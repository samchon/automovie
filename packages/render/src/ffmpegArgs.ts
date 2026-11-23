import type { IAutoMovieRenderSpec } from "@automovie/interface";

/**
 * The ffmpeg argument vector that encodes a `frameName` image sequence into the
 * spec's H.264 MP4.
 *
 * The vector is `-y -framerate <fps> -i <inputPattern> -c:v libx264 -pix_fmt
 * <pixelFormat> -crf <crf> -r <fps> -s <width>x<height> -movflags +faststart
 * <outputPath>`: input and output rates fixed to `frameFormat.fps`, the spec's
 * pixel format and CRF, the output raster pinned to `frameFormat` so the video
 * matches the pose-keypoint sidecar's aspect whatever the capture viewport was,
 * and the movie box moved first for progressive playback. The raster must be
 * even, which `yuv420p` requires; this function does not check it, and an odd
 * raster fails inside ffmpeg.
 *
 * Nothing here tone maps: the frames arrive as sRGB images and the curve that
 * produced them is a renderer setting of the capture host, owned by the scene's
 * `environment` with the spec's `toneMapping` as the delivery default. No
 * colour matrix, range or colour description is passed either, so ffmpeg
 * converts the RGB frames with its default matrix and range and the stream
 * carries no colour tag; the delivery profile's sRGB declaration is not
 * produced by this vector. `fps` is written as its decimal string, so a
 * non-integer rate reaches ffmpeg as that decimal rather than as a reduced
 * rational.
 */
export const ffmpegArgs: (
  spec: IAutoMovieRenderSpec,
  inputPattern: string,
  outputPath: string,
) => string[] = (
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
