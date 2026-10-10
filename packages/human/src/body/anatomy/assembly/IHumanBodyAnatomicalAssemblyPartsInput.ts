import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IHumanBodyExteriorRestReference } from "../binding/IHumanBodyExteriorRestReference";
import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";

/**
 * One body evaluation and its consumer-owned anatomical exterior reference.
 *
 * The body consumer supplies its own rest skin. A held-neutral person can
 * additionally supply the exterior its two partitions form together, so the
 * same assembly consumes head and body controls through one displacement.
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
  observePartComplete?: (
    part: AutoMovieHumanBodyPartId,
    completed: number,
    total: number,
  ) => void;

  /** Actual consumed source quantity path; observer exceptions propagate. */
  observeQuantityComplete?: (
    part: AutoMovieHumanBodyPartId,
    path: string,
  ) => void;
}
