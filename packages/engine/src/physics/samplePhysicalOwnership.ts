import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/** Resolve the last causal native authority change for one segment. Live caches and solver-free archives share this exact arbitrary-time selection; no authored clock reconstructs contact activation or return completion. */
export function samplePhysicalOwnership(
  events: readonly Cache.IOwnership[],
  duration: number,
  body: string,
  bone: string,
  seconds: number,
): Cache.IOwnership["kind"] {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration)
    throw new Error("Physics ownership read outside completed film");
  for (let index: number = events.length - 1; index >= 0; index--) {
    const entry: Cache.IOwnership = events[index]!;
    if (entry.body === body && entry.bone === bone && entry.seconds <= seconds)
      return entry.kind;
  }
  throw new Error(`Physics ownership segment missing: ${body}/${bone}`);
}
