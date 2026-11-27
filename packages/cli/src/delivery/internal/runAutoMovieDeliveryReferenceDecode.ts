import type { IAutoMovieDeliveryContentAudit } from "@automovie/interface";

import { planAutoMovieDeliveryDecode } from "./planAutoMovieDeliveryDecode";
import { readAutoMovieDeliveryDecode } from "./readAutoMovieDeliveryDecode";
import { runAutoMovieDeliverySourceAudioDecode } from "./runAutoMovieDeliverySourceAudioDecode";
import { runAutoMovieFfmpeg } from "../../ffmpeg/internal/runAutoMovieFfmpeg";

/*
 * Measures what the encoder was given, with the same detectors and thresholds
 * as the delivered file: the drawn image sequence and the soundtrack as the
 * encoder pads and cuts it. The audit attributes a delivered black, frozen or
 * silent interval to the drawn source when this reference shows it too.
 *
 * Both inputs are read from the encoder's own argument vector, so the reference
 * is exactly what produced the delivery: the first `-i` with the `-framerate`
 * before it is the picture, a second `-i` is the soundtrack, and the last `-t`
 * is the cut. Call it while the drawn frames still exist.
 * Parameter binary: The FFmpeg executable already resolved by the delivery host.
 * Parameter encoder: The argument vector the delivery encode ran with.
 * Parameter expected: The commissioned frame count and rational frame rate.
 * Parameter thresholds: The effective detector settings of the delivery audit.
 * Parameter run: The established FFmpeg process owner.
 * Returns: Reference evidence per medium: decoded, missing when the encoder had
 * no soundtrack, or uncovered with its reason.
 */
export async function runAutoMovieDeliveryReferenceDecode(
  binary: string,
  encoder: readonly string[],
  expected: Pick<Audit["expected"], "frameCount" | "frameRate">,
  thresholds: Audit["thresholds"],
  run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
): Promise<{ video: Stream; audio: Stream }> {
  const inputs = readEncoderInputs(encoder);
  if (inputs === null) {
    const reason = "The delivery encoder arguments name no picture input";
    return {
      video: { status: "uncovered", reason },
      audio: { status: "uncovered", reason },
    };
  }

  let video: Stream;
  try {
    const log = await run(
      binary,
      planAutoMovieDeliveryDecode(
        inputs.picture,
        expected.frameRate,
        thresholds,
        ["-framerate", inputs.frameRate],
      ),
    );
    video = (await readAutoMovieDeliveryDecode(log, expected)).video;
  } catch (error) {
    video = {
      status: "uncovered",
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  const audio: Stream =
    inputs.soundtrack === null
      ? { status: "missing" }
      : inputs.seconds === null
        ? {
            status: "uncovered",
            reason: "The delivery encoder arguments name no duration",
          }
        : await runAutoMovieDeliverySourceAudioDecode(
            binary,
            inputs.soundtrack,
            inputs.seconds,
            thresholds.silence,
            run,
          );
  return { video, audio };
}

type Audit = IAutoMovieDeliveryContentAudit.IProps;
type Stream = IAutoMovieDeliveryContentAudit.Stream;

/*
 * Reads the picture input, its frame rate, an optional soundtrack and the cut
 * from an encoder vector.
 */
function readEncoderInputs(encoder: readonly string[]): {
  picture: string;
  frameRate: string;
  soundtrack: string | null;
  seconds: string | null;
} | null {
  const first = encoder.indexOf("-i");
  const rate = encoder.lastIndexOf("-framerate", first);
  const picture = encoder[first + 1];
  const frameRate = encoder[rate + 1];
  if (first < 0 || rate < 0 || picture === undefined || frameRate === undefined)
    return null;
  const second = encoder.indexOf("-i", first + 2);
  const cut = encoder.lastIndexOf("-t");
  return {
    picture,
    frameRate,
    soundtrack: second < 0 ? null : (encoder[second + 1] ?? null),
    seconds: cut < 0 ? null : (encoder[cut + 1] ?? null),
  };
}
