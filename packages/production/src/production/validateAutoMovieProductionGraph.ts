import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignProduction } from "./validateProductionDesignProduction";
import { validateProductionDesignModels } from "./validateProductionDesignModels";
import { validateProductionDesignWorld } from "./validateProductionDesignWorld";
import { validateProductionDesignFormationBudgets } from "./validateProductionDesignFormationBudgets";
import { validateProductionDesignFormations } from "./validateProductionDesignFormations";
import { validateProductionDesignShots } from "./validateProductionDesignShots";
import { validateProductionDesignAcceptance } from "./validateProductionDesignAcceptance";
import { validateProductionDesignCompareDiagnostics } from "./validateProductionDesignCompareDiagnostics";
import { AutoMovieModelArchetypeRegistry, AUTOMOVIE_REGISTERED_ARCHETYPES } from "./productionArchetypes";
import { IAutoMovieDiagnostic } from "@automovie/interface";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Validate a structurally admitted production graph without changing its records.
 *
 * @evidence contracts/common.md#principled-implementation Production, models, world, formation budgets, formations, shots and acceptance append findings in that order; the returned owned array is sorted by path, code and message using code-unit order. Omitted production identity uses the graph ID or unbound-production, and omitted archetypes use the registered catalogue. This gate checks declared relationships and budgets, not compiled realization or rendered acceptance.
 * @evidence contracts/common.md#clear-and-simple-design validateAutoMovieProductionGraph owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Full declared populations and their strings are scanned. Costs include quadratic polygon edge pairs, repeated recipe/route/participant searches, formation payload encoding and source-sized profile checks; sorting D findings costs O(D log D) comparisons plus string lengths. No measured speedup is claimed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export const validateAutoMovieProductionGraph: (graph: IAutoMovieProductionDesignGraph, productionId?: string, archetypes?: AutoMovieModelArchetypeRegistry) => IAutoMovieDiagnostic[] = (
  graph: IAutoMovieProductionDesignGraph,
  productionId: string = graph.production?.id ?? "unbound-production",
  archetypes: AutoMovieModelArchetypeRegistry = AUTOMOVIE_REGISTERED_ARCHETYPES,
): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const productionRoot: string = `automovie/design/${encodeAutoMoviePathSegment(productionId)}`;
  const sharedRoot: string = "automovie/design/shared";
  validateProductionDesignProduction(diagnostics, graph, productionRoot);
  validateProductionDesignModels(diagnostics, graph, sharedRoot, archetypes);
  validateProductionDesignWorld(diagnostics, graph, sharedRoot);
  validateProductionDesignFormationBudgets(diagnostics, graph, sharedRoot);
  validateProductionDesignFormations(diagnostics, graph, sharedRoot);
  validateProductionDesignShots(diagnostics, graph, productionRoot);
  validateProductionDesignAcceptance(diagnostics, graph, productionRoot);
  return diagnostics.sort(validateProductionDesignCompareDiagnostics);
};
