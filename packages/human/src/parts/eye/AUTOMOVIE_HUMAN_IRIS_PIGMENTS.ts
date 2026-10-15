import { AutoMovieHumanIrisColor } from "../../structures/AutoMovieHumanIrisColor";
import { IAutoMovieHumanIrisPigment } from "./IAutoMovieHumanIrisPigment";

/**
 * Colours of each iris category, sRGB from 0 to 1, that the iris image is painted from.
 *
 * An iris reads by its anterior stroma: little melanin there scatters short wavelengths and looks blue or grey, more melanin looks green, hazel and then brown, and the pupillary zone inside the collarette usually carries more pigment than the ciliary zone outside it, which is what a hazel iris shows strongly. Each category therefore names four colours: the pupillary zone, the ciliary zone, the light crests of the radial trabeculae, and the dark limbal ring at the iris root. No measured colour per category was read, so the values are chosen to read as their names under neutral light. Grade: conventional.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_IRIS_PIGMENTS: Record<
  AutoMovieHumanIrisColor,
  IAutoMovieHumanIrisPigment
> = {
  blue: pigment([0x5e, 0x77, 0x88], [0x5f, 0x86, 0xad], [0xa9, 0xc4, 0xdc], [0x22, 0x31, 0x45]),
  gray: pigment([0x6c, 0x70, 0x6c], [0x7b, 0x85, 0x8b], [0xb7, 0xbd, 0xbf], [0x2e, 0x33, 0x38]),
  green: pigment([0x80, 0x6c, 0x3a], [0x5e, 0x7c, 0x52], [0x9c, 0xb0, 0x7c], [0x26, 0x34, 0x24]),
  hazel: pigment([0x7a, 0x52, 0x26], [0x6e, 0x72, 0x45], [0xa8, 0x98, 0x60], [0x30, 0x2c, 0x1c]),
  lightBrown: pigment([0x76, 0x49, 0x22], [0x92, 0x62, 0x30], [0xb8, 0x8c, 0x55], [0x3a, 0x26, 0x16]),
  brown: pigment([0x48, 0x2c, 0x18], [0x5e, 0x3a, 0x1e], [0x8a, 0x5e, 0x36], [0x26, 0x18, 0x0e]),
  darkBrown: pigment([0x26, 0x18, 0x0f], [0x31, 0x20, 0x13], [0x4a, 0x31, 0x1e], [0x15, 0x0e, 0x09]),
};

/**
 * One category's colours from 8-bit sRGB triples.
 *
 * @param pupillary Pupillary zone
 * @param ciliary Ciliary zone
 * @param crest Trabecular crests
 * @param ring Limbal ring
 * @returns The colours from 0 to 1
 */
function pigment(
  pupillary: [number, number, number],
  ciliary: [number, number, number],
  crest: [number, number, number],
  ring: [number, number, number],
): IAutoMovieHumanIrisPigment {
  const unit = (c: [number, number, number]): [number, number, number] => [
    c[0] / 255,
    c[1] / 255,
    c[2] / 255,
  ];
  return {
    pupillary: unit(pupillary),
    ciliary: unit(ciliary),
    crest: unit(crest),
    ring: unit(ring),
  };
}
