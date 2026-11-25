import type {
  IAutoMovieDialogueMouth,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieSampleDialogueMouth,
} from "@automovie/interface";

import { AUTOMOVIE_DIALOGUE_ENVELOPE_JAW } from "./AUTOMOVIE_DIALOGUE_ENVELOPE_JAW";
import { sampleAutoMovieDialogueVisemeWeights } from "./sampleAutoMovieDialogueVisemeWeights";

/**
 * Sample one actor's dialogue mouth at a film second from the film's mouth
 * track, in closed form.
 *
 * The second's frame is `seconds × fps`. The actor's speaking line is the one
 * whose speech span `[startFrame, endFrame)` holds that frame; where two of the
 * actor's lines hold it, the later-starting one speaks, because a new line
 * takes the mouth from its start. The jaw is the line's envelope opening of the
 * whole frame holding the second, so every sample within one frame interval,
 * such as a shutter sample, shares the level the line has there. The weights
 * are the line's coarticulated visemes at the fractional frame
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
  const { fps }: IAutoMovieDialogueMouthTrack = props.track;
  const frame: number = props.seconds * fps;

  // A frame within the tolerance of a boundary counts as that boundary, so
  // `f / fps × fps` that lands a hair below `f` still selects frame `f`.
  const whole: number = Math.floor(frame + FRAME_TOLERANCE);
  let speaking: IAutoMovieDialogueMouthTrack.ILine | null = null;
  for (const line of props.track.lines)
    if (
      line.actor === props.actor &&
      whole >= line.startFrame &&
      whole < line.endFrame &&
      (speaking === null || line.startFrame >= speaking.startFrame)
    )
      speaking = line;
  if (speaking === null) return { jaw: 0, visemes: { sil: 1 } };

  const jaw: number = speaking.jaw[whole - speaking.startFrame] ?? 0;
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

/**
 * Frames within this distance below a whole frame count as that frame: far
 * above the rounding of `f / fps × fps` in double precision and far below any
 * shutter sample's offset.
 */
const FRAME_TOLERANCE: number = 1e-6;
