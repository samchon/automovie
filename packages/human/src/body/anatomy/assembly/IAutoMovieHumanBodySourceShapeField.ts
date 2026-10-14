import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";

/**
 * One producer-qualified source shape freedom, never personal vertex input. Coefficient support comes from the source recipe's actual attachment and boundary conditions, not a physiological prior or arbitrary positive range.
 *
 * @evidence contracts/common.md#principled-implementation A source-qualified dimensionless coefficient interval contains neutral zero and controls actual member displacement fields with declared held attachments.
 * @evidence contracts/common.md#clear-and-simple-design One field identity binds supported bounds, recipe account and per-member fields without exposing personal vertex controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coefficient support comes from source attachment/boundary conditions rather than a universal physiological prior or arbitrary positive range.
 * @evidence contracts/common.md#meaningful-documentation Comments define coefficient units, neutral inclusion, field identity, recipe limits and held zero-displacement attachments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shape-field metadata states supported freedom without running coefficient search or boundary deformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recipe fields provide immutable evaluation inputs and own no solved coefficient cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The field schema allocates neither displacement buffers nor running target solvers.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceShapeField {
  /** Stable source field identity within one part. */
  id: string;

  /** Lower supported dimensionless coefficient, including neutral zero. */
  minimumCoefficient: number;

  /** Upper supported dimensionless coefficient, including neutral zero. */
  maximumCoefficient: number;

  /** Actual producer/recipe support condition and unresolved clinical limits. */
  domainAccount: string;

  /** Actual member fields, preserving declared zero-displacement attachments. */
  surfaces: readonly IAutoMovieHumanBodySourceSurfaceShapeField[];
}
