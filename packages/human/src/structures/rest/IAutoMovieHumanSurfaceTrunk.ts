import { IAutoMovieHumanSurfaceSection } from "./IAutoMovieHumanSurfaceSection";

/** Horizontal rest observations at the declared trunk planes. */
export interface IAutoMovieHumanSurfaceTrunk {
  /** Chest-apex plane in the shared standing-surface datum. */
  chest: IAutoMovieHumanSurfaceSection;

  /** Natural-waist plane, distinct from a navel section. */
  waist: IAutoMovieHumanSurfaceSection;

  /** Maximum-buttock plane; its height is independently supplied. */
  buttock: IAutoMovieHumanSurfaceSection;
}
