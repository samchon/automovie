import type { IAutoMovieFfmpegSources } from "../IAutoMovieFfmpegSources";
import { resolveAutoMovieFfmpeg } from "./internal/resolveAutoMovieFfmpeg";
import { runAutoMovieFfmpeg, type IAutoMovieFfmpegOutput } from "./internal/runAutoMovieFfmpeg";

/** Operations for finding and running a production's FFmpeg binary. */
export class AutoMovieCliFfmpeg {
  /** Resolve FFmpeg from the environment or the production's ffmpeg-static. */
  public static resolve(props: IAutoMovieFfmpegSources): string {
    return resolveAutoMovieFfmpeg(props);
  }

  /** Run FFmpeg and return its captured error output. */
  public static run(
    binary: string,
    args: readonly string[],
    accept: (code: number | null) => boolean = (code: number | null): boolean =>
      code === 0,
    output?: IAutoMovieFfmpegOutput,
  ): Promise<string> {
    return runAutoMovieFfmpeg(binary, args, accept, output);
  }
}