import type { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset";
import type { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings";

/** Data and callback contracts shared by the SealRenderTarget operations. */
export namespace IAutoMovieSealRenderTarget {
  /**
   * Seal one render target: the renderer, its settings, and the exact asset
   * bytes a frame will read.
   *
   * The digest hashes explicit-position JSON tuples, so object property order
   * and embedded tabs/newlines do not collapse different renderer/asset fields.
   * Assets are sorted by UTF-16 code unit rather than locale collation.
   *
   * Buffer dimensions, ratio/exposure, shadow policy, nonblank renderer fields,
   * unique asset paths and SHA spellings are admitted here. Closed policy and
   * boolean field shapes are a caller structural-admission premise.
   */
  export type IProps = {
    /** Who draws the frame. */
    renderer: IAutoMovieRenderTargetRenderer;
    /** Configuration that changes what a frame costs. */
    settings: IAutoMovieRenderTargetSettings;
    /** Assets the drawn frame depends on; order is normalized here. */
    assets: readonly IAutoMovieRenderTargetAsset[];
    /** Canonical host-decoded upload facts, when measured by the current host. */
    textureDigest?: string;
  };
}
