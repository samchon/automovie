import type { IAutoMovieHumanBasisNormalTransport } from "../../common/basis/IAutoMovieHumanBasisNormalTransport";

/**
 * One skin half as normal-transport admission reads it: its emitted triangle
 * vertex indices and its compiled fixed-source normal transport, if any.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportHalf {
  /** Flat emitted triangle vertex index triples. */
  indices: readonly number[];

  /** Compiled fixed-source normal transport, or none. */
  transport?: IAutoMovieHumanBasisNormalTransport;
}
