import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/**
 * Type contracts exchanged by AutoMovieHumanFacePlan; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFacePlan {
  /**
   * 3D Facial Norms' means, women and men, mm: cranial base width, middle
   * facial depth, maximum facial width.
   */
  export type Norms = AutoMovieHumanSexPair<{
    /** Reference bitragion straight-line breadth, millimetres. */
    readonly tt: number;
    /** Reference tragion-to-subnasale distance, millimetres. */
    readonly tsn: number;
    /** Reference bizygomatic face breadth, millimetres. */
    readonly zy: number;
  }>;
}
