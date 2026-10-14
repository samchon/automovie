import type { IAutoMovieDesignMutationOutput, IAutoMovieWorldDesign } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateWorldDesign } from "./productionProjectValidateWorldDesign";
import { productionProjectSetDesign } from "./productionProjectSetDesign";

/**
 * Upsert the project-shared world design through current graph admission and the existing shared mutation transaction.
 *
 * @evidence contracts/common.md#principled-implementation Exact world schema validation supplies setDesign's admission result; current graph/generated/screenplay observations and target semantic checks precede world replacement, while the shared transaction guards the originally observed revision.
 * @evidence contracts/common.md#clear-and-simple-design This entry owns world target/schema selection and delegates cross-record consequences, warning policy, fingerprint and atomic storage to setDesign instead of introducing a second world publication path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Schema and target errors yield refusal without a world write; dependent newly invalid artifacts remain explicit warnings for staged authoring, and neither default geometry nor an expected project world is substituted.
 * @evidence contracts/common.md#meaningful-documentation Defines shared world ownership and mutation accepted/refused output; acceptance updates the authored record rather than rendering a world or proving all downstream compilation prerequisites.
 * @evidence contracts/performance.md#efficient-algorithms Includes world schema traversal, complete graph/keyed-file load, before/after semantic graph checks, shot/review/sequence consequences and generated/screenplay reads, then world serialization/hash and transaction staging; shallow graph replacement does not eliminate full population work.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied schema result, one resident graph and previous diagnostic Set serve admission and downstream comparison; independent writes retain fresh revision/namespace observations rather than reusing earlier world success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input world is borrowed and old/new shallow graph shells share unchanged maps; graph records, consequences, diagnostics and staged world/prior bytes scale with actual populations without a fixed cap. Delegated readers/transaction own cleanup and mutation output transfers to the caller.
 */
export function productionProjectSetWorldDesign(state: AutoMovieProductionProjectState, design: IAutoMovieWorldDesign): IAutoMovieDesignMutationOutput {
    return productionProjectSetDesign(state, { kind: "world" }, design, productionProjectValidateWorldDesign(design));
}
