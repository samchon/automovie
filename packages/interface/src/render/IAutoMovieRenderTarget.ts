import type { IAutoMovieRenderTargetAsset } from "./IAutoMovieRenderTargetAsset";
import type { IAutoMovieRenderTargetRenderer } from "./IAutoMovieRenderTargetRenderer";
import type { IAutoMovieRenderTargetSettings } from "./IAutoMovieRenderTargetSettings";

/**
 * The exact renderer, settings, and asset bytes a render report was measured
 * against.
 *
 * A budget verdict is only evidence while the thing it measured is still the
 * thing that will be drawn. Change the shadow filter, the pixel ratio, or one
 * texture's bytes and the same design costs something else, so a report that
 * outlives its target is not conservative, it is wrong in an unknown direction.
 * The fingerprint makes that detectable: a consumer compares the report's
 * target against the target in front of it and treats a mismatch as stale
 * rather than as a pass.
 *
 * Identical declared renderer, settings, asset and optional texture facts
 * produce the same fingerprint across hosts. Fixed-position JSON tuples
 * preserve embedded tabs and newlines, and asset ordering uses UTF-16 code
 * units rather than locale collation.
 *
 * Sealing validates supplied facts rather than acquiring a renderer or reading
 * assets; closure completeness and byte provenance belong to the caller. The
 * returned settings and asset array are new, but renderer and asset records
 * remain shared and mutable, so a later mutation can make the stored digest
 * stale. Target comparison checks the represented fields rather than
 * recomputing or authenticating their digests.
 */
export interface IAutoMovieRenderTarget {
  /** Versioned fingerprint protocol. */
  protocol: "automovie.render-target.v1" | "automovie.render-target.v2";

  /**
   * Host-decoded upload fact identity. Version two targets include this digest;
   * legacy version one targets omit it and cannot certify those host facts.
   */
  textureDigest?: string;

  /** Who draws the frame. */
  renderer: IAutoMovieRenderTargetRenderer;

  /** Renderer configuration that changes what a frame costs. */
  settings: IAutoMovieRenderTargetSettings;

  /**
   * Every asset whose bytes the drawn frame depends on, ascending by path.
   *
   * Ordering is by UTF-16 code unit, never by locale collation, so a Turkish or
   * Swedish host does not fingerprint a different frame than an English one.
   */
  assets: IAutoMovieRenderTargetAsset[];

  /**
   * Digest of the represented fields at sealing time; subsequent shared-record
   * mutation is not reflected automatically.
   */
  digest: string;
}
