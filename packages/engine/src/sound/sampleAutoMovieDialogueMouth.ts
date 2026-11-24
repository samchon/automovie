import type {
  IAutoMovieDialogueMouth,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieSampleDialogueMouth,
} from "@automovie/interface";

import { AUTOMOVIE_DIALOGUE_ENVELOPE_JAW } from "./AUTOMOVIE_DIALOGUE_ENVELOPE_JAW";
import { sampleAutoMovieDialogueVisemeWeights } from "./sampleAutoMovieDialogueVisemeWeights";
import { speakingAutoMovieDialogueLine } from "./speakingAutoMovieDialogueLine";

/**
 * Sample one actor's dialogue mouth at a film second from the film's mouth
 * track, in closed form.
 *
 * The second's frame is `seconds × fps`. The actor's speaking line is
 * `speakingAutoMovieDialogueLine`'s: the one whose speech span holds the frame,
 * the later-starting where two do. The jaw is the line's envelope opening of
 * the whole frame holding the second, so every sample within one frame
 * interval, such as a shutter sample, shares the level the line has there. The
 * weights are the line's coarticulated visemes at the fractional frame
 * (`sampleAutoMovieDialogueVisemeWeights`); a line without viseme ranges gives
 * `aa` at the jaw's fraction of `AUTOMOVIE_DIALOGUE_ENVELOPE_JAW
 * .maximumOpeningMm` and `sil` for the rest. Outside every line of the actor
 * the jaw is 0 and the weights are `{ sil: 1 }`.
 *
 * @param props The track, the actor and the second.
 * @returns The actor's jaw opening in millimetres and viseme weights.
 */
export function sampleAutoMovieDialogueMouth(
  props: IAutoMovieSampleDialogueMouth.IProps,
): IAutoMovieDialogueMouth {
  if (!Number.isFinite(props.seconds))
    throw new Error(
      `dialogue mouth second ${props.seconds} of actor "${props.actor}" is not finite`,
    );
  const { fps }: IAutoMovieDialogueMouthTrack = props.track;
  const frame: number = props.seconds * fps;
  const held: ReturnType<typeof speakingAutoMovieDialogueLine> =
    speakingAutoMovieDialogueLine(props.track, props.actor, props.seconds);
  if (held === null) return { jaw: 0, visemes: { sil: 1 } };

  const speaking: IAutoMovieDialogueMouthTrack.ILine = held.line;
  const jaw: number = speaking.jaw[held.frame - speaking.startFrame] ?? 0;
  if (speaking.ranges !== null)
    return {
      jaw,
      visemes: sampleAutoMovieDialogueVisemeWeights({
        timeline: {
          line: speaking.line,
          actor: speaking.actor,
          ranges: speaking.ranges,
        },
        frame,
        fps,
      }),
    };
  const open: number = Math.min(
    1,
    Math.max(0, jaw / AUTOMOVIE_DIALOGUE_ENVELOPE_JAW.maximumOpeningMm),
  );
  return {
    jaw,
    visemes: open === 0 ? { sil: 1 } : { aa: open, sil: 1 - open },
  };
}
