/**
 * How a model turns its eyes for the gaze channels of an expression, after the
 * VRM 1.0 `lookAt` extension.
 *
 * The gaze channels are the `lookUp`, `lookDown`, `lookLeft` and `lookRight`
 * presets and the eight `eyeLook*` ARKit channels. `"expression"` keeps them on
 * morph targets and expression sinks, as a model without this record does.
 * `"bone"` turns the `leftEye` and `rightEye` bones instead and takes the
 * channels off the morphs, because a morph cannot rotate an eyeball mesh
 * without shrinking it at intermediate weights.
 *
 * Reference: VRM 1.0 lookAt
 * (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md).
 */
export type IAutoMovieLookAt =
  | IAutoMovieLookAt.IBone
  | IAutoMovieLookAt.IExpression;
/** Bone-driven and expression-driven eye gaze alternatives. */
export namespace IAutoMovieLookAt {
  /**
   * Gaze turns the eye bones.
   *
   * Each eye turns by clinical flexion, positive down, and twist, positive
   * toward the model's own left, the conventions the head's gaze uses; in the
   * canonical rest frame the default basis puts them on the eye's +X and +Y,
   * and a rig whose eye frames differ declares {@link IAutoMovieBone.axes} so
   * the two still mean those directions. A channel at full weight turns the eye
   * by the range in its direction, and partial weights scale linearly, so a
   * weight `w` is VRM's range map evaluated at `w` of its input maximum. Inner
   * and outer are relative to each eye: looking left turns the left eye outward
   * and the right eye inward. The turn adds to any angle the pose authors on
   * that eye.
   *
   * ValidateModel requires a skeleton declaring `leftEye` and `rightEye`, and
   * each range finite, at least `0`, and within both eyes' range of motion in
   * its direction.
   */
  export interface IBone {
    /** Selects bone gaze. */
    type: "bone";

    /**
     * Degrees an eye turns toward the nose at full weight, VRM's
     * `rangeMapHorizontalInner` output.
     */
    horizontalInner: number;

    /**
     * Degrees an eye turns away from the nose at full weight, VRM's
     * `rangeMapHorizontalOuter` output.
     */
    horizontalOuter: number;

    /**
     * Degrees both eyes turn down at full weight, VRM's `rangeMapVerticalDown`
     * output.
     */
    verticalDown: number;

    /**
     * Degrees both eyes turn up at full weight, VRM's `rangeMapVerticalUp`
     * output.
     */
    verticalUp: number;
  }

  /** Gaze stays on morph targets and expression sinks at the authored weights. */
  export interface IExpression {
    /** Selects expression gaze. */
    type: "expression";
  }
}
