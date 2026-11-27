import { planAutoMovieVideoEncoding as planAutoMovieVideoEncodingImplementation } from "./delivery/internal/planAutoMovieVideoEncoding.js";

import { type IAutoMovieRenderSpec, type IAutoMovieRenderAndSeeResult, type IAutoMovieRenderAndSeeRequest, type IAutoMovieRenderResult, type IAutoMovieRenderAdapters, type IAutoMoviePlanVideoEncodingResult, type IAutoMoviePlanVideoEncodingProps } from "@automovie/interface";
import { ffmpegArgs as ffmpegArgsImplementation } from "./internal/ffmpegArgs.js";
import { renderAndSee as renderAndSeeImplementation } from "./internal/renderAndSee.js";
import { renderVideo as renderVideoImplementation } from "./internal/renderVideo.js";

/** Public operations for Auto Movie Render Video. */
export namespace AutoMovieRenderVideo {
  /**
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
  export function ffmpegArgs(spec: IAutoMovieRenderSpec, inputPattern: string, outputPath: string): string[] {
    return ffmpegArgsImplementation(spec, inputPattern, outputPath);
  }

  /**
   * Render a clip and return the encoded output plus explicit frame artifacts.
   * The function still performs only deterministic orchestration over injected
   * host I/O; its value is the metadata contract that lets an agent inspect what
   * was captured without guessing paths or sample times.
   */
  export function renderAndSee(request: IAutoMovieRenderAndSeeRequest): Promise<IAutoMovieRenderAndSeeResult> {
    return renderAndSeeImplementation(request);
  }

  /**
   * Render a clip of `durationSeconds` into a video, deterministically: compute
   * the frame schedule, capture each frame through the host adapter at its exact
   * `t = i / fps`, then encode the sequence with the pinned ffmpeg args.
   *
   * The schedule and effect order are deterministic; pixel and encoder output
   * depend on the supplied host. The host also owns file and task cleanup when
   * capture or encoding fails.
   */
  export function render(spec: IAutoMovieRenderSpec, durationSeconds: number, dir: string, outputPath: string, adapters: IAutoMovieRenderAdapters): Promise<IAutoMovieRenderResult> {
    return renderVideoImplementation(spec, durationSeconds, dir, outputPath, adapters);
  }

  /**
   * Admit a drawn video's exact clock and raster and plan the one FFmpeg run that
   * encodes its frames, with an optional soundtrack.
   *
   * The frame count is `durationSeconds × fps` and must be a whole number from 1
   * to a million, so the clock has no partial frame to round. The raster must be
   * positive and even on both sides, which the `yuv420p` chroma layout needs. The
   * encoder and following audit share the exact rational rate selected for the
   * commissioned numeric frame rate. The arguments are `ffmpegArgs` over the
   * frame pattern in `frameDir` (BT.709 full-range samples tagged as sRGB, no
   * B-frames), quiet below warnings, with the movie and video track timescales
   * both set to the exact rate's numerator so a frame lasts its denominator in
   * ticks and the movie clock never rounds the runtime, four encoder threads and
   * the `medium` preset, `-frames:v` and `-t` pinned to the clock, and the video
   * stream mapped explicitly; a soundtrack is the second input, padded with
   * silence (`apad`) and cut at the clock as 48 kHz stereo AAC at 192 kb/s, and
   * without one the output has no audio stream.
   *
   * It throws naming what is refused: a clock that is not a whole number of
   * frames in range, an odd or empty raster, and a blank soundtrack path.
   */
  export function planVideoEncoding(props: IAutoMoviePlanVideoEncodingProps): IAutoMoviePlanVideoEncodingResult {
    return planAutoMovieVideoEncodingImplementation(props);
  }
}
