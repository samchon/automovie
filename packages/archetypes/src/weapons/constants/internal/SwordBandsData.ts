
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";

export namespace SwordBandsData {
  /*
   * The British light cavalry sabre, from a secondary source.
   */
  export const SABRE: string =
    "Pattern 1796 light cavalry sabre, blade 83 to 84 cm (Wikipedia, https://en.wikipedia.org/wiki/Pattern_1796_light_cavalry_sabre)";

  /*
   * The katana's defining blade length, from a secondary source.
   */
  export const KATANA: string =
    "katana, blade longer than 60.6 cm (2 shaku), about 60 to 80 cm (Wikipedia, https://en.wikipedia.org/wiki/Katana)";

  /*
   * The rapier's average figures, from a secondary source.
   */
  export const RAPIER: string =
    "rapier, blade averaging 104 cm and 2.5 cm wide, about 1 kg (Wikipedia, https://en.wikipedia.org/wiki/Rapier)";

  /*
   * The rondel dagger's lengths, from a secondary source.
   */
  export const DAGGER: string =
    "rondel dagger, blade 30 cm or more, the whole as long as 51 cm (Wikipedia, https://en.wikipedia.org/wiki/Rondel_dagger)";

  /*
   * A fighting knife, from a secondary source.
   */
  export const KNIFE: string =
    "Ka-Bar fighting knife, 30.16 cm overall, 17.8 cm blade, 320 g (Wikipedia, https://en.wikipedia.org/wiki/Ka-Bar)";

  /*
   * A value no source read gives: an estimate from the kind's typical make,
   * always provisional.
   */
  export const ESTIMATE: string = "typical of the kind, not read at a source";

  /*
   * A band in metres that is an estimate.
   */
  export const guess = (minimum: number, maximum: number): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, ESTIMATE, true);
}
