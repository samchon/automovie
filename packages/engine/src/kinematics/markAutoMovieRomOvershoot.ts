import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieMark } from "../geometry/IAutoMovieMark";

/**
 * Turn joints' range-of-motion overshoot at one instant into flagged inspection marks at the joints that exceed their range.
 *
 * Each entry is a joint's path, its world position in metres and its overshoot in degrees, as `jointRomOvershoot` measures it. A joint with a positive overshoot, or an unmeasurable one (`Infinity`), becomes one flagged point of kind `rom`, label `range overshoot`, colour olive drab `556b2f`, at path `<path>/rom`; a joint within its range draws nothing. The mark is in world metres and unanchored.
 *
 * It throws for a position that is not finite or an overshoot that is negative or NaN.
 *
 * @param entries Joints with their world positions and measured overshoots.
 * @returns One flagged mark per joint past its range, in the entries' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input and its source, which joints are marked and how, the kind, label, colour, path and frame, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The measure is the pose gate's own overshoot sum, so a mark appears exactly where the gate reports a violation, and an overshoot is an anomaly of the joint, so the mark is flagged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one map over the entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance hides a small overshoot, and no joint is named; an unmeasurable overshoot is marked rather than skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the entries.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one instant.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieRomOvershoot(
  entries: readonly { path: string; at: IAutoMovieVector3; overshoot: number }[],
): IAutoMovieMark[] {
  const marks: IAutoMovieMark[] = [];
  for (const entry of entries) {
    if (![entry.at.x, entry.at.y, entry.at.z].every(Number.isFinite))
      throw new Error(
        `markAutoMovieRomOvershoot: joint ${entry.path} has no finite position`,
      );
    if (!(entry.overshoot >= 0))
      throw new Error(
        `markAutoMovieRomOvershoot: joint ${entry.path} has the overshoot ${entry.overshoot}, not zero or more degrees`,
      );
    if (entry.overshoot === 0) continue;
    marks.push({
      path: `${entry.path}/rom`,
      kind: "rom",
      label: "range overshoot",
      color: 0x556b2f,
      shape: { type: "points", points: [entry.at.x, entry.at.y, entry.at.z] },
      flagged: true,
      anchor: null,
    });
  }
  return marks;
}
