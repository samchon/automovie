import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Resolve the selected production's absolute generated-output root under the current project generation.
 *
 * @evidence contracts/common.md#principled-implementation Complete incarnation/namespace admission precedes configured generated-root project/ancestor fencing and portable production-segment containment; resolution preserves a missing tail rather than creating a directory.
 * @evidence contracts/common.md#clear-and-simple-design This address owner supplies the same selected root to generated readers and publication transactions, leaving resident file and payload admission with those consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale namespace or escaping configured ancestor receives a fallback root; this composition does not independently assert final generated-root existence or directory kind beyond its delegated observations.
 * @evidence contracts/common.md#meaningful-documentation States absolute selected-production address, missing-tail semantics and generation/containment refusal; no generated file is read or published by resolving the root.
 * @evidence contracts/performance.md#efficient-algorithms Includes full registry/incarnation validation and captured ancestry fences, then configured-root nearest-ancestor/path work; the fixed path composition reads no generated payload population.
 * @evidence contracts/performance.md#reuse-equivalent-work The constructor's production segment and expected identities are reused as operands, while current registry and physical observations are reacquired instead of caching an output-root verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary registry records and path/stat data are local and readers own descriptor cleanup; only the absolute root string transfers, without a retained output inventory or task.
 */
export function productionProjectGeneratedRoot(state: AutoMovieProductionProjectState): string {
    productionProjectAssertIncarnation(state);
    return resolveInside(productionProjectResolveOwnedDirectory(state, state.manifest_.generatedRoot), state.productionSegment);
}
