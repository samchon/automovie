import type { AutoMovieHumanLoftAperture } from "./AutoMovieHumanLoftAperture";
import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";

/**
 * One skin opening; see {@link AutoMovieHumanLoftAperture}.
 *
 * Without `chain` its values are world millimetres. With `chain` and `frame`
 * a region stores the margin and `forward` in the opening's own child frame,
 * itself in that chain's anchor coordinates, and
 * `AutoMovieHumanBodyRegions.merge` places all of them in the world, so the
 * merged calibration holds world values and the child frame placed there.
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

  /** Chain whose anchor the opening hangs from; absent for a world opening. */
  chain?: string;

  /**
   * The opening's child frame, a rigid frame (a point `(x, y, z)` lies at
   * `origin + x u + y (v x u) + z v`): in `chain`'s anchor coordinates in a
   * region, placed in the world by the merge. Given with `chain` only.
   */
  frame?: AutoMovieHumanLoftFrame.IFrame;
}
