import type { IAutoMovieFlameCue } from "@automovie/interface";

import { sampleAutoMovieFlame } from "./sampleAutoMovieFlame";

/** Keys per second of a flame-bound light's intensity track. */
const KEY_RATE: number = 120;

/**
 * The key grid and silhouette areas a flame cue's bound light flickers by.
 *
 * Keys fall at every multiple of 1/120 s in [0, duration], plus the duration
 * and the cue's `on` start and end, merged where they coincide. The grid does
 * not depend on the render's frame rate; 1/120 s divides the frame period of
 * 12, 24, 30 and 60 fps, and gives at least 16 keys per flicker period up to
 * 7.5 Hz, the limit flame admission enforces. `areas[i]` is the flame's
 * silhouette area at `times[i]` from `sampleAutoMovieFlame`. `mean` is Ā, the
 * mean area over the keys inside `on`, or over every key when `on` is omitted;
 * a light whose key inside `on` holds `I_on · A / Ā` therefore averages exactly
 * `I_on` over those keys, and the flame's luminance is `I_on / Ā` in cd/m².
 */
export function compileAutoMovieFlameFlicker(
  cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size" | "on">,
  duration: number,
): {
  /** Strictly increasing key times, seconds. */
  times: number[];

  /** Silhouette area at each key, square metres. */
  areas: number[];

  /** Whether each key lies inside the cue's `[start, end)` interval. */
  inside: boolean[];

  /** Mean area over the keys inside the interval, square metres. */
  mean: number;
} {
  const count: number = Math.floor(duration * KEY_RATE + 1e-9);
  const set: Set<number> = new Set([duration, ...(cue.on ?? [])]);
  for (let k: number = 0; k <= count; ++k) set.add(k / KEY_RATE);
  const times: number[] = [...set]
    .filter((time: number): boolean => time >= 0 && time <= duration)
    .sort((a: number, b: number): number => a - b);
  const areas: number[] = times.map(
    (time: number): number => sampleAutoMovieFlame(cue, time).area,
  );
  const inside: boolean[] = times.map((time: number): boolean =>
    cue.on === undefined ? true : cue.on[0] <= time && time < cue.on[1],
  );
  let sum: number = 0;
  let keys: number = 0;
  areas.forEach((area: number, index: number): void => {
    if (!inside[index]) return;
    sum += area;
    keys += 1;
  });
  return { times, areas, inside, mean: sum / keys };
}
