import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanKnuckleSection; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanKnuckleSection {
  /** A section's two measures, mm. */
  export interface IMeasure {
    /** Extent along the line from knuckle II to knuckle V. */
    breadth: number;

    /** Hull perimeter. */
    girth: number;
  }

  /**
   * The mcps argument of AutoMovieHumanKnuckleSection.measure. Measure a mesh's
   * knuckle section.
   *
   * @param positions Flat vertex positions, mm.
   * @param indices Flat triangle indices.
   * @param mcps Knuckles II, III and V.
   * @param centre The wrist centre.
   */
  export type MeasureMcps = readonly [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];
}
