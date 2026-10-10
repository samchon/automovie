import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Current admitted body state consumed by the atlas inspection adapter.
 *
 * The body builder supplies its solved shape and pose transforms, so the
 * adapter cannot inspect stale authored weights before anatomical inversion.
 *
 * @author Samchon
 */
export interface IHumanBodyAtlasPartsInput {
  /** Admitted immutable shared source. */
  basis: IAutoMovieHumanBodyBasis;

  /** Admitted document with the final solved shape. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Current pose transforms in the same body frame. */
  transforms: ReadonlyMap<string, IAutoMovieHumanBodyBoneTransform>;
}
