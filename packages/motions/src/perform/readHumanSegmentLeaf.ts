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

import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { courseLimbSwivels } from "../compose/courseLimbSwivels";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { HumanMinimumJerkSpline } from "../posture/HumanMinimumJerkSpline";
import type { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { HumanPreparedPlayback } from "./HumanPreparedPlayback";
import { HumanSegmentCarry } from "./HumanSegmentCarry";
import { HumanSegmentLayer } from "./HumanSegmentLayer";
import { HumanSegmentOverlay } from "./HumanSegmentOverlay";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import { demandedHumanChannels } from "./demandedHumanChannels";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentLegs } from "./readHumanSegmentLegs";
import { unfollowedHumanChannels } from "./unfollowedHumanChannels";
import { unplantedHumanObservation } from "./unplantedHumanObservation";

/**
 * The arms, placed at the anchor course (`readHumanSegmentLeaf.anchors`) where
 * the plan's own course does not place them.
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
 * action's anchor course (`readHumanSegmentLeaf.anchors`).
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
    ? readHumanSegmentLeaf.anchors(person, segment, t, prepared)
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

  /**
   * The segments whose anchors are being read: a read nested in one takes no
   * anchors.
   */
  const ANCHORING: WeakSet<IAutoMovieMotionHumanSegment> = new WeakSet();

  /**
   * The anchor course of a displayed second's arm fits: each fit's swivel and
   * branch, prescribed (`IAutoMovieSwivelNear.prescribed`), as
   * `courseLimbSwivels` gives the plan's own arms. Anchors lie on a fixed grid
   * of the plan's clock, `1 / AutoMovieMotionHumanArmPlanned.LEAST` seconds
   * apart: the least waypoint spacing of a planned arm, between which a goal at
   * a daily reach's peak speed travels at most that plan's spacing. Each anchor
   * is read once, the first continuing the arms the entry displays and each
   * later one continuing the one before it (`anchor`), and kept by the segment;
   * that read is never shown. A fit both anchors around a second give on one
   * branch lies on the minimum-jerk path through its run of anchors (Flash and
   * Hogan 1985, `HumanMinimumJerkSpline`: a quintic between each two whose
   * position, velocity and acceleration carry across each anchor), its forearm
   * twist too where the whole run gives one, so an anchor second shows its
   * interval's limit; any other fit takes the nearer anchor's seed (the other's
   * where only it gives the fit). The closed form places each arm at that
   * swivel on its displayed goal and falls back to refining from it only where
   * the placement misses the goal, leaves the range of motion or meets what the
   * arm keeps clear of (Tolani, Goswami and Badler 2000, §3.2.4: the swivel is
   * the one free parameter of an arm on its goal). None while an anchor is
   * read.
   *
   * @param person The person.
   * @param segment The action.
   * @param t Film seconds.
   * @param prepared The read's preparation.
   * @returns The arm fits' seeds by name, or none.
   * @evidence contracts/development/common.md#meaningful-documentation States the grid and its source, the chained anchor reads, the interpolation, the fallback and when nothing is given.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel is the one free coordinate of an arm on its goal (Tolani §3.2.4); placing it on the minimum-jerk path through the anchor fits chained from the action's start (Flash and Hogan 1985: quintics whose position, velocity and acceleration carry across each anchor) keeps the branch, the elbow and the forearm's twist continuous across anchors, and the anchors are fixed seconds of the action read under the placed state, so a second's pose never depends on the order seconds are read in.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bracketing anchors, each one kept-map lookup or the chain's missing reads, then one pass over their fit names, each a run lookup and one minimum-jerk solve over the run.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goals stay the displayed ones; only the swivel and branch come from the anchors, prescribed for an arm and only continued for a free leg, and a planted leg keeps its own fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read per anchor, overlay count and placed state; every other read is a closed-form placement.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The anchors' fits are kept by the segment for every second between them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most one seed map per anchor and overlay count of the action, released by `HumanSegment.placed` and `HumanSegment.forget`.
   */
  export function anchors(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    t: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): HumanSegmentPose.IFits | undefined {
    if (ANCHORING.has(segment)) return undefined;
    const spacing: number = 1 / AutoMovieMotionHumanArmPlanned.LEAST;
    const local: number = Math.min(
      segment.plan.duration,
      Math.max(0, t - segment.start),
    );
    // The anchor at or before the second and the one after it; an anchor
    // second is the start of its interval, so it reads the same path as the
    // seconds around it.
    const last: number = Math.ceil(segment.plan.duration / spacing - 1e-9);
    const lower: number = Math.min(
      Math.max(0, last - 1),
      Math.floor(local / spacing + 1e-9),
    );
    const from: IAutoMovieMotionHumanSegment.IAnchorFits = anchor(
      person,
      segment,
      lower,
      spacing,
      prepared,
    );
    if (last === 0) return new Map(from);
    const to: IAutoMovieMotionHumanSegment.IAnchorFits = anchor(
      person,
      segment,
      lower + 1,
      spacing,
      prepared,
    );
    const start: number = second(segment, lower, spacing);
    const h: number = second(segment, lower + 1, spacing) - start;
    const share: number = Math.min(1, Math.max(0, (t - start) / h));
    const near: IAutoMovieMotionHumanSegment.IAnchorFits =
      share < 0.5 ? from : to;
    const far: IAutoMovieMotionHumanSegment.IAnchorFits =
      share < 0.5 ? to : from;
    const out: HumanSegmentPose.IFits = new Map();
    for (const name of new Set<string>([...from.keys(), ...to.keys()])) {
      const a: IAutoMovieSwivelSeed | null | undefined = from.get(name);
      const b: IAutoMovieSwivelSeed | null | undefined = to.get(name);
      if (!(a && b && a.branch === b.branch)) {
        out.set(name, near.get(name) ?? far.get(name) ?? null);
        continue;
      }
      // The fit's run: the anchors around the interval that give it on its
      // branch. Its swivel, and its forearm twist where the whole run gives
      // one, lie on the minimum-jerk path through the run (Flash and Hogan
      // 1985, J Neurosci 5:1688, `HumanMinimumJerkSpline`): a quintic between
      // each two anchors whose position, velocity and acceleration carry
      // across each anchor, so an anchor second shows its interval's limit.
      const on: (i: number) => IAutoMovieSwivelSeed | undefined = (
        i: number,
      ): IAutoMovieSwivelSeed | undefined => {
        const seed: IAutoMovieSwivelSeed | null | undefined = anchor(
          person,
          segment,
          i,
          spacing,
          prepared,
        ).get(name);
        return seed && seed.branch === a.branch ? seed : undefined;
      };
      let first: number = lower;
      while (first > 0 && on(first - 1) !== undefined) --first;
      let end: number = lower + 1;
      while (end < last && on(end + 1) !== undefined) ++end;
      const run: IAutoMovieSwivelSeed[] = [];
      for (let i: number = first; i <= end; ++i) run.push(on(i)!);
      const twisted: boolean = run.every(
        (seed: IAutoMovieSwivelSeed): boolean => seed.twist !== undefined,
      );
      const values: number[][] = [];
      for (const seed of run) {
        const before: number[] | undefined = values.at(-1);
        const turn: number =
          before === undefined ? 0 : seed.swivel - before[0]!;
        const swivel: number =
          before === undefined
            ? seed.swivel
            : before[0]! + turn - 360 * Math.round(turn / 360);
        values.push(twisted ? [swivel, seed.twist!] : [swivel]);
      }
      const times: number[] = [];
      for (let i: number = first; i <= end; ++i)
        times.push(second(segment, i, spacing));
      const rates: HumanMinimumJerkSpline.IDerivatives =
        HumanMinimumJerkSpline.derivatives(times, values);
      const k: number = lower - first;
      const at: number[] = HumanMinimumJerkSpline.quintic(
        values[k]!,
        values[k + 1]!,
        rates.velocities[k]!,
        rates.velocities[k + 1]!,
        rates.accelerations[k]!,
        rates.accelerations[k + 1]!,
        h,
        share,
      );
      out.set(name, {
        swivel: at[0]!,
        branch: a.branch,
        ...(at.length > 1 ? { twist: at[1]! } : {}),
      });
    }
    return out;
  }

  /**
   * An anchor's film second: the plan second `index` spacings in, clamped to
   * the plan.
   */
  function second(
    segment: IAutoMovieMotionHumanSegment,
    index: number,
    spacing: number,
  ): number {
    return segment.start + Math.min(segment.plan.duration, index * spacing);
  }

  /**
   * An anchor's arm fits, kept by the segment under the person's overlay count,
   * since a read under fewer overlays (`HumanSegmentShown.laid`) shows other
   * fits. The anchors are chained from the action's start: the first continues
   * the leaf arms the entry displays (`HumanLimbFit.seed` on its pose), the
   * rest of its fits read cold, and each later one continues the one before it
   * (each fit refined from that anchor's seed of it, keeping its branch and
   * swivel where they stay legal), the warm start from the previous swivel a
   * display holds a limb's branch by. A missing anchor reads every missing one
   * below it first, once each, so an anchor's fits depend on the action alone,
   * never on which second was read first.
   */
  function anchor(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    index: number,
    spacing: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieMotionHumanSegment.IAnchorFits {
    const key = (i: number): string => `${person.overlays.length}:${i}`;
    const found: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
      segment.anchors?.get(key(index));
    if (found !== undefined) return found;
    let first: number = index;
    while (first > 0 && segment.anchors?.has(key(first - 1)) !== true) --first;
    // The first anchor continues the arms the entry displays (the cut's own
    // swivel and branch, `HumanLimbFit.seed`), so the anchors leave the cut
    // where the display showed each arm rather than from a cold fit, which
    // may take another solution of the same goal.
    let kept: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
      first === 0
        ? entered(person, segment)
        : segment.anchors!.get(key(first - 1));
    for (let i: number = first; i <= index; ++i) {
      const previous: IAutoMovieMotionHumanSegment.IAnchorFits | undefined =
        kept;
      ANCHORING.add(segment);
      let reading: IReading;
      try {
        reading = readHumanSegmentLeaf(
          person,
          segment,
          second(segment, i, spacing),
          previous === undefined
            ? undefined
            : { seeds: previous, tolerance: hingedArmSwivel.RESOLUTION },
          undefined,
          prepared,
        );
      } finally {
        ANCHORING.delete(segment);
      }
      const arms: Map<string, IAutoMovieSwivelSeed | null> = new Map();
      for (const [name, seed] of reading.seeds)
        if (name.endsWith("Arm")) arms.set(name, seed);
      (segment.anchors ??= new Map()).set(key(i), arms);
      kept = arms;
    }
    return kept!;
  }
  /**
   * Each leaf arm's swivel and branch as the segment's entry displays it, by
   * its fit's name; an arm the entry pose cannot seed is left to a cold fit.
   */
  function entered(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
  ): IAutoMovieMotionHumanSegment.IAnchorFits {
    const seeds: Map<string, IAutoMovieSwivelSeed | null> = new Map();
    for (const limb of ARMS) {
      const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
        person.performer.body,
        segment.context.entry.pose,
        limb,
      );
      if (seed !== null) seeds.set(`leaf::${limb}`, seed);
    }
    return seeds;
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
