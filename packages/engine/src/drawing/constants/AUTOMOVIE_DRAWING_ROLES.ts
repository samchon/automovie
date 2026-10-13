import { AutoMovieDrawingRole } from "@automovie/interface";

/**
 * Every drawing line role, in the order lines are sorted and pens are checked.
 *
 * Cut first and hidden last is the drafting precedence from the heaviest pen
 * to the lightest, so a sorted sheet lists what the plane passes through
 * before what lies beyond it.
 */
export const AUTOMOVIE_DRAWING_ROLES: readonly AutoMovieDrawingRole[] = [
  "cut",
  "projected",
  "overhead",
  "hidden",
];
