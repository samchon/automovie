import type { AutoMovieArchetypeDoor } from "../../AutoMovieArchetypeDoor";
import { AutoMovieArchetypeUnits } from "../../../core";

/*
 * A cylindrical lock's backsets, the Schlage ND's, which a lever and a knob
 * share and a sliding door's pull is set at.
 */
export const BACKSETS: Readonly<Record<AutoMovieArchetypeDoor.Backset, Figures>> = {
  "2-3/8in": { backset: (2 + 3 / 8) * AutoMovieArchetypeUnits.INCH },
  "2-3/4in": { backset: (2 + 3 / 4) * AutoMovieArchetypeUnits.INCH },
};

/*
 * One read size's figures, metres.
 */
export type Figures = Readonly<Partial<Record<AutoMovieArchetypeDoor.Dimension, number>>>;
