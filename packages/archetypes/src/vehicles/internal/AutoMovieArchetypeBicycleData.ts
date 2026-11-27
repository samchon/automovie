import type { IAutoMovieArchetypeBand } from "../../core";
import { AutoMovieArchetypeBand } from "../../core";

/*
 * A provisional band in metres from a secondary source.
 */
export const m = (
  minimum: number,
  maximum: number,
  source: string,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("m", minimum, maximum, source, true);

/*
 * Frame geometry no source gave.
 */
export const GEOMETRY: string =
  "typical road frame geometry; maker geometry charts could not be opened";
