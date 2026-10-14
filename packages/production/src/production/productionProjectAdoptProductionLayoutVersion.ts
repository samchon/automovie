import type { IAutoMovieProductionProjectProductionRegistry } from "./IAutoMovieProductionProjectProductionRegistry";
import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectWriteOwnedJsonAtomic } from "./productionProjectWriteOwnedJsonAtomic";

/**
 * Mark a physically migrated registry as using production-scoped layout version one.
 *
 * @evidence contracts/common.md#principled-implementation Reads and validates the current registry before assigning layoutVersion 1 and publishing it through the owned atomic JSON writer; migration chooses when this final adoption occurs.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the final registry version transition, keeping migration directory moves and fencing with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer migration success from the version number or repair an invalid registry; read and publication failures propagate with their original effects.
 * @evidence contracts/common.md#meaningful-documentation Version one records completed production-scoped migration, and this operation alone cannot prove the preceding move sequence completed.
 * @evidence contracts/performance.md#efficient-algorithms Includes full registry read/parse/validation and serialization/write plus physical writer fences, with registry bytes and entry count dominating work.
 * @evidence contracts/performance.md#reuse-equivalent-work Preserves current validated registry fields when changing its version; it reacquires rather than writing an opening-time registry that could erase newer registrations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed registry data and serialization buffers are local, delegated atomic cleanup owns temporary files, and a successful version record remains repository-owned.
 */
export function productionProjectAdoptProductionLayoutVersion(state: AutoMovieProductionProjectState): void {
    const registry: IAutoMovieProductionProjectProductionRegistry = productionProjectValidateProductionRegistry(readOwnedJson(state.rootReal, state.registryPath), state.registryPath);
    registry.layoutVersion = 1;
    productionProjectWriteOwnedJsonAtomic(state, state.registryPath, registry);
}
