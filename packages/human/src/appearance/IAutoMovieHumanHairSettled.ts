import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/** A strand point settled against the body below the head. */
export interface IAutoMovieHumanHairSettled {
  /** Point, head-local millimetres. */
  point: AutoMovieHumanSkinVector.Vec3;

  /** Body normal under it, or null when it is clear of the body. */
  normal: AutoMovieHumanSkinVector.Vec3 | null;
}
