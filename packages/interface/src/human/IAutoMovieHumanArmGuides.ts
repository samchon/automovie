import type { IAutoMovieHumanArmTube } from "./IAutoMovieHumanArmTube";

/**
 * A section-shape evaluator indexed by distance along the arm walk.
 *
 * The interface package owns these declarations; AutoMovieHumanArmGuides in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanArmGuides {
  /**
   * Result of AutoMovieHumanArmGuides.shape. The normalised section at any walk
   * length.
   *
   * @param pieces The spans, proximal to distal.
   */
  export type ShapeResult = (s: number) => IAutoMovieHumanArmTube.IShape;
}
