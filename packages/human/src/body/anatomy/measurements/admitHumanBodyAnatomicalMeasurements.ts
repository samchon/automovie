import typia from "typia";

import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./IAutoMovieHumanBodyAnatomicalMeasurements";

/**
 * Admit a closed tree of named anatomical targets and actual observations.
 *
 * The schema rejects unknown sculpt coordinates, missing observation context, impossible modality/quantity pairs, wrong group ownership and empty parts. All scalar values must be finite. Length, girth, mass and volume are positive; chronological age and quantified measurement uncertainty may be zero, and MRI proton-density fat fractions lie in [0,1]. Angles may have either sign because their clinical axes differ by component. Population-specific ranges and whether one scalar can produce a valid surface belong to the component resolver, not this input gate. No exterior or internal geometry is created by admitting a record.
 *
 * @evidence contracts/common.md#principled-implementation Typia first admits the closed measurement tree, then a numeric traversal enforces finite/unit-specific signs and fractions without changing inputs.
 * @evidence contracts/common.md#clear-and-simple-design Schema admission owns structural/provenance validity; one local walker owns numeric constraints, leaving population and geometry validity to consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Key-dependent numeric rules follow the closed schema's quantity names rather than fixture values; no anatomical surface is fabricated on admission.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies positive quantities, signed degrees, nonnegative age/uncertainty, bounded fractions and unresolved population/surface validity.
 * @evidence contracts/performance.md#efficient-algorithms Structural assertion and the numeric walker each traverse the supplied finite tree; Object.entries allocations scale with node width and recursion with depth.
 * @evidence contracts/performance.md#reuse-equivalent-work The asserted tree is reused for numeric admission and returned by identity; mutable caller objects prevent safe persistent validity caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call retains only its traversal stack and temporary entries arrays; no resources survive return or a thrown admission error.
 */
export function admitHumanBodyAnatomicalMeasurements(
  input: unknown,
): IAutoMovieHumanBodyAnatomicalMeasurements {
  const measurements: IAutoMovieHumanBodyAnatomicalMeasurements =
    typia.assertEquals<IAutoMovieHumanBodyAnatomicalMeasurements>(input);
  const visit: (node: object) => void = (node: object): void => {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "number") {
        const valid: boolean =
          Number.isFinite(value) &&
          (key === "degrees" ||
            (key === "fraction" || key === "uncertaintyFraction"
              ? value >= 0 && value <= 1
              : key === "years" || key.startsWith("uncertainty")
                ? value >= 0
                : value > 0));
        if (!valid)
          throw new Error(
            `Body anatomical ${key} needs a finite physical value.`,
          );
      } else if (typeof value === "object") visit(value as object);
    }
  };
  visit(measurements);
  return measurements;
}
