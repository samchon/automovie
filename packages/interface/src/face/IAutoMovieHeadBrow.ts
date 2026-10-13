/**
 * Brow traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`, with
 * omission leaving the template's brows unchanged.
 *
 * Both brows move together. `flattenHead` renames `height` to `browHeight` and
 * `angle` to `browAngle`.
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.brow` in `flattenHead` maps each of the two leaves to one unsided morph name and copies the weight, so one value drives one template target covering both brows.
 * @evidence contracts/common.md#clear-and-simple-design Two leaves on one record are the whole coarse brow; per-side brows belong to the sided `IAutoMovieFaceBrowSet` of the face vocabulary, not to this head group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raised single brow is approximated by splitting a weight; the head vocabulary simply has no sided brow target.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, that both brows move together, and the two morph names; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadBrow {
  /** Vertical brow position: `+` higher, `-` lower. */
  height?: number;

  /** Brow tilt: `+` arched up, `-` angled down. */
  angle?: number;
}
