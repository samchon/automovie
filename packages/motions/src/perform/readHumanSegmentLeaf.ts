import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { courseLimbSwivels } from "../compose/courseLimbSwivels";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import type { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import { demandedHumanChannels } from "./demandedHumanChannels";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentAnchors } from "./readHumanSegmentAnchors";
import { readHumanSegmentLegs } from "./readHumanSegmentLegs";
import { unfollowedHumanChannels } from "./unfollowedHumanChannels";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/**
 * The arms, placed at the anchor course (`readHumanSegmentAnchors`) where the
 * plan's own course does not place them.
 */
const ARMS: readonly AutoMovieHumanLimb[] = ["leftArm", "rightArm"];

/**
 * Whether a plan second lies inside the plan's legs-still window
 * (`IAutoMovieMotionHumanActionPlan.legsStill`), where the legs keep one fit.
 */
function still(
  plan: IAutoMovieMotionHumanActionPlan,
  seconds: number,
): boolean {
  return (
    plan.legsStill !== undefined &&
    seconds >= plan.legsStill[0] &&
    seconds <= plan.legsStill[1]
  );
}

/**
 * Read the action before its entering offset, including current holds and
 * overlays. A read with no fits of its own places the arms at the plan's swivel
 * course (`readHumanSegmentLeaf.swivels`) and every other arm fit at the
 * action's anchor course (`readHumanSegmentAnchors`).
 */
export function readHumanSegmentLeaf(
  person: IAutoMovieMotionHumanSegment.IPerson,
  segment: IAutoMovieMotionHumanSegment,
  t: number,
  fits: HumanSegmentPose.INear | undefined,
  observed: ReadonlySet<AutoMovieHumanoidBone> | undefined,
  prepared: prepareHumanSegmentPose.IPrepared,
): readHumanSegmentLeaf.IReading {
  const reader: typeof segment.plan.posture = segment.plan.posture;
  const localSeconds: number = Math.min(
    segment.plan.duration,
    Math.max(0, t - segment.start),
  );
  const bare: boolean =
    person.layers.length === 0 &&
    person.overlays.length === 0 &&
    person.holds.length === 0 &&
    person.stops.size === 0;
  const sample: IAutoMovieMotionHumanPlayback.ISample | undefined =
    HumanPreparedPlayback.read(
      segment.plan,
      person.performer.body,
      reader,
      bare,
      fits === undefined && observed === undefined,
      segment.incumbents,
      localSeconds,
      undefined,
      prepared.resolution,
      prepared.clamp,
    );
  // An observation of some bones reads only the channels their frames hang
  // from (`demandedHumanChannels`), so the plan evaluates no writer of a
  // part the observation does not show (a trunk read never runs an arm's
  // course, nor through it a partner's): the demand-driven evaluation of an
  // animation graph's required bones.
  const channels: readonly AutoMovieMotionHumanChannel[] | undefined =
    observed === undefined ? undefined : demandedHumanChannels(observed);
  const raw: IAutoMovieMotionHumanPosture =
    sample?.posture ??
    Reflect.apply(reader, segment.plan, [
      localSeconds,
      channels,
      prepared.resolution,
      prepared.clamp,
    ]);
  let direct: resolveHumanPostureSource.IAssembled | undefined;
  let written: IAutoMovieMotionHumanPosture = HumanSegmentLayer.apply(
    person,
    raw,
    t,
    prepared.resolution,
    prepared.clamp,
    fits === undefined &&
      person.layers.length === 1 &&
      person.overlays.length === 0 &&
      person.holds.length === 0 &&
      person.stops.size === 0
      ? (assembly: resolveHumanPostureSource.IAssembled): void => {
          direct = assembly;
        }
      : undefined,
  );

  const borne: IAutoMovieMotionHumanSegment.IHeld[] = HumanSegmentCarry.borne(
    person,
    segment,
    t,
  );
  if (borne.length !== 0) {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...written.joints,
    };
    for (const h of borne) Object.assign(joints, h.fingers);
    written = { ...written, joints };
  }
  // A read with no fits of its own places each limb at its plan's swivel
  // course (`readHumanSegmentLeaf.swivels`): the displayed goals stay, the
  // branch and swivel come from the course, so no limb is swept afresh.
  // An observation that shows no arm reads no arm course.
  const armed: boolean =
    channels === undefined ||
    channels.includes("leftArm") ||
    channels.includes("rightArm");
  const course:
    | ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>
    | undefined =
    fits === undefined && armed
      ? readHumanSegmentLeaf.swivels(
          segment.plan,
          person.performer.body,
          segment.context.entry.pose,
        )(localSeconds)
      : undefined;

  // The arm fits the course does not place (an overlay leaf's, a carry's, a
  // contact's re-aim, an arm the course holds no seed for) are placed at the
  // anchor course (`anchors`): the swivel interpolated between the anchor
  // seconds around this one, so no read sweeps or refines and every read of
  // a second shows the same pose, whatever was read before it.
  const anchoring: boolean =
    fits === undefined &&
    armed &&
    (borne.length !== 0 ||
      (person.overlays.length !== 0 &&
        HumanSegmentOverlay.running(person, t).length !== 0) ||
      ARMS.some(
        (limb: AutoMovieHumanLimb): boolean =>
          written.limbs[limb] !== undefined && course?.get(limb) === undefined,
      ));
  const anchors: HumanSegmentPose.IFits | undefined = anchoring
    ? readHumanSegmentAnchors(person, segment, t, prepared)
    : undefined;

  // Every free leg fitted at this second (outside a legs-still window, where
  // the legs keep one fit) continues the plan's leg chain at the frame at or
  // before it (`readHumanSegmentLegs`): the closed-form root on the branch
  // the frame before chose, or the legal one nearest it on the other branch
  // where that branch has none, so a knee keeps its side from frame to
  // frame; a planted leg keeps its own fit, which holds its foot.
  const legs: ReadonlyMap<string, IAutoMovieSwivelSeed> =
    fits === undefined && !still(segment.plan, localSeconds)
      ? readHumanSegmentLegs(person, segment, t, localSeconds, written.limbs)
      : new Map();
  const placing: HumanSegmentPose.INear | undefined =
    (course === undefined || course.size === 0) &&
    anchors === undefined &&
    legs.size === 0
      ? fits
      : {
          seeds: new Map<string, IAutoMovieSwivelSeed | null>([
            ...legs,
            ...(anchors ?? []),
            ...[...(course ?? [])]
              // Legs kept over a legs-still window keep their own fit there.
              .filter(
                ([limb]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): boolean =>
                  !limb.endsWith("Leg") || !still(segment.plan, localSeconds),
              )
              .map(
                ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): [
                  string,
                  IAutoMovieSwivelSeed,
                ] => [`leaf::${limb}`, seed],
              ),
          ]),
          tolerance: hingedArmSwivel.RESOLUTION,
          prescribed: true,
        };
  const overlaid: HumanSegmentOverlay.IOverlaid = HumanSegmentOverlay.overlaid(
    person,
    written,
    t,
    borne,
    placing,
    prepared.resolution,
    unplantedHumanObservation(written.limbs, observed),
    prepared,
    segment,
    direct,
    bare && fits === undefined && observed === undefined ? sample : undefined,
  );
  return {
    posture: {
      ...written,
      limbs: { ...written.limbs, ...overlaid.contacts },
    },
    carried: borne,
    pose: overlaid.pose,
    seeds: overlaid.seeds,
  };
}

/** Records produced by one pre-transition leaf evaluation. */
export namespace readHumanSegmentLeaf {
  /** Each plan's swivel course, made on its first read. */
  const COURSES: WeakMap<
    IAutoMovieMotionHumanActionPlan,
    courseLimbSwivels.Swivels
  > = new WeakMap();

  /**
   * A plan's swivel course of every limb goal it writes
   * (`courseLimbSwivels.swivels`): knots on the frame grid and at the plan's
   * events, each continuing the one before. A displayed second places each limb
   * at the course's swivel and branch against the goal it shows, so a near-tie
   * no longer hops between frames and no read sweeps. The course's first knot
   * is placed at each arm as the entry displays it (`HumanLimbFit.seed` on the
   * entry's pose), so an arm whose goal carries on across a cut keeps the
   * branch and swivel it was shown with rather than a cold fit's, which may
   * take the other elbow side for the same goal.
   *
   * @param plan The segment's plan.
   * @param body The performer's body.
   * @param entry The displayed pose the segment is entered with.
   * @returns The course, made once per plan.
   * @evidence contracts/development/common.md#meaningful-documentation States what is coursed, where it is read and why.
   * @evidence contracts/development/implementation.md#principled-implementation The branch and swivel are the course's; the goal stays the displayed one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One course per plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every knot is a full resolve of the plan's own posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms One continued fit per frame and event, made once per plan; a read interpolates two knots.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course and its knots are kept per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Held weakly by its plan.
   */
  export function swivels(
    plan: IAutoMovieMotionHumanActionPlan,
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMoviePose,
  ): courseLimbSwivels.Swivels {
    let found: courseLimbSwivels.Swivels | undefined = COURSES.get(plan);
    if (found === undefined) {
      const entered: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
      for (const limb of ARMS) {
        const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
          body,
          entry,
          limb,
        );
        if (seed !== null) entered.set(limb, seed);
      }
      found = courseLimbSwivels.swivels({
        entry: entered,
        body,
        // Without an arm that follows a partner (`unfollowedHumanChannels`).
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          plan.posture(seconds, unfollowedHumanChannels(plan, seconds)),
        // The legs keep their own fits: a planted foot is held by its plant
        // and transition corrections, which a course of the leaf alone would
        // not see.
        limbs: ["leftArm", "rightArm"],
        span: { start: 0, end: plan.duration },
        instants: plan.events.map(
          (event: IAutoMovieMotionEvent): number => event.share * plan.duration,
        ),
      });
      COURSES.set(plan, found);
    }
    return found;
  }

  /** The composed posture and the fits produced on this read. */
  export interface IReading {
    /** Authored posture with the overlay contacts. */
    posture: IAutoMovieMotionHumanPosture;
    /** Objects still borne by this action. */
    carried: IAutoMovieMotionHumanSegment.IHeld[];
    /** The resolved displayed pose. */
    pose: IAutoMoviePose;
    /** Continuation seeds for the fitted limbs. */
    seeds: HumanSegmentPose.IFits;
  }
}
