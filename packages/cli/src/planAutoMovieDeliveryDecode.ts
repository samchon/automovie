import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { planAutoMovieDeliveryInput } from "./planAutoMovieDeliveryInput";

/**
 * Plans a read-only FFmpeg pass over the primary decoded video stream.
 *
 * The native freeze detector starts early so a freeze extending to EOF can
 * qualify after the last frame's duration is included. The audit decides the
 * final minimum duration and removes detector intervals containing one frame.
 *
 * The same plan measures the encoder's own image-sequence input when given
 * the input options the encoder used, such as its `-framerate`.
 *
 * @param path The delivery file, or the encoder's input pattern, to decode.
 * @param frameRate The commissioned rational delivery frame rate.
 * @param thresholds The delivery audit's detector settings.
 * @param inputOptions Demuxer options placed before the input, empty for a delivery file.
 * @returns Arguments for a shell-free invocation with evidence on stderr.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the indexed stream, native detector behavior, the optional input options and stderr evidence.
 * @evidence contracts/development/implementation.md#principled-implementation Maintains input timestamps with copyts, measures decoded pictures before output sync, and observes decoded duration independently of the commissioned clock. The delivered file and the encoder's input go through one identical filter chain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one filter chain followed by a null output.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supplies the input file as a separate argument and asks FFmpeg to fail on decoding errors.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses one decode for both video detectors. Disables extra per-frame checksums and pixel statistics.
 */
export function planAutoMovieDeliveryDecode(
  path: string,
  frameRate: IAutoMovieDeliveryContentAudit.Ratio,
  thresholds: IAutoMovieDeliveryContentAudit.IThresholds,
  inputOptions: readonly string[] = [],
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
    ...planAutoMovieDeliveryInput(path, inputOptions),
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
