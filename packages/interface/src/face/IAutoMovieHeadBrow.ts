import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Brow traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`,
 * omitted meaning the template's brows unchanged. Both brows move together;
 * `flattenHead` projects `height` onto `browHeight` and `angle` onto
 * `browAngle`.
 *
 * @evidence contracts/common.md#principled-implementation Two leaves that `flattenHead` maps onto the unsided `browHeight` and `browAngle` names, so one value moves both brows through the template's additive delta.
 * @evidence contracts/common.md#clear-and-simple-design Only vertical position and tilt, kept apart from the eyes group so a brow edit never touches an eye morph name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No side split or mirroring exists here; the flat map copies each present brow value unchanged into the result.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, that omission is neutral, that both brows move together, and the two morph names; members give the direction of height and angle.
 * @author Samchon
 */
export interface IAutoMovieHeadBrow {
  /** Vertical brow position: `+` higher (feminine arch), `-` lower. */
  height?: AutoMovieFaceWeight;

  /** Brow tilt: `+` arched up, `-` angled down. */
  angle?: AutoMovieFaceWeight;
}
