import input from "./AutoMovieHumanArmF1LeftInputs.json";
import { AutoMovieHumanArmF1Lines } from "./AutoMovieHumanArmF1Lines";

/**
 * Fixed F1 numeric inputs from the actual 6ed65f481e producer.
 * Sleeve and wrist are absolute capture-world mm (+X front, +Y up, +Z right). Palm cubics retain native world mm with opposite Z.
 * The 107 ordinary sleeve walks are the actual 0.1 mm chord loft input. The 72-point wrist and observed palm preserve their original station order.
 * JSON preserves every binary64 value and the ordered coefficient fields.
 */
export const AutoMovieHumanArmF1LeftSections: AutoMovieHumanArmF1Lines.IFixedSource = AutoMovieHumanArmF1Lines.fixedInput(input);
