import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectEncodeId } from "./productionProjectEncodeId";
import { productionProjectAssertPhysicalDirectoryAncestors } from "./productionProjectAssertPhysicalDirectoryAncestors";
import { productionProjectResolveOwnedDirectory } from "./productionProjectResolveOwnedDirectory";

/**
 * Admit existing ancestors for a proposed production namespace without creating it.
 *
 * @evidence contracts/common.md#principled-implementation Encodes one id and checks shared design, production design/state and declared generated/render namespace ancestors with missing descendants permitted before registration creation proceeds.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the five supported namespace roots together while encoding, declared-root resolution and physical ancestor admission remain delegated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing descendants are accepted only for this creation preflight; existing symlink or out-of-root ancestors still refuse and no directory is created here.
 * @evidence contracts/common.md#meaningful-documentation Preflight admits currently existing ancestors for subsequent activation, not the permanence or atomic creation of the eventual namespace.
 * @evidence contracts/performance.md#efficient-algorithms Checks a fixed five paths with ancestry work proportional to their depths and id encoding proportional to id length; it reads no design/media records.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the encoded id within this preflight while resolving generated/render roots independently in original order; later creation performs its own physical checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path strings and ancestor observations are temporary, with no acquired descriptor, lock, directory ownership or running task to retain.
 */
export function productionProjectPreflightProductionNamespace(state: AutoMovieProductionProjectState, productionId: string): void {
    const segment: string = productionProjectEncodeId(productionId);
    for (const directory of [
        path.join(state.automovieRoot, "design", "shared"),
        path.join(state.automovieRoot, "design", segment),
        path.join(state.automovieRoot, "productions", segment),
        path.join(productionProjectResolveOwnedDirectory(state, state.manifest_.generatedRoot), segment),
        path.join(productionProjectResolveOwnedDirectory(state, state.manifest_.renderRoot), segment),
    ])
        productionProjectAssertPhysicalDirectoryAncestors(state.rootReal, directory, true);
}
