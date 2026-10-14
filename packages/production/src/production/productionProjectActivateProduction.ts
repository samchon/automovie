import { readAutoMovieProductionProjectJson as readOwnedJson } from "./readAutoMovieProductionProjectJson";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import { assertAutoMovieProductionProjectRegularFile as assertOwnedRegularFile } from "./assertAutoMovieProductionProjectRegularFile";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { planAutoMovieProductionRegistration } from "./planAutoMovieProductionRegistration";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionRegistry } from "./productionProjectValidateProductionRegistry";
import { productionProjectProductionIncarnationPathOf } from "./productionProjectProductionIncarnationPathOf";
import { productionProjectLegacyProductionId } from "./productionProjectLegacyProductionId";
import { productionProjectRemoveContendedAtomic } from "./productionProjectRemoveContendedAtomic";
import { productionProjectValidateIncarnation } from "./productionProjectValidateIncarnation";
import { productionProjectValidateProductionId } from "./productionProjectValidateProductionId";
import { productionProjectPortableProductionKey } from "./productionProjectPortableProductionKey";
import { productionProjectMkdirOwned } from "./productionProjectMkdirOwned";
import { productionProjectWriteOwnedJsonAtomic } from "./productionProjectWriteOwnedJsonAtomic";
import { productionProjectPreflightProductionNamespace } from "./productionProjectPreflightProductionNamespace";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";

/**
 * Register or adopt one production and its checkout-local incarnation during mutable open.
 *
 * @evidence contracts/common.md#principled-implementation Validated registry/legacy identity and portable ID checks precede namespace preflight; registration policy decides discard, registry publication and incarnation issue in that order.
 * @evidence contracts/common.md#clear-and-simple-design The planner owns registration policy while this operation performs guarded resident reads and writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reserved shared identity and legacy address refusal follow the supported namespace contract; writes are sequential and a later failure does not roll back every earlier publication.
 * @evidence contracts/common.md#meaningful-documentation Returns production ID, incarnation and whether the original registry required legacy migration; this is the mutable-open path.
 * @evidence contracts/performance.md#efficient-algorithms Includes registry/legacy parsing, ID scans, preflight ancestry checks, possible registry sorting/serialization and atomic writes; costs follow registry text, path depth and record bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing registered incarnation is adopted after admission; unchanged registry bytes are left alone, while new registration issues a fresh UUID.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Delegated readers/atomic writers release descriptors and temporary files; local records release, while the caller retains returned identity and partial published state can survive failure.
 */
export function productionProjectActivateProduction(state: AutoMovieProductionProjectState, requestedProductionId?: string): {
    incarnation: string;
    legacy: boolean;
    productionId: string;
} {
    const stored: unknown = readOwnedJson(state.rootReal, state.registryPath);
    const registry: { version: 1; layoutVersion: number; productions: string[]; } = stored === undefined
        ? {
            version: 1 as const,
            layoutVersion: 0,
            productions: [] as string[],
        }
        : productionProjectValidateProductionRegistry(stored, state.registryPath);
    const legacyId: string | null = productionProjectLegacyProductionId(state.rootReal, state.automovieRoot);
    let productionId: string | undefined = requestedProductionId;
    if (productionId !== undefined &&
        (productionId.trim().length === 0 || productionId.trim() !== productionId))
        throw new Error("Production id must be a trimmed non-empty stable id.");
    if (productionId !== undefined)
        productionProjectValidateProductionId(productionId);
    if (registry.layoutVersion === 0 &&
        legacyId !== null &&
        productionId !== undefined &&
        productionId !== legacyId)
        throw new Error(`Legacy production design declares id "${legacyId}", not requested production "${productionId}". Open "${legacyId}" once to migrate it, then register another production.`);
    if (productionId === undefined) {
        if (registry.productions.length === 1)
            productionId = registry.productions[0]!;
        else if (registry.productions.length > 1)
            throw new Error(`Project "${state.root}" contains ${registry.productions.length} productions. Configure the host with one productionId from: ${registry.productions.join(", ")}.`);
        else
            productionId = legacyId ?? state.manifest_.projectId;
    }
    productionProjectValidateProductionId(productionId);
    if (productionId.toLowerCase() === "shared")
        throw new Error('Production id "shared" is reserved for project-level design assets. Choose another stable id.');
    const productionKey: string = productionProjectPortableProductionKey(productionId);
    const collision: string | undefined = registry.productions.find((candidate: string): boolean => productionProjectPortableProductionKey(candidate) === productionKey &&
        candidate !== productionId);
    if (collision !== undefined)
        throw new Error(`Production id "${productionId}" collides with registered production "${collision}" on a case-insensitive filesystem. Choose one portable spelling.`);
    productionProjectPreflightProductionNamespace(state, productionId);
    // The preflight above fenced this production's state root, so the
    // incarnation record inside it is observed without following a link.
    const incarnationPath: string = productionProjectProductionIncarnationPathOf(state.automovieRoot, productionId);
    const plan: { publish: { version: 1; layoutVersion: number; productions: string[]; } | null; discard: boolean; issue: boolean; } = planAutoMovieProductionRegistration({
        registry: stored === undefined
            ? null
            : {
                productions: registry.productions,
                layoutVersion: registry.layoutVersion,
                retiredLineage: (stored as {
                    incarnations?: unknown;
                }).incarnations !==
                    undefined,
            },
        productionId,
        incarnationPresent: lstatOrNull(incarnationPath) !== null,
        mutable: true,
    });
    if (plan.discard) {
        productionProjectAssertProjectRootIdentity(state);
        assertOwnedRegularFile(state.rootReal, incarnationPath);
        productionProjectRemoveContendedAtomic(incarnationPath);
    }
    if (plan.publish !== null)
        productionProjectWriteOwnedJsonAtomic(state, state.registryPath, plan.publish);
    const incarnation: string = plan.issue
        ? randomUUID()
        : productionProjectValidateIncarnation(readOwnedJson(state.rootReal, incarnationPath), incarnationPath);
    if (plan.issue) {
        productionProjectMkdirOwned(state, path.dirname(incarnationPath));
        productionProjectWriteOwnedJsonAtomic(state, incarnationPath, {
            version: 1,
            id: incarnation,
        });
    }
    return {
        incarnation,
        legacy: registry.layoutVersion !== 1,
        productionId,
    };
}
