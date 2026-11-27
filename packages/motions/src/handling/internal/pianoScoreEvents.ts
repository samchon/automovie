import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPianoScore,
} from "@automovie/interface";

/*
 * A piano score's events (`pianoScore`): each scored key, in score order, is
 * down at its `at` and up at its `to`, `keyDown<n>` and `keyUp<n>` numbered
 * from 1, as shares of the score's duration, every event sorted by its share.
 * Parameter notes: The scored keys, in score order.
 * Parameter duration: The score's duration, seconds; positive.
 * Returns: The events, by share.
 */
export function pianoScoreEvents(
  notes: readonly IAutoMovieMotionHumanPianoScore.INote[],
  duration: number,
): IAutoMovieMotionEvent[] {
  return notes
    .flatMap(
      (
        score: IAutoMovieMotionHumanPianoScore.INote,
        i: number,
      ): IAutoMovieMotionEvent[] => [
        { name: `keyDown${i + 1}`, share: score.at / duration },
        { name: `keyUp${i + 1}`, share: score.to / duration },
      ],
    )
    .sort(
      (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
        a.share - b.share,
    );
}
