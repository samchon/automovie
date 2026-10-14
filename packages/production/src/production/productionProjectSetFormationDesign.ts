import type { IAutoMovieDesignMutationOutput, IAutoMovieFormationDesign } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateFormationDesign } from "./productionProjectValidateFormationDesign";
import { productionProjectInputDesignId } from "./productionProjectInputDesignId";
import { productionProjectSetDesign } from "./productionProjectSetDesign";

/**
 * Upsert one shared formation while preserving formation-wide semantic refusal and staged dependent consequences.
 *
 * @evidence contracts/common.md#principled-implementation ID projection precedes exact formation schema validation; setDesign checks portable case collision and validates the replacement graph, treating both this target and formations-wide diagnostics as refusal before shared revision-guarded storage.
 * @evidence contracts/common.md#clear-and-simple-design Formation target/schema selection stays here and setDesign owns copied sorted membership, dependency consequences, downstream warnings and publication authority without another formation cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested count/layout is repaired to pass admission; target or formations-wide errors refuse, while newly invalid dependent artifacts are disclosed as warnings for subsequent author correction.
 * @evidence contracts/common.md#meaningful-documentation Defines project-shared formation mutation and the aggregate formations refusal scope, accepted/refused result and propagated transaction failures; it does not materialize instances or complete dependent source compilation.
 * @evidence contracts/performance.md#efficient-algorithms Includes formation schema traversal, all graph/keyed records and before/after semantic checks, affected participant/shot/sequence scans, copied/sorted formation map and generated/screenplay observations, plus serialized mutation hash/staging and current guards.
 * @evidence contracts/performance.md#reuse-equivalent-work The one schema result and resident graph supply replacement/admission, with previous diagnostic identity reused for downstream comparison; complete current population checks remain separate from prior formation-ID equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed formation and old/new graph shells coexist with copied formation-map entries and consequence/diagnostic populations; staged old/new record bytes remain transaction-local with no fixed population bound, and reader/lock cleanup stays with the owners.
 */
export function productionProjectSetFormationDesign(state: AutoMovieProductionProjectState, design: IAutoMovieFormationDesign): IAutoMovieDesignMutationOutput {
    return productionProjectSetDesign(state, { kind: "formation", id: productionProjectInputDesignId(design) }, design, productionProjectValidateFormationDesign(design));
}
