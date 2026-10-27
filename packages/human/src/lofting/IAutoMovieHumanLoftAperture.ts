import type { AutoMovieHumanLoftAperture } from "./AutoMovieHumanLoftAperture";

/**
 * One skin opening in world millimetres; see {@link AutoMovieHumanLoftAperture}.
 */
export interface IAutoMovieHumanLoftAperture {
  /** Name, e.g. `eye.left`. */
  name: string;

  /** Highest harmonic of each coordinate series. */
  order: number;

  /**
   * Coefficients of x, y and z in turn, each `[a0, a1, b1, ..., aK, bK]`, mm.
   */
  coefficients: number[];

  /** Unit direction the opening faces, e.g. the eye's line of sight. */
  forward: [number, number, number];

  /** Depth tolerance of the inside test beyond the margin's own depth, mm. */
  depth: number;

  /**
   * Depth of the closed pocket behind an opening with no globe, such as a
   * nostril, mm: the margin is pushed this far back along `forward` and
   * closed. Absent or zero leaves the opening as an open hole; an opening
   * with a globe behind it takes its depth from the globe instead.
   */
  pocket?: number;

  /**
   * Chain whose skin the opening lies on. Given, the opening is a trim
   * loop in that chain's chart (the outline projected onto its surface
   * along `forward`): the chain leaves the cells inside unlofted and the
   * closure starts from the loop with the surface's own derivatives.
   * Absent, the opening is cut from the finished mesh by position.
   */
  base?: string;
}
