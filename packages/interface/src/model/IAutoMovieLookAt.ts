/**
 * How a model turns its eyes for the gaze channels of an expression, after the VRM 1.0 `lookAt` extension.
 *
 * The gaze channels are the `lookUp`, `lookDown`, `lookLeft` and `lookRight` presets and the eight `eyeLook*` ARKit channels. `"expression"` keeps them on morph targets and expression sinks, as a model without this record does. `"bone"` turns the `leftEye` and `rightEye` bones instead and takes the channels off the morphs, because a morph cannot rotate an eyeball mesh without shrinking it at intermediate weights.
 *
 * Reference: VRM 1.0 lookAt (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md).
 *
 * @evidence contracts/common.md#principled-implementation Follows the VRM 1.0 split between bone and expression gaze; a bone gaze writes clinical flexion and twist on each eye, read through the eye bone's declared axes like every other joint, and validateModel admits the ranges against the eye bones' range of motion.
 * @evidence contracts/common.md#clear-and-simple-design A closed two-variant union where only the bone variant carries ranges, since an expression gaze drives morphs at the authored weight and has nothing to scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts VRM's `inputMaxValue` and `offsetFromHeadBone` are not carried: the first normalizes a gaze angle into the unit weight that automovie's channels already are, and the second serves a look-at target, which the head's gaze owns.
 * @evidence contracts/common.md#meaningful-documentation States which channels count as gaze, what each variant drives, why bone gaze exists, the VRM reference and the fields deliberately left out.
 * @author Samchon
 */
export type IAutoMovieLookAt =
  | IAutoMovieLookAt.IBone
  | IAutoMovieLookAt.IExpression;
export namespace IAutoMovieLookAt {
  /**
   * Gaze turns the eye bones.
   *
   * Each eye turns by clinical flexion, positive down, and twist, positive toward the model's own left, the conventions the head's gaze uses; in the canonical rest frame the default basis puts them on the eye's +X and +Y, and a rig whose eye frames differ declares {@link IAutoMovieBone.axes} so the two still mean those directions. A channel at full weight turns the eye by the range in its direction, and partial weights scale linearly, so a weight `w` is VRM's range map evaluated at `w` of its input maximum. Inner and outer are relative to each eye: looking left turns the left eye outward and the right eye inward. The turn adds to any angle the pose authors on that eye.
   *
   * validateModel requires a skeleton declaring `leftEye` and `rightEye`, and each range finite, at least `0`, and within both eyes' range of motion in its direction.
   *
   * @evidence contracts/common.md#principled-implementation Maps unit channel weights linearly onto per-direction degree ranges, VRM's range map at the normalized input, and writes them on the clinical axes the head's gaze already uses, so declared eye axes decide the geometry.
   * @evidence contracts/common.md#clear-and-simple-design Four scalars, one per VRM range map, keep each direction's reach independent without a curve or a per-eye duplicate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The ranges are admitted against the eye bones' range of motion rather than clamped at playback, so a gaze the rig cannot hold is refused when the model is admitted.
   * @evidence contracts/common.md#meaningful-documentation States the axis and sign each direction writes, the weight-to-angle law, inner and outer per eye, composition with authored eye angles, units and admission.
   * @author Samchon
   */
  export interface IBone {
    /** Selects bone gaze. */
    type: "bone";

    /** Degrees an eye turns toward the nose at full weight, VRM's `rangeMapHorizontalInner` output. */
    horizontalInner: number;

    /** Degrees an eye turns away from the nose at full weight, VRM's `rangeMapHorizontalOuter` output. */
    horizontalOuter: number;

    /** Degrees both eyes turn down at full weight, VRM's `rangeMapVerticalDown` output. */
    verticalDown: number;

    /** Degrees both eyes turn up at full weight, VRM's `rangeMapVerticalUp` output. */
    verticalUp: number;
  }

  /**
   * Gaze stays on morph targets and expression sinks at the authored weights.
   *
   * @evidence contracts/common.md#principled-implementation States VRM's expression gaze explicitly; the viewer drives the gaze channels as it does for a model without a lookAt record.
   * @evidence contracts/common.md#clear-and-simple-design Only the discriminant, because an expression gaze has nothing to scale or rotate.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts VRM's expression weight caps are not modeled; the authored weights reach the morphs unchanged.
   * @evidence contracts/common.md#meaningful-documentation States what the variant drives and that it equals omitting the record.
   * @author Samchon
   */
  export interface IExpression {
    /** Selects expression gaze. */
    type: "expression";
  }
}
