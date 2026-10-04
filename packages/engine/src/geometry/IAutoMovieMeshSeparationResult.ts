import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";

/**
 * Outcome of one compiled mesh separation query.
 *
 * `certified` means the complete feature has at least the requested
 * separation; false means unproved, including touches, crossings and rounding
 * at an exact limit. It never diagnoses penetration or selects a closest point.
 * With attachment metadata, `lowerBound` is zero and certification is the
 * combined bounded-contact and strict-other-face proof.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports whole-feature separation qualification for composable resident geometry without a sampled-corner substitute.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Names the limiting original triangle, spent work and support caps of a complete-feature clearance proof.
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationResult {
  /**
   * Whether the complete feature proved at least the requested separation.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations States whether the composable feature qualified against the resident surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Treats touches, crossings and exact-limit rounding as unproved rather than accepted.
   */
  certified: boolean;

  /**
   * Proved separation lower bound in metres, capped at the requested clearance;
   * MIN_VALUE is the weak first-positive bound at zero clearance and zero is
   * reported for an attachment query.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports the conservative separation the feature proved, not a nearest-distance estimate.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Bounds separation by support projection and edge-pair kernels over the original triangles.
   */
  lowerBound: number;

  /**
   * Original limiting triangle ordinal, or -1 when no individual triangle
   * lowered the target-capped bound; ties keep the smallest ordinal.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Names which resident face limited or refused the composable feature.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the original source triangle ordinal with stable tie order.
   */
  triangle: number;

  /**
   * Work units this query spent from the shared budget.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Exposes the bounded work the query consumed from its caller-owned budget.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Counts every visited box and tested triangle, normal triple, axis and edge pair.
   */
  examined: number;

  /**
   * Contact caps proved on each attachment support, in support order.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports each bounded root contact region of an attached feature.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Lists caps by original support triangle without accepting another crossing.
   */
  attachmentCaps: IAutoMovieMeshAttachmentCap[];
}
