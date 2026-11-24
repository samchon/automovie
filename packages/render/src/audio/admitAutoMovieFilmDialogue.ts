import { productionSpeechEndFrame } from "@automovie/engine";
import { admitProductionTtsReceipt } from "@automovie/ingest";
import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieFilmSound,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

/** The mixer's fixed rate; every adopted line is decoded to it. */
const SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/**
 * Admit a film's adopted lines and place each over its speech span on the film
 * clock.
 *
 * Every line's WAVE file and receipt are read through `read`, so render opens
 * no file itself. Ingest admits each receipt against its line and bytes and
 * decodes the line at 48 kHz. A line's speech span ends at
 * `productionSpeechEndFrame` of its 48 kHz sample count from its start frame,
 * on the clock the mix places it with. The mix, the dialogue mouths and the
 * lip-sync measure all take their lines from here, so they agree on every
 * sample and span.
 *
 * It refuses, before reading any file, a line id that repeats; it refuses a
 * file `read` cannot supply, naming the path, so a wrong path never plays a
 * stand-in; it refuses a speech span past the film's last frame; and it passes
 * on every refusal of admission and decoding.
 *
 * @param props The sound list, the film clock and the file reader.
 * @returns Each adopted line in list order, with its span, admitted receipt and
 *   48 kHz samples.
 */
export async function admitAutoMovieFilmDialogue(
  props: Pick<
    IAutoMovieMixFilmSound.IProps,
    "sound" | "frameRate" | "totalFrames" | "read"
  >,
): Promise<IAutoMovieMixFilmSound.ILine[]> {
  const seen: Set<string> = new Set();
  for (const line of props.sound.lines) {
    if (seen.has(line.id))
      throw new Error(
        `Film sound declares line id "${line.id}" more than once.`,
      );
    seen.add(line.id);
  }
  const read: (path: string) => Promise<Uint8Array> = async (
    path: string,
  ): Promise<Uint8Array> => {
    try {
      return await props.read(path);
    } catch (cause) {
      throw new Error(`Film sound cannot read "${path}".`, { cause });
    }
  };

  const clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  > = {
    fps: props.frameRate.numerator / props.frameRate.denominator,
    frameRate: props.frameRate,
    sampleRate: SAMPLE_RATE,
  };
  const lines: IAutoMovieMixFilmSound.ILine[] = [];
  for (const line of props.sound.lines) {
    const admitted: IAutoMovieAdmitProductionTtsReceipt.IResult =
      admitProductionTtsReceipt({
        line,
        pcmPath: line.pcm,
        pcm: await read(line.pcm),
        receiptPath: line.receipt,
        receipt: await read(line.receipt),
        sampleRate: SAMPLE_RATE,
      });
    const endFrame: number = productionSpeechEndFrame(
      clock,
      line.startFrame,
      admitted.audio.samples.length,
    );
    if (endFrame > props.totalFrames)
      throw new Error(
        `Film sound line "${line.id}" speaks until frame ${endFrame}, past the film's last frame ${props.totalFrames}.`,
      );
    lines.push({
      line: span(line, endFrame),
      receipt: admitted.receipt,
      samples: admitted.audio.samples,
    });
  }
  return lines;
}

/** The line as the sound plan places it, over its speech span. */
const span: (
  line: IAutoMovieFilmSound.ILine,
  endFrame: number,
) => IAutoMovieMixFilmSound.ILine["line"] = (
  line: IAutoMovieFilmSound.ILine,
  endFrame: number,
): IAutoMovieMixFilmSound.ILine["line"] => ({
  id: line.id,
  text: line.text,
  language: line.language,
  ...(line.speaker === undefined ? {} : { speaker: line.speaker }),
  startFrame: line.startFrame,
  endFrame,
});
