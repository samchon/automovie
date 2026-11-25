import {
  hingedArmSwivel,
  inertializePose,
  poseJointCodec,
  samplePoseVelocity,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMoviePoseRig,
  IAutoMoviePoseState,
  IAutoMovieSeededChainFit,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { humanRig } from "../posture/humanRig";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import { HumanSegmentPlant } from "./HumanSegmentPlant";
import { HumanSegmentPoseSeeds } from "./HumanSegmentPoseSeeds";
import { HumanSegmentShown } from "./HumanSegmentShown";
import { HumanSegmentStop } from "./HumanSegmentStop";
import { carrySeatTransition } from "./carrySeatTransition";
import { observableHumanSegment } from "./observableHumanSegment";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";

/** The alternatives of `ContinuedSide`'s site. */
type ContinuedSide = "before" | "after";

/**
 * One action's displayed pose at a film second, whether or not it is the active
 * one: its posture, entering offset, range-of-motion clamps and final planted
 * contacts.
 *
 * @param person The person.
 * @param segment The action.
 * @param seconds Film seconds.
 * @returns The pose.
 */
export function HumanSegmentPose(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  seconds: number,
  prepared?: prepareHumanSegmentPose.IPrepared,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): IAutoMoviePose {
  return HumanSegmentPose.seeded(
    person,
    segment,
    seconds,
    undefined,
    prepared,
    requested,
  ).pose;
}

/**
 * A person's displayed pose: the layered action, carried holds, overlays,
 * stopped weapons and entering transition offset. Range-of-motion clamps
 * precede the final planted refits, so no later operation moves a plant.
 */
export namespace HumanSegmentPose {
  /**
   * A person's displayed pose at a film second.
   *
   * @param person The person.
   * @param seconds Film seconds.
   * @param requested Optional observational bones; only their frames are
   *   guaranteed and a partial result never enters the full-pose cache.
   * @returns The pose.
   */
  export function displayed(
    person: IAutoMovieMotionHumanSegment.IPerson,
    seconds: number,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return HumanSegmentShown(person, seconds, requested, prepared);
  }

  /** The difference interval of every rate read of a shown pose, seconds. */
  export const STEP: number = 1e-3;

  /**
   * The inertialization offset of the transition that entered an action
   * (`inertializePose`, Bollo 2018): the source action's displayed state just
   * before the cut against the entered action's leaf, carries and overlays
   * included, just after it, each side's rates read on fits continued from its
   * cut fits, so the offset keeps the motion rather than differences in fit
   * resolution. The performance solves it once when it is prepared
   * (`IAutoMovieMotionHumanSegment.IPrepared.offset`).
   *
   * @param person The person.
   * @param segment The entered action.
   * @param prepared Same-body preparation borrowed for the evaluation.
   * @returns The offset, or none for an action entered without one.
   */
  export function offset(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
  ): ((elapsed: number, pose: IAutoMoviePose) => IAutoMoviePose) | undefined {
    const transition: IAutoMovieMotionHumanSegment["transition"] =
      segment.transition;
    if (transition === undefined || transition.kind === "redirect")
      return undefined;
    const rig: IAutoMoviePoseRig = humanRig(person.performer.body);
    const codec: () => IAutoMoviePoseJointCodec.ICodec =
      poseJointCodec.prepare(rig);
    const source = continued(
      (t: number, near?: INear): ISeeded =>
        seeded(person, transition.source, t, near, prepared),
      transition.cut,
      "before",
      rig,
      transition.blend,
      codec,
    ).state;
    // Include the target's carry and overlays; a bare-posture offset would
    // add their arm placement a second time.
    const target = continued(
      (t: number, near?: INear): ISeeded =>
        readHumanSegmentLeaf(person, segment, t, near, undefined, prepared),
      transition.cut,
      "after",
      rig,
      transition.blend,
      codec,
    ).state;
    const decay = inertializePose(
      source,
      target,
      transition.blend,
      // A joint cut as it passes the next action's pose keeps its rate and
      // follows through; stopped short it would lose that rate at once.
      true,
      // Joints blend as rotations read through the displayed rig, so an arm
      // hanging at its shoulder chart's gimbal does not swing on the way.
      rig,
      codec,
    );
    const from = (transition.cut - segment.start) / segment.plan.duration;
    return carrySeatTransition(
      segment.context.entry,
      {
        from,
        until: from + transition.blend / segment.plan.duration,
        contacts: segment.plan.contacts,
        sourceRoot: source.pose.root?.translation,
        targetRoot: target.pose.root?.translation,
      },
      decay,
    );
  }

  /**
   * {@link of} with every limb fit's seed. Names distinguish the chain, overlay
   * set and leaf, carry, stop or planted stage (`IFits`); each fit continues
   * its matching nearby seed. A read that continues no other second places its
   * stops and plants at its own shown leaf fit of the same limb
   * (`HumanSegmentPoseSeeds.shown`), prescribed for an arm.
   *
   * @param person The person.
   * @param segment The action.
   * @param seconds Film seconds.
   * @param near The fits of a nearby second to continue, if any.
   * @param prepared Same-body preparation borrowed only within this synchronous
   *   evaluation, or acquired here and released on return or throw.
   * @param requested Optional bone observation; near fits, holds, stops, active
   *   transitions and contact/plant-dependent overlays retain complete
   *   evaluation.
   * @returns The pose and the seeds of its fits.
   */
  export function seeded(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    near?: INear,
    prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(
      person.performer.body,
    ),
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
  ): ISeeded {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    if (prepared.body !== body)
      throw new Error(
        "A displayed evaluation borrows its own body's rig preparation",
      );
    const clamp: (pose: IAutoMoviePose) => IAutoMoviePose = prepared.clamp;
    const transition: IAutoMovieMotionHumanSegment["transition"] =
      segment.transition;
    const observed: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      requested !== undefined &&
      near === undefined &&
      observableHumanSegment(person, segment, seconds)
        ? requested
        : undefined;

    const shown = (t: number, fits?: INear): readHumanSegmentLeaf.IReading =>
      readHumanSegmentLeaf(person, segment, t, fits, observed, prepared);
    const now: ReturnType<typeof shown> = shown(seconds, near);
    const seeds: IFits = now.seeds;
    let posture: IAutoMovieMotionHumanPosture = now.posture;
    const carried: IAutoMovieMotionHumanSegment.IHeld[] = now.carried;
    let pose: IAutoMoviePose = now.pose;

    // Whether the pose is still the leaf resolve's own: no overlay or hold
    // shaped it, and no stop fit or transition offset writes it below.
    let plain: boolean = person.overlays.length === 0 && carried.length === 0;

    // A read that continues no other second places a later stage's limb
    // (a stop's, a plant's) at this very read's leaf fit of that limb,
    // prescribed: the same branch and swivel on the stage's own goal, never
    // swept or refined afresh, so every reader of the second reads one
    // placement. The leaf is the one under every running overlay, whose fit
    // the pose shows (`HumanSegmentOverlay.overlaid` names it by all their
    // ordinals). A read that continues another second continues `near`.
    const leafed = (stage: string): HumanSegmentPose.INear | undefined =>
      HumanSegmentPoseSeeds.continues(near)
        ? near
        : {
            seeds: HumanSegmentPoseSeeds.shown(seeds, stage),
            tolerance: hingedArmSwivel.RESOLUTION,
            prescribed: true,
          };

    // One more fit of the evaluation, continued or placed where `from`
    // holds its name. The fitted pose is this evaluation's own intermediate,
    // so the fit's result is used as solved, without the public entry's
    // complete clone.
    function fit(
      name: string,
      at: IAutoMoviePose,
      limb: AutoMovieHumanLimb,
      goal: IAutoMovieHumanLimbGoal,
      from: HumanSegmentPose.INear | undefined,
    ): IAutoMoviePose {
      const fitted: IAutoMovieSeededChainFit = HumanLimbFit.fit(
        body,
        at,
        limb,
        goal,
        ["left", "right"],
        undefined,
        nearby(from, name),
        prepared.resolution,
      );
      seeds.set(name, fitted.seed);
      return fitted.pose;
    }

    // A carried hand no overlay drives keeps its goal as a planted one, so
    // the transition's offset below never moves what it holds. A hand an
    // overlay drives is that overlay's, faded in and out by `overlaid`.
    let kept: IAutoMovieMotionHumanSegment.IHeld[] = carried;
    if (carried.length !== 0) {
      const active: IAutoMovieMotionHumanSegment.IOverlay[] =
        HumanSegmentOverlay.running(person, seconds);
      kept = carried.filter(
        (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
          !active.some((o: IAutoMovieMotionHumanSegment.IOverlay): boolean =>
            HumanSegment.drives(o.plan, h.side),
          ),
      );
    }
    if (kept.length !== 0)
      posture = {
        ...posture,
        limbs: {
          ...posture.limbs,
          ...Object.fromEntries(
            HumanSegmentCarry.carries(
              person,
              kept,
              prepared.resolution,
              prepared,
            ),
          ),
        },
      };

    // A stopped weapon's limb holds its contact when its law does not take its
    // stops itself; a law that does shows its own dwell and recoil.
    if (segment.plan.stop === undefined)
      for (const w of segment.plan.weapons ?? []) {
        const s: number | undefined = person.stops.get(
          HumanSegment.weapon(segment, w.id),
        );
        if (s === undefined || seconds <= s) continue;
        const goal: IAutoMovieHumanLimbGoal = HumanSegmentStop.goal(
          person,
          segment,
          w,
          s,
          prepared,
        );
        posture = { ...posture, limbs: { ...posture.limbs, [w.limb]: goal } };
        pose = fit(
          `stop:${w.id}:${w.limb}`,
          pose,
          w.limb,
          goal,
          leafed(`stop:${w.id}:`),
        );
        plain = false;
      }
    if (
      transition !== undefined &&
      transition.kind !== "redirect" &&
      seconds - transition.cut < transition.blend
    ) {
      // The offset the performance prepared, or, while the schedule is
      // resolved, the one the displayed state at the cut gives now.
      const decay: ReturnType<typeof offset> =
        segment.prepared?.offset ?? offset(person, segment, prepared);

      // The offset pose is clamped first and the planted limbs re-solved last,
      // so no later step moves a plant (the limb fit keeps its own angles in range).
      if (decay !== undefined) {
        pose = clamp(decay(Math.max(0, seconds - transition.cut), pose));
        plain = false;
      }
    }

    // Contacts are the final operation, including an overlay's entire
    // declared window: neither a fade, an offset nor the range clamp can
    // move them. The ordinary resolver owns attachment order and arm pairs.
    const fitted: IAutoMoviePose = pose;
    const playback = segment.plan.playback;
    const placed =
      playback?.placed !== undefined &&
      playback.located === segment.plan.posture &&
      playback.body === body
        ? playback.placed
        : undefined;
    // In the plain case every record of the pose is the range clamp's own
    // at the joints whose clamp gives it back (`IHumanBody.settled`), so
    // those are kept and the rest clamped; otherwise every joint is.
    const joint: ReturnType<typeof prepareHumanPostureProjection.joints> = plain
      ? prepareHumanPostureProjection.joints(body, clamp)
      : undefined;
    if (joint === undefined) pose = clamp(pose);
    else {
      const settled: ReadonlySet<AutoMovieHumanoidBone> = body.settled;
      pose = {
        skeleton: pose.skeleton,
        root: pose.root,
        joints: pose.joints.map(
          (
            record: IAutoMoviePose["joints"][number],
          ): IAutoMoviePose["joints"][number] =>
            settled.has(record.bone) ? record : joint(record),
        ),
      };
    }
    // In the plain case (the leaf resolve of this very posture, with no
    // overlay, hold, stop, offset, digit goal or whole-body rotation after
    // it) the leaf fitted these same goal objects and only the clamp stands
    // between its fits and the plants; a plant the clamp left untouched
    // keeps the leaf's solution (`HumanSegmentPlant.settled`).
    if (
      plain &&
      posture.digits === undefined &&
      posture.rotation === undefined &&
      HumanSegmentPlant.settled(fitted, pose, posture.limbs, seeds)
    )
      return {
        pose: placed?.(seconds - segment.start, pose, observed) ?? pose,
        seeds,
      };
    // Each plant is placed at this very read's leaf fit of the same goal
    // (`leafed`), displaced only by what came after the leaf.
    const planted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      HumanSegmentPlant.fit(
        body,
        pose,
        posture.limbs,
        leafed("planted:"),
        prepared.resolution,
      );
    for (const [limb, seed] of Object.entries(planted.seeds))
      seeds.set(`planted:${limb}`, seed ?? null);
    return {
      pose:
        placed?.(seconds - segment.start, planted.pose, observed) ?? planted.pose,
      seeds,
    };
  }

  /**
   * A one-sided shown-pose state: the instant is cold; its rate samples
   * continue that instant's fits to the tolerance an inertialization of
   * `duration` asks (`samplePoseVelocity.tolerance`).
   *
   * @param read The shown pose at a second with its fits' seeds, continued from
   *   `near` where given.
   * @param seconds The second.
   * @param side The side the motion is read from.
   * @param rig The rig the joints are read through.
   * @param duration The decay the state feeds, seconds.
   * @param prepared Optional codec or lazy getter from this same unchanged-rig
   *   transition capture, demanded only after the samples.
   * @returns The state, and the continued samples its rates were read from.
   */
  export function continued(
    read: (seconds: number, near?: INear) => ISeeded,
    seconds: number,
    side: ContinuedSide,
    rig: IAutoMoviePoseRig,
    duration: number,
    prepared?: Parameters<typeof samplePoseVelocity>[6],
  ): IContinued {
    const tolerance: number = samplePoseVelocity.tolerance(STEP, duration);
    let fits: IFits;
    const samples: IAutoMoviePose[] = [];
    const state: IAutoMoviePoseState = samplePoseVelocity(
      (t: number): IAutoMoviePose => {
        const instant: ISeeded = read(t);
        fits = instant.seeds;
        return instant.pose;
      },
      seconds,
      STEP,
      side,
      rig,
      (t: number): IAutoMoviePose => {
        const sample: IAutoMoviePose = read(t, {
          seeds: fits,
          tolerance,
        }).pose;
        samples.push(sample);
        return sample;
      },
      prepared,
    );
    return {
      state,
      samples: samples as [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose],
    };
  }

  /**
   * Exact-name continuation lookup, shared with overlays and final plants.
   *
   * HumanSegmentPoseSeeds.nearby owns the exact name, absent/null behavior and
   * copied degree tolerance. This alias adds no wrapper, transformed seed,
   * numerical result or retained query state.
   */
  export const nearby: typeof HumanSegmentPoseSeeds.nearby =
    HumanSegmentPoseSeeds.nearby;

  /** The evaluator's named fit seeds, owned by HumanSegmentPoseSeeds. */
  export type IFits = HumanSegmentPoseSeeds.IFits;

  /** A nearby evaluation's named seeds and swivel tolerance. */
  export type INear = HumanSegmentPoseSeeds.INear;

  /** A displayed pose and the named fits it actually evaluated. */
  export type ISeeded = HumanSegmentPoseSeeds.ISeeded;

  /** A cold state and its three one-sided continued samples. */
  export type IContinued = HumanSegmentPoseSeeds.IContinued;
  /**
   * The posture a following action carries. Native breathing is evaluated on
   * the film clock when the pose is shown.
   */
  export function entryPosture(
    person: IAutoMovieMotionHumanSegment.IPerson,
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    resolution?: prepareHumanSegmentPose.IPrepared["resolution"],
    projection?: prepareHumanSegmentPose.IPrepared["clamp"],
  ): IAutoMovieMotionHumanPosture {
    return HumanSegmentLayer.apply(
      person,
      posture,
      seconds,
      resolution,
      projection,
      undefined,
      "entry",
    );
  }

  /** The standing pose before a person's first action. */
  export function initial(
    person: IAutoMovieMotionHumanSegment.IPerson,
    requested?: ReadonlySet<AutoMovieHumanoidBone>,
    prepared?: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose {
    return resolveHumanPosture.seeded(
      person.performer.body,
      person.initial,
      undefined,
      undefined,
      prepared?.resolution,
      requested,
      prepared?.clamp,
    ).pose;
  }
}
