import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";

/**
 * One producer-qualified source shape freedom, never personal vertex input.
 * Coefficient support comes from the source recipe's actual attachment and
 * boundary conditions, not a physiological prior or arbitrary positive range.
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
