import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** One bone at rest. */
export interface IAutoMovieHumanBindBone {
  /** Bone id. */
  bone: string;

  /** Parent bone, or null for the root. */
  parent: string | null;

  /**
   * Joint centre at the achieved bind, metres in Human registered coordinates
   * (+X forward, +Y up, +Z anatomical left).
   */
  position: AutoMovieVector3Tuple;

  /**
   * End of a leaf bone's drawn segment in registered bind coordinates, metres;
   * null when child joints terminate its drawn segments.
   */
  tip: AutoMovieVector3Tuple | null;

  /** Skin girth radius of the segment leaving the joint, metres. */
  radius: number;
}
