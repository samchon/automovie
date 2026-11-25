import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieLoftViewSource } from "./IAutoMovieLoftViewSource";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

/**
 * Original native field values and physical2 before any loft or mesh.
 * Relief/shift composition is shared with chain consumers. This reader owns no
 * emitted rows, fitted source, legacy lift or geometry process.
 */
export namespace IAutoMovieLoftViewFullSource {
  /**
   * Complete original scalar controls, their actual axis and immutable
   * features.
   */
  export type IInput = IAutoMovieLoftViewSource.IInput &
    Pick<
      IAutoMovieViewPart,
      "axis" | "reliefs" | "originalSection" | "originalGraphs"
    >;

  /** Two independent full-native capabilities on one inclusive original domain. */
  export interface IReader {
    /** Inclusive physical station bounds, mm. */
    readonly domain: readonly [number, number];
    /** Inclusive physical station bounds outside the retained caps, mm. */
    readonly regular: readonly [number, number] | null;
    /** Fresh full world Point0, mm; no axis.jet is requested. */
    point(s: number, t: number): AutoMovieVector3Tuple;
    /**
     * Prepare Point0 once at physical station s in mm for repeated phase
     * queries.
     */
    pointAt(s: number): (phase: number) => AutoMovieVector3Tuple;
    /**
     * Actual world total2: p mm, u per mm, v per radian and corresponding
     * second orders.
     */
    jet(s: number, t: number): IAutoMovieSolidSurface.IJet;
  }
}
