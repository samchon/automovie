import { IAutoMovieCollisionProxyReference } from "./IAutoMovieCollisionProxyReference";
import { IAutoMovieMeasurementProxyReference } from "./IAutoMovieMeasurementProxyReference";

/**
 * Explicit ingest and proxy choices for an external 3D model.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalModelProvenance {
  /**
   * Stable model-only normalization profile applied to the source model.
   *
   * Motion-only `gltf-motion-v1` provenance belongs to
   * {@link IAutoMovieExternalMotionProvenance} and cannot enter this record.
   */
  ingestProfile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1";

  /** Explicit LOD members rather than an inferred filename convention. */
  lod: Array<{
    /** Closed near-to-far level identity. */
    level: "hero" | "near" | "far";

    /** Manifest-owned asset path providing this level. */
    asset: string;
  }>;

  /** Chosen collision proxy; absence never falls back to mesh inference. */
  collisionProxy: IAutoMovieCollisionProxyReference;

  /** Chosen measurement proxy; absence never falls back to mesh inference. */
  measurementProxy: IAutoMovieMeasurementProxyReference;
}
