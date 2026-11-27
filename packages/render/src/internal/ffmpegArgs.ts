import type { IAutoMovieRenderSpec } from "@automovie/interface";

/*
 * The ffmpeg argument vector that encodes a `frameName` image sequence into the
 * spec's H.264 MP4.
 *
 * The vector is `-y -framerate <fps> -i <inputPattern> -c:v libx264 -pix_fmt
 * <pixelFormat> -crf <crf> -bf 0 -vf scale=w=<width>:h=<height>:
 * out_color_matrix=bt709:out_range=full -color_primaries bt709 -color_trc
 * iec61966-2-1 -colorspace bt709 -color_range pc -r <fps> -movflags +faststart
 * <outputPath>`: input and output rates fixed to `frameFormat.fps`, the spec's
 * pixel format and CRF, the output raster pinned to `frameFormat` so the video
 * matches the pose-keypoint sidecar's aspect whatever the capture viewport was,
 * and the movie box moved first for progressive playback. The raster must be
 * even, which `yuv420p` requires; this function does not check it, and an odd
 * raster fails inside ffmpeg.
 *
 * Nothing here tone maps: the frames arrive as sRGB images and the curve that
 * produced them is a renderer setting of the capture host, owned by the scene's
 * `environment` with the spec's `toneMapping` as the delivery default. The one
 * `scale` filter converts those RGB samples to YUV with the BT.709 matrix at
 * full range, and the stream and the MP4 `colr` box are tagged with what the
 * samples now are: BT.709 primaries (1), the sRGB transfer (13), the BT.709
 * matrix (1) and full range, the delivery profile's sRGB declaration. `-bf 0`
 * turns B-frames off, so every sample is presented in decode order from
 * composition time zero, which the delivery profile requires. `fps` is written
 * as its decimal string, so a non-integer rate reaches ffmpeg as that decimal
 * rather than as a reduced rational.
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
  "-bf",
  "0",
  "-vf",
  `scale=w=${spec.frameFormat.width}:h=${spec.frameFormat.height}:out_color_matrix=bt709:out_range=full`,
  "-color_primaries",
  "bt709",
  "-color_trc",
  "iec61966-2-1",
  "-colorspace",
  "bt709",
  "-color_range",
  "pc",
  "-r",
  `${spec.frameFormat.fps}`,
  "-movflags",
  "+faststart",
  outputPath,
];
