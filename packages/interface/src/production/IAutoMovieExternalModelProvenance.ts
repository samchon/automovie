import { IAutoMovieCollisionProxyReference } from "./IAutoMovieCollisionProxyReference";
import { IAutoMovieMeasurementProxyReference } from "./IAutoMovieMeasurementProxyReference";

/**
 * Explicit ingest and proxy choices for an external 3D model.
 *
 * @evidence contracts/common.md#principled-implementation An explicit model profile, LOD paths and separate collision/measurement references retain acquisition choices on AssetProvenance. Production inspection/adoption is retired, so this metadata neither verifies inspected facts nor installs an appearance or proxy; motion-only metadata has its own record.
 * @evidence contracts/common.md#clear-and-simple-design Visual representations and the two semantic proxy roles stay separate, preventing one imported mesh declaration from silently supplying unrelated collision or measurement meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts LOD paths are authored instead of inferred from filename conventions, and absent proxies do not fall back to mesh analysis or guessed geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines the three model-only profiles, motion exclusion, explicit hero-near-far assets and the independent collision and measurement proxy requirements.
 * @author Samchon
 */
export interface IAutoMovieExternalModelProvenance {
  /**
   * Stable model-only normalization profile applied to the source model.
   *
   * Motion-only `gltf-motion-v1` provenance belongs to {@link IAutoMovieExternalMotionProvenance} and cannot enter this record.
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
