import { IAutoMovieAssetProvenance } from "./IAutoMovieAssetProvenance";

/**
 * Project asset ledger ordered by canonical relative path. Inventory admission compares current bytes and resolves production uses.
 *
 * @evidence contracts/common.md#principled-implementation Version one declares ordered current paths, digests and typed uses; inventory checks ordering, folded path collisions and supplied current bytes, then graph/resource and later compiled-consumer gates resolve usage. Partial populations can coexist with diagnostics and reach source evaluation; the builder's final error gate blocks successful publication rather than this record itself withholding every invalid path.
 * @evidence contracts/common.md#clear-and-simple-design A format version and one ordered provenance list own the project-wide byte ledger, while each entry owns its external-model, motion or generated-acquisition details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Directory presence does not authorize an unlisted asset, and a declared digest cannot replace hashing current bytes or resolving the consumer ledger.
 * @evidence contracts/common.md#meaningful-documentation States canonical path ordering, project scope, current byte identity and the separate inventory checks that establish admissible asset use.
 * @author Samchon
 */
export interface IAutoMovieAssetManifest {
  /** Asset-manifest format. */
  version: 1;

  /** Every distributable project asset, ordered by canonical path. */
  assets: IAutoMovieAssetProvenance[];
}
