import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";

/**
 * The immutable source pair an exterior target builder compiles once.
 *
 * `createHumanBodyExteriorTargetBuilder` clones both members, admits the
 * reference exactly and refuses it unless `reference.basis` names this basis.
 * Per-person requests arrive later as numerical documents, so neither member
 * carries an individual's measurements.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorTargetSource {
  /** Connected body basis whose builder and channel the instrument drives. */
  basis: IAutoMovieHumanBodyBasis;

  /** Exterior instrument bound to `basis` by its exact id. */
  reference: IAutoMovieHumanBodyExteriorReference;
}
