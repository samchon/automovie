import type { IAutoMovieHumanFaceHairDomain } from "../../structures/IAutoMovieHumanFaceHairDomain";

/**
 * Neutral source geometry and the registered growth chart consumed by area sampling.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSamplingProps {
  /** Original neutral flat XYZ positions, head-frame metres. */
  positions: readonly number[];

  /** Original oriented faces, addressing the same coordinate population. */
  indices: readonly number[];

  /** Registered domain face ordinals retain the shared domain owner's identity and ordering. */
  triangles: Readonly<IAutoMovieHumanFaceHairDomain["triangles"]>;

  /** Registered neutral XYZ chart origin, in the shared domain owner's metre frame. */
  origin: Readonly<IAutoMovieHumanFaceHairDomain["origin"]>;
}
