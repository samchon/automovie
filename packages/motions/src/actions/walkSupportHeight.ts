import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "./walkLeg";
import { walkReach } from "./walkReach";
import { walkRoot } from "./walkRoot";

/** Walking pelvis height and the approaching ankle's claim at touchdown. */
interface ISupport {
  /** The scheduled horizontal path at its contact-constrained height. */
  root: IAutoMovieMotionHumanWalkSteps.IPlan["root"];

  /** A footfall's residual lowering under that root, in metres. */
  landing: (
    side: AutoMovieHumanSide,
    seconds: number,
    read: Parameters<typeof walkReach.pelvis>[5],
  ) => number;
}

/**
 * Limit the walking pelvis's rise above the two adjacent double-support
 * heights.
 *
 * @param plan The original alternating footfalls, amounts and unlowered root.
 * @param body The performer's segment masses and measured leg length.
 * @param lift Swing ankle height expressed in hip heights.
 * @param pelvis The three pelvic joint angles at an action second, in degrees.
 * @param claim The existing two-link knee-floor bound for this body.
 * @returns The original horizontal root with its walking height bounded by both
 *   planted legs and a reader of each landing's residual claim.
 */
export function walkSupportHeight(
  plan: IAutoMovieMotionHumanWalkSteps.IPlan,
  body: IAutoMovieMotionHumanBody,
  lift: number,
  pelvis: (seconds: number) => Parameters<typeof walkReach.pelvis>[3],
  claim: ReturnType<typeof walkReach.prepareShort>,
): ISupport {
  const times: number[] = plan.stances
    .map(
      (
        stance: IAutoMovieMotionHumanWalkSteps.IPlan["stances"][number],
      ): number => stance.from,
    )
    .filter((time: number): boolean => time > 0)
    .sort((a: number, b: number): number => a - b);
  times.unshift(0);
  times.push(plan.duration);
  const heights: (number | undefined)[] = [];
  // Perry and Burnfield report a 4–5 cm whole-body vertical excursion.
  const rise: number =
    (0.04 + 0.05) / 2 -
    walkRoot.distalShare(body) * lift * body.measure.hipHeight;
  const support: (seconds: number) => number = (seconds: number): number => {
    const feet: Parameters<typeof walkReach.pelvis>[4] = {
      left: plan.foot("left", seconds),
      right: plan.foot("right", seconds),
    };
    const raw: IAutoMovieVector3 = plan.root(seconds);
    const hips: Parameters<typeof walkReach.pelvis>[3] = pelvis(seconds);
    const frame: walkReach.IPelvis = walkReach.pelvis(
      body,
      raw,
      plan.yaw(seconds),
      hips,
      feet,
    );
    return walkReach.ground(
      body,
      raw,
      frame,
      hips,
      feet,
      {},
      walkLeg.ROCKER * plan.amount(seconds),
    ).root.y;
  };
  const rootAt: ISupport["root"] = (t: number): IAutoMovieVector3 => {
    const root: IAutoMovieVector3 = plan.root(t);
    const amount: number = plan.amount(t);
    if (amount === 0 || t < times[0]! || t >= plan.duration) return root;
    let low: number = 0;
    let high: number = times.length - 1;
    while (high - low > 1) {
      const middle: number = Math.floor((low + high) / 2);
      if (times[middle]! <= t) low = middle;
      else high = middle;
    }
    const begin: number = (heights[low] ??= support(times[low]!));
    const u: number = (t - times[low]!) / (times[high]! - times[low]!);
    if (u === 0)
      return { ...root, y: root.y - amount * Math.max(0, root.y - begin) };
    const end: number = (heights[high] ??= support(times[high]!));
    const through: number = u * u * (3 - 2 * u);
    const limit: number =
      begin + (end - begin) * through + rise * Math.sin(Math.PI * u) ** 2;
    return { ...root, y: root.y - amount * Math.max(0, root.y - limit) };
  };
  /**
   * Read the heel-strike ankle directly from the stance it lands in. A swing's
   * departure velocity, clearance and middle path cannot affect that endpoint.
   * The plan retains one scalar per used footfall.
   */
  const landings: Record<AutoMovieHumanSide, Map<number, number>> = {
    left: new Map(),
    right: new Map(),
  };
  function landing(
    side: AutoMovieHumanSide,
    seconds: number,
    read: Parameters<typeof walkReach.pelvis>[5],
  ): number {
    const retained: number | undefined = landings[side].get(seconds);
    if (retained !== undefined) return retained;
    const feet: Parameters<typeof walkReach.pelvis>[4] = {
      left: plan.foot("left", seconds),
      right: plan.foot("right", seconds),
    };
    const frame: walkReach.IPelvis = walkReach.pelvis(
      body,
      rootAt(seconds),
      plan.yaw(seconds),
      pelvis(seconds),
      feet,
      read,
    );
    const lowering: number = claim(
      frame.hips[side],
      feet[side].placement.ankle,
    );
    landings[side].set(seconds, lowering);
    return lowering;
  }
  return { root: rootAt, landing };
}
