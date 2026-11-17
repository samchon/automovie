import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";
import type { IAutoMovieLinearizePhysicalTargetRows } from "./IAutoMovieLinearizePhysicalTargetRows";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/**
 * Binding-attributed residual closures for one articulated contact fit.
 *
 * @evidence contracts/development/design.md#principled-representation Separation and contact bindings retain distinct measured witnesses; same-body receiver motion participates in the row's affected bones while external receivers use the actual snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalContactBindingRows builds residual closures from the shared profile, binding and geometry query contracts. planPhysicalContactTargets uses the id for residual attribution and the shared IRows protocol for the articulation solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing contact witness refuses instead of fabricating an anchor, and measured residuals remain distinct from solver success.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies source seed, simultaneous receiver poses and borrowed no-dynamics geometry for one fit. Documents original binding ids and the lifetime of residual closures retaining borrowed fit inputs.
 */
export namespace IAutoMoviePhysicalContactBindingRows {
  /**
   * Own collider relationship witnesses for one fit. Separation shares its native distance with the local model; contact retains its original world start and receiver-local feature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies source seed, simultaneous receiver poses and borrowed no-dynamics geometry for one fit.
   * @evidence contracts/development/design.md#principled-representation Body/bone identities resolve canonical profiles and world-metre poses; bindings remain in authored order for row attribution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalContactBindingRows builds residual closures from the shared profile, binding and geometry query contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing contact witness is a refusal, and external receivers remain actual while same-body candidate dependencies are tracked explicitly.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents original binding ids and the lifetime of residual closures retaining borrowed fit inputs.
   * @evidence contracts/development/design.md#principled-representation An ordered list pairs each binding identity with its metre-valued nonlinear/local row group.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalContactTargets uses the id for residual attribution and the shared IRows protocol for the articulation solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeping a row alive also keeps its fit data alive; release rows after fitting and do not reinterpret residuals as contact receipts.
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
