import type { IAutoMovieLinearizePhysicalTargetRows } from "./IAutoMovieLinearizePhysicalTargetRows";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/**
 * Binding-attributed residual closures for one articulated contact fit.
 *
 * @evidence contracts/development/design.md#principled-representation Separation and contact bindings retain distinct measured witnesses; same-body receiver motion participates in the row's affected bones while external receivers use the actual snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing query and row protocols carry the computation; the returned list adds only original binding ids for attribution.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing contact witness refuses instead of fabricating an anchor, and measured residuals remain distinct from solver success.
 * @evidence contracts/development/common.md#meaningful-documentation Inputs state invocation ownership and output rows explicitly retain borrowed geometry and records for the fit lifetime.
 */
export namespace IAutoMoviePhysicalContactBindingRows {
  /**
   * Own collider relationship witnesses for one fit. Separation shares its native distance with the local model; contact retains its original world start and receiver-local feature.
   */
  export type IInput = {
    /** Source body identity. */ body: string;
    /** Immutable profiles for this invocation. */ profiles: Readonly<
      Record<string, IAutoMoviePhysicalProfile>
    >;
    /** Coherent source seed. */ initial: IAutoMoviePoses;
    /** Simultaneous actual receiver placements. */ actual: Readonly<
      Record<string, IAutoMoviePoses>
    >;
    /** Positive-weight relationships in their original order. */ bindings: readonly IAutoMoviePhysicalContactBinding[];
    /** Initialized convex queries. */ geometry: IAutoMoviePreparePhysicalGeometry.IQueries;
  };

  /**
   * Own collider relationship witnesses for one fit. Separation shares its native distance with the local model; contact retains its original world start and receiver-local feature.
   */
  export type IResult = {
    /** Original binding id, preserving input binding order for residual attribution. */
    id: string;
    /**
     * Metre residual callbacks and affected bones. Closures retain the borrowed
     * fit inputs/geometry; keep them valid for the fit and release these rows after it.
     */
    rows: IAutoMovieLinearizePhysicalTargetRows.IRows;
  }[];
}
