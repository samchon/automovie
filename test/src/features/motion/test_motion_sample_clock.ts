import { sampleTimes, windowSampleTimes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/**
 * Observe the shared clock functions' endpoint-inclusive grids and exact zero-origin/window equivalence. Consumer agreement is provided by their shared source owner; this unit does not invoke every downstream sampler or prove their clocks cannot diverge.
 *
 * Scenarios:
 *
 * 1. A whole-frame duration (1 s at 24 Hz) yields 25 instants `i/24` with the last
 *    exactly at the duration.
 * 2. A fractional duration (1.01 s at 24 Hz) rounds the interval count UP and
 *    clamps the final instant to the duration (endpoint-inclusive, never
 *    past).
 * 3. A sub-frame duration still yields its two endpoints (min one interval).
 * 4. `sampleTimes(d, r)` is exactly `windowSampleTimes(0, d, r)`: the delegation
 *    is the identity that keeps every consumer on one grid.
 * 5. A shifted window `[start, end]` steps `start + i/r` clamped to `end`: the
 *    foot-skate contact-window form, same arithmetic shifted.
 *
 * The existing binary64 just-above-integer window also requires a deduplicated final instant. Zero-width and malformed windows are outside this unit's unchanged case population.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls sampleTimes/windowSampleTimes on whole, fractional, sub-frame, shifted and binary64 tail cases; observes lengths, selected instants, final clamp, exact delegation equivalence and distinct final neighbours.
 * @evidence contracts/testing.md#independent-expectations Authored seconds and Hz give ceil(duration*rate) intervals with endpoint clamp: counts 25,26,2,19 and the duplicate-tail count 10. Selected values use literal i/r and shifted i/r arithmetic independently of the output. The delegation twin alone can share a wrong grid, so literal counts/points bound it; eps0 comparison preserves prior exact array equivalence.
 * @evidence contracts/testing.md#distinguishing-cases Retains whole/fractional/sub-frame durations, shifted zero/nonzero origins and [0.1,0.4] at 30 Hz, with the original numeric tolerances and exact final-neighbour distinction. Input admission, zero-width semantics and downstream use have separate owners.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every direct clock call using scalar fixtures and local arrays; named facts register no cases and no sampling process, viewer or native artifact is started.
 */
export function test_motion_sample_clock(): void {
  const whole: number[] = sampleTimes(1, 24);
  TestValidator.equals("1s@24Hz yields 25 instants", whole.length, 25);
  TestValidator.equals(
    "instants sit at i/24 with the last at the duration",
    namedFacts([
      ["ncloseWhole", (): boolean => nclose(whole[0]!, 0)],
      ["ncloseWhole2", (): boolean => nclose(whole[12]!, 12 / 24)],
      ["ncloseWhole3", (): boolean => nclose(whole[24]!, 1)],
    ]),
    { ncloseWhole: true, ncloseWhole2: true, ncloseWhole3: true },
  );

  const fractional: number[] = sampleTimes(1.01, 24);
  TestValidator.equals(
    "fractional duration rounds intervals up",
    fractional.length,
    26,
  );
  TestValidator.equals(
    "final instant clamps to the duration",
    namedFacts([
      ["ncloseFractional25", (): boolean => nclose(fractional[25]!, 1.01)],
      ["fractional25", (): boolean => fractional[25]! <= 1.01],
    ]),
    { ncloseFractional25: true, fractional25: true },
  );

  const tiny: number[] = sampleTimes(0.01, 24);
  TestValidator.equals(
    "sub-frame duration keeps two endpoints",
    tiny.length,
    2,
  );
  TestValidator.equals(
    "the two endpoints are 0 and the duration",
    namedFacts([
      ["ncloseTiny0", (): boolean => nclose(tiny[0]!, 0)],
      ["ncloseTiny1", (): boolean => nclose(tiny[1]!, 0.01)],
    ]),
    { ncloseTiny0: true, ncloseTiny1: true },
  );

  const viaWindow: number[] = windowSampleTimes(0, 1.01, 24);
  TestValidator.predicate(
    "sampleTimes(d, r) === windowSampleTimes(0, d, r)",
    fractional.length === viaWindow.length &&
      fractional.every((time: number, index: number): boolean =>
        nclose(time, viaWindow[index]!, 0),
      ),
  );

  const window: number[] = windowSampleTimes(0.5, 1.25, 24);
  TestValidator.equals(
    "a 0.75s window at 24Hz yields 19 instants",
    window.length,
    19,
  );
  TestValidator.equals(
    "window instants step start + i/24 clamped to end",
    namedFacts([
      ["ncloseWindow", (): boolean => nclose(window[0]!, 0.5)],
      ["ncloseWindow2", (): boolean => nclose(window[1]!, 0.5 + 1 / 24)],
      ["ncloseWindow3", (): boolean => nclose(window[18]!, 1.25)],
    ]),
    { ncloseWindow: true, ncloseWindow2: true, ncloseWindow3: true },
  );

  // (end − start) × rate landing just above an integer (0.3 × 30 =
  // 9.000000000000002) must not duplicate the clamped final instant: a
  // zero-width segment downstream validators would divide by.
  const fpWindow: number[] = windowSampleTimes(0.1, 0.4, 30);
  TestValidator.equals(
    "an FP just-above-integer window deduplicates its final instant",
    namedFacts([
      ["fpWindow", (): boolean => fpWindow.length === 10],
      [
        "ncloseFpWindowFpWindow",
        (): boolean => nclose(fpWindow[fpWindow.length - 1]!, 0.4),
      ],
      [
        "fpWindowFpWindowFpWindow",
        (): boolean =>
          !nclose(
            fpWindow[fpWindow.length - 1]!,
            fpWindow[fpWindow.length - 2]!,
            0,
          ),
      ],
    ]),
    {
      fpWindow: true,
      ncloseFpWindowFpWindow: true,
      fpWindowFpWindowFpWindow: true,
    },
  );
}
