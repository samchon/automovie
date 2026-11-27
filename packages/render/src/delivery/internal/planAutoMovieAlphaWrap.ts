import type { IAutoMoviePlanAlphaWrapProps } from "@automovie/interface";
import { guidePassFramePattern } from "../../internal/guidePassFramePattern.js";

/*
 * The FFmpeg arguments that wrap a transparent render's RGBA PNG frames,
 * without re-encoding, into a QuickTime `.mov` whose every sample is one frame
 * file's bytes.
 *
 * The PNG sequence is read at the exact frame rate as `-framerate <num>/<den>`
 * from frame 0, `-c:v copy` stores each file as one sample of a `png` video
 * track, `-an` writes no audio track, and `-map_metadata -1` with the bit-exact
 * flags writes no encoder or creation-time metadata, so the same frames always
 * give the same file. The frame pattern and rate sit in the same places as in
 * `planAutoMovieVideoEncoding`'s vector, so the delivery audit reads the drawn
 * frames from either.
 *
 * It throws for a frame count that is not a positive whole number.
 */
export function planAutoMovieAlphaWrap(props: IAutoMoviePlanAlphaWrapProps): string[] {
  if (!(props.frameCount > 0))
    throw new Error(
      `An alpha wrap needs a positive whole number of frames, not ${props.frameCount}`,
    );
  const pattern: string = guidePassFramePattern("beauty");
  return [
    "-y",
    "-v",
    "error",
    "-framerate",
    `${props.frameRate[0]}/${props.frameRate[1]}`,
    "-i",
    `${props.frameDir}/${pattern}`,
    "-frames:v",
    String(props.frameCount),
    "-map",
    "0:v:0",
    "-c:v",
    "copy",
    "-an",
    "-map_metadata",
    "-1",
    "-fflags",
    "+bitexact",
    "-flags:v",
    "+bitexact",
    props.outputPath,
  ];
}
