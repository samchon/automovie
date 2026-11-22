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

import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { courseLimbSwivels } from "../compose/courseLimbSwivels";
import type { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/** The limbs whose fits continue an anchor second's (`readHumanSegmentLeaf.anchors`); the legs keep their own fits. */
const ARMS: readonly AutoMovieHumanLimb[] = ["leftArm", "rightArm"];

/**
 * Read the action before its entering offset, including current holds and
 * overlays. A read with no fits of its own places the arms at the plan's
 * swivel course (`readHumanSegmentLeaf.swivels`) and continues every other
 * arm fit from the nearest anchor second (`readHumanSegmentLeaf.anchors`).
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

  // The arm fits the course does not place (an overlay leaf's, a carry's, a
  // contact's re-aim, an arm the course holds no seed for) continue the
  // nearest anchor second's (`anchors`), so a read refines a seed instead of
  // sweeping every swivel. A read with none of those fits continues nothing.
  const anchoring: boolean =
    fits === undefined &&
    (borne.length !== 0 ||
      (person.overlays.length !== 0 &&
        HumanSegmentOverlay.running(person, t).length !== 0) ||
      ARMS.some(
        (limb: AutoMovieHumanLimb): boolean =>
          written.limbs[limb] !== undefined && course?.get(limb) === undefined,
      ));
  const anchors: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
    anchoring
      ? readHumanSegmentLeaf.anchors(person, segment, t, prepared)
      : undefined;
  const placing: HumanSegmentPose.INear | undefined =
    course === undefined || course.size === 0
      ? anchors === undefined
        ? fits
        : {
            seeds: new Map<string, IAutoMovieSwivelSeed | null>(),
            tolerance: hingedArmSwivel.RESOLUTION,
            prescribed: true,
            anchors,
          }
      : {
          ...(anchors === undefined ? {} : { anchors }),
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

  // A whole read that continued no anchor at an anchor second is that anchor's.
  if (anchoring && anchors === undefined && observed === undefined)
    readHumanSegmentLeaf.anchored(person, segment, t, overlaid.seeds);
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

  /** The segments whose anchor second is being read: that read fits cold. */
  const ANCHORING: WeakSet<IAutoMovieMotionHumanSegment> = new WeakSet();

  /**
   * The arm fits a displayed second with no fits of its own continues: the
   * nearest anchor second's, read once per anchor with every fit cold and
   * kept by the segment. Anchors lie on a fixed grid of the plan's clock,
   * `1 / AutoMovieMotionHumanArmPlanned.LEAST` seconds apart, the least
   * waypoint spacing of a planned arm, between which a goal at a daily
   * reach's peak speed travels at most that plan's spacing. None at an
   * anchor second itself, whose own read keeps its fits (`anchored`), nor
   * while an anchor is read.
   *
   * @param person The person.
   * @param segment The action.
   * @param t Film seconds.
   * @param prepared The read's preparation.
   * @returns The anchor's arm fits by name, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is continued, from which second, its spacing and when nothing is.
   * @evidence contracts/development/implementation.md#principled-implementation Continuation from a nearby solution is how a display holds a limb's branch from frame to frame (warm start); the anchor is a fixed second of the action read cold under the placed state, so a second's fits depend on its own goal and its anchor alone, never on the order seconds are read in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one kept map lookup, one cold read on a miss.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every continued fit is refined against its own goal; an anchor gives only its start, and the legs keep their own fits.
   * @evidence contracts/development/implementation.md#efficient-algorithms One cold read per anchor, overlay count and placed state; every other second refines seeds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The anchor's fits are kept by the segment for every second that continues them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most one seed map per anchor and overlay count of the action, released by `HumanSegment.placed` and `HumanSegment.forget`.
   */
  export function anchors(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    t: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieMotionHumanSegment.IAnchorFits | undefined {
    if (ANCHORING.has(segment)) return undefined;
    const anchor: IAnchor = nearest(person, segment, t);
    const kept: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
      segment.anchors?.get(anchor.key);
    if (kept !== undefined) return kept;
    if (Math.abs(anchor.at - t) <= 1e-12) return undefined;
    ANCHORING.add(segment);
    let reading: IReading;
    try {
      reading = readHumanSegmentLeaf(
        person,
        segment,
        anchor.at,
        undefined,
        undefined,
        prepared,
      );
    } finally {
      ANCHORING.delete(segment);
    }
    return keep(segment, anchor.key, reading.seeds);
  }

  /**
   * Keep a whole cold read's arm fits where it is an anchor second's
   * (`IAutoMovieMotionHumanSegment.anchors`).
   *
   * @param person The person.
   * @param segment The action.
   * @param t The read's film second.
   * @param seeds The read's fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept and when.
   * @evidence contracts/development/implementation.md#principled-implementation Only an anchor second's own fits are kept, arms alone, so the read an anchor stands for is the one kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test and one insertion.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No fit is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the read's fits.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A kept anchor is never read again until released.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One map per anchor and overlay count, released with the rest (`anchors`).
   */
  export function anchored(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    t: number,
    seeds: HumanSegmentPose.IFits,
  ): void {
    const anchor: IAnchor = nearest(person, segment, t);
    if (Math.abs(anchor.at - t) <= 1e-12) keep(segment, anchor.key, seeds);
  }

  /** The anchor nearest a film second of the action: its key among the segment's anchors and its film second. */
  function nearest(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    t: number,
  ): IAnchor {
    const spacing: number = 1 / AutoMovieMotionHumanArmPlanned.LEAST;
    const duration: number = segment.plan.duration;
    const index: number = Math.round(
      Math.min(duration, Math.max(0, t - segment.start)) / spacing,
    );
    return {
      // A read under fewer overlays (`HumanSegmentShown.laid`) shows other fits.
      key: `${person.overlays.length}:${index}`,
      at: segment.start + Math.min(duration, index * spacing),
    };
  }

  /** Keep a read's arm fits under an anchor's key unless one is kept there, and return the kept fits. */
  function keep(
    segment: IAutoMovieMotionHumanSegment,
    key: string,
    seeds: HumanSegmentPose.IFits,
  ): IAutoMovieMotionHumanSegment.IAnchorFits {
    const kept: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
      segment.anchors?.get(key);
    if (kept !== undefined) return kept;
    const arms: Map<string, IAutoMovieSwivelSeed | null> = new Map();
    for (const [name, seed] of seeds)
      if (name.endsWith("Arm")) arms.set(name, seed);
    (segment.anchors ??= new Map()).set(key, arms);
    return arms;
  }

  /**
   * An anchor second of an action's display.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The key the segment keeps its fits under and the film second they are read at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, private to the anchor readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The key is the interface's own (`IAutoMovieMotionHumanSegment.anchors`).
   */
  interface IAnchor {
    /** The key, `<overlays>:<anchor>`. */
    key: string;

    /** The anchor's film second. */
    at: number;
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
