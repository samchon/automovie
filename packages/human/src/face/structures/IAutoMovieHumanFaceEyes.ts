import type { IAutoMovieHumanFaceOpticalDimensions } from "./IAutoMovieHumanFaceOpticalDimensions";

/**
 * A document's independent optical dimensions for each eye.
 *
 * Each side takes the seven explicit dimensions of one authored optical core
 * (`IAutoMovieHumanFaceOpticalDimensions`). They need the basis's
 * producer-qualified optical support for that side; without it the builder
 * refuses the document by name instead of approximating a globe. Omission
 * keeps the basis's authored globes byte for byte.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyes {
  /** Optical dimensions of the anatomical left eye. */
  left: IAutoMovieHumanFaceOpticalDimensions;

  /** Optical dimensions of the anatomical right eye. */
  right: IAutoMovieHumanFaceOpticalDimensions;
}
