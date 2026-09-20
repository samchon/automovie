/**
 * One conservative contact found over one ordered camera sample interval.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-dynamic-spatial-sampling Exposes the exact interval, envelope owner, and scene obstacle that failed the swept comparison.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Types the addressed finding returned instead of accepting a penetrating camera path.
 * @author Samchon
 */
export interface IAutoMovieCameraClearanceFinding {
  /** Camera or parent-rig envelope that contacted scene geometry. */
  part: "body" | "parent-rig";

  /** Stable scene-node identity whose current bound was contacted. */
  obstacle: string;

  /** Inclusive shot-local interval start in seconds. */
  start: number;

  /** Inclusive shot-local interval end in seconds. */
  end: number;
}
