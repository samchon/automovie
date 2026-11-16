import {
  Quaternion,
  carriedAcceleration,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpPath } from "./jumpPath";
import { jumpPushEnd } from "./jumpPushEnd";
import type { standUpright } from "./standUpright";
import { walkLeg } from "./walkLeg";

/**
 * A jump's push-off, from the entry exactly: the pelvis and the heading
 * from the entry's own angles and rates to the jump's, the take-off foot
 * laid flat about its heel if it was on its heel rocker and then risen about
 * its toes' joint by the rule a walking stance rises by, and the reaching
 * leg withdrawn under the body carrying the velocity, spin and acceleration
 * it was entered with, each rate for no longer than its room affords
 * (`jump` states the law).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the push-off moves and from what; the law's own documentation gives the sources.
 * @evidence contracts/development/design.md#principled-representation The push-off phase of the jump as one record of paths over the push's seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs, the paths the jump reads and their builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every path starts at the entry's own value and rate.
 */
export namespace jumpPush {
  /**
   * What the push-off is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The entry, the two feet's roles and places, and the jump's heading, root path and knee rule.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the push-off reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The root path and the knee rule are the jump's own, passed in.
   */
  export interface IProps {
    /** The body. */
    body: IHumanBody;

    /** The state the jump is entered from. */
    entry: IHumanEntryState;

    /** The foot that pushes off. */
    takeoff: "left" | "right";

    /** The foot that leaves at once. */
    reaching: "left" | "right";

    /** The take-off foot as entered. */
    support: HumanFoot.IPlacement;

    /** The take-off foot's heading, degrees. */
    supportHeading: number;

    /** The take-off foot's pitch as entered, degrees; positive with the toes up. */
    supportPitch: number;

    /** The take-off foot's heel, world metres. */
    heel: IAutoMovieVector3;

    /** The take-off foot's toes' joint once flat, world metres. */
    ball: IAutoMovieVector3;

    /** The upright stand the pelvis comes to. */
    upright: standUpright.IAlignment;

    /** The jump's heading, degrees. */
    heading: number;

    /** The push-off's seconds. */
    push: number;

    /** Where the reaching ankle is drawn to in the body's frame, metres. */
    tuck: IAutoMovieVector3;

    /**
     * The raw push Hermite root at local seconds, held at its endpoints.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines local seconds and the unlowered world-metre push root.
     * @evidence contracts/development/implementation.md#principled-implementation The actual jump.plan producer supplies jumpPath's quintic Hermite from entry position/velocity/acceleration to the nominal terminal root and solved launch slope.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One phase-local root reader is consumed by the hip rule and raw push posture.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the push curve rather than future free-flight roots; no lowered root is fed back into the nominal rule.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Delegates fixed-size curve evaluation to jumpPath's prepared Hermite reader.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The hip and posture readers share the same authored phase curve.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The supplying plan owns the reader; calls return fresh world vectors and acquire no resource.
     */
    rootAt: (t: number) => IAutoMovieVector3;

    /**
     * The knee's bend point for a root, a side and a heading.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Inputs are a world-metre root, leg side and degree heading; output is a world-metre pole.
     * @evidence contracts/development/implementation.md#principled-implementation The jump.plan producer delegates to jumpAirborne.knee using the actual body's rest knee and the supplied pole heading.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One spatial pole reader is shared by the timed push and pure terminal producer.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the support foot's actual heading rather than substituting the flight heading at release.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Delegates fixed-size frame operations to jumpAirborne.knee.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same existing pole owner for endpoint and interior demand.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no resource.
     */
    knee: (
      root: IAutoMovieVector3,
      side: "left" | "right",
      yaw: number,
    ) => IAutoMovieVector3;
  }

  /**
   * The push-off's paths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it gives.
   * @evidence contracts/development/design.md#principled-representation The paths the jump's posture reads through the push and after.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One phase sample, the entered arm rates and one complete leg writer are all consumed by jumpPushPosture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The legs are written whole, so no caller recombines their parts.
   */
  export interface IPush {
    /**
     * Read one unlowered phase sample at local push seconds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines local seconds and the original raw root, degree heading/pelvis, unitless progress and carried-time coefficient in IPhase.
     * @evidence contracts/development/implementation.md#principled-implementation jumpPush.of evaluates the same root Hermite, minimum-jerk progress and engine carriedRate, then the original heading/pelvis formulas with their exact terminal values.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit value record feeds arm assembly, the heel's actual hip and the final raw posture.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No lowered root, sampled replacement curve, changed entry rate or timing epsilon enters the sample.
     * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size arithmetic evaluates each shared root/progress/carry/yaw/pelvis quantity once per requested phase sample, with speedup unmeasured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumers share only this exact local time's explicit values; different times construct independent samples and no callback result cache is retained.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh phase record/root and interior pelvis tuple; the terminal pelvis retains its existing readonly endpoint tuple. No query history or resource is retained.
     */
    sample: (t: number) => IPhase;

    /**
     * An upper arm's entry flexion rate, degrees per second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Names the side and clinical flexion-rate unit.
     * @evidence contracts/development/implementation.md#principled-implementation jumpPush.of reads that bone's entered joint-rate map, with the declared absent rate of zero.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One existing map lookup.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not resample, scale or clamp an available entry rate.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-time map access.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual push arm writer uses this same entered rate.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no new resource.
     */
    swinging: (side: "left" | "right") => number;

    /**
     * Write the pelvis, both legs and toes at a local push second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the mutated caller-owned joint/goal records and the supplying phase sample's unlowered world geometry.
     * @evidence contracts/development/implementation.md#principled-implementation jumpPush.of supplies the existing heel/forefoot rocker and carried reaching leg; the exact end delegates to the shared jumpPushEnd producer where all entry-rate terms vanish.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Write the shared terminal state or the existing interior pelvis, support and reaching goals.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves physical plant/contact and actual heel rule through release; flight independently starts from the achieved state rather than a fixed-angle substitute.
     * @evidence contracts/development/implementation.md#efficient-algorithms One heel-rule read and fixed goal writes per call; no FK or alternate solver is introduced here.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint preparation and normal playback share jumpPushEnd; the phase sample supplies the same root/pelvis/yaw/progress already used by arm assembly, while jumpPushPosture still owns lowering.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only the provided fresh records; its closure borrows immutable plan geometry and holds no external handle.
     */
    write: (
      phase: IPhase,
      joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      >,
      limbs: IHumanPosture["limbs"],
    ) => void;
  }

  /**
   * One raw push instant shared by its arm, pelvis, rocker and posture writers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its time, unit and unlowered phase provenance.
   * @evidence contracts/development/design.md#principled-representation Explicit values of the same authored phase curves keep equivalent same-time work separate from downstream physical fitting.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the six quantities consumed by actual push posture and heel/reaching-goal construction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose certification, contact result, cache identity or alternate support is represented.
   */
  export interface IPhase {
    /** Local elapsed push seconds. */
    seconds: number;

    /** The original unlowered Hermite root, world metres. */
    root: IAutoMovieVector3;

    /** The existing minimum-jerk progress at these seconds, unitless. */
    progress: number;

    /** The existing carried entry-rate coefficient, seconds per unit rate. */
    carry: number;

    /** The entered heading continued toward the jump heading, degrees. */
    yaw: number;

    /** The entered pelvis continued toward upright, clinical degrees. */
    pelvis: readonly [number, number, number];
  }

  /**
   * Build a jump's push-off.
   *
   * @param props What it is built from.
   * @returns Its paths.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result; the namespace and the law give the rules.
   * @evidence contracts/development/implementation.md#principled-implementation Each moved part follows a path at rest plus the entry rate times the engine's carried-rate term, carried no longer than its room affords; the heel rises by the walking stance's rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The carries, the pelvis and heading, the foot's rocker, then one writer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot rolling on its heel is laid flat before its heel rises, so the pivot never passes at a rate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three build-time heel-rule reads and every pitch trial remain. Fixed contact pivots, heel-rule geometry, reaching-frame coefficients, quaternion endpoints and spin axis prepare once; each phase computes original root/progress/carry/yaw/pelvis once and shares them with actual heel/arm/posture reads. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing heelRise, hipJoints, HumanFoot and quaternion owners prepare only body/side/contact/heading or arc/axis prerequisites fixed by this push. Every varying hip, pitch, rotation weight, spin angle and local-time phase is still evaluated normally, with no time/result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns a fixed number of pivot, frame, arc and axis readers plus its original jump inputs. The unused heel pivot is absent without a heel rocker; no query history, FK reader or external handle enters these closures.
   */
  export function of(props: IProps): IPush {
    const {
      body,
      entry,
      takeoff,
      reaching,
      support,
      supportHeading,
      supportPitch,
      heel,
      ball,
      upright,
      heading,
      tuck,
      rootAt,
      knee,
    }: IProps = props;
    const P: number = props.push;
    // What an entry rate adds to a push-off path that starts at rest: the
    // rate times this term, whose slope is one at the cut.
    const carry: (t: number) => number = (t: number): number => carriedRate(P, t);
    const stride: IAutoMovieVector3 = entry.feet[reaching].velocity;
    const spin: IAutoMovieVector3 = entry.feet[reaching].spin;
    const spinRate: number = Math.hypot(spin.x, spin.y, spin.z);
    const spinAxis: IAutoMovieVector3 | undefined = spinRate < 1e-9 ? undefined : {
      x: spin.x / spinRate, y: spin.y / spinRate, z: spin.z / spinRate,
    };
    const reachingTurn: IAutoMovieQuaternion = HumanFoot.rotation(heading, 0);
    const reachingRotation: ReturnType<typeof Quaternion.prepareSlerp> =
      Quaternion.prepareSlerp(entry.feet[reaching].rotation, reachingTurn);
    const spinTurn: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined =
      spinAxis === undefined ? undefined : Quaternion.prepareAxisAngle(spinAxis);
    const reachingPoint: ReturnType<typeof HumanFrame.preparePoint> = HumanFrame.preparePoint(heading, tuck);
    // The reaching foot's velocity and spin are one rigid motion, carried for
    // no longer than brings a sole point to the floor: a point `h` above it
    // coming down at `v` affords `h / (PEAK v)` seconds. A point descending
    // slower than 1 cm/s is one the foot was turning about, and is passed.
    let reachingCarry: number = P;
    for (const point of ["heel", "ball"] as const) {
      const arm: IAutoMovieVector3 = Quaternion.rotateVector(
        entry.feet[reaching].rotation,
        HumanFoot.offset(body, reaching, point),
      );
      const falling: number = -(stride.y + spin.z * arm.x - spin.x * arm.z);
      if (falling > 0.01)
        reachingCarry = Math.min(
          reachingCarry,
          Math.max(0, entry.feet[reaching].ankle.y + arm.y) /
            (carriedRate.PEAK * falling),
        );
    }
    // The reaching ankle's entry acceleration fades over the same carry, so
    // the leg continues what the root's carried acceleration asks of it.
    const surge: IAutoMovieVector3 = entry.feet[reaching].acceleration;
    const reachBend: (t: number) => number = (t: number): number =>
      reachingCarry > 1e-6 ? carriedAcceleration(reachingCarry, t) : 0;
    // The take-off foot's pitch rate about its lateral axis, degrees per
    // second, positive lifting the toes.
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
      support.rotation,
      { x: 1, y: 0, z: 0 },
    );
    const roll: IAutoMovieVector3 = entry.feet[takeoff].spin;
    const rolling: number =
      (-(roll.x * lateral.x + roll.y * lateral.y + roll.z * lateral.z) * 180) /
      Math.PI;
    // The pelvis joint through the push, from the entry's own angles and
    // their rates to the upright ones. The hip joints hang from the pelvis,
    // so a pelvis listed and turned by a stride puts the take-off hip
    // millimetres from where an upright one has it, and the heel's rule would
    // read a leg the entry does not show.
    const level: readonly [number, number, number] = upright.joints.hips ?? [
      0, 0, 0,
    ];
    const listed: readonly [number, number, number] =
      entry.posture.joints.hips ?? level;
    const listing: readonly [number, number, number] =
      entry.velocity.joints.get("hips") ?? [0, 0, 0];
    const turning: number = (entry.velocity.angular.y * 180) / Math.PI;
    const sample: (t: number) => IPhase = (t: number): IPhase => {
      const s: number = minimumJerk(t / P).s;
      const k: number = carry(t);
      return {
        seconds: t, root: rootAt(t), progress: s, carry: k,
        yaw: t >= P ? heading : entry.posture.yaw + (heading - entry.posture.yaw) * s + turning * k,
        pelvis: t >= P ? level : [
          listed[0] + (level[0] - listed[0]) * s + listing[0] * k,
          listed[1] + (level[1] - listed[1]) * s + listing[1] * k,
          listed[2] + (level[2] - listed[2]) * s + listing[2] * k,
        ],
      };
    };
    const swinging: (side: "left" | "right") => number = (side: "left" | "right"): number =>
      entry.velocity.joints.get(`${side}UpperArm`)?.[0] ?? 0;
    // A foot entered on its heel rocker is laid flat before its heel rises,
    // as a walking foot is (Perry and Burnfield), so the pivot passes from
    // the heel to the toes' joint with the foot at rest: passed at a rate,
    // the ankle's velocity would step by that rate times the foot's length.
    // The foot comes flat in the share of the push its pitch is of the whole
    // turn, and no later than keeps a foot entered rolling down above the
    // floor: toward the end the carried rate's term falls as four times the
    // cube of the time left and the pitch as ten times it.
    const lowered: number =
      supportPitch > 0
        ? Math.min(
            (P * supportPitch) / (supportPitch + 40),
            rolling < 0 ? (2.5 * supportPitch) / -rolling : P,
          )
        : 0;
    const span: number = P - lowered;
    const start: number = Math.min(supportPitch, 0);
    const heelAt: ReturnType<typeof HumanFoot.preparePivot> | undefined = lowered > 0
      ? HumanFoot.preparePivot(body, takeoff, "heel", heel, supportHeading) : undefined;
    const ballAt: ReturnType<typeof HumanFoot.preparePivot> =
      HumanFoot.preparePivot(body, takeoff, "mtp", ball, supportHeading);
    const heelRise: ReturnType<typeof walkLeg.prepareHeelRise> =
      walkLeg.prepareHeelRise(body, takeoff, ball, supportHeading, walkLeg.ROCKER);
    // The flat foot's heel then rises by the rule a walking stance rises by:
    // asked from flat to its take-off pitch, and no later than the ankle's
    // dorsal limit asks. A foot the walk held by that rule is met by it.
    const ruled: (phase: IPhase) => number = (phase: IPhase): number =>
      heelRise(
        hipJoints(body, phase.root,
          resolveHumanPosture.heading({ yaw: phase.yaw, pitch: 0, roll: 0 }), phase.pelvis)[takeoff],
        Math.min(start, -40) * minimumJerk((phase.seconds - lowered) / span).s,
      );
    // What the entry's pitch and pitch rate differ from the rule's by is
    // eased out over the rise. A heel coming down about the ball is carried
    // no longer than lays the foot flat, where the pivot would pass to the
    // heel.
    const met: number = ruled(sample(lowered));
    const gap: number = start - met;
    const excess: number =
      (supportPitch > 0 ? 0 : rolling) -
      (-3 * met + 4 * ruled(sample(lowered + 1e-3)) - ruled(sample(lowered + 2e-3))) / 2e-3;
    const carried: number =
      excess > 0 ? Math.min(span, -start / (carriedRate.PEAK * excess)) : span;
    const pitchAt: (phase: IPhase) => number = (phase: IPhase): number => {
      const t: number = phase.seconds;
      return (
        t < lowered
          ? supportPitch * (1 - minimumJerk(t / lowered).s) +
            rolling * carriedRate(lowered, t)
          : ruled(phase) +
            gap * (1 - minimumJerk((t - lowered) / span).s) +
            (carried > 1e-6 ? excess * carriedRate(carried, t - lowered) : 0)
      );
    };

    return {
      sample,
      swinging,
      write: (
        phase: IPhase,
        joints: IHumanPosture["joints"],
        limbs: IHumanPosture["limbs"],
      ): void => {
        const t: number = phase.seconds;
        const root: IAutoMovieVector3 = phase.root;
        if (t >= P) {
          const end: Pick<IHumanPosture, "joints" | "limbs"> = jumpPushEnd(props, root);
          Object.assign(joints, end.joints);
          Object.assign(limbs, end.limbs);
          return;
        }
        joints.hips = phase.pelvis;
        // Push-off: the take-off foot rolls over its ball; the reaching leg withdraws under the body.
        // From the entry's own pitch and pitch rate, so a foot rolling on
        // its heel or its ball keeps rolling.
        const pitch: number = pitchAt(phase);
        const about: "heel" | "mtp" = t < lowered ? "heel" : "mtp";
        const foot: HumanFoot.IPlacement = about === "heel" ? heelAt!(pitch) : ballAt(pitch);
        limbs[`${takeoff}Leg`] = {
          point: foot.ankle,
          rotation: foot.rotation,
          bend: knee(root, takeoff, supportHeading),
          planted: true,
          // The point the foot turns about is the one that stays on the floor.
          contact: HumanFoot.offset(body, takeoff, about),
        };
        joints[`${takeoff}Toes`] = [-pitch, 0, 0];
        // The reaching foot leaves at once on a minimum-jerk path, carrying
        // the velocity and the spin it was entered with.
        const s: number = phase.progress;
        const k: number = reachingCarry > 1e-6
          ? reachingCarry === P ? phase.carry : carriedRate(reachingCarry, t) : 0;
        const b: number = reachBend(t);
        const from: IAutoMovieVector3 = entry.feet[reaching].ankle;
        const into: IAutoMovieVector3 = reachingPoint(root);
        const path: IAutoMovieVector3 = jumpPath.lerp(from, into, s);
        const turned: IAutoMovieQuaternion = reachingRotation(s);
        limbs[`${reaching}Leg`] = {
          point: {
            x: path.x + stride.x * k + surge.x * b,
            y: path.y + stride.y * k + surge.y * b,
            z: path.z + stride.z * k + surge.z * b,
          },
          rotation:
            spinTurn === undefined
              ? turned
              : Quaternion.normalize(
                  Quaternion.multiply(
                    spinTurn((spinRate * k * 180) / Math.PI),
                    turned,
                  ),
                ),
          bend: knee(root, reaching, heading),
        };
      },
    };
  }
}
