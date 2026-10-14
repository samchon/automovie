import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRefreshRevision } from "./productionProjectRefreshRevision";

/**
 * Refresh and return the resident optimistic revision generation.
 *
 * @evidence contracts/common.md#principled-implementation Uses the same namespace and revision decoder as commits before returning the stored safe integer; a missing admitted revision keeps the decoder's initial-zero policy.
 * @evidence contracts/common.md#clear-and-simple-design Adds only the public number projection to refresh, leaving malformed/exhausted generation policy with the shared revision owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never increments or coerces a generation during a read, and deleted or replaced namespace errors propagate.
 * @evidence contracts/common.md#meaningful-documentation The result is one resident observation used for optimistic comparison, not a lease guaranteeing that later content remains unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Refresh includes physical ancestry checks, incarnation/registry byte reads and parsing, R-registration sorting, K retired-key linear membership scans and revision record decoding; no generated, design or media population is scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work Updates this instance's lastReadRevision_ but reacquires its source on every call instead of trusting a previously matching number.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one scalar in state; delegated readers attempt descriptor cleanup and propagate close failures, while temporary records expire and no task survives.
 */
export function productionProjectRevision(state: AutoMovieProductionProjectState): number {
    productionProjectRefreshRevision(state);
    return state.lastReadRevision_;
}
