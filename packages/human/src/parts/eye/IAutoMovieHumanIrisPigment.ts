/**
 * The four colours of one iris category, sRGB from 0 to 1.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanIrisPigment {
  /** Pupillary zone, from the pupil to the collarette. */
  pupillary: [number, number, number];

  /** Ciliary zone, from the collarette to the root. */
  ciliary: [number, number, number];

  /** Crests of the radial trabeculae and the collarette's ridge. */
  crest: [number, number, number];

  /** Limbal ring at the iris root. */
  ring: [number, number, number];
}
