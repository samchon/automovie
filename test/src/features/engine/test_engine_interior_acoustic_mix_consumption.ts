import {
  deriveAutoMovieInteriorAcousticResponse,
  renderProductionSound,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";
import { nclose } from "../internal/predicates";

/**
 * The actual 48000 Hz renderer consumes the different-room gain at the event impulse, with no unrelated silent film span.
 *
 * Scenarios:
 * 1. A real48000 Hz one-frame renderer produces a nonzero dry stereo impulse.
 * 2. The different-room event multiplies both native samples by 0.1 while preserving the one-sample-frame clock.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives the actual different-room response and sends dry/wet one-frame plans through the real CPU sound renderer, observing a nonzero below-limiter dry impulse, both gain-scaled stereo components and the output sample clock.
 * @evidence contracts/testing.md#independent-expectations The fixture's literal 20 dB partition loss independently implies amplitude gain 10^(-20/20)=.1; the dry render provides the same event baseline rather than an independent tone oracle. Numeric PCM is observed without audio playback or encoded-delivery proof.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the single stereo frame at 48000 Hz and otherwise equal dry/wet events; original nclose tolerance and positive/below-limiter inequalities remain unchanged. Same-room tails, unavailable responses and propagation have separate owning units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous entry owns fresh room requests, plans and rendered CPU arrays through the existing fixture. It opens no file, audio device, codec process, browser, renderer host or GPU and replaces no foreign method or installed consumer.
 */
export function test_engine_interior_acoustic_mix_consumption(): void {
  const {
    digest,
    profile,
    request,
    soundPlan,
  }: ReturnType<typeof createInteriorAcousticTestInputs> =
    createInteriorAcousticTestInputs();

  const across: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-b",
      inputRevision: digest,
      request: request(),
      profile,
    });

  if (across.status !== "available")
    throw new Error("positive response unavailable");
  const dry: ReturnType<typeof renderProductionSound> = renderProductionSound({
    plan: soundPlan(),
  });
  const wet: ReturnType<typeof renderProductionSound> = renderProductionSound({
    plan: soundPlan(across),
  });
  TestValidator.predicate(
    "the arranged dry impulse is audible and below the master limiter",
    dry.pcm[0]! > 0 && dry.pcm[1]! > 0 && dry.analysis.samplePeak < 0.95,
  );
  TestValidator.predicate(
    "the declared transmission gain reaches both native stereo samples",
    nclose(wet.pcm[0]!, dry.pcm[0]! * 0.1) &&
      nclose(wet.pcm[1]!, dry.pcm[1]! * 0.1),
  );
  TestValidator.equals(
    "one native sample frame carries the declared clock",
    { length: wet.pcm.length, sampleRate: wet.analysis.sampleRate },
    { length: 2, sampleRate: 48_000 },
  );
}
