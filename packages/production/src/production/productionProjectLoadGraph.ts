import { readAutoMovieProductionProjectTypedJson as readOwnedTypedJson } from "./readAutoMovieProductionProjectTypedJson";
import path from "node:path";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionDesign } from "./productionProjectValidateProductionDesign";
import { productionProjectValidateModelRecipe } from "./productionProjectValidateModelRecipe";
import { productionProjectValidateWorldDesign } from "./productionProjectValidateWorldDesign";
import { productionProjectValidateFormationDesign } from "./productionProjectValidateFormationDesign";
import { productionProjectValidateShotContract } from "./productionProjectValidateShotContract";
import { productionProjectValidateAcceptanceScenario } from "./productionProjectValidateAcceptanceScenario";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectDesignPath } from "./productionProjectDesignPath";
import { productionProjectReadKeyedDesigns } from "./productionProjectReadKeyedDesigns";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Read the current shared and active-production design graph through exact schema admission.
 *
 * @evidence contracts/common.md#principled-implementation Root identity and physical automovie ownership precede ordered typed reads; absent singleton records become null, while malformed or disappearing keyed records refuse.
 * @evidence contracts/common.md#clear-and-simple-design Schema-specific readers feed one graph; dependency validity and publication are separate operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unreadable record becomes an empty admitted design, and canonical filename/ID collisions are delegated to keyed readers.
 * @evidence contracts/common.md#meaningful-documentation Returns freshly parsed records and ordered maps; schema admission alone does not settle cross-design correctness.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses all selected design bytes and sorts keyed directory candidates; existing keyed-ID collision scans can cost O(F squared), plus path/descriptor admission and validator work.
 * @evidence contracts/performance.md#reuse-equivalent-work No graph persists between calls; each load reobserves records and physical ancestry rather than trusting cached paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned readers close descriptors; parsed values/maps transfer to the caller and no lock, task or fixed graph-size bound is added.
 */
export function productionProjectLoadGraph(state: AutoMovieProductionProjectState): IAutoMovieProductionDesignGraph {
    productionProjectAssertProjectRootIdentity(state);
    const stateRootReal: string = productionProjectOwnedRootReal(state.rootReal, state.automovieRoot);
    return {
        production: readOwnedTypedJson(stateRootReal, productionProjectDesignPath(state, { kind: "production" }), productionProjectValidateProductionDesign),
        models: productionProjectReadKeyedDesigns(state, path.join(state.sharedDesignRoot, "models"), productionProjectValidateModelRecipe),
        world: readOwnedTypedJson(stateRootReal, productionProjectDesignPath(state, { kind: "world" }), productionProjectValidateWorldDesign),
        formations: productionProjectReadKeyedDesigns(state, path.join(state.sharedDesignRoot, "formations"), productionProjectValidateFormationDesign),
        shots: productionProjectReadKeyedDesigns(state, path.join(state.productionDesignRoot, "shots"), productionProjectValidateShotContract),
        acceptance: productionProjectReadKeyedDesigns(state, path.join(state.productionDesignRoot, "acceptance"), productionProjectValidateAcceptanceScenario),
    };
}
