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
 * @evidence contracts/common.md#clear-and-simple-design Seven record-family passes append to one owned findings array before one final sort; typed record acquisition stays with project readers and source/compiled/visual admission stays with later build and review owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed shared root and unbound-production fallback address diagnostics rather than bypass admission. Inputs must already satisfy their structural schemas, and the supplied archetype catalogue must keep definitions stable and plans pure under its strategy contract; this coordinator neither freezes records nor totalizes malformed host objects or thrown plan failures.
 * @evidence contracts/common.md#meaningful-documentation States pass order, default diagnostic identity/catalogue and the sorted caller-owned result; semantic findings do not certify source realization or pixels, and helper/native/plan failures can propagate instead of returning diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Full declared populations and their strings are scanned. Costs include quadratic polygon edge pairs, repeated recipe/route/participant searches, formation payload encoding and source-sized profile checks; sorting D findings costs O(D log D) comparisons plus string lengths. No measured speedup is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work All passes borrow the same graph/catalogue references and append to the same array; the two diagnostic-root strings are computed once. Mutable records and catalogue definitions prevent reusing an earlier cross-call verdict by object identity, so every invocation reruns the passes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new D-finding array transfers to the caller; helper identity sets, population arrays and serialized payload text are temporary. Neither findings nor input/temporary bytes have a local cap here, and no filesystem, renderer, descriptor or running task is acquired.
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
