import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * The complete source ownership option of a native conic family.
 */
export namespace IAutoMovieHumanNativeSourceAuthority {
  /**
   * An invocation's axis-origin sampling metadata.
   */
  export interface ISampling {
    /** Finite positive world millimetres per material millimetre. */
    maximumSpeed: number;
    /** Finite ordered source-native course breaks, in material millimetres. */
    materialBreaks: readonly number[];
  }

  /**
   * The actual named original and reflected sources and their sampling scope.
   */
  export interface ISpec {
    /** Invocation-owned complete sources, including each actual reflected name. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;
    /** Nonidentity course sampling only; absence preserves the requested/cap grid. */
    sampling?: ISampling;
  }
}
