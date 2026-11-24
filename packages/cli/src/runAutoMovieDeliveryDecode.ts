import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieLoudnessMeter,
} from "@automovie/interface";

import { planAutoMovieDeliveryDecode } from "./planAutoMovieDeliveryDecode";
import { readAutoMovieDeliveryDecode } from "./readAutoMovieDeliveryDecode";
import { runAutoMovieDeliveryAudioDecode } from "./runAutoMovieDeliveryAudioDecode";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

type Audit = IAutoMovieDeliveryContentAudit.IProps;

/**
 * Decodes one encoded delivery to obtain native timing and content evidence.
 * The primary video decode also inventories the source. Audio is decoded only
 * when the source lists a primary audio stream.
 *
 * @param binary The resolved FFmpeg executable.
 * @param artifact The same delivery artifact whose bytes the host hashes.
 * @param expected The commissioned frame count and rational frame rate.
 * @param thresholds Effective video detector and silence thresholds.
 * @param run Process owner with separate binary and text output channels.
 * @param meter Creates the render's loudness meter, when the decoded audio's
 *   loudness and true peak are measured.
 * @returns Native evidence, absence or reasoned uncovered status per stream.
 */
export async function runAutoMovieDeliveryDecode(
  binary: string,
  artifact: string,
  expected: Pick<Audit["expected"], "frameCount" | "frameRate">,
  thresholds: Audit["thresholds"],
  run: typeof runAutoMovieFfmpeg = runAutoMovieFfmpeg,
  meter?: (channels: 1 | 2) => IAutoMovieLoudnessMeter,
): Promise<Audit["streams"]> {
  try {
    const log = await run(
      binary,
      planAutoMovieDeliveryDecode(artifact, expected.frameRate, thresholds),
    );
    const decoded = readAutoMovieDeliveryDecode(log, expected);
    const audio =
      decoded.audioIndex === undefined
        ? decoded.audio
        : await runAutoMovieDeliveryAudioDecode(
            binary,
            artifact,
            decoded.audioIndex,
            thresholds.silence,
            run,
            meter,
          );
    return { video: decoded.video, audio };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      video: { status: "uncovered", reason },
      audio: {
        status: "uncovered",
        reason: "The delivery input stream listing was incomplete",
      },
    };
  }
}
