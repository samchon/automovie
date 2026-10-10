import type { IAutoMovieHumanBodyMeasurement } from "../../structures/IAutoMovieHumanBodyMeasurement";
import type { IAutoMovieHumanBodyExteriorTarget } from "./IAutoMovieHumanBodyExteriorTarget";

/**
 * One supplied bound surface target, ready to solve: its table binding, the
 * instrument oriented to the binding's side and the requested metres.
 *
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
