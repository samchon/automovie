import {
  renderProductionSound,
} from "@automovie/engine";
import type {
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  nclose,
  throwsError,
} from "../internal/predicates";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Cue and dialogue ingress distinguish invalid empty spans from bounded decoded and resampled native PCM.
 *
 * Scenarios:
 * 1. An empty cue refuses; a decoded1e-6 sample is exact at its onset, silent beyond its generation and below the absolute loudness gate.
 * 2. A supported short native dialogue is audible and finite; an empty supplied dialogue refuses by line identity.
 * 3. A zero-sample film refuses while the adjacent one-sample frame returns two finite silent stereo values at 48000 Hz.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `renderProductionSound` on cue, dialogue and empty-film plans with caller-supplied decoded PCM and asserts refusal fragments, the cue's onset and post-span samples, a null integrated loudness, an audible finite resampled dialogue, and the one-frame film's samples, rate and peak; it catches a zero-frame cue or empty dialogue mixed as silence, a decoded cue that keeps sounding past its one-frame span, quiet program loudness reported instead of gated, and a film with no samples reported as a valid mix.
 * @evidence contracts/testing.md#independent-expectations The null loudness follows from the BS.1770 absolute gate at -70 LUFS, which a 1e-6 peak cannot clear; silence at sample 2 follows from the cue's one-frame span; `[0, 0]` at 48 kHz is one empty stereo frame. Limitation: the onset check uses the default 1e-6 tolerance around 1e-6, so it would also accept a silent onset, and the resampled dialogue is checked only for audibility and finiteness, not for its interpolated values.
 * @evidence contracts/testing.md#distinguishing-cases Negatives for a zero-frame cue, an empty supplied dialogue line and a zero-frame film; their adjacent positives are a one-frame decoded cue, a two-sample dialogue stretched over four frames and a one-frame film; propagation delay and spectral filtering belong to `test_engine_sound_propagation` and `test_engine_sound_propagation_spectral_mix`, and short-line clocking to `test_engine_sound_short_dialogue_clock`.
 */
export const test_engine_sound_decoded_pcm_admission = (): void => {
  const { eventPlan } = createSoundPropagationTestInputs();

  const zeroCuePlan: IAutoMovieProductionSoundPlan = {
      ...eventPlan(),
      fps: 48_000,
      totalFrames: 4,
      events: [],
      cues: [
        {
          id: "zero",
          asset: "assets/zero.wav",
          startFrame: 0,
          durationFrames: 0,
          sourceOffsetFrame: 0,
          sourceDurationFrames: 0,
          gain: 1,
          fadeInFrames: 0,
          fadeOutFrames: 0,
          bus: "ambience",
          seed: 1,
        },
      ],
    };

  const oneSampleDialoguePlan: IAutoMovieProductionSoundPlan = {
      ...eventPlan(),
      fps: 48_000,
      totalFrames: 2,
      events: [],
      dialogue: [
        {
          id: "one-sample",
          text: "a",
          language: "en",
          startFrame: 0,
          endFrame: 1,
        },
      ],
    };

  TestValidator.equals(
  "an empty cue span is refused before mixing",
  {
  // A cue with no frames has no sample to mix and no source to read: the
        // builder refuses it when lowering the edit, and the mix refuses the
        // same contradiction rather than rendering it as silence.
        zeroCueRefused: throwsError(
          () => renderProductionSound({ plan: zeroCuePlan }),
          ['cue "zero"', "positive whole-frame span"],
        )
  },
  {
  zeroCueRefused: true
  }
  );

  const decodedCuePlan: IAutoMovieProductionSoundPlan = {
      ...zeroCuePlan,
      cues: [
        {
          ...zeroCuePlan.cues[0]!,
          durationFrames: 1,
          sourceDurationFrames: 1,
        },
      ],
    };

  const decodedCue = renderProductionSound({
      plan: decodedCuePlan,
      assets: new Map([
        [decodedCuePlan.cues[0]!.asset, Float32Array.from([1e-6])],
      ]),
    });

  const resampledDialoguePlan: IAutoMovieProductionSoundPlan = {
      ...eventPlan(),
      fps: 48_000,
      totalFrames: 4,
      events: [],
      dialogue: [
        {
          id: "resampled",
          text: "ab",
          language: "en",
          startFrame: 0,
          endFrame: 4,
        },
      ],
    };

  const resampledDialogue = renderProductionSound({
      plan: resampledDialoguePlan,
      dialogue: new Map([["resampled", Float32Array.from([0.25, 0.5])]]),
    });

  TestValidator.equals(
  "decoded generation extents, absolute loudness gate and dialogue resampling remain explicit",
  {
  decodedFirstSample: nclose(decodedCue.pcm[0]!, 1e-6),
  decodedPastEndIsSilent: decodedCue.pcm[2] === 0,
  subGateLoudness: decodedCue.analysis.integratedLoudness,
  emptyDialogueIsRefused: throwsError(
          () =>
            renderProductionSound({
              plan: oneSampleDialoguePlan,
              dialogue: new Map([["one-sample", new Float32Array()]]),
            }),
          ['dialogue line "one-sample"', "empty PCM"],
        ),
  resampledDialogueAudible: resampledDialogue.pcm.some(
          (sample) => sample !== 0,
        ),
  resampledDialogueFinite: Array.from(resampledDialogue.pcm).every(
          Number.isFinite,
        )
  },
  {
  decodedFirstSample: true,
  decodedPastEndIsSilent: true,
  subGateLoudness: null,
  emptyDialogueIsRefused: true,
  resampledDialogueAudible: true,
  resampledDialogueFinite: true
  }
  );

  const emptyFilm: IAutoMovieProductionSoundPlan = {
    ...eventPlan(),
    fps: 48_000,
    totalFrames: 0,
    events: [],
  };
  TestValidator.predicate(
    "a film yielding no native samples cannot claim a valid mix",
    throwsError(
      () => renderProductionSound({ plan: emptyFilm }),
      ["generated production mix", "empty PCM"],
    ),
  );
  const oneFrame = renderProductionSound({
    plan: { ...emptyFilm, totalFrames: 1 },
  });
  TestValidator.equals(
    "the adjacent one-sample native clock remains supported",
    {
      samples: Array.from(oneFrame.pcm),
      sampleRate: oneFrame.analysis.sampleRate,
      peak: oneFrame.analysis.samplePeak,
    },
    { samples: [0, 0], sampleRate: 48_000, peak: 0 },
  );
};
