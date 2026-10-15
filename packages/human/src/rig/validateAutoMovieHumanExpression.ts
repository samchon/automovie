import typia, { IValidation } from "typia";

import { AutoMovieHumanActionUnit } from "../structures/AutoMovieHumanActionUnit";
import { IAutoMovieHumanExpression } from "../structures/IAutoMovieHumanExpression";

/** Action units that move the mandible, which is one bone and cannot act on one side alone. */
const JAW_UNITS: ReadonlySet<AutoMovieHumanActionUnit> =
  new Set<AutoMovieHumanActionUnit>(["jawDrop", "mouthStretch"]);

/**
 * Admit an expression: its static type and bounds, then the combinations a face can take.
 *
 * A unit may act once per side: listing it twice for one side, or for both sides and for one side, gives that muscle two intensities at once. A jaw unit acts on both sides only, because the mandible is one bone. The input is never mutated; on success the result holds a private copy.
 *
 * @param input Candidate expression, of any shape
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanExpression(
  input: unknown,
): IValidation<IAutoMovieHumanExpression> {
  const typed: IValidation<IAutoMovieHumanExpression> =
    typia.validateEquals<IAutoMovieHumanExpression>(input);
  if (typed.success === false) return typed;
  const expression: IAutoMovieHumanExpression = structuredClone(typed.data);

  const errors: IValidation.IError[] = [];
  const sides: Map<AutoMovieHumanActionUnit, Set<string>> = new Map();
  expression.units.forEach(
    (activation: IAutoMovieHumanExpression.IActivation, i: number): void => {
      const path: string = `$input.units[${i}]`;
      if (JAW_UNITS.has(activation.unit) && activation.side !== "both")
        errors.push({
          path: `${path}.side`,
          value: activation.side,
          expected: `"both" for ${activation.unit}`,
          description:
            "the mandible is one bone and opens on both sides together",
        });
      const listed: Set<string> = sides.get(activation.unit) ?? new Set();
      if (
        listed.has(activation.side) ||
        (activation.side === "both" && listed.size !== 0) ||
        listed.has("both")
      )
        errors.push({
          path: `${path}.unit`,
          value: activation.unit,
          expected: `${activation.unit} not already acting on the ${activation.side === "both" ? "same sides" : `${activation.side} side`}`,
          description: "one muscle has one intensity on one side at an instant",
        });
      listed.add(activation.side);
      sides.set(activation.unit, listed);
    },
  );
  if (errors.length !== 0) return { success: false, data: input, errors };
  return { success: true, data: expression };
}
