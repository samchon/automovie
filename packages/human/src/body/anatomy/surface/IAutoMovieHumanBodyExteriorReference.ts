import type { IAutoMovieHumanBodyMeasurement } from "../../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Source-owned instrument for one fictional nipple-level exterior target.
 * This binding accompanies an immutable basis, never a numerical body request.
 * Its bare rest convention is not a registered anthropometric acquisition.
 * The source witness and channel belong to that basis; their ordinals are not
 * portable anatomical identities or editable sculpt controls.
 * @evidence contracts/common.md#principled-implementation Binds the existing source response and instrument to one basis instead of duplicating either formula.
 * @evidence contracts/common.md#clear-and-simple-design One source binding supplies the concrete exterior producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reference convention certifies neither individual tissue nor a measured population.
 * @evidence contracts/common.md#meaningful-documentation States constructor ownership and the acquisition boundary.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorReference {
  /** Exact immutable connected source identity. */
  readonly basis: string;
  /** The authored rest frame, without an independently prescribed pose. */
  readonly evaluation: "source-rest";
  /** Named bare-source protocol; observed standing tape values are distinct. */
  readonly protocol: "bare-source-rest-nipple-level";
  /** Source shape response the existing inverse evaluates privately. */
  readonly channel: string;
  /** Explicit topology authority, independent of clinical and normal records. */
  readonly incidence: "native-indexed" | "source-partition";
  /** Horizontal girth through this source's own skin witness. */
  readonly measurement: IAutoMovieHumanBodyMeasurement;
}
