import type { IAutoMovieHumanBodyUnderwearProps } from "../structures/IAutoMovieHumanBodyUnderwearProps";
import type { IHumanBodyUnderwearSkinSurface } from "./IHumanBodyUnderwearSkinSurface";

/** Actual posed skin, cut garment and existing garment table lengths. */
export interface IHumanBodyUnderwearCreaseInput {
  /** Actual cut material triangles; point proximity is not connectivity. */
  indices: readonly number[];

  /** Actual posed reference surfaces supplying exterior triangle clearance. */
  skin: readonly IHumanBodyUnderwearSkinSurface[];

  /** Original XYZ material samples cut from the posed skin, metres. */
  points: readonly number[];

  /** This invocation's existing construction observer, with the same synchronous failure semantics. */
  observeFitting?: IAutoMovieHumanBodyUnderwearProps["observeFitting"];

  /** Supplied outward directions at those exact material samples. */
  normals: readonly number[];

  /** Existing signed normal lift from the fitted material, metres. */
  offsetMetres: number;

  /** Existing diameter of the ball spanning skin creases, metres. */
  spanMetres: number;
}
