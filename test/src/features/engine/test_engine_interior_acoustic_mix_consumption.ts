import {
  deriveAutoMovieInteriorAcousticResponse,
  renderProductionSound,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  nclose,
} from "../internal/predicates";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";

/**
 *
 * The actual 48000 Hz renderer consumes the different-room gain at the event impulse, with no unrelated silent film span.
 *
 * Scenarios:
 * 1. A real48000 Hz one-frame renderer produces a nonzero dry stereo impulse.
 * 2. The different-room event multiplies both native samples by 0.1 while preserving the one-sample-frame clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Renders a one-frame 48 kHz sound plan with `renderProductionSound` dry and again with a different-room response from `deriveAutoMovieInteriorAcousticResponse` attached to its contact event, asserting the dry stereo impulse is positive and under the limiter, that each wet sample is one tenth of its dry twin, and the wet buffer length and rate; it catches a mixer that drops or double-applies the event's acoustic response, applies it to only one channel, or pads the film with silent frames.
 * @evidence contracts/testing.md#independent-expectations The 0.1 factor is `10^(-20/20)` for the request's 20 dB partition loss, and the length two is one frame times two channels; the wet value is compared against the dry render of the same plan rather than an absolute amplitude, so the dry mix gain itself is not pinned here.
 * @evidence contracts/testing.md#distinguishing-cases Positive dry and cross-room twins differing only in the attached response; same-room tails and outdoor copying at the PCM level belong to `test_engine_interior_acoustic_pcm_paths`, and response derivation to `test_engine_interior_acoustic_response`.
 */
export const test_engine_interior_acoustic_mix_consumption = (): void => {
  const { digest, profile, request, soundPlan } = createInteriorAcousticTestInputs();

  const across = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: request(),
      profile,
    });

  if (across.status !== "available") throw new Error("positive response unavailable");
  const dry = renderProductionSound({ plan: soundPlan() });
  const wet = renderProductionSound({ plan: soundPlan(across) });
  TestValidator.predicate(
    "the arranged dry impulse is audible and below the master limiter",
    dry.pcm[0]! > 0 && dry.pcm[1]! > 0 && dry.analysis.samplePeak < 0.95,
  );
  TestValidator.predicate("the declared transmission gain reaches both native stereo samples", nclose(wet.pcm[0]!, dry.pcm[0]! * 0.1) && nclose(wet.pcm[1]!, dry.pcm[1]! * 0.1));
  TestValidator.equals("one native sample frame carries the declared clock", { length: wet.pcm.length, sampleRate: wet.analysis.sampleRate }, { length: 2, sampleRate: 48_000 });
};
