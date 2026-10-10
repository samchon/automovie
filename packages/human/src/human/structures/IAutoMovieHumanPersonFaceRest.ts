/**
 * The face producer's evaluated skin of a one-skin generation, by skin vertex:
 * the head skin, and the band's appended body cells when the generation has
 * band rows.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceRest {
  /** Head skin positions, flat XYZ by head skin vertex. */
  head: number[];

  /** Band surface positions, flat XYZ by band view vertex, when the generation has band rows. */
  band?: number[];
}
