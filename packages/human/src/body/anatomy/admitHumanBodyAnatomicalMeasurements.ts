import typia from "typia";

import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * Admit a closed tree of named anatomical targets and actual observations.
 *
 * The schema rejects unknown sculpt coordinates, missing observation context,
 * impossible modality/quantity pairs, wrong group ownership and empty parts.
 * All scalar values must be finite. Length, girth, mass and volume are
 * positive; chronological age and quantified measurement uncertainty may be
 * zero, and MRI proton-density fat fractions lie in [0,1]. Angles may have
 * either sign because their clinical axes differ by
 * component. Population-specific ranges and whether one scalar can produce
 * a valid surface belong to the component resolver, not this input gate.
 * No exterior or internal geometry is created by admitting a record.
 * @author Samchon
 */
export function admitHumanBodyAnatomicalMeasurements(
  input: unknown,
): IAutoMovieHumanBodyAnatomicalMeasurements {
  const measurements =
    typia.assertEquals<IAutoMovieHumanBodyAnatomicalMeasurements>(input);
  const visit = (node: object): void => {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "number") {
        const valid =
          Number.isFinite(value) &&
          (key === "degrees" ||
            (key === "fraction" || key === "uncertaintyFraction"
              ? value >= 0 && value <= 1
              : key === "years" || key.startsWith("uncertainty")
                ? value >= 0
                : value > 0));
        if (!valid)
          throw new Error(`Body anatomical ${key} needs a finite physical value.`);
      } else if (typeof value === "object") visit(value as object);
    }
  };
  visit(measurements);
  return measurements;
}
