import { AutoMovieEngineKinematics, clampPose, dampedSpring, sampleMotion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieExpression,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMovieMotionSample,
  IAutoMoviePose,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSpringStep,
} from "@automovie/interface";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IAutoMovieSpringAxisSettlement } from "./IAutoMovieSpringAxisSettlement.js";
import type { IAutoMovieSpringConfig } from "./IAutoMovieSpringConfig.js";
import { applyExpression } from "./applyExpression.js";
import { applyPose } from "./applyPose.js";

/** One joint's three solver states, retained in this player's spring map. */
interface IAxisSprings {
  /** Flexion value and velocity carried between bounded solver updates. */
  flexion: IAutoMovieSpringStep;

  /** Abduction value and velocity carried between the same updates. */
  abduction: IAutoMovieSpringStep;

  /** Twist value and velocity carried between the same updates. */
  twist: IAutoMovieSpringStep;
}

/**
 * Drives a motion clip onto a built model: given an elapsed time it samples the
 * clip (via the engine's interpolation) and applies the resulting pose to the
 * model's bones.
 *
 * Call {@link AutoMovieRenderPlayer.update} with elapsed seconds. The host owns
 * rendering and the animation loop (see {@link mountViewer}). Without springs,
 * the pose depends only on clip time. Springs retain velocity and depend on the
 * update sequence;
 * equal or backward times hold the last spring state.
 *
 * Expression output is sampled on the same frame clock and applied to morph
 * targets or imported-runtime expression sinks when the target provides them;
 * when the target's `lookAt` is `"bone"`, its gaze channels turn the eye bones
 * instead (`resolveLookAt`).
 */
export class AutoMovieRenderPlayer {
  private lastSample: IAutoMovieMotionSample | null = null;
  private readonly springs: Map<AutoMovieHumanoidBone, IAxisSprings> = new Map<
    AutoMovieHumanoidBone,
    IAxisSprings
  >();
  private lastSeconds: number | null = null;
  private lastUpdateSeconds: number | null = null;

  public constructor(
    private readonly target: IAutoMovieModelObject,
    private readonly skeleton: IAutoMovieSkeleton,
    private motion: IAutoMovieMotion,
    private readonly jointAxes?: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
    >,
    /**
     * When true, clamp each sampled pose into the skeleton's ROM before it is
     * applied, and again AFTER the secondary-motion springs, which overshoot by
     * design (#1048), so joints can no longer exceed their anatomical limits.
     */
    private readonly clampToRom: boolean = false,
    /** Secondary-motion joints (tail, ears) driven with follow-through. */
    private readonly spring?: IAutoMovieSpringConfig,
    /**
     * Per-bone rest frames: read each sampled joint angle as **clinical** and
     * map it into the rig's rest-relative space before articulating (e.g.
     * abduction 180 raises either arm overhead regardless of side). Omit to
     * treat angles as raw rig-space, the historical behaviour.
     */
    private readonly restFrames?: Partial<
      Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
    >,
  ) {}

  /** Swap the clip being played, preserving active spring follow-through. */
  public setMotion(motion: IAutoMovieMotion): void {
    this.motion = motion;
  }

  /**
   * Sample the clip at elapsed `seconds` and apply pose and expression. Springs
   * hold on equal or backward timestamps and advance at most 1/15 second.
   */
  public update(seconds: number): void {
    const deltaSeconds: number =
      this.lastUpdateSeconds === null
        ? 0
        : Math.max(0, seconds - this.lastUpdateSeconds);
    this.lastUpdateSeconds = seconds;
    // A bone gaze moves the gaze channels from the expression onto the eye
    // joints before the ROM clamp and springs see the pose.
    const sample: IAutoMovieMotionSample = AutoMovieEngineKinematics.resolveLookAt(
      sampleMotion(this.motion, seconds),
      this.target.lookAt,
    );
    this.lastSample = sample;
    let pose: IAutoMoviePose = this.clampToRom
      ? clampPose(sample.pose, this.skeleton)
      : sample.pose;
    if (this.spring !== undefined) {
      pose = this.applySpring(pose, seconds);
      // An underdamped spring can overshoot, so the pre-spring clamp
      // alone rendered poses past the promised limits (#1048). Re-clamp the
      // OUTPUT only: the spring state keeps its overshoot and converges
      // naturally; the render just never shows it outside the ROM.
      if (this.clampToRom) pose = clampPose(pose, this.skeleton);
    }
    applyPose(
      this.target,
      pose,
      this.skeleton,
      this.jointAxes,
      this.restFrames,
    );
    applyExpression(this.target, sample.expression);
    this.target.afterAutoMovieFrame?.({
      seconds,
      deltaSeconds,
      pose,
      expression: sample.expression,
    });
  }

  /**
   * Replace the spring joints' angles with a damped lag toward the animated
   * target, so a tail/ears trail and overshoot the body's motion instead of
   * snapping. Stateful across frames (velocity per axis); `dt` is clamped so a
   * stall or tab-switch can't explode the integrator.
   */
  private applySpring(pose: IAutoMoviePose, seconds: number): IAutoMoviePose {
    const cfg: IAutoMovieSpringConfig = this.spring!;
    const dt: number =
      this.lastSeconds === null
        ? 0
        : Math.min(Math.max(seconds - this.lastSeconds, 0), 1 / 15);
    this.lastSeconds = seconds;
    const targets: Set<AutoMovieHumanoidBone> = new Set(cfg.joints);
    const params: Parameters<typeof dampedSpring>[3] = {
      stiffness: cfg.stiffness,
      damping: cfg.damping,
    };

    const axis: (
      state: IAutoMovieSpringStep | undefined,
      target: number | null,
    ) => IAutoMovieSpringAxisSettlement = (
      state: IAutoMovieSpringStep | undefined,
      target: number | null,
    ): IAutoMovieSpringAxisSettlement => {
      // A vanished axis DECAYS toward neutral instead of hard-resetting
      // (#1048): follow-through settles smoothly when a keyframe segment
      // stops authoring the joint, rather than popping to rest.
      //
      // dt=0 means "no time elapsed", NOT "never sprung" (#1098): a paused
      // host loop re-calling update(sameT), a backwards scrub (negative
      // delta clamps to 0), or a frozen-frame capture must HOLD the live
      // spring (value and velocity) on both the decay and tracking sides.
      // Conflating the two popped a mid-decay joint to rest (and zeroed its
      // state), and re-seeded a lagging joint AT its target.
      if (target === null) {
        if (state === undefined)
          return { angle: null, next: { value: 0, velocity: 0 } };
        if (dt === 0) return { angle: state.value, next: state };
        const r: IAutoMovieSpringStep = dampedSpring(
          state.value,
          state.velocity,
          0,
          params,
          dt,
        );
        return { angle: r.value, next: r };
      }
      if (state === undefined)
        return { angle: target, next: { value: target, velocity: 0 } };
      if (dt === 0) return { angle: state.value, next: state };
      const r: IAutoMovieSpringStep = dampedSpring(
        state.value,
        state.velocity,
        target,
        params,
        dt,
      );
      return { angle: r.value, next: r };
    };

    const springJoint: (
      bone: AutoMovieHumanoidBone,
      j: IAutoMovieJointPose | null,
    ) => IAutoMovieJointPose = (
      bone: AutoMovieHumanoidBone,
      j: IAutoMovieJointPose | null,
    ): IAutoMovieJointPose => {
      const prev: IAxisSprings | undefined = this.springs.get(bone);
      const f: IAutoMovieSpringAxisSettlement = axis(
        prev?.flexion,
        j?.flexion ?? null,
      );
      const a: IAutoMovieSpringAxisSettlement = axis(
        prev?.abduction,
        j?.abduction ?? null,
      );
      const t: IAutoMovieSpringAxisSettlement = axis(
        prev?.twist,
        j?.twist ?? null,
      );
      this.springs.set(bone, {
        flexion: f.next,
        abduction: a.next,
        twist: t.next,
      });
      return { bone, flexion: f.angle, abduction: a.angle, twist: t.angle };
    };

    const joints: IAutoMovieJointPose[] = pose.joints.map(
      (j: IAutoMovieJointPose): IAutoMovieJointPose =>
        targets.has(j.bone) ? springJoint(j.bone, j) : j,
    );
    // A configured joint ABSENT from the pose still decays its follow-through
    // (#1048): the spring keeps integrating toward neutral instead of the
    // joint vanishing mid-swing.
    const present: Set<AutoMovieHumanoidBone> = new Set(
      pose.joints.map(
        (j: IAutoMovieJointPose): AutoMovieHumanoidBone => j.bone,
      ),
    );
    for (const bone of cfg.joints) {
      if (present.has(bone) || !this.springs.has(bone)) continue;
      const decayed: IAutoMovieJointPose = springJoint(bone, null);
      if (
        decayed.flexion !== null ||
        decayed.abduction !== null ||
        decayed.twist !== null
      )
        joints.push(decayed);
    }
    return { skeleton: pose.skeleton, root: pose.root, joints };
  }

  /** The most recently sampled facial expression, or `null`. */
  public get lastExpression(): IAutoMovieExpression | null {
    return this.lastSample?.expression ?? null;
  }
}
