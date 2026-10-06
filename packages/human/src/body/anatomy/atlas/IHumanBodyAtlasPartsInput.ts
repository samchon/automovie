import type { IAutoMovieHumanBodyBasisDocument } from "../../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBoneTransform } from "../../structures/rig/IAutoMovieHumanBodyBoneTransform";

/**
 * Current admitted body state consumed by the atlas inspection adapter.
 *
 * The body builder supplies its solved shape and pose transforms, so the
 * adapter cannot inspect stale authored weights before anatomical inversion.
 *
 * @evidence contracts/common.md#principled-implementation One admitted state and the transforms that skin the same body are supplied together.
 * @evidence contracts/common.md#clear-and-simple-design A named input carries the adapter's three dependencies.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A transport record.
 * @evidence contracts/common.md#meaningful-documentation States solved-state ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The resources own identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document owns channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No emission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The resources and transforms own frames.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The adapter owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source receipts own acquisition accounts.
 * @evidenceExclude contracts/anatomy.md#permitted-range No admission here.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal geometry input.
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
