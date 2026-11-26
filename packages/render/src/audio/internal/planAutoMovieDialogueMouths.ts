import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

/** The rate `admitAutoMovieFilmDialogue` decodes every line at. */
const SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/**
 * Plan a film's dialogue mouths from its admitted lines: what each line gives
 * its bound actor's mouth over its speech span.
 *
 * A line enters when its speaker binds to exactly one actor; any other line
 * moves no mouth. Every entered line carries its envelope jaw, one opening per
 * frame of its span from the frame level of its own 48 kHz samples
 * (`AutoMovieEngineSound.dialogueFrameLevels`,
 * `AutoMovieEngineSound.dialogueEnvelopeJaw`). A line whose receipt has phoneme
 * chunks also carries its viseme ranges, each phoneme an equal share of its
 * chunk mapped to its viseme (`AutoMovieEngineSound.phonemesToVisemes`) and
 * placed from the line's start frame on the emission clock
 * (`AutoMovieEngineSound.joinDialogueVisemes`). The same lines and clock give
 * the same track, so a capture and the delivered video hand a subject the same
 * mouths.
 *
 * @param props The admitted lines, the film's speaker bindings and the frame
 *   rate the lines were admitted on.
 * @returns The film's mouth track.
 */
export function planAutoMovieDialogueMouths(props: {
  /** The admitted lines, from `admitAutoMovieFilmDialogue`. */
  lines: readonly IAutoMovieMixFilmSound.ILine[];

  /** The film's speaker-to-actor bindings. */
  speakers: readonly IAutoMovieDialogueSpeakerBinding[];

  /** The film's exact frame rate the lines were admitted on. */
  frameRate: IAutoMovieProductionFrameRate;
}): IAutoMovieDialogueMouthTrack {
  const fps: number = props.frameRate.numerator / props.frameRate.denominator;
  const clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  > = { fps, frameRate: props.frameRate, sampleRate: SAMPLE_RATE };
  const lines: IAutoMovieDialogueMouthTrack.ILine[] = [];
  for (const entry of props.lines) {
    const bound: IAutoMovieDialogueSpeakerBinding[] = props.speakers.filter(
      (binding: IAutoMovieDialogueSpeakerBinding): boolean =>
        entry.line.speaker !== undefined &&
        binding.speaker === entry.line.speaker,
    );
    if (bound.length !== 1) continue;

    const jaw: number[] = Array.from(
      AutoMovieEngineSound.dialogueFrameLevels(
        clock,
        entry.line,
        entry.samples,
      ),
      AutoMovieEngineSound.dialogueEnvelopeJaw,
    );
    const chunks: readonly IAutoMovieProductionPhonemeChunk[] =
      entry.receipt.phonemeChunks ?? [];
    let ranges: IAutoMovieDialogueMouthTrack.ILine["ranges"] = null;
    if (chunks.length !== 0) {
      const joined: IAutoMovieDialogueVisemeCompilation =
        AutoMovieEngineSound.joinDialogueVisemes({
          line: entry.line,
          bindings: bound,
          visemes: AutoMovieEngineSound.phonemesToVisemes({ chunks }),
          sourceSampleRate: entry.receipt.sourceSampleRate,
          fps,
        });
      if (joined.timeline === null)
        throw new Error(
          `Dialogue line "${entry.line.id}" bound to one actor did not join its visemes.`,
        );
      ranges = joined.timeline.ranges;
    }
    lines.push({
      line: entry.line.id,
      actor: bound[0]!.actor,
      startFrame: entry.line.startFrame,
      endFrame: entry.line.endFrame,
      jaw,
      ranges,
    });
  }
  return { fps, lines };
}
