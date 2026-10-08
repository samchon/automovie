import type { IAutoMovieHumanBodyUnderwearProps } from "../structures/IAutoMovieHumanBodyUnderwearProps";
import type { IHumanBodyUnderwearEnvelope } from "./IHumanBodyUnderwearEnvelope";

/**
 * Original connected material and the actual normal operation it must restore.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceFitInput {
  /** Complete original cut positions in posed skin metres. */
  points: readonly number[];

  /** This invocation's existing construction observer, with the same synchronous failure semantics. */
  observeFitting?: IAutoMovieHumanBodyUnderwearProps["observeFitting"];

  /** Actual supplied outward directions at the original material samples. */
  normals: readonly number[];

  /** Original cut triangle incidence; fitting removes no material face. */
  indices: readonly number[];

  /** Existing component member ordinals in the original cut; never native skin IDs. */
  sourceVertices: readonly number[];

  /** One original qualified exterior-ball field shared by fit and evaluation. */
  envelope: IHumanBodyUnderwearEnvelope;

  /** Existing garment ball radius, metres. */
  rho: number;

  /** Existing signed normal lift, metres; zero is the identity. */
  offsetMetres: number;
}
