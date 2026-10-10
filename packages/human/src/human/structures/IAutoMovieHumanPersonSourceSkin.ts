import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * One final skin of a performed person in its body frame: the posed face
 * skin, the cut body skin after collar conformance and before it, and the
 * head transform that placed the face. Positions are owned flat triples in
 * metres, Y up, +Z forward.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceSkin {
  /** Posed face skin positions, metres. */
  face: number[];

  /** Cut body skin positions after collar conformance, metres. */
  body: number[];

  /** Cut body skin positions before collar conformance, metres. */
  bodyBeforeCollar: number[];

  /** The head transform that placed the face. */
  head: IAutoMovieHumanPersonHeadTransform;
}
