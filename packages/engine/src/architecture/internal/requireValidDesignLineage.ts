import {
  IAutoMovieConstraintViolation,
  IAutoMovieDesignLineage,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validateDesignLineage } from "./validateDesignLineage";

/*
 * Refuse a design lineage that `validateDesignLineage` rejects.
 *
 * Every lineage query reads ids, edges and phases on the premise that they
 * resolve, so each one calls this first and then answers only for a valid
 * record. The thrown `Error` names the lineage, the path of the first
 * violation, and what that path expected; a valid lineage returns nothing.
 * Parameter lineage: Lineage record to check.
 */
export function requireValidDesignLineage(
  lineage: IAutoMovieDesignLineage,
): void {
  const validated: IAutoMovieValidation = validateDesignLineage({ lineage });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `design lineage "${lineage.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }
}
