import type {
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionDialogueLine,
} from "@automovie/interface";

import { productionSpeechEndFrame } from "./productionSpeechEndFrame";

/**
 * Lower one caption into a dialogue line: over its speech span when the caption
 * has adopted speech, over its caption window otherwise.
 *
 * The speech span ends at {@link productionSpeechEndFrame} of the caption's
 * start frame and its sample count on the plan's 48 kHz clock. A caption may
 * stay up longer than its speech but not end before it, because the line it
 * captions would still be playing; a speech span past the film's last frame has
 * no samples to play in.
 *
 * @param props The sound plan's inputs: the timeline's clock and length, and
 *   the adopted speech sample counts by caption id.
 * @param caption The caption to lower.
 * @returns The dialogue line, ending at its speech end when it has speech.
 * @throws {Error} When the speech runs past the film's last frame or past the
 *   caption's end.
 */
export function productionCaptionDialogueLine(
  props: IAutoMovieDeriveProductionSoundPlan.IProps,
  caption: IAutoMovieFilmTimeline["tracks"]["captions"][number],
): IAutoMovieProductionDialogueLine {
  const line: IAutoMovieProductionDialogueLine = {
    id: caption.id,
    text: caption.text,
    language: caption.language,
    ...(caption.speaker === undefined ? {} : { speaker: caption.speaker }),
    startFrame: caption.startFrame,
    endFrame: caption.endFrame,
  };
  const samples: number | undefined = props.speechSamples?.get(caption.id);
  if (samples === undefined) return line;
  const speechEndFrame: number = productionSpeechEndFrame(
    { ...props.timeline, sampleRate: 48_000 },
    caption.startFrame,
    samples,
  );
  if (speechEndFrame > props.timeline.totalFrames)
    throw new Error(
      `Dialogue line "${caption.id}" speaks until frame ${speechEndFrame}, past the film's last frame ${props.timeline.totalFrames}.`,
    );
  if (caption.endFrame < speechEndFrame)
    throw new Error(
      `Caption "${caption.id}" ends on frame ${caption.endFrame}, before its speech ends on frame ${speechEndFrame}.`,
    );
  return { ...line, endFrame: speechEndFrame };
}
