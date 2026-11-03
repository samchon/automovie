import type { HumanReferenceSurface } from "./HumanReferenceSurface";

/**
 * The codes a surface comparison writes on a vertex it finds beyond its limit,
 * and the one angle that decides which generated triangle may stand for a
 * reference vertex. Code 0 means the vertex is within its limit.
 */
export namespace HumanReferenceSurfaceFlag {
  /** The generated skin stands outside the reference at the vertex. */
  export const OUTSIDE: number = 1;

  /** The generated skin stands inside the reference at the vertex. */
  export const INSIDE: number = 2;

  /** The generated skin has no counterpart at the vertex: another surface or a hole. */
  export const MISSING: number = 3;

  /** A generated vertex beyond its limit that no reference patch accounts for. */
  export const EXTRA: number = 4;

  /** A generated vertex on a whole piece detached from the body. */
  export const DETACHED: number = 5;

  /**
   * The direction each code reports, indexed by the code. Entry 0 is a
   * placeholder, since an unflagged vertex is never reported; a detached part
   * reports as extra geometry with its own flag on the patch.
   */
  export const DIRECTIONS: HumanReferenceSurface.Direction[] = [
    "outside",
    "outside",
    "inside",
    "missing",
    "extra",
    "extra",
  ];

  /**
   * Cosine of 60 degrees. Generated skin turned farther than this from a
   * reference normal is another surface, so it is not that vertex's counterpart.
   */
  export const FACING: number = 0.5;
}
