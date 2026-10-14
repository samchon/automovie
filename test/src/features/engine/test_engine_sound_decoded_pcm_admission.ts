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
import { test12ValuesClose } from "../internal/test12ValuesClose";

/**
 * Cue and dialogue ingress distinguish invalid empty spans from bounded decoded and resampled native PCM.
 *
 * Scenarios:
 * 1. An empty cue refuses; a decoded 1e-6 sample matches its onset within 1e-12, stays silent beyond its generation and falls below the absolute loudness gate.
 * 2. A supported short native dialogue is audible and finite; an empty supplied dialogue refuses by line identity.
 * 3. A zero-sample film refuses while the adjacent one-sample frame returns two finite silent stereo values at 48000 Hz.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual production PCM mixer with decoded cue/dialogue buffers, observing empty-span/empty-PCM refusals, bounded cue onset/end, null sub-gate loudness, audible finite resampling and adjacent zero/one-sample film outcomes.
 * @evidence contracts/testing.md#independent-expectations Literal 1e-6 cue PCM, its one-sample extent, four-frame dialogue destination and zero/one native sample clocks establish expectations independently; cue tolerance remains 1e-12 and formerly exact numeric records use zero tolerance. Audibility is nonzero PCM, not a hearing threshold or perceptual quality measurement.
 * @evidence contracts/testing.md#distinguishing-cases Preserves empty versus one-sample cues, empty versus two-sample supplied dialogue, below-gate loudness and zero versus one 48000 Hz film frame. It does not exercise decoding file bytes, arbitrary resampling ratios or playback hardware.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh plans, maps and PCM buffers through the existing fixture; it runs no decoder, filesystem/audio-device operation, renderer, browser or GPU and replaces no foreign method.
 */
export function test_engine_sound_decoded_pcm_admission(): void {
  const { eventPlan }: ReturnType<typeof createSoundPropagationTestInputs> = createSoundPropagationTestInputs();

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
          (): ReturnType<typeof renderProductionSound> => renderProductionSound({ plan: zeroCuePlan }),
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

  const decodedCue: ReturnType<typeof renderProductionSound> = renderProductionSound({
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

  const resampledDialogue: ReturnType<typeof renderProductionSound> = renderProductionSound({
      plan: resampledDialoguePlan,
      dialogue: new Map([["resampled", Float32Array.from([0.25, 0.5])]]),
    });

  TestValidator.equals(
  "decoded generation extents, absolute loudness gate and dialogue resampling remain explicit",
  {
  decodedFirstSample: nclose(decodedCue.pcm[0]!, 1e-6, 1e-12),
  decodedPastEndIsSilent: nclose(decodedCue.pcm[2]!, 0, 0),
  subGateLoudness: decodedCue.analysis.integratedLoudness,
  emptyDialogueIsRefused: throwsError(
          (): ReturnType<typeof renderProductionSound> =>
            renderProductionSound({
              plan: oneSampleDialoguePlan,
              dialogue: new Map([["one-sample", new Float32Array()]]),
            }),
          ['dialogue line "one-sample"', "empty PCM"],
        ),
  resampledDialogueAudible: resampledDialogue.pcm.some(
          (sample: number): boolean => sample !== 0,
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
      (): ReturnType<typeof renderProductionSound> => renderProductionSound({ plan: emptyFilm }),
      ["generated production mix", "empty PCM"],
    ),
  );
  const oneFrame: ReturnType<typeof renderProductionSound> = renderProductionSound({
    plan: { ...emptyFilm, totalFrames: 1 },
  });
  TestValidator.predicate(
    "the adjacent one-sample native clock remains supported",
    test12ValuesClose(
    {
      samples: Array.from(oneFrame.pcm),
      sampleRate: oneFrame.analysis.sampleRate,
      peak: oneFrame.analysis.samplePeak,
    },
    { samples: [0, 0], sampleRate: 48_000, peak: 0 },
    ),
  );
}
