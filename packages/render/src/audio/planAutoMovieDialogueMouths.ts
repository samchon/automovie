import {
  autoMovieDialogueEnvelopeJaw,
  joinAutoMovieDialogueVisemes,
  levelProductionDialogueLine,
  productionDialogueFrameLevels,
  productionPhonemesToVisemes,
  resolveProductionLoudness,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieLoudnessIntent,
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
 * frame of its span from the frame level of the line as the mix places it:
 * faded and levelled to the dialogue target of `loudness`, EBU R 128 without
 * one (`levelProductionDialogueLine`, `productionDialogueFrameLevels`,
 * `autoMovieDialogueEnvelopeJaw`). So two takes of a line that the mix levels
 * to the same audio open the jaw alike, whatever level each was generated at. A
 * line whose receipt has phoneme chunks also carries its viseme ranges, each
 * phoneme an equal share of its chunk mapped to its viseme
 * (`productionPhonemesToVisemes`) and placed from the line's start frame on the
 * emission clock its samples and speech span share
 * (`joinAutoMovieDialogueVisemes`). The same lines, loudness and clock give the
 * same track, so a capture and the delivered video hand a subject the same
 * mouths.
 *
 * @param props The admitted lines, the film's speaker bindings, the frame rate
 *   the lines were admitted on and the film's loudness targets.
 * @returns The film's mouth track.
 * @throws {Error} When a line cannot be levelled, as the mix refuses it.
 */
export function planAutoMovieDialogueMouths(props: {
  /** The admitted lines, from `admitAutoMovieFilmDialogue`. */
  lines: readonly IAutoMovieMixFilmSound.ILine[];

  /** The film's speaker-to-actor bindings. */
  speakers: readonly IAutoMovieDialogueSpeakerBinding[];

  /** The film's exact frame rate the lines were admitted on. */
  frameRate: IAutoMovieProductionFrameRate;

  /**
   * The film's loudness targets, which level each line as the mix does; absent,
   * EBU R 128.
   */
  loudness?: IAutoMovieLoudnessIntent | undefined;
}): IAutoMovieDialogueMouthTrack {
  const fps: number = props.frameRate.numerator / props.frameRate.denominator;
  const clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  > = { fps, frameRate: props.frameRate, sampleRate: SAMPLE_RATE };
  const targetLufs: number = resolveProductionLoudness(
    props.loudness,
  ).dialogueLufs;
  const lines: IAutoMovieDialogueMouthTrack.ILine[] = [];
  for (const entry of props.lines) {
    const bound: IAutoMovieDialogueSpeakerBinding[] = props.speakers.filter(
      (binding: IAutoMovieDialogueSpeakerBinding): boolean =>
        entry.line.speaker !== undefined &&
        binding.speaker === entry.line.speaker,
    );
    if (bound.length !== 1) continue;

    const levelled: Float64Array = levelProductionDialogueLine({
      id: entry.line.id,
      samples: entry.samples,
      targetLufs,
    }).placed;
    const jaw: number[] = Array.from(
      productionDialogueFrameLevels(clock, entry.line, levelled),
      autoMovieDialogueEnvelopeJaw,
    );
    const chunks: readonly IAutoMovieProductionPhonemeChunk[] =
      entry.receipt.phonemeChunks ?? [];
    let ranges: IAutoMovieDialogueMouthTrack.ILine["ranges"] = null;
    if (chunks.length !== 0) {
      const joined: IAutoMovieDialogueVisemeCompilation =
        joinAutoMovieDialogueVisemes({
          line: entry.line,
          bindings: bound,
          visemes: productionPhonemesToVisemes({ chunks }),
          sourceSampleRate: entry.receipt.sourceSampleRate,
          sourceSamples: entry.receipt.sourceSamples,
          clock,
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
