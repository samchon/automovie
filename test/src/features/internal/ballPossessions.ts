import type { IAutoMovieMotionHumanBallPlay } from "@automovie/interface";

/**
 * A ball play's custody chain as short labels: `hold:<subject>:<caught>`
 * for each possession and `launch:<subject>` for each launch, in film order.
 * Contacts are left out so a sport test compares who played the ball.
 *
 * @param play The ball's play from AutoMovieMotionHumanPerformance.play.
 * @returns The labels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the label grammar, the order and what is omitted.
 * @evidenceExclude contracts/development/implementation.md#principled-implementation A projection of the play's own records with no computation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared projection replaces each sport test's own.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No values are derived.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One pass over the events.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list.
 */
export function ballPossessions(play: IAutoMovieMotionHumanBallPlay): string[] {
  return play.events.flatMap(
    (event: IAutoMovieMotionHumanBallPlay.Event): string[] =>
      event.kind === "hold"
        ? [`hold:${event.subject}:${event.caught}`]
        : event.kind === "launch"
          ? [`launch:${event.subject}`]
          : [],
  );
}
