import { readAutoMovieProductionProjectTypedJson as readOwnedTypedJson } from "./readAutoMovieProductionProjectTypedJson";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieScreenplayIndex } from "@automovie/interface";
import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateScreenplayIndex } from "./productionProjectValidateScreenplayIndex";
import { productionProjectOwnedRootReal } from "./productionProjectOwnedRootReal";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Load the selected production's optional screenplay index after current-incarnation admission.
 *
 * @evidence contracts/common.md#principled-implementation Incarnation admission precedes screenplay/index.json observation; initial absence returns null, otherwise a physical state-root and exact-schema guarded JSON read admit the resident index.
 * @evidence contracts/common.md#clear-and-simple-design The loader owns index location and schema while screenplay/build consumers own document interpretation and the public facade owns revision refresh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unsafe or malformed present index is not converted into an empty screenplay population; a disappearance during the guarded JSON read retains that reader's existing absence/error semantics.
 * @evidence contracts/common.md#meaningful-documentation States selected-production location, optional absence and current-incarnation/schema refusal; referenced prose is not read or judged by this loader.
 * @evidence contracts/performance.md#efficient-algorithms Work includes registry/ancestry incarnation admission, initial lstat and B-byte index parse/schema traversal across its entry population; referenced document bytes are outside this operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current incarnation and resident index are reobserved rather than assuming an earlier path or revision result proves identical bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded readers close their descriptors; transient registry/index buffers expire or transfer as admitted records, without a persistent document cache or running task.
 */
export function productionProjectLoadScreenplayIndex(state: AutoMovieProductionProjectState): IAutoMovieScreenplayIndex | null {
    productionProjectAssertIncarnation(state);
    const file: string = path.join(state.productionDesignRoot, "screenplay/index.json");
    if (lstatOrNull(file) === null)
        return null;
    return readOwnedTypedJson(productionProjectOwnedRootReal(state.rootReal, state.automovieRoot), file, productionProjectValidateScreenplayIndex);
}
