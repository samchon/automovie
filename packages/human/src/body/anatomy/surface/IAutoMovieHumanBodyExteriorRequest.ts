import type { IAutoMovieHumanBodyMeasurement } from "../../structures/IAutoMovieHumanBodyMeasurement";
import type { IAutoMovieHumanBodyExteriorTarget } from "./IAutoMovieHumanBodyExteriorTarget";

/**
 * One supplied bound surface target, ready to solve: its table binding, the
 * instrument oriented to the binding's side and the requested metres.
 *
 * @evidence contracts/common.md#principled-implementation The binding, oriented instrument and value travel together so the solve and the report read one instrument.
 * @evidence contracts/common.md#clear-and-simple-design Three members, each owned elsewhere.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A carrier; it substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation States what each member is.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Carries the binding that names the solving channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The value is metres on the source-rest skin.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns its definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inverse owns admission.
 * @evidence contracts/anatomy.md#parametric-authority Carries one named measurement target only.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorRequest {
  /** The table binding the target was supplied under. */
  readonly binding: IAutoMovieHumanBodyExteriorTarget;

  /** The binding's rule oriented to its side. */
  readonly rule: IAutoMovieHumanBodyMeasurement;

  /** Requested absolute value, metres. */
  readonly metres: number;
}
