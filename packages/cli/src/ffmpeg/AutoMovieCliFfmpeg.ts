import type { IAutoMovieFfmpegSources } from "./IAutoMovieFfmpegSources";
import { resolveAutoMovieFfmpeg } from "./internal/resolveAutoMovieFfmpeg";
import { runAutoMovieFfmpeg } from "./internal/runAutoMovieFfmpeg";

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
    output?: AutoMovieCliFfmpeg.IOutput,
  ): Promise<string> {
    return runAutoMovieFfmpeg(binary, args, accept, output);
  }
}

/** Types shared by the FFmpeg operations. */
export namespace AutoMovieCliFfmpeg {
  /** Optional consumers for a decoder that produces binary and text evidence. */
  export interface IOutput {
    /** Receives each binary chunk written to FFmpeg's standard output. */
    stdout?: (chunk: Buffer) => void;
    /** Receives each UTF-8 text chunk written to FFmpeg's standard error. */
    stderr?: (chunk: string) => void;
  }
}
