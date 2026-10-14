import {
  IAutoMovieConstraintViolation,
  IAutoMovieDesignLineage,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateDesignLineage } from "./validateDesignLineage";

/**
 * Refuse a design lineage that `validateDesignLineage` rejects.
 *
 * Every lineage query reads ids, edges and phases on the premise that they
 * resolve, so each one calls this first and then answers only for a valid
 * record. The thrown `Error` names the lineage, the path of the first
 * violation, and what that path expected; a valid lineage returns nothing.
 *
 * @param lineage Lineage record to check.
 *
 * @evidence contracts/common.md#principled-implementation Delegates every rule to `validateDesignLineage` and turns its first violation into one thrown message, so a query's premises are exactly the validator's guarantees.
 * @evidence contracts/common.md#clear-and-simple-design One guard shared by the compare, decision, digest, impact, phase-order and phase-snapshot queries, which each kept a private copy of the same message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no lineage and relaxes no rule; an invalid record is refused rather than repaired or partly answered.
 * @evidence contracts/common.md#meaningful-documentation States why queries call it first, what the thrown message names, and that a valid lineage returns nothing.
 * @evidence contracts/performance.md#efficient-algorithms Pays the complete `validateDesignLineage` cost, including repeated prerequisite reachability walks, lifecycle checks and decision-by-artifact comparisons; those terms can be superlinear. Adds only first-finding message formatting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validates the record it is handed each call, because the record is the caller's mutable data; a caller answering many questions about one lineage validates once and uses the unvalidated cores such as `compareDesignVariants`.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the validation result is dropped on return.
 */
export const requireValidDesignLineage: (lineage: IAutoMovieDesignLineage) => void = (
  lineage: IAutoMovieDesignLineage,
): void => {
  const validated: IAutoMovieValidation = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
};
