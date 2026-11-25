import type {
  IAutoMovieMark,
  IAutoMovieMarkRomOvershoot,
} from "@automovie/interface";

/**
 * Turn joints' range-of-motion overshoot at one instant into flagged inspection
 * marks at the joints that exceed their range.
 *
 * Each entry is a joint's path, its world position in metres and its overshoot
 * in degrees, as `jointRomOvershoot` measures it. A joint with a positive
 * overshoot, or an unmeasurable one (`Infinity`), becomes one flagged point of
 * kind `rom`, label `range overshoot`, colour olive drab `556b2f`, at path
 * `<path>/rom`; a joint within its range draws nothing. The mark is in world
 * metres and unanchored.
 *
 * It throws for a position that is not finite or an overshoot that is negative
 * or NaN.
 *
 * @param entries Joints with their world positions and measured overshoots.
 * @returns One flagged mark per joint past its range, in the entries' order.
 */
export function markAutoMovieRomOvershoot(
  entries: IAutoMovieMarkRomOvershoot.IEntries,
): IAutoMovieMark[] {
  const marks: IAutoMovieMark[] = [];
  for (const entry of entries) {
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
