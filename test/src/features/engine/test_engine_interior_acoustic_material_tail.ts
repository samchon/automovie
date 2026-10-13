import {
  applyAutoMovieInteriorAcousticResponse,
  deriveAutoMovieInteriorAcousticResponse,
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
 * Material absorption changes the derived T60 and the complete bounded impulse tail on the existing 100 Hz kernel clock.
 *
 * Scenarios:
 * 1. Two impulse samples at the existing 100 Hz kernel clock produce T60 values 0.805 s and0.20125 s for absorption0.2 and0.8.
 * 2. The reflective response has both a longer complete bounded tail and greater tail energy.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives same-room responses with `deriveAutoMovieInteriorAcousticResponse` for shell absorption 0.2 and 0.8, applies each to a unit impulse with `applyAutoMovieInteriorAcousticResponse`, and asserts both T60 values, their order, the wet buffer lengths and the summed absolute tail; it catches absorption ignored or inverted in the Sabine term and a tail kernel whose length or energy does not follow the derived T60.
 * @evidence contracts/testing.md#independent-expectations T60 comes from the Sabine formula `0.161 * V / (S * alpha)` with V = 100 m3 and S = 100 m2, giving 0.805 s and 0.20125 s; the tail comparisons are orderings implied by a longer decay, not values, so the exact tail samples of the kernel are not pinned here.
 * @evidence contracts/testing.md#distinguishing-cases Two positive material twins that differ only in absorption, so any difference in result is caused by the material; the zero-absorption gap, the 0.5 default and cross-room gain belong to `test_engine_interior_acoustic_response`, and invalid PCM shapes to `test_engine_interior_acoustic_pcm_admission`.
 */
export const test_engine_interior_acoustic_material_tail = (): void => {
  const { digest, profile, request } = createInteriorAcousticTestInputs();

  const reflective = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(0.2),
      profile,
    });

  const absorptive = deriveAutoMovieInteriorAcousticResponse({
      sourceSpace: "room-a",
      listenerSpace: "room-a",
      inputRevision: digest,
      request: request(0.8),
      profile,
    });

  if (reflective.status !== "available" || absorptive.status !== "available")
      throw new Error("positive material twins unexpectedly lacked responses");

  const reflectivePcm = applyAutoMovieInteriorAcousticResponse({
      samples: Float32Array.from([1, 0]),
      channels: 1,
      sampleRate: 100,
      response: reflective,
    });

  const absorptivePcm = applyAutoMovieInteriorAcousticResponse({
      samples: Float32Array.from([1, 0]),
      channels: 1,
      sampleRate: 100,
      response: absorptive,
    });

  const tailEnergy = (pcm: Float32Array): number =>
      pcm.slice(1).reduce((sum, sample) => sum + Math.abs(sample), 0);

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
};
