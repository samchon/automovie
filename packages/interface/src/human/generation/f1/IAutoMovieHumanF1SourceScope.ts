import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";

/**
 * A production request and the exact source scope it resolves.
 */
export namespace IAutoMovieHumanF1SourceScope {
  /**
   * The production source role and its sampling request.
   */
  export type Scope =
    | { kind: "arm"; until: number; turn?: number }
    | { kind: "hand" | "leg"; turn?: number }
    | { kind: "trunk" | "nose"; phase: number }
    | { kind: "breast" | "ear" };

  /**
   * The resolved family and the wall interval its consumer requests.
   */
  export interface IResult {
    /** Complete controls with the production cap and clock scope applied once. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Requested wall sampling interval in physical mm; caps retain their own extra domain. */
    wallDomain: readonly [number, number];
  }
}
