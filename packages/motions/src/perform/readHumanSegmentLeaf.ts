import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
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
import type { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/** Read the action before its entering offset, including current holds and overlays. */
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
  const raw: IAutoMovieMotionHumanPosture =
    sample?.posture ??
    Reflect.apply(reader, segment.plan, [
      localSeconds,
      undefined,
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
  const course:
    | ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>
    | undefined =
    fits === undefined
      ? readHumanSegmentLeaf.swivels(
          segment.plan,
          person.performer.body,
        )(localSeconds)
      : undefined;
  const placing: HumanSegmentPose.INear | undefined =
    course === undefined || course.size === 0
      ? fits
      : {
          seeds: new Map<string, IAutoMovieSwivelSeed | null>(
            [...course]
              // Legs kept over a legs-still window keep their own fit there.
              .filter(
                ([limb]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): boolean =>
                  !limb.endsWith("Leg") ||
                  segment.plan.legsStill === undefined ||
                  localSeconds < segment.plan.legsStill[0] ||
                  localSeconds > segment.plan.legsStill[1],
              )
              .map(
                ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelSeed]): [
                  string,
                  IAutoMovieSwivelSeed,
                ] => [`leaf::${limb}`, seed],
              ),
          ),
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
   * (`courseLimbSwivels.swivels`): knots at the plan's ends and events,
   * refined where interpolation leaves a knot's own fit. A displayed second
   * places each limb at the course's swivel and branch against the goal it
   * shows, so a near-tie no longer hops between frames and no read sweeps.
   *
   * @param plan The segment's plan.
   * @param body The performer's body.
   * @returns The course, made once per plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is coursed, where it is read and why.
   * @evidence contracts/development/implementation.md#principled-implementation The branch and swivel are the course's; the goal stays the displayed one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One course per plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every knot is a full resolve of the plan's own posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms Knots only where the swivel path leaves its interpolation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The course and its knots are kept per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Held weakly by its plan.
   */
  export function swivels(
    plan: IAutoMovieMotionHumanActionPlan,
    body: IAutoMovieMotionHumanBody,
  ): courseLimbSwivels.Swivels {
    let found: courseLimbSwivels.Swivels | undefined = COURSES.get(plan);
    if (found === undefined) {
      found = courseLimbSwivels.swivels({
        body,
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          plan.posture(seconds),
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
