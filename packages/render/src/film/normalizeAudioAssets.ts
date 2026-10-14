import { compareCodeUnits } from "@automovie/engine";
import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";

import type { IAutoMovieProductionAudioAssetIdentity } from "./IAutoMovieProductionAudioAssetIdentity";
import { validDigest } from "./validDigest";
import { validWaveAudioIdentity } from "./validWaveAudioIdentity";

/** Sample rate of a placeholder stem: the sound plan's fixed mix rate. */
const PLACEHOLDER_SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/** Channel count of a placeholder stem: the sound plan's fixed stereo mix. */
const PLACEHOLDER_CHANNELS: IAutoMovieProductionSoundPlan["channels"] = 2;

/**
 * Copy the planned audio asset identities sorted by path, refusing any that
 * is invalid.
 *
 * Paths sort by UTF-16 code unit, so one input yields one plan on every host.
 * Throws when a path is blank or repeated, the digest is not a SHA-256 content
 * digest, the sample rate, channel count or sample-frame count is not a
 * positive safe integer, `durationSeconds` is not exactly `sourceFrames /
 * sampleRate`, the kind is unknown, a placeholder stem is not 48 kHz stereo,
 * or a WAVE identity fails `validWaveAudioIdentity`. The input is not changed.
 *
 * @evidence contracts/common.md#principled-implementation Code-unit order is locale-independent and total over distinct paths, and the duration check compares the stored seconds with the same IEEE division that produced them, so an exact record passes and any edited count or duration is refused.
 * @evidence contracts/common.md#clear-and-simple-design One sort and one validating copy produce the plan's asset list; the WAVE-specific relations live in `validWaveAudioIdentity` and the digest grammar in `validDigest`, so this function holds only the provenance-independent rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The placeholder format is typed from `IAutoMovieProductionSoundPlan`'s fixed rate and channel count rather than chosen here, no path is special-cased, and an invalid asset throws rather than being dropped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the ordering and why, every refusal, the placeholder format, and that the input is left unchanged.
 * @evidence contracts/performance.md#efficient-algorithms For A assets the cost is an O(A log A) sort plus one O(1) set lookup and constant checks per asset and one deep copy of each identity; the sort is needed because the order is part of the plan bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner calls it once per plan on that plan's own inputs, so there is no completed equivalent work to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The path set and the sorted array are local and released on return; the returned copies, owned by the caller, hold one record per asset and no handle or task.
 */
export const normalizeAudioAssets: (
  assets: readonly IAutoMovieProductionAudioAssetIdentity[],
) => IAutoMovieProductionAudioAssetIdentity[] = (
  assets: readonly IAutoMovieProductionAudioAssetIdentity[],
): IAutoMovieProductionAudioAssetIdentity[] => {
  const paths: Set<string> = new Set();
  return [...assets]
    .sort(
      (
        left: IAutoMovieProductionAudioAssetIdentity,
        right: IAutoMovieProductionAudioAssetIdentity,
      ): number => compareCodeUnits(left.path, right.path),
    )
    .map(
      (
        asset: IAutoMovieProductionAudioAssetIdentity,
      ): IAutoMovieProductionAudioAssetIdentity => {
        if (
          asset.path.trim().length === 0 ||
          paths.has(asset.path) ||
          validDigest(asset.digest) === false ||
          Number.isSafeInteger(asset.sampleRate) === false ||
          asset.sampleRate <= 0 ||
          Number.isSafeInteger(asset.channels) === false ||
          asset.channels <= 0 ||
          Number.isSafeInteger(asset.sourceFrames) === false ||
          asset.sourceFrames <= 0 ||
          asset.durationSeconds !== asset.sourceFrames / asset.sampleRate ||
          (asset.kind !== "placeholder-audio-stem" && asset.kind !== "wave") ||
          (asset.kind === "placeholder-audio-stem" &&
            (asset.sampleRate !== PLACEHOLDER_SAMPLE_RATE ||
              asset.channels !== PLACEHOLDER_CHANNELS)) ||
          (asset.kind === "wave" && validWaveAudioIdentity(asset) === false)
        )
          throw new Error(
            `Audio asset "${asset.path}" has invalid identity, duration, sample rate, channels, or duplicate ownership.`,
          );
        paths.add(asset.path);
        return structuredClone(asset);
      },
    );
};
