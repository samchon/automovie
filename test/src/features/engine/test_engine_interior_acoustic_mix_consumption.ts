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
 * The actual 48000 Hz renderer consumes the different-room gain at the event impulse, with no unrelated silent film span.
 *
 * Scenarios:
 * 1. A real48000 Hz one-frame renderer produces a nonzero dry stereo impulse.
 * 2. The different-room event multiplies both native samples by 0.1 while preserving the one-sample-frame clock.
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
