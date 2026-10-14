import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignPredicates } from "./validateProductionDesignPredicates";
import { IAutoMovieDiagnostic, IAutoMovieShotPredicate } from "@automovie/interface";

/**
 * Check exact state identities and descriptions, then their current predicates through the shared predicate owner.
 *
 * @evidence contracts/common.md#principled-implementation A local exact-id Set checks every schema-admitted state's identity before nonblank description and predicate admission in source order. The shot gate supplies opening or closing states; descriptive text does not prove compiled realization and an empty state list adds no finding here.
 * @evidence contracts/common.md#clear-and-simple-design Opening and closing populations share one state loop, while scalar uniqueness/text and predicate semantics retain their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States per-population identity scope and description-before-predicate order; field/id labels attribute appended findings and all state records remain unchanged.
 * @evidence contracts/performance.md#efficient-algorithms State and predicate scans determine cost, including predicate-owned reference searches; the state identity set is linear in distinct states.
 * @evidence contracts/performance.md#reuse-equivalent-work One local Set shares exact-id membership across the current state population and each predicate receives the same borrowed graph; no earlier state verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The distinct-state Set and field labels are local and input-sized; appended findings remain in the caller's array, while states/graph are borrowed without a handle or task.
 */
export const validateProductionDesignNamedStates: (diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, states: readonly { id: string; description: string; predicates: IAutoMovieShotPredicate[]; }[], target: string, file: string, field: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  graph: IAutoMovieProductionDesignGraph,
  states: readonly {
    id: string;
    description: string;
    predicates: IAutoMovieShotPredicate[];
  }[],
  target: string,
  file: string,
  field: string,
): void => {
  const seen: Set<string> = new Set<string>();
  for (const state of states) {
    validateProductionDesignUnique(diagnostics, seen, state.id, target, file, field);
    validateProductionDesignText(diagnostics, state.description, target, file, `${field}.description`);
    validateProductionDesignPredicates(
      diagnostics,
      graph,
      state.predicates,
      target,
      file,
      `${field}.${state.id}.predicates`,
    );
  }
};
