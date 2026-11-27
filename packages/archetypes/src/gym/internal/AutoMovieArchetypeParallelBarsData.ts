import type { IAutoMovieArchetypeBand } from "../../core/index";
import { AutoMovieArchetypeBand } from "../../core/index";

/*
 * The norm that sizes gymnastics' parallel bars.
 */
export const FIG: string =
  "Fédération Internationale de Gymnastique, Apparatus Norms, the parallel bars: the rails 2.0 m above the floor, 3.5 m long and 42 to 52 cm apart";

/*
 * A rail's thickness: the norm's oval rail is about 4 cm wide and 5 cm high,
 * read from descriptions of the apparatus and not from the norm's text.
 */
export const RAIL: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.04,
  0.05,
  "the rail's oval section, about 4 cm by 5 cm, as the apparatus is commonly described; the norm's text was not read for it",
  true,
);
