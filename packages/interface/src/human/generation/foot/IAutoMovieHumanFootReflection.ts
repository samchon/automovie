/**
 * Ordered angular intervals reflected from a canonical left foot onto a
 * requested side. Runtime construction and admission remain with
 * AutoMovieHumanFootReflection in Human.
 */
export namespace IAutoMovieHumanFootReflection {
  /**
   * Borrowed [start, end] phase intervals of a canonical left-foot ring, in
   * radians, supplied to the side-reflection operation.
   */
  export type ArcsList = readonly [number, number][];

  /**
   * Side-reflected [start, end] phase intervals of the foot ring, in radians,
   * returned in the reflection operation's order.
   */
  export type ArcsResult = [number, number][];
}
