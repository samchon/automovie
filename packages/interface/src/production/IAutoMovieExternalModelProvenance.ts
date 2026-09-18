import { IAutoMovieCollisionProxyReference } from "./IAutoMovieCollisionProxyReference";
import { IAutoMovieMeasurementProxyReference } from "./IAutoMovieMeasurementProxyReference";

/**
 * Explicit ingest and proxy choices for an external 3D model.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `IAutoMovieExternalModelProvenance` as the portable data boundary for the asset external provenance digest requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `IAutoMovieExternalModelProvenance` for the performance motion external adoption receipt system contract.
 * @author Samchon
 */
export interface IAutoMovieExternalModelProvenance {
  /**
   * Stable model-only normalization profile applied to the source model.
   *
   * Motion-only `gltf-motion-v1` provenance belongs to
   * {@link IAutoMovieExternalMotionProvenance} and cannot enter this record.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-adoption-mode Keeps external model adoption distinct from motion adoption.
   * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-gltf-glb-inspection Restricts model provenance to the supported glTF/VRM scene inspection profiles.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `ingestProfile` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `ingestProfile` for the performance motion external adoption receipt system contract.
   */
  ingestProfile: "gltf-static-v1" | "gltf-humanoid-v1" | "vrm-humanoid-v1";
  /**
   * Explicit LOD members rather than an inferred filename convention.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `lod` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `lod` for the performance motion external adoption receipt system contract.
   */
  lod: Array<{
    /** Closed near-to-far level identity. */
    level: "hero" | "near" | "far";
    /** Manifest-owned asset path providing this level. */
    asset: string;
  }>;
  /**
   * Chosen collision proxy; absence never falls back to mesh inference.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `collisionProxy` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `collisionProxy` for the performance motion external adoption receipt system contract.
   */
  collisionProxy: IAutoMovieCollisionProxyReference;
  /**
   * Chosen measurement proxy; absence never falls back to mesh inference.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `measurementProxy` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `measurementProxy` for the performance motion external adoption receipt system contract.
   */
  measurementProxy: IAutoMovieMeasurementProxyReference;
}
