import type { AutoMovieHumanBodySurfaceDimension } from "./AutoMovieHumanBodySurfaceDimension";

/**
 * Distance following the skin between named landmarks, in metres.
 *
 * A surface path is at least as long as the straight distance between its endpoints; equal length is possible on a straight path. A standing tape or scan-derived path must retain its surface meaning. Oranges et al. 2019, doi:10.21873/invivo.11548, compare vector and surface distances on a rigid plastic female torso model; that experiment does not establish live standing-tissue validity.
 *
 * @evidence contracts/common.md#principled-implementation The exterior dimension specialization preserves surface-path meaning and restricts observation posture to standing.
 * @evidence contracts/common.md#clear-and-simple-design Shared scalar provenance carries tape/scan methods while this owner defines arc rather than vector distance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A scanned plastic torso experiment is not represented as evidence for live standing-tissue validity.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre units, path-versus-vector distinction, equality degeneracy and the cited experiment's rigid-model condition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The surface-arc alias executes no geodesic path search or tape integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Arc typing coordinates no solved landmark-path work across scanning requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The arc declaration retains no scan mesh, geodesic cache or acquisition resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodySurfaceArc = AutoMovieHumanBodySurfaceDimension<
  "tape" | "surface-scan",
  "standing"
>;
