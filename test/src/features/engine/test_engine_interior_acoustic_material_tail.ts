import {
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createInteriorAcousticTestInputs } from "../internal/audio/createInteriorAcousticTestInputs";
import { nclose } from "../internal/predicates";

/**
 * Material absorption changes the derived T60 and the complete bounded impulse tail on the existing 100 Hz kernel clock.
 *
 * Scenarios:
 * 1. Two impulse samples at the existing 100 Hz kernel clock produce T60 values 0.805 s and0.20125 s for absorption0.2 and0.8.
 * 2. The reflective response has both a longer complete bounded tail and greater tail energy.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives two real Sabine responses and applies the maintained sparse PCM tier, observing expected T60 ordering, output-tail length and summed absolute delayed amplitude.
 * @evidence contracts/testing.md#independent-expectations V=100 and S=100 with absorption .2/.8 give .161*V/(S*alpha)=.805/.20125 seconds independently. The helper named tailEnergy sums absolute amplitude after index zero, an L1 witness rather than physical squared energy or measured audible reverberation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the same two-sample mono impulse at 100 Hz and reflective/absorptive twins; default nclose tolerances and strict time/length/amplitude ordering remain unchanged. The sparse bounded tier does not prove a measured impulse response or playback quality.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh requests and returned CPU sample arrays through the existing canonical fixture; it opens no file, native solver, codec/audio device, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_interior_acoustic_material_tail(): void {
  const {
    digest,
    profile,
    request,
  }: ReturnType<typeof createInteriorAcousticTestInputs> =
    createInteriorAcousticTestInputs();

  const reflective: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(0.2),
      profile,
    });

  const absorptive: ReturnType<typeof deriveAutoMovieInteriorAcousticResponse> =
    deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(0.8),
      profile,
    });

  if (reflective.status !== "available" || absorptive.status !== "available")
    throw new Error("positive material twins unexpectedly lacked responses");

  const reflectivePcm: ReturnType<
    typeof applyAutoMovieInteriorAcousticResponse
  > = applyAutoMovieInteriorAcousticResponse({
    samples: Float32Array.from([1, 0]),
    channels: 1,
    sampleRate: 100,
    response: reflective,
  });

  const absorptivePcm: ReturnType<
    typeof applyAutoMovieInteriorAcousticResponse
  > = applyAutoMovieInteriorAcousticResponse({
    samples: Float32Array.from([1, 0]),
    channels: 1,
    sampleRate: 100,
    response: absorptive,
  });

  const tailEnergy: (pcm: Float32Array) => number = (
    pcm: Float32Array,
  ): number =>
    pcm
      .slice(1)
      .reduce(
        (sum: number, sample: number): number => sum + Math.abs(sample),
        0,
      );

  TestValidator.equals(
    "material absorption changes both the Sabine result and the audible bounded tail",
    {
      reflectiveT60: nclose(reflective.reverberationTimeSeconds!, 0.805),
      absorptiveT60: nclose(absorptive.reverberationTimeSeconds!, 0.20125),
      ordered:
        reflective.reverberationTimeSeconds! >
        absorptive.reverberationTimeSeconds!,
      longerTail: reflectivePcm.length > absorptivePcm.length,
      greaterTailEnergy: tailEnergy(reflectivePcm) > tailEnergy(absorptivePcm),
    },
    {
      reflectiveT60: true,
      absorptiveT60: true,
      ordered: true,
      longerTail: true,
      greaterTailEnergy: true,
    },
  );
}
