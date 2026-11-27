import { AutoMovieEngineMotionSampling } from "@automovie/engine";

import { AutoMovieMotionInterval } from "../../compose/AutoMovieMotionInterval";
import { type resolvePianoScoreVoicing } from "./resolvePianoScoreVoicing";

/** A hand placement shared by every key in a voicing. */
type IVoicing = resolvePianoScoreVoicing.Voicing;

/** Find the current voicing or the destination of the hand's transport. */
export function pianoScoreHand(
  timeline: readonly IVoicing[],
  returnAt: number,
  seconds: number,
): pianoScoreHand.ISample {
  const final: IVoicing = timeline.at(-1)!;
  if (seconds > final.score.to && returnAt > final.score.to) {
    const share: number =
      (seconds - final.score.to) / (returnAt - final.score.to);
    return {
      note: final,
      previous: undefined,
      transport: 1 - AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, share)),
    };
  }

  let first: number = 0;
  let last: number = timeline.length - 1;
  while (first < last) {
    const middle: number = Math.floor((first + last) / 2);
    if (seconds <= timeline[middle]!.score.to) last = middle;
    else first = middle + 1;
  }
  const note: IVoicing = timeline[first]!;
  const previous: IVoicing | undefined = timeline[first - 1];
  const start: number = previous?.score.to ?? 0;
  const transport: number = AutoMovieMotionInterval.progress(
    start,
    note.score.from,
    seconds,
  );
  return { note, previous, transport };
}

/** `pianoScoreHand` and its records. */
export namespace pianoScoreHand {
  /** One hand's position on its voicing and the preceding transport. */
  export interface ISample {
    /** The voicing the hand plays or travels to. */
    note: IVoicing;

    /** The voicing before it, none for the first. */
    previous: IVoicing | undefined;

    /** The hand's transport from the previous voicing, a share in [0, 1]. */
    transport: number;
  }
}
