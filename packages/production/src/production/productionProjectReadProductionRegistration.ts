import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { planAutoMovieProductionRegistration } from "./planAutoMovieProductionRegistration";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectProductionIncarnationPathOf } from "./productionProjectProductionIncarnationPathOf";
import { productionProjectValidateIncarnation } from "./productionProjectValidateIncarnation";
import { productionProjectValidateProductionId } from "./productionProjectValidateProductionId";

/**
 * Select an existing production registration and this checkout's incarnation without writing either record.
 *
 * @evidence contracts/common.md#principled-implementation Guarded JSON and registry validation precede selection; omitted selection requires exactly one registered ID, layout must already be version 1, and the read-only registration plan refuses an unregistered or uninitialized namespace before its incarnation is admitted.
 * @evidence contracts/common.md#clear-and-simple-design The constructor delegates read-only namespace selection here, while the existing registration planner owns the shared registered/incarnation policy and mutable activation remains separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reserved shared ID refuses and an unregistered ID's incarnation is never read; this path creates no directory, migration, registry entry or replacement UUID.
 * @evidence contracts/common.md#meaningful-documentation Defines explicit versus singleton selection, layout refusal, checkout-local incarnation and the legacy:false result; native JSON/schema errors propagate.
 * @evidence contracts/performance.md#efficient-algorithms Registry reading/parsing scales with record bytes, validation sorts R registrations in O(R log R), and each of K retired inline incarnation keys searches the R registrations; selection adds linear membership searches and reads only the selected incarnation record.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registry and incarnation bytes are observed afresh; a prior ID or registration success cannot establish the current checkout generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Guarded readers own descriptor cleanup; local registry data and path strings expire after return/refusal, and the selected three-field result transfers to the constructor without retained tasks.
 */
export function productionProjectReadProductionRegistration(state: AutoMovieProductionProjectState, requestedProductionId?: string): {
    incarnation: string;
    legacy: false;
    productionId: string;
} {
    const stored: unknown = readOwnedJson(state.rootReal, state.registryPath);
    const registry: ReturnType<typeof productionProjectValidateProductionRegistry> = productionProjectValidateProductionRegistry(stored, state.registryPath);
    if (registry.layoutVersion !== 1)
        throw new Error(`Read-only verification cannot migrate legacy production layout "${state.registryPath}". Open this production with AutoMovieProductionProject.open(rootDirectory, productionId) before verifying.`);
    let productionId: string | undefined = requestedProductionId;
    if (productionId === undefined) {
        if (registry.productions.length !== 1)
            throw new Error(`Read-only verification requires one productionId; registered productions: ${registry.productions.join(", ") || "<none>"}.`);
        productionId = registry.productions[0]!;
    }
    productionProjectValidateProductionId(productionId);
    if (productionId.toLowerCase() === "shared")
        throw new Error('Production id "shared" is reserved for project-level design assets.');
    const incarnationPath: string = productionProjectProductionIncarnationPathOf(state.automovieRoot, productionId);
    // An unregistered id is refused before its state root is read, so a
    // damaged record an ended namespace left cannot mask that refusal.
    const incarnation: unknown = registry.productions.includes(productionId)
        ? readOwnedJson(state.rootReal, incarnationPath)
        : undefined;
    planAutoMovieProductionRegistration({
        registry: {
            productions: registry.productions,
            layoutVersion: registry.layoutVersion,
            retiredLineage: (stored as {
                incarnations?: unknown;
            }).incarnations !== undefined,
        },
        productionId,
        incarnationPresent: incarnation !== undefined,
        mutable: false,
    });
    return {
        incarnation: productionProjectValidateIncarnation(incarnation, incarnationPath),
        legacy: false,
        productionId,
    };
}
