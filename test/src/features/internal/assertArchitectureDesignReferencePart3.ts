import { validateDesignReference } from "@automovie/engine";
import type { IAutoMovieDesignReference } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./nclose";
import { violationCount } from "./predicates";

/** Execute the next ordered assertions of test_architecture_design_reference.
 *
 * Scenarios:
 * 1. the untouched observation produces no violation path at all.
 * 2. one malformed field produces exactly one refusal.
 *
 * The preceding authored single-field table supplies each exact refusal path; a fresh valid reference must produce no path, and blanking its id alone must yield exactly one violation. The numeric count is discrete, while provider authenticity and external file bytes are not tested.
 * Every table mutation is applied to a fresh reference, contrasting its located refusal with an untouched reference and a single blank-id fault. Part1 owns provenance/citation positive cases and Part2 owns construction of the malformed input table.
 */
export function assertArchitectureDesignReferencePart3(
  observation: () => IAutoMovieDesignReference,
  refusalPaths: (
    mutate: (value: IAutoMovieDesignReference) => void,
  ) => string[],
  malformed: ReadonlyArray<
    readonly [string, (value: IAutoMovieDesignReference) => void, string]
  >,
): void {
  malformed.forEach(
    ([name, mutate, path]: readonly [
      string,
      (value: IAutoMovieDesignReference) => void,
      string,
    ]): void =>
      TestValidator.equals(
        `${name} is refused at ${path}`,
        refusalPaths(mutate).includes(path),
        true,
      ),
  );
  TestValidator.equals(
    "the untouched observation produces no violation path at all",
    refusalPaths((): void => {}),
    [],
  );
  TestValidator.predicate(
    "one malformed field produces exactly one refusal",
    ((): boolean => {
      const observed: number = violationCount(
        validateDesignReference({
          reference: { ...observation(), id: "" },
        }),
      );
      return typeof observed === "number" && nclose(observed, 1);
    })(),
  );
}
