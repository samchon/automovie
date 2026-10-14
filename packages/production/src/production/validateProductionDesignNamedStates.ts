import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignPredicates } from "./validateProductionDesignPredicates";
import { IAutoMovieDiagnostic, IAutoMovieShotPredicate } from "@automovie/interface";

/**
 * Check exact state identities and descriptions, then their current predicates through the shared predicate owner.
 *
 * @evidence contracts/common.md#principled-implementation The caller supplies an already schema-admitted state population; descriptive text does not prove compiled realization.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignNamedStates owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms State and predicate scans determine cost, including predicate-owned reference searches; the state identity set is linear in distinct states.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
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
