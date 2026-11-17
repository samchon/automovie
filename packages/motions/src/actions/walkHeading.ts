import { wrapDegrees } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * How far a walk's footprint may turn, from the foot's own last footprint
 * and from the line to its hip, so the walk takes a turn the way the legs
 * can (`walkSteps`).
 *
 * A body that sets off toward a way behind it turns about over its first
 * footfalls: each foot turns at most `STEP` of the turn's amplitude from its
 * own last footprint, the yaw a foot turns in one swing of a standing turn,
 * so a turn about takes some three steps instead of one swing through the
 * whole turn. And a footprint turns no further from the line to its hip
 * than keeps that line within `ROLL` of the foot's side when the foot
 * lifts, so the ankle's inversion and eversion hold the stance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both bounds, what each is read from and their sources.
 * @evidence contracts/development/design.md#principled-representation Two bounds on one heading: a foot's turn per swing as cited data over the turn's amplitude, and the leg's lean as an angle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two bounds the footstep planner applies and the data they read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No walk is special-cased: a footprint the bounds already hold is left as it was.
 */
export namespace walkHeading {
  /** The furthest a planted leg's line leans to the side of its foot, degrees: 5° inside the ankle's 25° of inversion and eversion (DEFAULT_HUMANOID_ROM), provisional room for the pelvis's drop and list. */
  export const ROLL: number = 20;

  /** The yaw a foot turns in one swing of a standing turn, degrees, at the turn's amplitude, degrees: 73.5 +/- 14.3 at 90, 88.6 +/- 24.4 at 135 and 95.0 +/- 26.0 at 180, over 1.95, 2.75 and 3.25 steps (Khobkhun, Hollands and Richards 2022, Appl Sci 12:5474, Table 1, 20 younger adults turning on level ground at a self-selected speed, inertial sensors); between them linear, and the nearest beyond. */
  export const STEP: readonly (readonly [number, number])[] = [
    [90, 73.54],
    [135, 88.55],
    [180, 95.0],
  ];

  /**
   * The yaw a foot turns in one swing of a turn of an amplitude.
   *
   * @param amplitude The whole turn, degrees.
   * @returns Degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and how it is read.
   * @evidence contracts/development/implementation.md#principled-implementation Linear between the cited amplitudes, the nearest beyond them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table walk.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is extrapolated past the measured amplitudes.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three rows.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function step(amplitude: number): number {
    const a: number = Math.abs(amplitude);
    if (a <= STEP[0]![0]) return STEP[0]![1];
    for (let i: number = 1; i < STEP.length; i++) {
      const [x1, y1] = STEP[i]!;
      if (a <= x1) {
        const [x0, y0] = STEP[i - 1]!;
        return y0 + ((y1 - y0) * (a - x0)) / (x1 - x0);
      }
    }
    return STEP.at(-1)![1];
  }

  /**
   * How many opening footfalls a walk steps in place to turn about: when a
   * foot's first swing cannot face the way the walk sets off (turning at
   * most `step` of the turn), the feet alternate in place, each turning at
   * most that far, until both face within `twist` of the way, so the walk
   * sets off from feet the pelvis can face between.
   *
   * @param heading The way the walk sets off, degrees, unwrapped about `yaw`.
   * @param lead The foot that steps first; the feet alternate.
   * @param start Each foot's facing before the walk, degrees.
   * @param yaw The heading the walk starts from, degrees.
   * @param twist How far the pelvis turns from a foot it stands on, degrees (`walkReach.TWIST`).
   * @returns The count; 0 when the first swing of each foot faces the way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is counted, the bounds and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A standing turn before gait: the feet alternate, each turning the cited yaw per swing toward the way, until both face it within the pelvis's twist; a half turn takes four footfalls and a quarter two, against 3.25 and 1.95 steps measured (Khobkhun et al. 2022).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over alternating feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A way within a swing's turn counts none, so such a walk sets off as before.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most a few footfalls.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function opening(
    heading: number,
    lead: "left" | "right",
    start: Record<"left" | "right", number>,
    yaw: number,
    twist: number,
  ): number {
    const limit: number = step(heading - yaw);
    const last: Record<"left" | "right", number> = {
      left: yaw + wrapDegrees(start.left - yaw),
      right: yaw + wrapDegrees(start.right - yaw),
    };
    // A foot already within the twist of the way turns no more in place.
    const far = (s: "left" | "right"): boolean =>
      Math.abs(heading - last[s]) > twist;
    if (
      Math.abs(heading - last.left) <= limit &&
      Math.abs(heading - last.right) <= limit
    )
      return 0;
    let side: "left" | "right" = lead;
    let count: number = 0;
    while (far("left") || far("right")) {
      const off: number = heading - last[side];
      last[side] += Math.sign(off) * Math.min(limit, Math.abs(off));
      count++;
      side = side === "left" ? "right" : "left";
    }
    return count;
  }

  /**
   * The footfalls' facings with each foot turning at most `step` of the
   * walk's largest turn from its own last footprint, in order.
   *
   * @param towards Each footfall's facing as the way asks it, degrees, unwrapped about the starting heading.
   * @param lead The foot of the first footfall; the feet alternate.
   * @param start Each foot's facing before the walk, degrees.
   * @param yaw The heading the walk starts from, degrees.
   * @param kept How many footfalls at the end keep their asked facing (the closing pair).
   * @returns The facings, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound, the order and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A foot turns from its own last footprint at most the yaw a foot turns per swing in a standing turn of the walk's amplitude; the rest of the turn is left to its later footfalls.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the footfalls, one clamp each.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A facing within the bound is returned as asked, so a walk that does not turn about is unchanged; the closing pair keeps the arrival's facing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pass.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new array and retains nothing.
   */
  export function about(
    towards: readonly number[],
    lead: "left" | "right",
    start: Record<"left" | "right", number>,
    yaw: number,
    kept: number,
  ): number[] {
    const amplitude: number = Math.max(
      0,
      ...towards.map((t: number): number => Math.abs(t - yaw)),
    );
    const limit: number = step(amplitude);
    const last: Record<"left" | "right", number> = {
      left: yaw + wrapDegrees(start.left - yaw),
      right: yaw + wrapDegrees(start.right - yaw),
    };
    return towards.map((toward: number, j: number): number => {
      const side: "left" | "right" =
        j % 2 === 0 ? lead : lead === "left" ? "right" : "left";
      const turned: number =
        j >= towards.length - kept || Math.abs(toward - last[side]) <= limit
          ? toward
          : last[side] + Math.sign(toward - last[side]) * limit;
      last[side] = turned;
      return turned;
    });
  }

  /**
   * A footprint's heading turned no further from the line to its hip than
   * the ankle can lean sideways when the foot lifts.
   *
   * @param heading The footprint's heading, degrees.
   * @param point The footprint's ankle, world metres.
   * @param hip The hip over it when the foot lifts, world metres.
   * @param leeway How far across the foot the hip may lie, metres: the leg's height times the tangent of `ROLL`.
   * @param behind Whether a hip behind the foot (a backward step) leans the leg the other way.
   * @returns The heading, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and each input.
   * @evidence contracts/development/implementation.md#principled-implementation The angle between the foot's line and the line to its hip is held within the band the leeway subtends at the hip's distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance, one band and one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hip within the leeway leaves the heading as it is.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leaned(
    heading: number,
    point: IAutoMovieVector3,
    hip: IAutoMovieVector3,
    leeway: number,
    behind: boolean,
  ): number {
    const reach: number = Math.hypot(hip.x - point.x, hip.z - point.z);
    if (reach <= leeway) return heading;
    const band: number = (Math.asin(leeway / reach) * 180) / Math.PI;
    const line: number = wrapDegrees(
      heading - (Math.atan2(hip.x - point.x, hip.z - point.z) * 180) / Math.PI,
    );
    const off: number =
      behind && Math.abs(line) > 90 ? wrapDegrees(line - 180) : line;
    return heading + Math.max(-band, Math.min(band, off)) - off;
  }
}
