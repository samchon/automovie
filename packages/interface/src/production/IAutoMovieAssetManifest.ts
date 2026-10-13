import { IAutoMovieAssetProvenance } from "./IAutoMovieAssetProvenance";

/**
 * Project asset ledger ordered by canonical relative path. Inventory admission compares current bytes and resolves production uses.
 *
 * @evidence contracts/common.md#principled-implementation Version one declares each distributable asset's current path, content identity and typed uses; inventory validation checks ordering, uniqueness, byte existence and digest equality before assets enter compilation.
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
