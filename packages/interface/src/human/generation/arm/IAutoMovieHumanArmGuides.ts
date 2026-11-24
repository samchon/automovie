import type { IAutoMoviePolarSector } from "../../../construction/IAutoMoviePolarSector";

/**
 * A section-shape evaluator indexed by distance along the arm walk.
 *
 * The interface package owns these declarations; AutoMovieHumanArmGuides in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanArmGuides {
  /** A normalised section at a walk length. */
  export interface IShape {
    /** The guides by increasing angle. */
    guides: IAutoMoviePolarSector.IGuide[];

    /** One fullness share per guide. */
    fullness: number[];
  }

  /** Result of AutoMovieHumanArmGuides.shape. The normalised section at any walk length.
  @param pieces The spans, proximal to distal.
 */
  export type ShapeResult = (s: number) => IShape;
}
