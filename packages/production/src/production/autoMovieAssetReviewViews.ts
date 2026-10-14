import type { IAutoMovieAssetReviewView } from "./IAutoMovieAssetReviewView";

/**
 * Fixed top and bottom elevation in the retained asset-review target protocol. Both required directions use the same magnitude; this constant configures no camera and establishes no renderer elevation limit.
 */
const AUTOMOVIE_ASSET_REVIEW_POLE_DEG: number = 85;

/**
 * Required asset-review descriptors in canonical order. assetReviewEvidenceDiagnostics uses their angles and pose to request current target fingerprints and checks resident observations for the required pass.
 *
 * Eight beauty directions, a separate top-outline pass and the rigged model's additional ROM-extremes pass define the retained review population. These sampled obligations do not establish visibility of every occluded detail or provide a frame-capture producer.
 *
 * @evidence contracts/common.md#principled-implementation Returns the fixed population consumed by assetReviewEvidenceDiagnostics: eight beauty directions, one top-outline pass and an added ROM-extremes pass when rigged. The consumer addresses each target through its supplied current-fingerprint and resident-view callbacks.
 * @evidence contracts/common.md#clear-and-simple-design One ordered descriptor factory supplies the review coverage consumer; that consumer owns pass membership and its providers own current fingerprints and resident receipt admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the existing angles, poses and pass IDs, including symmetric 85-degree top/bottom targets; the rigged obligation supplements rather than replaces rest coverage. A descriptor creates no rendered observation.
 * @evidence contracts/common.md#meaningful-documentation States fixed direction/pass/pose obligations and the actual review consumer; supplied resident evidence and its currentness remain separate from this factory's descriptor output.
 * @evidence contracts/performance.md#efficient-algorithms Allocates nine rest descriptors or ten rigged descriptors with constant time and space, independent of geometry, image dimensions or renderer cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fixed small population uses fresh mutable descriptors per call; this factory retains no rendered result or current fingerprint for reuse across changing project inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The fresh array transfers to its caller; no image bytes, renderer handle or capture task is retained or started here.
 */
export function autoMovieAssetReviewViews(props: {
  /** Whether the compiled model carries a humanoid skeleton. */
  rigged: boolean;
}): IAutoMovieAssetReviewView[] { return [
  {
    id: "turntable-front",
    angleDeg: 0,
    elevationDeg: 0,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "turntable-right",
    angleDeg: 90,
    elevationDeg: 0,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "turntable-back",
    angleDeg: 180,
    elevationDeg: 0,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "turntable-left",
    angleDeg: 270,
    elevationDeg: 0,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "turntable-top",
    angleDeg: 0,
    elevationDeg: AUTOMOVIE_ASSET_REVIEW_POLE_DEG,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "turntable-bottom",
    angleDeg: 0,
    elevationDeg: -AUTOMOVIE_ASSET_REVIEW_POLE_DEG,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "oblique-front-right-top",
    angleDeg: 45,
    elevationDeg: 30,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "oblique-rear-left-top",
    angleDeg: 225,
    elevationDeg: 30,
    pose: "rest",
    pass: "beauty",
  },
  {
    id: "top-outline",
    angleDeg: 0,
    elevationDeg: 65,
    pose: "rest",
    pass: "outline",
  },
  ...(props.rigged
    ? [
        {
          id: "rig-rom-extremes",
          angleDeg: 0,
          elevationDeg: 15,
          pose: "rom-extremes" as const,
          pass: "beauty" as const,
        },
      ]
    : []),
]; }
