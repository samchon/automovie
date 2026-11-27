import type { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";

/*
 * The readable name of each kind.
 */
export const NAMES: Readonly<Record<AutoMovieArchetypeHolster.Kind, string>> = {
  holster: "belt holster",
  scabbard: "scabbard",
  sheath: "sheath",
  quiver: "quiver",
  pouch: "cartridge box",
};
