/**
 * The straight distance between two named skin points, as a sliding caliper's
 * blades read it between two drawn landmarks.
 *
 * Both points are fixed anatomical landmarks registered on the basis skin
 * (`skinLandmarks`), so the reading follows them on every shape.
 *
 * @evidence contracts/common.md#principled-implementation Reads two registered skin points rather than joint centres or vertex numbers.
 * @evidence contracts/common.md#clear-and-simple-design Three fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis without either point answers null, not a substituted point.
 * @evidence contracts/common.md#meaningful-documentation States what is read and why it follows the shape.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions A metre distance in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule using it owns the survey definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkDistance {
  /** A straight distance between two skin landmarks. */
  kind: "skin-distance";

  /** Skin landmark name at one end. */
  from: string;

  /** Skin landmark name at the other end. */
  to: string;
}
