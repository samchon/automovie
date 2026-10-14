import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Current admitted body state consumed by the atlas inspection adapter.
 *
 * The body builder supplies its solved shape and pose transforms, so the adapter cannot inspect stale authored weights before anatomical inversion.
 *
 * @evidence contracts/common.md#principled-implementation Admitted basis/final solved shape establish registration while current transforms carry atlas geometry in the same body frame.
 * @evidence contracts/common.md#clear-and-simple-design Source, solved shape and actual pose meet at one inspection boundary, avoiding stale pre-inversion authored weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The body builder's resolved state replaces no independent reconstructed personal placement.
 * @evidence contracts/common.md#meaningful-documentation Comments identify immutable source, solved shape and current common-frame transforms.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inspection inputs choose no transform-search or rigid-placement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed transform maps are evaluation results without cross-document caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The input owns no atlas residency, fitting process or observer subscription.
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
