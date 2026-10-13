/**
 * Brow traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`,
 * omitted meaning the template's brows unchanged. Both brows move together;
 * `flattenHead` projects `height` onto `browHeight` and `angle` onto
 * `browAngle`.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadBrow {
  /** Vertical brow position: `+` higher (feminine arch), `-` lower. */
  height?: number;

  /** Brow tilt: `+` arched up, `-` angled down. */
  angle?: number;
}
