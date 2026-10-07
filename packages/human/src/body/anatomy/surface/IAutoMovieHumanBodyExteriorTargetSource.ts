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
 * @evidence contracts/common.md#principled-implementation The basis and the instrument bound to it travel together so the builder can prove their identity once before any request.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace an anonymous parameter object; the builder owns admission and cloning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no request, population mean or fallback instrument.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, its cloning and the identity check between the members.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The basis and reference own their frames and units; this pair adds none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reference names an existing channel; this pair defines none.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The basis builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reference states its own source convention.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inverse and the channel envelope bound targets.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Requests supply named targets later; this pair is compile-time source.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorTargetSource {
  /** Connected body basis whose builder and channel the instrument drives. */
  basis: IAutoMovieHumanBodyBasis;

  /** Exterior instrument bound to `basis` by its exact id. */
  reference: IAutoMovieHumanBodyExteriorReference;
}
