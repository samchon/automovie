import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";

/**
 * Expands beginner traits into the detailed documents a person is built from.
 *
 * A converter is the only place population statistics meet a person: correlations such as taller adults having relatively longer legs, or adiposity adding girth to the waist before the limbs, live here where they can be cited and replaced, never inside geometry. It must be deterministic, so equal traits always give equal documents, and its output passes admission like any authored identity. Replacing the converter, for another population survey or a stylised profile, changes only new people: a saved person stores the converted identity, not the traits.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanConverter {
  /**
   * Expand traits into a detailed identity.
   *
   * @param traits Admitted traits
   * @returns Identity whose measurements follow the converter's documented statistics
   * @throws {AutoMovieHumanAdmissionError} When the traits fall outside the data the converter covers
   */
  toIdentity(traits: IAutoMovieHumanTraits): IAutoMovieHumanIdentity;

  /**
   * Expand traits into a default appearance, including underwear by sex.
   *
   * @param traits Admitted traits
   * @returns Appearance the person starts with
   */
  toAppearance(traits: IAutoMovieHumanTraits): IAutoMovieHumanAppearance;
}
