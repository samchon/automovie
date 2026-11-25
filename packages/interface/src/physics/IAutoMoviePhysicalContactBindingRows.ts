import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";
import type { IAutoMovieLinearizePhysicalTargetRows } from "./IAutoMovieLinearizePhysicalTargetRows";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/** Binding-attributed residual closures for one articulated contact fit. */
export namespace IAutoMoviePhysicalContactBindingRows {
  /**
   * Own collider relationship witnesses for one fit. Separation shares its
   * native distance with the local model; contact retains its original world
   * start and receiver-local feature.
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
   * Own collider relationship witnesses for one fit. Separation shares its
   * native distance with the local model; contact retains its original world
   * start and receiver-local feature.
   */
  export type IResult = {
    /**
     * Original binding id, preserving input binding order for residual
     * attribution.
     */
    id: string;
    /**
     * Metre residual callbacks and affected bones. Closures retain the borrowed
     * fit inputs/geometry; keep them valid for the fit and release these rows
     * after it.
     */
    rows: IAutoMovieLinearizePhysicalTargetRows.IRows;
  }[];
}
