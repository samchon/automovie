import type { IAutoMovieProductionProjectProductionRegistry } from "./IAutoMovieProductionProjectProductionRegistry";
import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectProductionIncarnationPathOf } from "./productionProjectProductionIncarnationPathOf";
import { productionProjectValidateIncarnation } from "./productionProjectValidateIncarnation";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";
import { productionProjectAssertProductionNamespaceIdentities } from "./productionProjectAssertProductionNamespaceIdentities";
import { productionProjectAssertStateRootIdentity } from "./productionProjectAssertStateRootIdentity";

/**
 * Refuse a handle whose physical roots, logical state/production generation or captured namespace changed.
 *
 * @evidence contracts/common.md#principled-implementation Project and state-root identity checks precede project incarnation JSON admission, a repeated state-root check, registry admission and selected production incarnation equality; captured namespace ancestries are checked last, retaining the original observation/refusal order.
 * @evidence contracts/common.md#clear-and-simple-design This shared generation guard composes independent physical identity, project-wide incarnation, registered production incarnation and namespace ancestry owners; a same-ID deletion/recreation cannot rebind the old handle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unregistered production's incarnation is not read, matching registry text cannot bypass its separate UUID, and no replacement identity or successful prior read silently resets constructor expectations.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered physical/logical generation refusal and reopen correction; sequential resident observations are not an atomic lock or guarantee that later bytes remain unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Includes physical root stats, project/production incarnation and registry byte parsing, registry R-registration sorting and K retired-key linear membership scans, selected-ID membership and all captured namespace directory components; it does not enumerate payload files.
 * @evidence contracts/performance.md#reuse-equivalent-work Constructor generations and ancestry snapshots remain expected operands for every consumer; resident registry/UUID/physical facts are freshly observed, because same path/production ID alone cannot prove the namespace remained current.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The handle retains its original identity snapshots; temporary parsed records and stat values expire after admission/refusal, delegated readers own descriptor cleanup and no lock, cached success or running task is retained here.
 */
export function productionProjectAssertIncarnation(state: AutoMovieProductionProjectState): void {
    productionProjectAssertProjectRootIdentity(state);
    productionProjectAssertStateRootIdentity(state);
    const current: string = productionProjectValidateIncarnation(readOwnedJson(state.rootReal, state.incarnationPath), state.incarnationPath);
    productionProjectAssertStateRootIdentity(state);
    if (current !== state.incarnation_)
        throw new AutoMovieProductionInputRaceError("Production state incarnation changed. Discard this project handle and open the project again before reading or mutating it.");
    const registry: IAutoMovieProductionProjectProductionRegistry = productionProjectValidateProductionRegistry(readOwnedJson(state.rootReal, state.registryPath), state.registryPath);
    const productionIncarnationPath: string = productionProjectProductionIncarnationPathOf(state.automovieRoot, state.productionId);
    const productionIncarnation: unknown = registry.productions.includes(state.productionId)
        ? readOwnedJson(state.rootReal, productionIncarnationPath)
        : undefined;
    if (productionIncarnation === undefined ||
        productionProjectValidateIncarnation(productionIncarnation, productionIncarnationPath) !==
            state.productionIncarnation_)
        throw new AutoMovieProductionInputRaceError(`Production "${state.productionId}" was deleted or recreated. Discard this stale handle and open the current production namespace before reading or mutating it.`);
    productionProjectAssertProductionNamespaceIdentities(state);
}
