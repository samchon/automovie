import RAPIER, { type World } from "@dimforge/rapier3d-compat";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/**
 * Restore the complete native and causal prefix selected by sampled-input equivalence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Restore the complete native and causal prefix selected by sampled-input equivalence) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Restore the complete native and causal prefix selected by sampled-input equivalence) directly over its typed inputs (`input`, `previous`, `cache`, `start`, `diagnostics`) as 8 sequential passes (for-of over previous.cache.checkpoints; for-of over previous.cache.controllerCheckpoints; for-of over previous.cache.balanceCheckpoints), delegating to `RAPIER.World.restoreSnapshot`, `bytes.slice`, `structuredClone`, `Object.assign`, `Object.values`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 71 lines and 3 top-level statements that reuses `RAPIER.World.restoreSnapshot`, `bytes.slice`, `structuredClone`, `Object.assign`, `Object.values` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `previous`, `cache`, `start`, `diagnostics`; the dominant cost is 8 sequential passes (for-of over previous.cache.checkpoints; for-of over previous.cache.controllerCheckpoints; for-of over previous.cache.balanceCheckpoints), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function restorePhysicalSimulationCheckpoint(
  input: Simulation.IInput,
  previous: Simulation | undefined,
  cache: Cache,
  start: number,
  diagnostics: Simulation.IDiagnostic[],
): World {
  let world: World;
  if (start > 0 && previous) {
    world = RAPIER.World.restoreSnapshot(
      previous.cache.checkpoints.get(start)!,
    );
    cache.frames.push(...previous.cache.frames.slice(0, start + 1));
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
    cache.ownership.push(
      ...previous.cache.ownership.slice(0, control.ownershipCount ?? 0),
    );
    cache.supportWrenches.push(
      ...previous.cache.supportWrenches.filter(
        (entry: Cache.ISupportWrench): boolean =>
          entry.seconds <= start / input.rate,
      ),
    );
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
    diagnostics.push(
      ...structuredClone(
        previous.tracking.filter(
          (entry: (typeof previous.tracking)[number]): boolean =>
            entry.seconds <= start / input.rate,
        ),
      ),
    );
  } else {
    world = new RAPIER.World(input.gravity);
  }
  return world;
}
