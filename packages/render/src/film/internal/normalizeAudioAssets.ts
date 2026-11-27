import { AutoMovieEngineText } from "@automovie/engine";
import type {
  IAutoMovieProductionAudioAssetIdentity,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { validDigest } from "./validDigest";
import { validWaveAudioIdentity } from "./validWaveAudioIdentity";

/*
 * Copy the planned audio asset identities sorted by path, refusing any that is
 * invalid.
 *
 * Paths sort by UTF-16 code unit, so one input yields one plan on every host.
 * Throws when a path is blank or repeated, the digest is not a SHA-256 content
 * digest, the sample rate, channel count or sample-frame count is not a
 * positive safe integer, `durationSeconds` is not exactly `sourceFrames /
 * sampleRate`, the kind is unknown, a placeholder stem is not 48 kHz stereo, or
 * a WAVE identity fails `validWaveAudioIdentity`. The input is not changed.
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
      ): number => AutoMovieEngineText.compareCodeUnits(left.path, right.path),
    )
    .map(
      (
        asset: IAutoMovieProductionAudioAssetIdentity,
      ): IAutoMovieProductionAudioAssetIdentity => {
        if (
          asset.path.trim().length === 0 ||
          paths.has(asset.path) ||
          validDigest(asset.digest) === false ||
          asset.sampleRate <= 0 ||
          asset.channels <= 0 ||
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

/*
 * Sample rate of a placeholder stem: the sound plan's fixed mix rate.
 */
const PLACEHOLDER_SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/*
 * Channel count of a placeholder stem: the sound plan's fixed stereo mix.
 */
const PLACEHOLDER_CHANNELS: IAutoMovieProductionSoundPlan["channels"] = 2;
