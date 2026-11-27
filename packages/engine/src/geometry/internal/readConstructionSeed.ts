import type { IAutoMovieConstructionSeed } from "@automovie/interface";

// Historical serialized point seeds stored chart points as [station, phase].
export function readConstructionSeed(
  seed: IAutoMovieConstructionSeed,
): IAutoMovieConstructionSeed {
  if (seed.type !== "point") return seed;
  const part: unknown = seed.part;
  const host: unknown = seed.host;
  if (
    !Array.isArray(part) ||
    part.length !== 2 ||
    !Array.isArray(host) ||
    host.length !== 2
  )
    return seed;
  return {
    ...seed,
    part: { station: part[0], phase: part[1] },
    host: { station: host[0], phase: host[1] },
  };
}