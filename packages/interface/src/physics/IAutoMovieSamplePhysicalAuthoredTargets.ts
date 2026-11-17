import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieSamplePhysicalTarget } from "./IAutoMovieSamplePhysicalTarget";

/**
 * One authored cached interval, independent of fitted controller plans.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains one authored cache interval and value-aware ownership of per-bone interpolation coefficients.
 * @evidence contracts/development/design.md#principled-representation step/rate locates a local-second interval; from/targets contain world-metre poses and each sample takes a dimensionless fraction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface samplePhysicalAuthoredTargets owns the per-bone map separately from fitted balance plans and reuses unchanged endpoint coefficients.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Before/after references are checked by scalar values as well as identity, so mutating an endpoint cannot justify reusing stale coefficients.
 */
export namespace IAutoMovieSamplePhysicalAuthoredTargets {
  /**
   * One authored cached interval, independent of fitted controller plans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains one authored cache interval and value-aware ownership of per-bone interpolation coefficients.
   * @evidence contracts/development/design.md#principled-representation step/rate locates a local-second interval; from/targets contain world-metre poses and each sample takes a dimensionless fraction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface samplePhysicalAuthoredTargets owns the per-bone map separately from fitted balance plans and reuses unchanged endpoint coefficients.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Before/after references are checked by scalar values as well as identity, so mutating an endpoint cannot justify reusing stale coefficients.
   */
  export interface IPlan {
    /** Enclosing cache interval. */ step: number;
    /** Original cache frequency, hertz. */ rate: number;
    /** Original admitted start transforms. */ from: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Original admitted end transforms. */ targets: Record<
      string,
      IAutoMovieRigidTransform
    >;
    /** Bone coefficient ownership with value-aware mutation checks. */ bones: Map<
      string,
      {
        /** Bound start-transform reference, with scalar invalidation. */ before: IAutoMovieRigidTransform;
        /** Bound end-transform reference, with scalar invalidation. */ after: IAutoMovieRigidTransform;
        /** Per-bone prepared interpolation and twist. */ sample: (
          fraction: number,
        ) => IAutoMovieSamplePhysicalTarget.IResult;
      }
    >;
  }
}
