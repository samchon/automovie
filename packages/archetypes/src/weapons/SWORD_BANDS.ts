import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createSword } from "./createSword";

/** Two longswords measured by their maker. */
const LONG: string =
  "Albion Swords, the Crecy (Oakeshott XVIa: 113.7 cm overall, 90 cm blade 5 cm wide, 1.39 kg, balance 10.16 cm, https://albion-swords.com/product/the-crecy/) and the Regent (XVIIIb: 122 cm overall, 94 cm blade 5 cm wide, 1.59 kg, balance 13 cm, https://albion-swords.com/product/the-regent/)";

/** Two single-hand swords measured by their maker. */
const ARMING: string =
  "Albion Swords, the Knight (Oakeshott XII: 96.8 cm overall, 80 cm blade 5.24 cm wide, 1.2 kg, balance 11.43 cm, https://albion-swords.com/product/the-knight/) and the Poitiers (XV: 94.77 cm overall, 77.79 cm blade 5.56 cm wide, 1.19 kg, balance 8.57 cm, https://albion-swords.com/product/the-poitiers/)";

/** The British light cavalry sabre, from a secondary source. */
const SABRE: string =
  "Pattern 1796 light cavalry sabre, blade 83 to 84 cm, 0.83 kg (officer's) to 0.96 kg (trooper's) (Wikipedia, https://en.wikipedia.org/wiki/Pattern_1796_light_cavalry_sabre)";

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

/** A value no source read gives: an estimate from the kind's typical make, always provisional. */
const ESTIMATE: string = "typical of the kind, not read at a source";

/** A band in metres that is an estimate. */
const guess = (minimum: number, maximum: number): IArchetypeBand =>
  ArchetypeBand.metres(minimum, maximum, ESTIMATE, true);

/**
 * The band of each free dimension of a blade, by kind, with the source it was read at; `createSword.BANDS` is this table.
 *
 * The two maker-measured kinds are read at the maker's pages. The others rest on secondary sources for length and mass, and their width, hilt length and point of balance are estimates: the missing measurement is a museum or maker record of that kind giving the point of balance.
 */
export const SWORD_BANDS: Readonly<
  Record<
    createSword.Kind,
    Readonly<Record<createSword.Dimension, IArchetypeBand>>
  >
> = {
  longsword: {
    bladeLength: ArchetypeBand.metres(0.9, 0.94, LONG),
    bladeWidth: ArchetypeBand.metres(0.05, 0.05, LONG),
    hiltLength: ArchetypeBand.metres(0.237, 0.28, LONG),
    balance: ArchetypeBand.metres(0.1016, 0.13, LONG),
    mass: ArchetypeBand.of("kg", 1.39, 1.59, LONG),
  },
  armingSword: {
    bladeLength: ArchetypeBand.metres(0.7779, 0.8, ARMING),
    bladeWidth: ArchetypeBand.metres(0.0524, 0.0556, ARMING),
    hiltLength: ArchetypeBand.metres(0.168, 0.1698, ARMING),
    balance: ArchetypeBand.metres(0.0857, 0.1143, ARMING),
    mass: ArchetypeBand.of("kg", 1.19, 1.2, ARMING),
  },
  sabre: {
    bladeLength: ArchetypeBand.metres(0.83, 0.84, SABRE, true),
    bladeWidth: guess(0.035, 0.038),
    hiltLength: guess(0.13, 0.14),
    balance: guess(0.12, 0.16),
    mass: ArchetypeBand.of("kg", 0.83, 0.96, SABRE, true),
  },
  katana: {
    bladeLength: ArchetypeBand.metres(0.606, 0.8, KATANA, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: guess(0.25, 0.28),
    balance: guess(0.1, 0.14),
    mass: ArchetypeBand.of("kg", 0.9, 1.2, ESTIMATE, true),
  },
  rapier: {
    bladeLength: ArchetypeBand.metres(1.04, 1.04, RAPIER, true),
    bladeWidth: ArchetypeBand.metres(0.025, 0.025, RAPIER, true),
    hiltLength: guess(0.15, 0.17),
    balance: guess(0.08, 0.12),
    mass: ArchetypeBand.of("kg", 1, 1, RAPIER, true),
  },
  dagger: {
    bladeLength: ArchetypeBand.metres(0.3, 0.36, DAGGER, true),
    bladeWidth: guess(0.02, 0.025),
    hiltLength: guess(0.14, 0.15),
    balance: guess(0, 0.03),
    mass: ArchetypeBand.of("kg", 0.25, 0.45, ESTIMATE, true),
  },
  knife: {
    bladeLength: ArchetypeBand.metres(0.178, 0.178, KNIFE, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: ArchetypeBand.metres(0.1236, 0.1236, KNIFE, true),
    balance: guess(0, 0.02),
    mass: ArchetypeBand.of("kg", 0.32, 0.32, KNIFE, true),
  },
};
