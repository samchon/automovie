import type { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * What changes as one guide is integrated, passed from step to step
 * (`AutoMovieHumanHairGuide`): every piece of the loop reads it and the
 * pieces that move the strand write it.
 */
export interface IAutoMovieHumanHairGuideState {
  /** Current point, head-local millimetres. */
  p: AutoMovieHumanSkinVector.Vec3;

  /** Current unit heading. */
  heading: AutoMovieHumanSkinVector.Vec3;

  /** Arc grown so far, millimetres. */
  travelled: number;

  /**
   * Once a strand reaches the body it rests there: the body normal under its
   * last point, null while off the body.
   */
  surface: AutoMovieHumanSkinVector.Vec3 | null;

  /**
   * The arc the strand may still lay along the body, null before the first
   * contact.
   */
  resting: number | null;

  /** Points from root to the current point, head-local millimetres. */
  points: AutoMovieHumanSkinVector.Vec3[];

  /** Outward unit normal of the hair mass at each point. */
  normals: AutoMovieHumanSkinVector.Vec3[];
}
