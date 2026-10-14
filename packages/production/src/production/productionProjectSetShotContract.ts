import type { IAutoMovieDesignMutationOutput, IAutoMovieShotContract } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateShotContract } from "./productionProjectValidateShotContract";
import { productionProjectInputDesignId } from "./productionProjectInputDesignId";
import { productionProjectSetDesign } from "./productionProjectSetDesign";

/**
 * Upsert one selected-production shot contract without executing its bound source module.
 *
 * @evidence contracts/common.md#principled-implementation ID projection precedes exact shot schema validation, then setDesign admits portable membership and target graph semantics against current resident designs; accepted replacement uses the selected shot path and original revision fence.
 * @evidence contracts/common.md#clear-and-simple-design This shot entry supplies only target/schema, leaving source execution with build owners and mutation consequences, warnings, fingerprint and atomic storage with setDesign.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid shot metadata or target semantic errors refuse without coercion; newly invalid dependent acceptance/source/review state is reported for staged correction rather than silently compiled or repaired.
 * @evidence contracts/common.md#meaningful-documentation Defines production-local shot ownership, structured mutation acceptance/refusal and propagated resident/transaction errors; acceptance stores a contract but does not certify its module or rendered pixels.
 * @evidence contracts/performance.md#efficient-algorithms Includes exact shot traversal, full graph load/keyed case scans, before/after graph admission and affected acceptance/source/sequence consequences, copied/sorted shot map and generated/screenplay reads, then serialization/hash and staged old/new bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One schema result, resident graph and prior diagnostic identities feed the attempted mutation; source module cache or an unchanged shot ID does not replace fresh resident/revision admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input contract is borrowed while old/new graph shells and copied shot-map entries, diagnostic/consequence arrays and staged record bytes remain local with no fixed cap; owners release reader descriptors and transaction locks and only mutation output transfers.
 */
export function productionProjectSetShotContract(state: AutoMovieProductionProjectState, design: IAutoMovieShotContract): IAutoMovieDesignMutationOutput {
    return productionProjectSetDesign(state, { kind: "shot", id: productionProjectInputDesignId(design) }, design, productionProjectValidateShotContract(design));
}
