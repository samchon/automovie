import { AutoMovieArchetypeBand, type IAutoMovieArchetypeBand } from "../../core";
import type { AutoMovieArchetypeSword } from "../AutoMovieArchetypeSword";
import * as SwordBandsData from "./internal/SwordBandsData";
import { guess } from "./internal/SwordBandsData";

/*
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
    bladeLength: AutoMovieArchetypeBand.metres(0.83, 0.84, SwordBandsData.SABRE, true),
    bladeWidth: guess(0.035, 0.038),
    hiltLength: guess(0.13, 0.14),
    balance: guess(0.12, 0.16),
  },
  katana: {
    bladeLength: AutoMovieArchetypeBand.metres(0.606, 0.8, SwordBandsData.KATANA, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: guess(0.25, 0.28),
    balance: guess(0.1, 0.14),
    mass: AutoMovieArchetypeBand.of("kg", 0.9, 1.2, SwordBandsData.ESTIMATE, true),
  },
  rapier: {
    bladeLength: AutoMovieArchetypeBand.metres(1.04, 1.04, SwordBandsData.RAPIER, true),
    bladeWidth: AutoMovieArchetypeBand.metres(0.025, 0.025, SwordBandsData.RAPIER, true),
    hiltLength: guess(0.15, 0.17),
    balance: guess(0.08, 0.12),
    mass: AutoMovieArchetypeBand.of("kg", 1, 1, SwordBandsData.RAPIER, true),
  },
  dagger: {
    bladeLength: AutoMovieArchetypeBand.metres(0.3, 0.36, SwordBandsData.DAGGER, true),
    bladeWidth: guess(0.02, 0.025),
    hiltLength: guess(0.14, 0.15),
    balance: guess(0, 0.03),
    mass: AutoMovieArchetypeBand.of("kg", 0.25, 0.45, SwordBandsData.ESTIMATE, true),
  },
  knife: {
    bladeLength: AutoMovieArchetypeBand.metres(0.178, 0.178, SwordBandsData.KNIFE, true),
    bladeWidth: guess(0.03, 0.032),
    hiltLength: AutoMovieArchetypeBand.metres(0.1236, 0.1236, SwordBandsData.KNIFE, true),
    balance: guess(0, 0.02),
    mass: AutoMovieArchetypeBand.of("kg", 0.32, 0.32, SwordBandsData.KNIFE, true),
  },
};
