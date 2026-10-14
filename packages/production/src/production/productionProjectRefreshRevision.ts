import { readAutoMovieProductionProjectRevision as readRevision } from "./readAutoMovieProductionProjectRevision";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectAssertProjectRootIdentity } from "./productionProjectAssertProjectRootIdentity";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Recheck the opened namespace and store its current admitted revision.
 *
 * @evidence contracts/common.md#principled-implementation Preserves root check, incarnation check and revision read order, assigning lastReadRevision_ only after all admission completes; incarnation performs its own nested root/state/ancestry checks.
 * @evidence contracts/common.md#clear-and-simple-design Owns the common read-refresh sequence while physical identity and safe-integer decoding remain with their dedicated operations/helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching revision cannot bypass namespace checks, and any refusal leaves the previous scalar observation unchanged rather than coercing a new generation.
 * @evidence contracts/common.md#meaningful-documentation Updates an optimistic read observation rather than holding a lock or guaranteeing future file stability; repeated nested checks preserve prior failure ordering.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes root stats, registry/incarnation JSON acquisition, R-registration sorting, K retired-key linear membership scans, namespace ancestry rechecks and the revision read; record bytes and directory component counts also drive work.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses opening identity expectations but reobserves resident directories and JSON on every refresh; no watcher or equal generation is treated as proof of byte equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replaces one retained revision number; temporary parsed records expire, delegated readers attempt descriptor cleanup and propagate close failures, and no lock is held across subsequent calls.
 */
export function productionProjectRefreshRevision(state: AutoMovieProductionProjectState): void {
    productionProjectAssertProjectRootIdentity(state);
    productionProjectAssertIncarnation(state);
    state.lastReadRevision_ = readRevision(state.rootReal, state.revisionPath);
}
