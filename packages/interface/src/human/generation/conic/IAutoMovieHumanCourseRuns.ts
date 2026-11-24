/**
 * The material coordinate map between two admitted courses.
 */
export namespace IAutoMovieHumanCourseRuns {
  /**
   * A station map that also gives its first two derivatives.
   */
  export interface IMap {
    /** The person's station of a reference station, mm. */
    (s: number): number;

    /** `[value mm, first derivative (dimensionless), second derivative per mm]` at a reference station. */
    jet: (s: number) => [number, number, number];
  }
}
