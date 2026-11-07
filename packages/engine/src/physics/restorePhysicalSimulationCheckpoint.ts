import RAPIER, { type World } from "@dimforge/rapier3d-compat";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/** Restore the complete native and causal prefix selected by sampled-input equivalence. */
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
