import type { AutoMovieHumanSexPair } from "../AutoMovieHumanSexPair";

/** Type contracts exchanged by AutoMovieHumanFacePlan; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFacePlan {
  /** 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width.
   * @evidence contracts/development/design.md#principled-representation 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFacePlan.Norms is the canonical exchange used by AutoMovieHumanFacePlan.NORMS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFacePlan.NORMS for 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width.
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
