import {
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  seededSmoothNoise,
  warpRoot,
} from "@automovie/engine";
import type {
  IAutoMovieRandom,
  IAutoMovieTransform,
  IAutoMovieWarpRoot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Windowed noise vanishes smoothly at its window's ends and repeats from its
 * seed; a root warp reaches its displacement at its event without a jump.
 *
 * Scenarios:
 * 1. Noise from a stream keyed by (film seed, subject, channel) is zero at
 *    u = 0 and u = 1, and its first and second finite differences shrink to
 *    zero there faster than the step (the window's derivatives vanish).
 * 2. The same stream gives the same value twice; another channel's stream
 *    gives a different signal; the signal stays within [-sqrt(4), sqrt(4)].
 * 3. A warp of (0.3, 0, -0.2) m and 30° over [0.5, 1.5] s leaves the root
 *    untouched before 0.5 s, reaches the full displacement and turn at 1.5 s
 *    and after, and has zero rate at both window ends.
 * 4. A window that does not move forward throws.
 * 5. An owned pure indexed spectrum gives four literal sine terms under
 *    256u^4(1-u)^4. Preparation draws nothing at construction or outside its
 *    open window; its first interior read draws indices0..7 once, then
 *    arbitrary query order evaluates the same analytic function.
 * 6. Invalid fixed parameters refuse on the first read, including an
 *    endpoint, before any draw. A one-term reader retains its own spectrum.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates public direct/prepared noise and warp. Literal sinusoidal values and owned draw traces catch stale time answers, missing terms, changed draw order, eager draws or invalid first-read admission alongside stream identity and warp continuity.
 * @evidence contracts/development/testing.md#independent-expectations The window256u^4(1-u)^4 has fourth-order zeros, and four unit sines divided by2 are bounded by2. Literal alternating draws0,1/8,1/4,3/8,1/2,5/8,3/4,7/8 at2Hz and1.25s give phase/pi pairs(1.5u+.25),(2.375u+.75),(3.25u+1.25),(4.125u+1.75). This equation, with1e-12 scalar roundoff, supplies prepared/direct expectations independently of their common implementation. Warp endpoints are the declared displacement.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both ends/outside/NaN, interior reverse and repeated seeks, literal four-term versus singleton spectra, no-draw inactive times, required first ordered draws, first-read invalid duration/frequency/count, equal/different streams and warp boundary/refusal. It adds no noise-result cache or new public API.
 * @evidence contracts/development/testing.md#execution-ownership A pure discoverable in-memory unit owns the indexed stream adapter and its callback trace; it replaces no foreign random function/global, starts no host/compiler and runs through the existing feature harness.
 * @evidence contracts/development/common.md#meaningful-documentation Lists six scenarios, the independent frequency/phase/window equation, lazy admission/draw semantics and the distinction between reusable coefficients and current output.
 */
export function test_motion_noise_warp(): void {
  const seed: string = deriveAutoMovieSeed("film", "a", "jab", "path");
  const a: IAutoMovieRandom = createAutoMovieRandom(seed);
  const n: (u: number) => number = (u: number): number => seededSmoothNoise(a, u, 0.8, 3);
  TestValidator.predicate("zero at ends", n(0) === 0 && n(1) === 0);
  for (const h of [1e-2, 1e-3]) {
    const near: number = Math.max(Math.abs(n(h)), Math.abs(n(1 - h)));
    TestValidator.predicate(
      `fourth-order zero at the ends (${h})`,
      near <= 2 * 256 * h ** 4,
    );
  }
  TestValidator.predicate("repeatable", nclose(n(0.37), n(0.37), 1e-12));
  const other: IAutoMovieRandom = createAutoMovieRandom(
    deriveAutoMovieSeed("film", "a", "jab", "guard"),
  );
  TestValidator.predicate(
    "other channel differs",
    seededSmoothNoise(other, 0.37, 0.8, 3) !== n(0.37),
  );
  let bounded: boolean = true;
  for (let u: number = 0; u <= 1; u += 0.001)
    if (Math.abs(n(u)) > 2 + 1e-12) bounded = false;
  TestValidator.predicate("bounded", bounded);

  const draws: number[] = [];
  const indexed: IAutoMovieRandom = {
    ...a,
    float: (index: number): number => { draws.push(index); return (index % 8) / 8; },
  };
  const prepared: (u: number) => number = seededSmoothNoise.prepare(indexed, 1.25, 2);
  TestValidator.equals("spectrum construction performs no indexed draw", draws, []);
  for (const u of [-1, -0, 0, 1, 2, NaN])
    TestValidator.predicate("outside the open window needs no spectrum", nclose(prepared(u), 0, 0));
  TestValidator.equals("inactive time reads perform no indexed draw", draws, []);
  for (const u of [0.83, 0.11, 0.5, 0.83, 0.37])
    TestValidator.predicate(`prepared spectrum evaluates all literal terms at u=${u}`,
      nclose(prepared(u), literalNoise(u), 1e-12),
    );
  TestValidator.equals("fixed pure spectrum draws each required index once in authored order", draws, [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const u of [0.11, 0.83])
    TestValidator.predicate("direct noise retains the same independent four-term equation",
      nclose(seededSmoothNoise(indexed, u, 1.25, 2), literalNoise(u), 1e-12),
    );
  TestValidator.equals("ordinary entry still performs each current set of draws",
    draws.slice(8), [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7],
  );
  draws.length = 0;
  for (const [duration, frequency, terms] of [[0, 2, 4], [1, -2, 4], [1, 2, 0], [1, 2, 1.5]] as const) {
    const invalid: (u: number) => number = seededSmoothNoise.prepare(indexed, duration, frequency, terms);
    TestValidator.predicate("fixed invalid parameters refuse at the first endpoint read",
      throwsError((): number => invalid(0), "positive duration, frequency and term count"),
    );
  }
  TestValidator.equals("invalid admission never consumes the source spectrum", draws, []);
  const singleton: (u: number) => number = seededSmoothNoise.prepare(indexed, 1.25, 2, 1);
  for (const u of [0.19, 0.72, 0.19])
    TestValidator.predicate("a separate singleton reader retains its own exact sine and window",
      nclose(singleton(u), 256 * u ** 4 * (1 - u) ** 4 * Math.sin(Math.PI * (1.5 * u + 0.25)), 1e-12),
    );
  TestValidator.equals("singleton preparation consumes only its own two declared indices", draws, [0, 1]);

  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const warp: IAutoMovieWarpRoot.IWarp = {
    translation: { x: 0.3, y: 0, z: -0.2 },
    yaw: 30,
    start: 0.5,
    end: 1.5,
  };
  const at: (s: number) => IAutoMovieTransform = (s: number): IAutoMovieTransform => warpRoot(root, warp, s);
  TestValidator.predicate(
    "before untouched",
    at(0.2).translation.x === 1 && at(0.2).rotation.w === 1,
  );
  const done: IAutoMovieTransform = at(1.5);
  TestValidator.predicate(
    "full displacement at the event",
    Math.abs(done.translation.x - 1.3) < 1e-12 &&
      Math.abs(done.translation.z - 1.8) < 1e-12 &&
      Math.abs(2 * Math.asin(done.rotation.y) - Math.PI / 6) < 1e-12 &&
      at(3).translation.x === done.translation.x,
  );
  const h: number = 1e-5;
  TestValidator.predicate(
    "zero rate at window ends",
    Math.abs(at(0.5 + h).translation.x - at(0.5).translation.x) / h < 1e-6 &&
      Math.abs(at(1.5).translation.x - at(1.5 - h).translation.x) / h < 1e-6,
  );
  TestValidator.predicate(
    "backward window",
    throwsError((): unknown => warpRoot(root, { ...warp, end: 0.5 }, 1)),
  );
}

/** Four independently expanded phase equations under the authored contact window. */
function literalNoise(u: number): number {
  return 128 * u ** 4 * (1 - u) ** 4 * (
    Math.sin(Math.PI * (1.5 * u + 0.25)) + Math.sin(Math.PI * (2.375 * u + 0.75)) +
    Math.sin(Math.PI * (3.25 * u + 1.25)) + Math.sin(Math.PI * (4.125 * u + 1.75))
  );
}
