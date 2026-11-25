import type { AutoMovieFfmpegStaticPath } from "./AutoMovieFfmpegStaticPath";

/** What finding FFmpeg reads. */
export interface IAutoMovieFfmpegSources {
  /** The environment, read for `FFMPEG_PATH`. */
  env: Readonly<Record<string, string | undefined>>;

  /**
   * Loads `ffmpeg-static` from the production, throwing when it is not
   * installed there.
   */
  load: (id: "ffmpeg-static") => AutoMovieFfmpegStaticPath;
}
