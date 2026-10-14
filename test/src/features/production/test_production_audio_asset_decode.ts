import { decodeProductionAudioAsset } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";
import { productionWav } from "../internal/productionMedia/productionWav";

/** The finished-film sound plan's own rate, which every decode targets. */
const PLAN_RATE: number = 48_000;

const decode: (bytes: Uint8Array, sampleRate?: number) => ReturnType<typeof decodeProductionAudioAsset> = (bytes: Uint8Array, sampleRate: number = PLAN_RATE): ReturnType<typeof decodeProductionAudioAsset> =>
  decodeProductionAudioAsset({
    path: "public/audio/bed.wav",
    bytes,
    sampleRate,
  });

/**
 * A declared audio asset becomes the mono samples the mix plays.
 *
 * This unit pins the decoder's supported container facts and mono output. It does not execute renderProductionSound or prove that a production renderer acquires these decoded bytes; the exported decoder's product wiring remains a separate obligation.
 *
 * The two are kept apart on purpose. The `source*` facts are the file's own,
 * before the downmix and before any resampling, because a render plan records
 * them as the asset's identity; the samples are what the mix consumes. A
 * decoder that reported its output as the source would make a resampled asset
 * claim the plan's rate and hide every duration disagreement the plan exists to
 * catch.
 *
 * Expected values are hand-derived from the WAV specification rather than read
 * back from the decoder: `16384 / 32768` is `0.5`, and the interpolated samples
 * are the midpoints of a ramp.
 *
 * Scenarios:
 *
 * 1. 16-bit PCM mono at the plan's rate: the container's facts are reported as its
 *    own, codes scale to unit floats, and full-scale negative is exactly -1.
 * 2. At the plan's own rate nothing is resampled, so the output holds exactly as
 *    many samples as the file has frames.
 * 3. A metadata chunk ahead of the format chunk changes nothing: the walk finds
 *    chunks by id rather than by offset.
 * 4. Stereo folds to the average of its channels, so an opposed pair cancels
 *    instead of surviving as the left channel.
 * 5. 32-bit IEEE float samples decode as written.
 * 6. `WAVE_FORMAT_EXTENSIBLE` decodes as the sub-format it names, so an ordinary
 *    stem is not refused for how its header spells PCM.
 * 7. A file at another rate is resampled to the plan's rate: the buffer stretches
 *    by the rate ratio, interpolates between source samples, holds the last
 *    sample past the end, and still reports the file's own rate and runtime.
 *
 * @evidence contracts/testing.md#behavioral-verification Decodes actual authored RIFF/WAVE byte records and asserts source rate/layout/precision, mono sample amplitudes, copy/downmix/resample lineage and source-duration preservation, catching wrong scaling, channel selection or output facts substituted for source identity.
 * @evidence contracts/testing.md#independent-expectations PCM codes divided by 32768, arithmetic stereo means and linear ramp midpoints independently supply sample expectations; authored frame/rate ratios supply duration and output length. Metadata/extensible comparisons share a decoded mono reference but its complete samples are independently checked; no anti-alias quality or renderer wiring is certified.
 * @evidence contracts/testing.md#distinguishing-cases Preserves seven scenarios plus existing extensible-float stereo, negative zero, minimum subnormal, maximum finite float and combined downmix/resample boundaries; malformed containers and unsupported fields belong to the refusal unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all assertions and invokes the ingest decoder on the existing in-memory WAVE writer's records; it opens no asset file, audio device, native process or dynamic test.
 */
export function test_production_audio_asset_decode(): void {
  const monoPcm: ReturnType<typeof decode> = decode(
    productionWav({
      channels: [[0, 16_384, -32_768, 8_192]],
      metadata: false,
    }),
  );
  const withMetadata: ReturnType<typeof decode> = decode(
    productionWav({
      channels: [[0, 16_384, -32_768, 8_192]],
      metadata: true,
    }),
  );
  const stereoPcm: ReturnType<typeof decode> = decode(
    productionWav({
      channels: [
        [16_384, -16_384],
        [16_384, 16_384],
      ],
    }),
  );
  const float: ReturnType<typeof decode> = decode(
    productionWav({
      formatTag: 3,
      bitsPerSample: 32,
      channels: [[0.25, -0.75, 1]],
    }),
  );
  const extensible: ReturnType<typeof decode> = decode(
    productionWav({
      formatTag: 0xfffe,
      subFormatTag: 1,
      channels: [[0, 16_384, -32_768, 8_192]],
    }),
  );
  const extensibleFloatStereo: ReturnType<typeof decode> = decode(
    productionWav({
      formatTag: 0xfffe,
      subFormatTag: 3,
      bitsPerSample: 32,
      channels: [
        [0.25, -0.5],
        [0.75, 0.5],
      ],
    }),
  );
  const finiteBoundaries: ReturnType<typeof decode> = decode(
    productionWav({
      formatTag: 3,
      bitsPerSample: 32,
      channels: [[-0, 1.401298464324817e-45, 3.4028234663852886e38]],
    }),
  );
  const resampled: ReturnType<typeof decode> = decode(
    productionWav({
      sampleRate: 24_000,
      channels: [[0, 8_192, 16_384, 24_576]],
    }),
  );
  const downmixResampled: ReturnType<typeof decode> = decode(
    productionWav({
      sampleRate: 24_000,
      channels: [
        [16_384, 0],
        [0, 16_384],
      ],
    }),
  );

  TestValidator.predicate(
    "authored PCM codes independently determine the complete mono reference",
    [0, 0.5, -1, 0.25].every((sample: number, index: number): boolean =>
      nclose(monoPcm.samples[index]!, sample, 1e-9)),
  );
  TestValidator.equals(
    "a declared WAV asset decodes to mono samples at the plan's rate",
    namedFacts([
      ["itReadsTheDeclaredRate", (): boolean => monoPcm.sourceSampleRate === PLAN_RATE],
      ["itReadsTheDeclaredChannelCount", (): boolean => monoPcm.sourceChannels === 1],
      ["itCountsTheSourceFrames", (): boolean => monoPcm.sourceFrames === 4],
      [
        "legacyMonoPreservesItsDefaultFrontCenterFacts",
        (): boolean =>
          monoPcm.sourceFormat.header === "wave-format-ex" &&
          monoPcm.sourceFormat.encoding === "pcm-s16le" &&
          monoPcm.sourceFormat.containerBits === 16 &&
          monoPcm.sourceFormat.validBits === 16 &&
          monoPcm.sourceFormat.layout.source === "legacy-default" &&
          monoPcm.sourceFormat.layout.speakers[0] === "front-center" &&
          monoPcm.sourceFormat.subFormatGuid === null,
      ],
      [
        "exactRateMonoDeclaresCopyLineage",
        (): boolean =>
          monoPcm.processing.kind === "copy" &&
          monoPcm.processing.outputSampleRate === PLAN_RATE &&
          nclose(monoPcm.processing.matrix[0]?.[0] ?? Number.NaN, 1, 0),
      ],
      [
        "itDerivesTheRuntimeFromThoseFrames",
        (): boolean => nclose(monoPcm.durationSeconds, 4 / PLAN_RATE, 1e-12),
      ],
      [
        "itScalesSixteenBitCodesToUnitFloats",
        (): boolean => nclose(monoPcm.samples[1]!, 0.5, 1e-9),
      ],
      [
        "andFullScaleNegativeIsExactlyMinusOne",
        (): boolean => nclose(monoPcm.samples[2]!, -1, 1e-9),
      ],
      // At the plan's own rate the buffer is copied rather than interpolated, so
      // an asset already in the right shape carries no conversion error at all.
      [
        "aFileAlreadyAtThePlanRateIsNotResampled",
        (): boolean => monoPcm.samples.length === monoPcm.sourceFrames,
      ],
      // Found by id, not by offset: a writer that puts a LIST first must not
      // shift what the decoder believes the format chunk is.
      [
        "aMetadataChunkAheadOfTheFormatChangesNothing",
        (): boolean =>
          [...withMetadata.samples].every((sample: number, index: number): boolean =>
            nclose(sample, monoPcm.samples[index]!, 1e-9),
          ),
      ],
      [
        "stereoFoldsToTheAverageOfItsChannels",
        (): boolean => nclose(stereoPcm.samples[0]!, 0.5, 1e-9),
      ],
      // Taking the left channel, or summing without dividing, both read 0.5
      // above and -0.5 here. Only the average cancels.
      ["soAnOpposedPairCancels", (): boolean => nclose(stereoPcm.samples[1]!, 0, 1e-9)],
      [
        "thirtyTwoBitFloatSamplesDecodeAsWritten",
        (): boolean =>
          nclose(float.samples[1]!, -0.75, 1e-9) &&
          float.sourceFormat.encoding === "float-f32le",
      ],
      [
        "anExtensibleHeaderDecodesAsItsSubFormat",
        (): boolean =>
          extensible.sourceFormat.subFormatGuid ===
            "00000001-0000-0010-8000-00aa00389b71" &&
          extensible.sourceFormat.layout.mask === 0x4 &&
          [...extensible.samples].every((sample: number, index: number): boolean =>
            nclose(sample, monoPcm.samples[index]!, 1e-9),
          ),
      ],
      [
        "extensibleFloatStereoPreservesLayoutAndDownmix",
        (): boolean =>
          extensibleFloatStereo.sourceFormat.encoding === "float-f32le" &&
          extensibleFloatStereo.sourceFormat.layout.speakers.join("|") ===
            "front-left|front-right" &&
          extensibleFloatStereo.processing.kind === "downmix" &&
          extensibleFloatStereo.processing.matrix[0]?.length === 2 &&
          extensibleFloatStereo.processing.matrix[0].every((coefficient: number): boolean => nclose(coefficient, 0.5, 0)) &&
          nclose(extensibleFloatStereo.samples[0]!, 0.5, 1e-9) &&
          nclose(extensibleFloatStereo.samples[1]!, 0, 1e-9),
      ],
      [
        "finiteFloatBoundariesRemainAdmissible",
        (): boolean =>
          Object.is(finiteBoundaries.samples[0], -0) &&
          nclose(finiteBoundaries.samples[1]!, 1.401298464324817e-45, 0) &&
          nclose(finiteBoundaries.samples[2]!, 3.4028234663852886e38, 0),
      ],
      [
        "aFileAtAnotherRateStretchesByTheRateRatio",
        (): boolean => resampled.samples.length === 8,
      ],
      [
        "andInterpolatesBetweenItsSourceSamples",
        (): boolean => nclose(resampled.samples[1]!, 0.125, 1e-9),
      ],
      // Past the last source sample the interpolation holds it rather than
      // reading off the end of the buffer.
      [
        "andHoldsTheLastSamplePastTheEnd",
        (): boolean => nclose(resampled.samples[7]!, 0.75, 1e-9),
      ],
      // The plan records the asset's identity from these, so they must stay the
      // file's own facts and not the mix's.
      [
        "whileTheReportedRateStaysTheFilesOwn",
        (): boolean => resampled.sourceSampleRate === 24_000,
      ],
      [
        "andTheReportedRuntimeStaysTheFilesOwn",
        (): boolean => nclose(resampled.durationSeconds, 4 / 24_000, 1e-12),
      ],
      [
        "resamplingIsNamedSeparatelyFromSourceFacts",
        (): boolean =>
          resampled.processing.kind === "resample" &&
          resampled.sourceFormat.sampleRate === 24_000 &&
          resampled.processing.outputSampleRate === PLAN_RATE,
      ],
      [
        "stereoDownmixThenResampleKeepsCombinedLineage",
        (): boolean =>
          downmixResampled.processing.kind === "downmix-resample" &&
          downmixResampled.processing.matrix[0]?.length === 2 &&
          downmixResampled.processing.matrix[0].every((coefficient: number): boolean => nclose(coefficient, 0.5, 0)) &&
          downmixResampled.samples.every((sample: number): boolean => nclose(sample, 0.25)),
      ],
    ]),
    {
      itReadsTheDeclaredRate: true,
      itReadsTheDeclaredChannelCount: true,
      itCountsTheSourceFrames: true,
      legacyMonoPreservesItsDefaultFrontCenterFacts: true,
      exactRateMonoDeclaresCopyLineage: true,
      itDerivesTheRuntimeFromThoseFrames: true,
      itScalesSixteenBitCodesToUnitFloats: true,
      andFullScaleNegativeIsExactlyMinusOne: true,
      aFileAlreadyAtThePlanRateIsNotResampled: true,
      aMetadataChunkAheadOfTheFormatChangesNothing: true,
      stereoFoldsToTheAverageOfItsChannels: true,
      soAnOpposedPairCancels: true,
      thirtyTwoBitFloatSamplesDecodeAsWritten: true,
      anExtensibleHeaderDecodesAsItsSubFormat: true,
      extensibleFloatStereoPreservesLayoutAndDownmix: true,
      finiteFloatBoundariesRemainAdmissible: true,
      aFileAtAnotherRateStretchesByTheRateRatio: true,
      andInterpolatesBetweenItsSourceSamples: true,
      andHoldsTheLastSamplePastTheEnd: true,
      whileTheReportedRateStaysTheFilesOwn: true,
      andTheReportedRuntimeStaysTheFilesOwn: true,
      resamplingIsNamedSeparatelyFromSourceFacts: true,
      stereoDownmixThenResampleKeepsCombinedLineage: true,
    },
  );
}
