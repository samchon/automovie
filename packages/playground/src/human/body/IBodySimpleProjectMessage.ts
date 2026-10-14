import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "@automovie/human";

/**
 * Project a detailed shape onto the simple tier. The worker resolves any authored anatomy before reading the effective detailed shape. Omitted anatomy leaves the authored channel weights as the projection input; admission remains with the numerical package.
 *
 * @evidence contracts/common.md#principled-implementation Projection carries both channel weights and optional anatomy because the worker resolves anatomical targets before measuring the resulting body on the simple tier.
 * @evidence contracts/common.md#clear-and-simple-design The project message contains only correlation and numerical operands; the worker's already loaded whole-person reader supplies head-dependent measurement context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The detailed shape is sent unchanged to anatomical resolution and projection, with no stored expected stature, mass or girth replacing those computations.
 * @evidence contracts/common.md#meaningful-documentation The projection comment names anatomy resolution and its absent-state behavior; member comments identify the discriminant, correlation ID and channel map.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This projection request is a structural payload and performs no shape resolution or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request type retains no prior projection; the page's dependency comparison decides whether another worker request is required.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shape and anatomy are message data rather than owned external resources; the body transport releases their queued request after reply or worker retirement.
 *
 * @author Samchon
 */
export interface IBodySimpleProjectMessage {
  /** Correlates the reply. */
  id: number;

  /** Request discriminant. */
  kind: "project";

  /** The detailed channel weights to project. */
  shape: Record<string, number>;

  /** Anatomical measurements the builder solves into the weights, if any. */
  anatomy?: IAutoMovieHumanBodyAnatomicalMeasurements;
}
