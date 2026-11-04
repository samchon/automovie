import type { IAutoMovieHumanConstructionPath } from "../IAutoMovieHumanConstructionPath";

/** A built web: where each child's section meets the web's skin, and the lines the surface was drawn on. */
export interface IAutoMovieHumanWebResult {
  /** Each child's adjacent end: the vertices of its section, in ring order. */
  rings: Map<string, number[]>;

  /** The webs' separatrices, the lips and each child's own column, as the surface sampled them. */
  construction: IAutoMovieHumanConstructionPath[];
}
