import { AutoMovieEngineSound } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Spectral absorption reduces the first contact transient and a full-buffer
 * adjacent-sample proxy at 48000 Hz.
 *
 * Scenarios:
 *
 * 1. Supported seven-frame PCM at 10 fps retains the entire0.22 s contact event
 *    after its0.2 s onset.
 * 2. High-frequency gain 0.05 reduces both the first transient and full-buffer
 *    adjacent-sample energy relative to gain 1.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs actual propagation and production mixing with otherwise identical receipts selecting high-frequency gains 1 and .05, comparing the first nonzero transient and the left-channel adjacent-difference sum across each full returned buffer.
 * @evidence contracts/development/testing.md#independent-expectations Authored stronger absorption determines the strict decrease expectations independently; the existing observation helper only searches/sums PCM and does not synthesize expected output. Adjacent differences are a frequency-content proxy, not an FFT, proof of every tail sample or perceptual quality.
 * @evidence contracts/development/common.md#meaningful-documentation Supported PCM holds the entire event at the authored clock. The reduced high-frequency gain attenuates its onset and the whole buffer in the tested mix.
 */
export function test_engine_sound_propagation_spectral_mix(): void {
  const {
    profile,
    eventPlan,
    firstAudibleFrame,
    adjacentEnergy,
  }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  const zero: ReturnType<typeof AutoMovieEngineSound.deriveSoundPropagation> =
    AutoMovieEngineSound.deriveSoundPropagation({
      distanceMeters: 0,
      emissionFrame: 2,
      segmentEndFrame: 7,
      fps: 10,
      totalFrames: 7,
      profile: { ...profile(), spectral: { kind: "none" } },
    });

  const unfiltered: ReturnType<
    typeof AutoMovieEngineSound.renderProductionSound
  > = AutoMovieEngineSound.renderProductionSound({
    plan: eventPlan({ ...zero, highFrequencyGain: 1 }),
  });

  const absorbed: ReturnType<
    typeof AutoMovieEngineSound.renderProductionSound
  > = AutoMovieEngineSound.renderProductionSound({
    plan: eventPlan({ ...zero, highFrequencyGain: 0.05 }),
  });

  const first: number = firstAudibleFrame(unfiltered.pcm) * 2;

  TestValidator.equals(
    "declared spectral absorption filters the complete event including its transient",
    {
      firstTransientFalls: absorbed.pcm[first]! < unfiltered.pcm[first]!,
      adjacentEnergyFalls:
        adjacentEnergy(absorbed.pcm) < adjacentEnergy(unfiltered.pcm),
    },
    { firstTransientFalls: true, adjacentEnergyFalls: true },
  );
}
