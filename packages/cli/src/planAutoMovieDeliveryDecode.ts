import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

/**
 * Plans a read-only FFmpeg pass over the primary decoded video stream.
 *
 * The native freeze detector starts early so a freeze extending to EOF can
 * qualify after the last frame's duration is included. The audit decides the
 * final minimum duration and removes detector intervals containing one frame.
 *
 * @param path The delivery file to decode.
 * @param frameRate The commissioned rational delivery frame rate.
 * @param thresholds The delivery audit's detector settings.
 * @returns Arguments for a shell-free invocation with evidence on stderr.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the indexed stream, native detector behavior and stderr evidence.
 * @evidence contracts/development/implementation.md#principled-implementation Maintains input timestamps with copyts, measures decoded pictures before output sync, and observes decoded duration independently of the commissioned clock.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one filter chain followed by a null output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supplies the input file as a separate argument and asks FFmpeg to fail on decoding errors.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses one decode for both video detectors. Disables extra per-frame checksums and pixel statistics.
 */
export function planAutoMovieDeliveryDecode(
  path: string,
  frameRate: IAutoMovieDeliveryContentAudit.Ratio,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds,
): string[] {
  const [frames, seconds] = frameRate;
  const { minimumDuration, maximumMeanDifference } = thresholds.frozen;
  const freezeSeconds =
    (minimumDuration.ticks * minimumDuration.timeBase[0]) /
    minimumDuration.timeBase[1];
  const detectorMicroseconds = Math.max(
    0,
    Math.floor((freezeSeconds - seconds / frames) * 1_000_000) - 1,
  );
  if (!Number.isSafeInteger(detectorMicroseconds))
    throw new Error("The delivery freeze detector duration is invalid");

  return [
    ...deliveryInput(path),
    "-map",
    "0:v:0",
    "-an",
    "-vf",
    [
      "showinfo=checksum=0",
      "blackdetect=d=0:" +
        "pic_th=" +
        thresholds.black.minimumPictureRatio +
        ":pix_th=" +
        thresholds.black.maximumPixelThreshold,
      "freezedetect=n=" +
        maximumMeanDifference +
        ":d=" +
        detectorMicroseconds +
        "us",
      "metadata=mode=print",
    ].join(","),
    "-fps_mode",
    "passthrough",
    "-f",
    "null",
    "-",
  ];
}

/**
 * Plans a read-only decode of a known present audio stream into interleaved
 * little-endian 32-bit floating point samples. Its decoded frame log and PCM
 * byte count provide independent timing and content evidence.
 *
 * @param path The delivery file to decode.
 * @returns Shell-free FFmpeg arguments with PCM on stdout and frame timing on stderr.
 * @evidence contracts/development/common.md#meaningful-documentation States which stream is decoded, the precise PCM format and both output channels.
 * @evidence contracts/development/implementation.md#principled-implementation Logs the audio frames after converting sample format and before writing PCM. Does not request a different sample rate or channel layout.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects one stream, logs its sample frames and writes an unpadded PCM output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passes the file path directly and preserves decoded timestamps with copyts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses one streaming decode, only for an artifact with an audio stream.
 */
export function planAutoMovieDeliveryAudioDecode(path: string): string[] {
  return [
    ...deliveryInput(path),
    "-map",
    "0:a:0",
    "-vn",
    "-af",
    "aformat=sample_fmts=flt,ashowinfo",
    "-c:a",
    "pcm_f32le",
    "-f",
    "f32le",
    "pipe:1",
  ];
}

/** Common read-only input arguments for both delivery decoders. */
function deliveryInput(path: string): string[] {
  return [
    "-hide_banner",
    "-nostdin",
    "-nostats",
    "-xerror",
    "-copyts",
    "-i",
    path,
  ];
}
