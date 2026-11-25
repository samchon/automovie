/**
 * Planar section coordinates and convex-gauge ray readers used by head
 * geometry. Runtime construction and admission remain with
 * AutoMovieHumanHeadMath in Human.
 */
export namespace IAutoMovieHumanHeadMath {
  /** A point of a section. */
  export type P2 = [number, number];

  /**
   * Convex-gauge value h(r) along the caller's ray, with boundary h(r)=1. The
   * physical unit of r follows that ray; the caller's outermost-root algorithm
   * relies on convexity and may report no intersection.
   */
  export type OutermostH = (r: number) => number;
}
