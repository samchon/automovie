import type { IAutoMovieRenderSpec } from "@automovie/interface";

/**
 * The ffmpeg argument vector that encodes a `frameName` image sequence into
 * the spec's H.264 MP4.
 *
 * The vector is `-y -framerate <fps> -i <inputPattern> -c:v libx264 -pix_fmt
 * <pixelFormat> -crf <crf> -r <fps> -s <width>x<height> -movflags +faststart
 * <outputPath>`: input and output rates fixed to `frameFormat.fps`, the spec's
 * pixel format and CRF, the output raster pinned to `frameFormat` so the video
 * matches the pose-keypoint sidecar's aspect whatever the capture viewport
 * was, and the movie box moved first for progressive playback. The raster
 * must be even, which `yuv420p` requires; this function does not check it,
 * and an odd raster fails inside ffmpeg.
 *
 * Nothing here tone maps: the frames arrive as sRGB images and the curve that
 * produced them is a renderer setting of the capture host, owned by the
 * scene's `environment` with the spec's `toneMapping` as the delivery default.
 * No colour matrix, range or colour description is passed either, so ffmpeg
 * converts the RGB frames with its default matrix and range and the stream
 * carries no colour tag; the delivery profile's sRGB declaration is not
 * produced by this vector. `fps` is written as its decimal string, so a
 * non-integer rate reaches ffmpeg as that decimal rather than as a reduced
 * rational.
 *
 * @evidence contracts/common.md#principled-implementation The arguments are documented ffmpeg options passed in one fixed order, with `-framerate` setting the image-sequence input clock and `-r` the output clock so no frame is dropped or duplicated, and `-s` scaling to the spec raster; the unresolved limitations are the unspecified RGB-to-YUV conversion and missing colour tags, and the decimal rate, both stated in the doc.
 * @evidence contracts/common.md#clear-and-simple-design The single render, the sequence plan and the chunk plan all encode through this one vector, and the caller supplies only the input pattern and output path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every spec value is passed verbatim, the CRF unchecked as the spec documents, and no host or spec is special-cased; the missing colour flags are the gap the doc names, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation The doc spells the exact vector, why the raster is pinned, the unchecked even-raster requirement, who owns tone mapping, and the colour and rate limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Building a fixed argument array chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each encode builds its vector once, cheaper than caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function returns an array of strings and starts no process; the caller owns the ffmpeg process it may start.
 * @author Samchon
 */
export const ffmpegArgs: (spec: IAutoMovieRenderSpec, inputPattern: string, outputPath: string) => string[] = (
  spec: IAutoMovieRenderSpec,
  inputPattern: string,
  outputPath: string,
): string[] => [
  "-y",
  "-framerate",
  `${spec.frameFormat.fps}`,
  "-i",
  inputPattern,
  "-c:v",
  "libx264",
  "-pix_fmt",
  spec.pixelFormat,
  "-crf",
  `${spec.crf}`,
  "-r",
  `${spec.frameFormat.fps}`,
  "-s",
  `${spec.frameFormat.width}x${spec.frameFormat.height}`,
  "-movflags",
  "+faststart",
  outputPath,
];
