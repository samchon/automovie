import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanSegment,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { HumanMinimumJerkSpline } from "../posture/HumanMinimumJerkSpline";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";

/** The arms, whose leaf fits the entry seeds (`entered`). */
const ARMS: readonly AutoMovieHumanLimb[] = ["leftArm", "rightArm"];
/**
 * The segments whose anchors are being read: a read nested in one takes no
 * anchors.
 */
const ANCHORING: WeakSet<IAutoMovieMotionHumanSegment> = new WeakSet();

/**
 * The anchor course of a displayed second's arm fits: each fit's swivel and
 * branch, prescribed (`IAutoMovieSwivelNear.prescribed`), as
 * `courseLimbSwivels` gives the plan's own arms. Anchors lie on a fixed grid of
 * the plan's clock, `1 / AutoMovieMotionHumanArmPlanned.LEAST` seconds apart:
 * the least waypoint spacing of a planned arm, between which a goal at a daily
 * reach's peak speed travels at most that plan's spacing. Each anchor is read
 * once, the first continuing the arms the entry displays and each later one
 * continuing the one before it (`anchor`), and kept by the segment; that read
 * is never shown. A fit both anchors around a second give on one branch lies on
 * the minimum-jerk path through its run of anchors (Flash and Hogan 1985,
 * `HumanMinimumJerkSpline`: a quintic between each two whose position, velocity
 * and acceleration carry across each anchor), its forearm twist too where the
 * whole run gives one, so an anchor second shows its interval's limit; any
 * other fit takes the nearer anchor's seed (the other's where only it gives the
 * fit). The closed form places each arm at that swivel on its displayed goal
 * and falls back to refining from it only where the placement misses the goal,
 * leaves the range of motion or meets what the arm keeps clear of (Tolani,
 * Goswami and Badler 2000, §3.2.4: the swivel is the one free parameter of an
 * arm on its goal). None while an anchor is read.
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
export function readHumanSegmentAnchors(
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
  const far: IAutoMovieMotionHumanSegment.IAnchorFits = share < 0.5 ? to : from;
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
      const turn: number = before === undefined ? 0 : seed.swivel - before[0]!;
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
 * An anchor's film second: the plan second `index` spacings in, clamped to the
 * plan.
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
 * the leaf arms the entry displays (`HumanLimbFit.seed` on its pose), the rest
 * of its fits read cold, and each later one continues the one before it (each
 * fit refined from that anchor's seed of it, keeping its branch and swivel
 * where they stay legal), the warm start from the previous swivel a display
 * holds a limb's branch by. A missing anchor reads every missing one below it
 * first, once each, so an anchor's fits depend on the action alone, never on
 * which second was read first.
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
    const previous: IAutoMovieMotionHumanSegment.IAnchorFits | undefined = kept;
    ANCHORING.add(segment);
    let reading: readHumanSegmentLeaf.IReading;
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
 * Each leaf arm's swivel and branch as the segment's entry displays it, by its
 * fit's name; an arm the entry pose cannot seed is left to a cold fit.
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
