import { AutoMovieEngineMath } from "@automovie/engine";

/*
 * Draw a reproducible ordered subset without replacement for one proposal. The
 * declared seed, distinct model domain and trial number identify every sample
 * independently of previous invocations. Sampling models the entire
 * tentative-match population, with no location, object or expected-pose prior.
 */
export function sampleRecoveryCameraIndices(
  population: number,
  sampleSize: number,
  seed: number,
  domain: number,
  trial: number,
): number[] {
  if (
    population < sampleSize ||
    sampleSize < 1 ||
    seed < 0 ||
    seed > 0xffffffff ||
    trial < 0
  )
    throw new Error(
      "camera-sampling: admitted finite sample identity required",
    );
  const indices: number[] = Array.from(
    { length: population },
    (_: unknown, at: number): number => at,
  );
  for (let at: number = 0; at < sampleSize; at++) {
    const selected: number =
      at + Math.floor(AutoMovieEngineMath.seededValue(seed, domain, trial, at) * (population - at));
    const previous: number = indices[at]!;
    indices[at] = indices[selected]!;
    indices[selected] = previous;
  }
  return indices.slice(0, sampleSize);
}
