import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** One bone's world placement: geometry at the bind moves rigidly with it. */
export interface IAutoMovieHumanBonePlacement {
  /** Bone id. */
  bone: string;

  /**
   * Joint position in Human registered body coordinates, metres (+X forward, +Y
   * up, +Z anatomical left); no authored scene transform is applied.
   */
  position: AutoMovieVector3Tuple;

  /**
   * Unit quaternion `[x, y, z, w]` rotating the achieved bind geometry into
   * this placement in Human registered coordinates; identity leaves the bind
   * orientation unchanged.
   */
  rotation: AutoMovieQuaternionTuple;
}
