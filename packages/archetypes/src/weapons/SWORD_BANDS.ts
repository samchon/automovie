import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../core";
import type { AutoMovieArchetypeSword } from "./AutoMovieArchetypeSword";

/** The British light cavalry sabre, from a secondary source. */
const SABRE: string =
  "Pattern 1796 light cavalry sabre, blade 83 to 84 cm (Wikipedia, https://en.wikipedia.org/wiki/Pattern_1796_light_cavalry_sabre)";

/** The katana's defining blade length, from a secondary source. */
const KATANA: string =
  "katana, blade longer than 60.6 cm (2 shaku), about 60 to 80 cm (Wikipedia, https://en.wikipedia.org/wiki/Katana)";

/** The rapier's average figures, from a secondary source. */
const RAPIER: string =
  "rapier, blade averaging 104 cm and 2.5 cm wide, about 1 kg (Wikipedia, https://en.wikipedia.org/wiki/Rapier)";

/** The rondel dagger's lengths, from a secondary source. */
const DAGGER: string =
  "rondel dagger, blade 30 cm or more, the whole as long as 51 cm (Wikipedia, https://en.wikipedia.org/wiki/Rondel_dagger)";

/** A fighting knife, from a secondary source. */
const KNIFE: string =
  "Ka-Bar fighting knife, 30.16 cm overall, 17.8 cm blade, 320 g (Wikipedia, https://en.wikipedia.org/wiki/Ka-Bar)";

/**
 * A value no source read gives: an estimate from the kind's typical make,
 * always provisional.
 */
const ESTIMATE: string = "typical of the kind, not read at a source";

/** A band in metres that is an estimate. */
const guess = (minimum: number, maximum: number): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.metres(minimum, maximum, ESTIMATE, true);

/**
 * The band of each free dimension of a blade that its kind's read model leaves,
 * by kind, with the source it was read at; `createSword.BANDS` is this table.
 *
 * A longsword and an arming sword are each one of their maker's swords whole
 * (`SWORD_MODELS`), so they have no bands, and a sabre's mass is its pattern's.
 * The others rest on secondary sources for length and mass, and their width,
 * hilt length and point of balance are estimates: the missing measurement is a
 * museum or maker record of that kind giving the point of balance.
 */
export const SWORD_BANDS: Readonly<
  Record<
    AutoMovieArchetypeSword.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeSword.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  longsword: {},
  armingSword: {},
  sabre: {
    bladeLength: AutoMovieArchetypeBand.metres(0.83, 0.84, SABRE, true),
    bladeWidth: guess(0.035, 0.038),
    hiltLength: guess(0.13, 0.14),
    balance: guess(0.12, 0.16),
  },
  katana: {
    bladeLength: AutoMovieArchetypeBand.metres(0.606, 0.8, KATANA, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: guess(0.25, 0.28),
    balance: guess(0.1, 0.14),
    mass: AutoMovieArchetypeBand.of("kg", 0.9, 1.2, ESTIMATE, true),
  },
  rapier: {
    bladeLength: AutoMovieArchetypeBand.metres(1.04, 1.04, RAPIER, true),
    bladeWidth: AutoMovieArchetypeBand.metres(0.025, 0.025, RAPIER, true),
    hiltLength: guess(0.15, 0.17),
    balance: guess(0.08, 0.12),
    mass: AutoMovieArchetypeBand.of("kg", 1, 1, RAPIER, true),
  },
  dagger: {
    bladeLength: AutoMovieArchetypeBand.metres(0.3, 0.36, DAGGER, true),
    bladeWidth: guess(0.02, 0.025),
    hiltLength: guess(0.14, 0.15),
    balance: guess(0, 0.03),
    mass: AutoMovieArchetypeBand.of("kg", 0.25, 0.45, ESTIMATE, true),
  },
  knife: {
    bladeLength: AutoMovieArchetypeBand.metres(0.178, 0.178, KNIFE, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: AutoMovieArchetypeBand.metres(0.1236, 0.1236, KNIFE, true),
    balance: guess(0, 0.02),
    mass: AutoMovieArchetypeBand.of("kg", 0.32, 0.32, KNIFE, true),
  },
};
