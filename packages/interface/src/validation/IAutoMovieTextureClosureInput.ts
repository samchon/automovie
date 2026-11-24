import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieAssetProvenance } from "../production/IAutoMovieAssetProvenance";
import type { IAutoMovieSceneEnvironmentUse } from "./IAutoMovieSceneEnvironmentUse";
import type { IAutoMovieShotFontSources } from "./IAutoMovieShotFontSources";
import type { IAutoMovieSurfaceGraphicImageUse } from "./IAutoMovieSurfaceGraphicImageUse";
import type { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * All authored uses, ledger rows and supplied image facts for texture closure:
 * the images a compiled production samples and the font files its shots set
 * text in.
 */
export interface IAutoMovieTextureClosureInput {
  /** Exact production id whose ledger entries authorize these uses. */
  production: string;

  /** Compiled models whose materials bind PBR images. */
  models: readonly IAutoMovieModel[];

  /** Compiled shots whose scenes bind image lighting. */
  scenes: readonly IAutoMovieSceneEnvironmentUse[];

  /** Images compiled shots show through surface graphics; omitted means none. */
  surfaceImages?: readonly IAutoMovieSurfaceGraphicImageUse[];

  /**
   * Each compiled shot's font sources, one row per shot that lists any; omitted
   * means none, so a ledger `"font"` use of this production is then stale.
   * Closure is where an `"asset"` font's licence is checked, because it alone
   * holds the ledger.
   */
  fonts?: readonly IAutoMovieShotFontSources[];

  /** The project asset ledger, exactly as the manifest holds it. */
  assets: readonly IAutoMovieAssetProvenance[];

  /**
   * Resolve supplied image-header facts for an authored asset path, including
   * an unregistered scene reference, or return undefined for unavailable
   * facts.
   */
  facts: (asset: string) => IAutoMovieTextureImageFacts | undefined;
}
