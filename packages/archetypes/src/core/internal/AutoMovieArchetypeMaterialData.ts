import type { AutoMovieArchetypeMaterial } from "../AutoMovieArchetypeMaterial";

export namespace AutoMovieArchetypeMaterialData {
  /*
   * The College Physics textbook's table of measured pairs.
   */
  export const OPENSTAX: string =
    "OpenStax, College Physics 2e (2022), Table 5.1, Coefficients of Static and Kinetic Friction (https://openstax.org/books/college-physics-2e/pages/5-1-friction)";

  /*
   * The Physics Hypertextbook's table, each row with its primary source.
   */
  export const ELERT: string =
    "G. Elert, The Physics Hypertextbook, Friction, coefficient table (https://physics.info/friction/)";

  /*
   * The admitted names, kept private so callers cannot edit the catalogue.
   */
  export const KINDS: readonly AutoMovieArchetypeMaterial.Kind[] = Object.freeze([
    "rubber",
    "wood",
    "steel",
    "leather",
    "teflon",
    "sole",
    "hoof",
    "ice",
    "concrete",
    "asphalt",
    "stone",
    "brick",
    "glass",
    "ceramic",
    "plastic",
    "paper",
    "fabric",
    "foam",
    "skin",
    "wax",
    "food",
    "aluminium",
    "lead",
    "iron",
    "composite",
    "felt",
  ]);
}
