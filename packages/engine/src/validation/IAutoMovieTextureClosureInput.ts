import {
  IAutoMovieAssetProvenance,
  IAutoMovieModel,
} from "@automovie/interface";

import { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/** Everything the texture closure is decided against. */
export interface IAutoMovieTextureClosureInput {
  /** Exact production id whose ledger entries authorize these uses. */
  production: string;
  /** Compiled models whose materials bind PBR images. */
  models: readonly IAutoMovieModel[];
  /** Compiled shots whose scenes bind image lighting. */
  scenes: readonly IAutoMovieSceneEnvironmentUse[];
  /** The project asset ledger, exactly as the manifest holds it. */
  assets: readonly IAutoMovieAssetProvenance[];
  /**
   * Image facts for one registered asset path, or `undefined` when the builder
   * could not read the bytes as an image at all.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
