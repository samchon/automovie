import input from "./AutoMovieHumanHandF1RightInputs.json";
import { AutoMovieHumanHandConstruction } from "./AutoMovieHumanHandConstruction";
import type { AutoMovieHumanHandPorts } from "./AutoMovieHumanHandPorts";

/**
 * Fixed F1 numeric inputs from the actual 6ed65f481e producer.
 * Branch/fan and digit coefficients retain native world mm (+X front, +Y up, +Z left). Intermediate port walks are native world metres.
 * The three measured fan splits, disjoint outlet ownership, turned digit charts, reduced extent/rho knots and true tips are unchanged.
 * JSON preserves every binary64 value and the ordered coefficient fields.
 */
export const AutoMovieHumanHandF1RightSections: AutoMovieHumanHandPorts.IFixed =
  AutoMovieHumanHandConstruction.fixedInput(input, AutoMovieHumanHandConstruction.fixedContour(input.branch.model));
