import { IAutoMovieAssetProvenance } from "./IAutoMovieAssetProvenance";

/** Project asset byte identities and consumer bindings. */
export interface IAutoMovieAssetManifest {
  /** Asset-manifest format. */
  version: 1;

  /** Every distributable project asset, ordered by canonical path. */
  assets: IAutoMovieAssetProvenance[];
}
