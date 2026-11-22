import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicsCache,
} from "@automovie/interface";

import { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";

/**
 * Restore the complete solver and causal prefix selected by sampled-input equivalence.
 *
 * The caller selects an equivalent completed cached interval and supplies empty
 * destination collections. Frames and completed receipts remain borrowed;
 * snapshot bytes, controller state and diagnostics are copied. A copy failure
 * leaves a partial destination that the failed run must discard, but builds no world. A successful return hands the caller its world.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States checkpoint selection, interval indexing, borrowed versus copied records, partial destination failure and the returned world.
 * @evidence contracts/development/implementation.md#principled-implementation Restores every causal ledger through the selected interval and trims active contact sample prefixes to the controller checkpoint, preventing future samples from entering resumed history.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prefix copying precedes the final world restore; a fresh run returns a new world directly. Each ledger has one ordered pass.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts checkpointPhysicalSimulation establishes matching snapshot/controller entries and valid prefix counts before this helper. Elementwise append has no JavaScript call-argument limit; the helper does not silently truncate admitted history.
 * @evidence contracts/development/implementation.md#efficient-algorithms Work is linear in visited frame and ledger populations plus copied byte/state size. Active episodes use a Map for constant-time expected receipt lookup rather than pairwise matching.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the selected world snapshot and causal prefix instead of rerunning those simulation steps; selection and sampled-input equivalence belong to checkpointPhysicalSimulation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All fallible copies finish before the world is built, and the returned world belongs to the run; copied state remains in the supplied cache and diagnostic arrays for that run's lifetime.
 */
export function restorePhysicalSimulationCheckpoint(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  previous: IAutoMoviePhysicalSimulation | undefined,
  cache: IAutoMoviePhysicsCache,
  start: number,
  diagnostics: IAutoMoviePhysicalSimulationInput.IDiagnostic[],
): AutoMovieXpbdWorld {
  if (start > 0 && previous) {
    for (let index: number = 0; index <= start; index++)
      cache.frames.push(previous.cache.frames[index]!);
    for (const [step, bytes] of previous.cache.checkpoints)
      if (step <= start) cache.checkpoints.set(step, bytes.slice());
    for (const [step, state] of previous.cache.controllerCheckpoints)
      if (step <= start)
        cache.controllerCheckpoints.set(step, structuredClone(state));
    for (const [step, state] of previous.cache.balanceCheckpoints)
      if (step <= start)
        cache.balanceCheckpoints.set(step, structuredClone(state));
    Object.assign(
      cache.recovery,
      structuredClone(previous.cache.balanceCheckpoints.get(start) ?? {}),
    );
    for (const state of Object.values(cache.recovery))
      state.offsets = Object.assign(Object.create(null), state.offsets);
    const control: NonNullable<
      ReturnType<typeof cache.controllerCheckpoints.get>
    > = previous.cache.controllerCheckpoints.get(start)!;
    for (let index: number = 0; index < (control.ownershipCount ?? 0); index++)
      cache.ownership.push(previous.cache.ownership[index]!);
    for (const entry of previous.cache.supportWrenches)
      if (entry.seconds <= start / input.rate)
        cache.supportWrenches.push(entry);
    const episodes: Map<string, (typeof control.episodes)[number]> = new Map(
      control.episodes.map(
        (
          episode: (typeof control.episodes)[number],
        ): [string, (typeof control.episodes)[number]] => [
          episode.receipt.id,
          episode,
        ],
      ),
    );
    for (const receipt of previous.cache.contacts.slice(
      0,
      control.contactCount,
    )) {
      const episode: (typeof control.episodes)[number] | undefined =
        episodes.get(receipt.id);
      cache.contacts.push(
        episode
          ? {
              ...structuredClone(episode.receipt),
              samples: receipt.samples!.slice(0, episode.sampleCount),
            }
          : receipt,
      );
    }
    for (const entry of previous.tracking)
      if (entry.seconds <= start / input.rate)
        diagnostics.push(structuredClone(entry));

    // Finish every fallible prefix copy before building the world.
    // The caller receives sole disposal ownership immediately on return.
    return AutoMovieXpbdWorld.restoreSnapshot(
      previous.cache.checkpoints.get(start)!,
    );
  }
  return new AutoMovieXpbdWorld(input.gravity);
}
