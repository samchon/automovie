import { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset";
import { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer";
import { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings";

/**
 * The exact renderer, settings, and asset bytes a render report was measured against.
 *
 * A budget verdict is only evidence while the thing it measured is still the thing that will be drawn. Change the shadow filter, the pixel ratio, or one texture's bytes and the same design costs something else, so a report that outlives its target is not conservative, it is wrong in an unknown direction. The fingerprint makes that detectable: a consumer compares the report's target against the target in front of it and treats a mismatch as stale rather than as a pass.
 *
 * Identical declared renderer, settings, asset and optional texture facts produce the same fingerprint across hosts. Fixed-position JSON tuples preserve embedded tabs and newlines, and asset ordering uses UTF-16 code units rather than locale collation.
 *
 * @evidence contracts/common.md#principled-implementation Target sealing records admitted renderer identity, normalized shadow settings and sorted exact asset digests, adding host texture facts in protocol v2 before hashing fixed-position JSON tuples.
 * @evidence contracts/common.md#clear-and-simple-design Separates implementation identity, frame configuration and byte dependencies so a report can compare the complete cost basis rather than only design or compile revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Version-one omission cannot certify decoded texture facts and reported unknown hardware remains explicit; tuple field positions and JSON escaping preserve arbitrary embedded separators without changing field identity.
 * @evidence contracts/common.md#meaningful-documentation Defines protocol compatibility, optional host texture facts, sorted exact assets and the dependence of reuse on current target equality.
 * @author Samchon
 */
export interface IAutoMovieRenderTarget {
  /** Versioned fingerprint protocol. */
  protocol: "automovie.render-target.v1" | "automovie.render-target.v2";

  /**
   * Host-decoded upload fact identity. Version two targets include this digest; legacy version one targets omit it and cannot certify those host facts.
   */
  textureDigest?: string;

  /** Who draws the frame. */
  renderer: IAutoMovieRenderTargetRenderer;

  /** Renderer configuration that changes what a frame costs. */
  settings: IAutoMovieRenderTargetSettings;

  /**
   * Every asset whose bytes the drawn frame depends on, ascending by path.
   *
   * Ordering is by UTF-16 code unit, never by locale collation, so a Turkish or Swedish host does not fingerprint a different frame than an English one.
   */
  assets: IAutoMovieRenderTargetAsset[];

  /** Digest over the protocol and every field above. */
  digest: string;
}
