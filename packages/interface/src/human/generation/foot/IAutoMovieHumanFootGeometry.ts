/**
 * The monotone predicate supplied to the foot's bounded root search. Runtime
 * construction and admission remain with AutoMovieHumanFootGeometry in Human.
 */
export namespace IAutoMovieHumanFootGeometry {
  /**
   * Predicate of a physical foot length s in millimetres. The root caller
   * requires a false-to-true crossing on its search interval; the predicate
   * does not supply the bracket or fallback value.
   */
  export type RootHolds = (s: number) => boolean;
}
