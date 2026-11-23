import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieAssetProvenance } from "../production/IAutoMovieAssetProvenance";
import type { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import type { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * All authored uses, ledger rows and supplied image facts for texture closure.
 *
 * @evidence contracts/development/design.md#principled-representation The production id binds asset authorization while model materials and shot environments enumerate uses; facts resolves one asset path to byte-header dimensions/media or undefined.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The validator receives an explicit facts callback instead of importing filesystem/network decoding into deterministic closure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback's purity and truthful byte provenance are caller premises; a manifest label or supplied fact alone does not prove complete decoding, pixel content or current GPU adoption.
 * @evidence contracts/development/common.md#meaningful-documentation Documents exact production scope, borrowed model/scene/ledger populations and undefined unreadable-image meaning; callback errors and effects may propagate.
 */
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
   * Resolve supplied image-header facts for an authored asset path, including
   * an unregistered scene reference, or return undefined for unavailable facts.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
