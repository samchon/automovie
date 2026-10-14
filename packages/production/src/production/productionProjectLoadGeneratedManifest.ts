import { readAutoMovieProductionProjectTypedJson as readOwnedTypedJson } from "./readAutoMovieProductionProjectTypedJson";
import type { IAutoMovieGeneratedManifest } from "@automovie/interface";
import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateGeneratedManifest } from "./productionProjectValidateGeneratedManifest";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Load the selected production's optional generated ownership manifest through its exact schema.
 *
 * @evidence contracts/common.md#principled-implementation Project-root identity admission precedes physical AutoMovie-root observation and the guarded typed JSON read of generated-manifest.json; absent JSON yields null and malformed or unsafe residents throw.
 * @evidence contracts/common.md#clear-and-simple-design This loader owns the manifest location/schema composition while callers own revision refresh, generated-currentness and publication decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No absent or invalid manifest is fabricated and no cache supplies an earlier schema result; root identity success alone is not claimed to prove current generated output.
 * @evidence contracts/common.md#meaningful-documentation Defines the selected manifest, null absence and propagated native/schema refusal, with revision and output verification left to its consumers.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes root and owned-directory checks plus B-byte parsing/schema traversal over the manifest's F file records; no generated payload file is read here.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each load reads current resident manifest bytes; unchanged pathname or a previously valid manifest does not establish current ownership content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded JSON readers own descriptor cleanup and temporary byte data; admitted manifest records transfer to the caller with no retained loader cache or task.
 */
export function productionProjectLoadGeneratedManifest(state: AutoMovieProductionProjectState): IAutoMovieGeneratedManifest | null {
    productionProjectAssertProjectRootIdentity(state);
    return readOwnedTypedJson(productionProjectOwnedRootReal(state.rootReal, state.automovieRoot), path.join(state.productionStateRoot, "generated-manifest.json"), productionProjectValidateGeneratedManifest);
}
