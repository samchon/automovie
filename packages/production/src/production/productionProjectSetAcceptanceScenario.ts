import type { IAutoMovieAcceptanceScenario, IAutoMovieDesignMutationOutput } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateAcceptanceScenario } from "./productionProjectValidateAcceptanceScenario";
import { productionProjectInputDesignId } from "./productionProjectInputDesignId";
import { productionProjectSetDesign } from "./productionProjectSetDesign";

/**
 * Upsert one selected-production acceptance scenario through schema and target semantic admission.
 *
 * @evidence contracts/common.md#principled-implementation ID projection and exact acceptance schema precede setDesign's portable collision and target graph checks; prior/replacement consequences include criterion-addressed shots, then accepted metadata commits under the originally observed revision.
 * @evidence contracts/common.md#clear-and-simple-design This entry owns acceptance target/schema selection; mutation accounting and byte publication stay with setDesign, while actual criterion measurement remains with acceptance/build review consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stored criterion is not a passing measurement and schema/target errors refuse without weakened expectations; dependent new errors become explicit staged-authoring warnings rather than hidden validation success.
 * @evidence contracts/common.md#meaningful-documentation States production-local scenario ownership, accepted/refused mutation output and delegated native/race errors; acceptance stores authored criteria and does not observe a render or execute an acceptance test.
 * @evidence contracts/performance.md#efficient-algorithms Includes exact criterion traversal, full graph/keyed reads and before/after semantic checks, criterion shot/review/sequence consequences, copied/sorted acceptance map and generated/screenplay observations, then serialized record hash and transaction staging.
 * @evidence contracts/performance.md#reuse-equivalent-work One input schema result and current graph serve admission and consequences, with the previous diagnostic Set distinguishing newly invalid dependents; past scenario IDs or measurement results are not reused as mutation authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed scenario, old/new graph shells, copied acceptance entries and criterion/consequence/diagnostic populations remain attempt-local without a fixed cap; staged current/prior bytes and lock/descriptor cleanup belong to transaction/read owners, while mutation output escapes.
 */
export function productionProjectSetAcceptanceScenario(state: AutoMovieProductionProjectState, design: IAutoMovieAcceptanceScenario): IAutoMovieDesignMutationOutput {
    return productionProjectSetDesign(state, { kind: "acceptance", id: productionProjectInputDesignId(design) }, design, productionProjectValidateAcceptanceScenario(design));
}
