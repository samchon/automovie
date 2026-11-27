import { AutoMovieEngineHingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSegment,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { HumanMinimumJerkSpline } from "../../posture/internal/HumanMinimumJerkSpline";
import type { HumanSegmentPose } from "./HumanSegmentPose";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";
import { readHumanSegmentLeaf } from "./readHumanSegmentLeaf";

/*
 * The anchor course of a displayed second's arm fits: each fit's swivel and
 * branch, prescribed (`IAutoMovieSwivelNear.prescribed`), as
 * `courseLimbSwivels` gives the plan's own arms. Anchors lie on a fixed grid of
 * the plan's clock, `1 / AutoMovieMotionHumanArmPlanned.LEAST` seconds apart:
 * the least waypoint spacing of a planned arm, between which a goal at a daily
 * reach's peak speed travels at most that plan's spacing. The anchors are
 * solved when the performance is prepared
 * (readHumanSegmentAnchors.prepare). A fit both anchors around a second
 * give on one branch lies on the minimum-jerk path through its run of anchors
 * (Flash and Hogan 1985, `HumanMinimumJerkSpline`: a quintic between each two
 * whose position, velocity and acceleration carry across each anchor), its
 * forearm twist too where the whole run gives one, so an anchor second shows
 * its interval's limit; any other fit takes the nearer anchor's seed (the
 * other's where only it gives the fit). The closed form places each arm at that
 * swivel on its displayed goal and falls back to refining from it only where
 * the placement misses the goal, leaves the range of motion or meets what the
 * arm keeps clear of (Tolani, Goswami and Badler 2000, §3.2.4: the swivel is
 * the one free parameter of an arm on its goal). None before the performance is
 * prepared.
 * Parameter segment: The action.
 * Parameter t: Film seconds.
 * Returns: The arm fits' seeds by name, or none.
 */
export function readHumanSegmentAnchors(
  segment: readHumanSegmentAnchors.IAnchored,
  t: number,
): HumanSegmentPose.IFits | undefined {
  const anchors: readonly IAutoMovieMotionHumanSegment.IAnchorFits[] =
    segment.prepared?.anchors ?? [];
  if (anchors.length === 0) return undefined;
  const spacing: number = 1 / AutoMovieMotionHumanArmPlanned.LEAST;
  const local: number = Math.min(
    segment.plan.duration,
    Math.max(0, t - segment.start),
  );

  // The anchor at or before the second and the one after it; an anchor
  // second is the start of its interval, so it reads the same path as the
  // seconds around it.
  const last: number = anchors.length - 1;
  const lower: number = Math.min(
    Math.max(0, last - 1),
    Math.floor(local / spacing + 1e-9),
  );
  const from: IAutoMovieMotionHumanSegment.IAnchorFits = anchors[lower]!;
  if (last === 0) return new Map(from);
  const to: IAutoMovieMotionHumanSegment.IAnchorFits = anchors[lower + 1]!;
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
    const on = (i: number): IAutoMovieSwivelSeed | undefined => {
      const seed: IAutoMovieSwivelSeed | null | undefined =
        anchors[i]!.get(name);
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

/*
 * The anchor course's preparation.
 */
export namespace readHumanSegmentAnchors {
  /*
   * What a read takes of an action: its time zero, its plan's duration and its
   * prepared anchors.
   */
  export interface IAnchored extends Pick<
    IAutoMovieMotionHumanSegment,
    "start" | "prepared"
  > {
    /*
     * The plan's duration.
     */
    plan: Pick<IAutoMovieMotionHumanActionPlan, "duration">;
  }

  /*
   * Every anchor's arm fits of an action, chained from its start: the first
   * continues the leaf arms the entry displays (`HumanLimbFit.seed` on its
   * pose), the rest of its fits read cold, and each later one continues the one
   * before it (each fit refined from that anchor's seed of it, keeping its
   * branch and swivel where they stay legal), the warm start from the previous
   * swivel a display holds a limb's branch by. Each anchor is one leaf read on
   * the placed performance with every overlay, so an anchor's fits depend on
   * the action alone, never on which second was read first.
   * Parameter person: The person.
   * Parameter segment: The action.
   * Parameter prepared: The reads' preparation.
   * Returns: The anchors' arm fits, by anchor index.
   */
  export function prepare(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMovieMotionHumanSegment.IAnchorFits[] {
    const spacing: number = 1 / AutoMovieMotionHumanArmPlanned.LEAST;
    const last: number = Math.ceil(segment.plan.duration / spacing - 1e-9);
    const out: IAutoMovieMotionHumanSegment.IAnchorFits[] = [];

    // The first anchor continues the arms the entry displays (the cut's own
    // swivel and branch, `HumanLimbFit.seed`), so the anchors leave the cut
    // where the display showed each arm rather than from a cold fit, which
    // may take another solution of the same goal.
    let kept: IAutoMovieMotionHumanSegment.IAnchorFits = entered(
      person,
      segment,
    );
    for (let i: number = 0; i <= last; ++i) {
      const reading: readHumanSegmentLeaf.IReading = readHumanSegmentLeaf(
        person,
        segment,
        second(segment, i, spacing),
        { seeds: kept, tolerance: AutoMovieEngineHingedArmSwivel.RESOLUTION },
        undefined,
        prepared,
      );
      const arms: Map<string, IAutoMovieSwivelSeed | null> = new Map();
      for (const [name, seed] of reading.seeds)
        if (name.endsWith("Arm")) arms.set(name, seed);
      out.push(arms);
      kept = arms;
    }
    return out;
  }
}

/*
 * The arms, whose leaf fits the entry seeds (`entered`).
 */
const ARMS: readonly AutoMovieHumanLimb[] = ["leftArm", "rightArm"];

/*
 * An anchor's film second: the plan second `index` spacings in, clamped to the
 * plan.
 */
function second(
  segment: readHumanSegmentAnchors.IAnchored,
  index: number,
  spacing: number,
): number {
  return segment.start + Math.min(segment.plan.duration, index * spacing);
}

/*
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
