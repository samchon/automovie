import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IHumanBodyExteriorRestReference } from "../binding/IHumanBodyExteriorRestReference";
import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";

/**
 * One body evaluation and its consumer-owned anatomical exterior reference.
 *
 * The body consumer supplies its own rest skin. A held-neutral person can
 * additionally supply the exterior its two partitions form together, so the
 * same assembly consumes head and body controls through one displacement.
 *
 * @evidence contracts/common.md#principled-implementation Basis, effective document and the resolved rig are one evaluation; the optional exterior changes the displacement reference without reinterpreting the document's controls.
 * @evidence contracts/common.md#clear-and-simple-design The named rest reference carries both arrays together and omission preserves the standalone body consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The consumer supplies its evaluated skin rather than per-part corrective coordinates.
 * @evidence contracts/common.md#meaningful-documentation States the standalone and whole-person ownership and the held-neutral restriction.
 * @evidence contracts/modeling.md#spatial-conventions The body skin and optional complete exterior use common body metres.
 * @evidence contracts/modeling.md#shared-boundaries The optional reference is formed by the person consumer's existing shared-sample definition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input carries an assembly evaluation and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document and skin builders own controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The assembly builder owns the emitted parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly and person consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input carries existing source owners without adding an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The document and source rig admit supported states.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The input adds no personal authoring channel.
 *
 * @author Samchon
 */
export interface IHumanBodyAnatomicalAssemblyPartsInput {
  /** Actual admitted immutable body basis carrying the exact registered assembly. */
  basis: IAutoMovieHumanBodyBasis;
  /** Effective solved document whose shape/pose produced this graph evaluation. */
  document: IAutoMovieHumanBodyBasisDocument;
  /** Same source FK result used by skin and public projections, in common body metres. */
  rig: IAutoMovieHumanBodySourceRigResult;
  /** The skin's native vertices at rest under the document's shape, in metres; the parts of a bound assembly follow its departure from the neutral skin. */
  restSkin: readonly number[];

  /**
   * A neutral whole-person consumer's complete exterior, after its head and
   * body fields meet on the shared samples. Omission uses the body exterior.
   */
  exteriorRestReference?: IHumanBodyExteriorRestReference;

  /** Actual completed source part; observer exceptions propagate to the original construction. */
  observePartComplete?: (part: AutoMovieHumanBodyPartId, completed: number, total: number) => void;

  /** Actual consumed source quantity path; observer exceptions propagate. */
  observeQuantityComplete?: (part: AutoMovieHumanBodyPartId, path: string) => void;
}
