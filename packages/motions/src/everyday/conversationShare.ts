import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
} from "@automovie/interface";

/**
 * The share of a film span in which the requests target a person's face.
 * A request ends at its release or the next request, whichever comes first.
 * This measures authored attention without modeling the layer's physical blend.
 *
 * @param params The gaze requests in chronological order and the span's start and end in film seconds, the end greater than the start.
 * @returns The share in [0, 1].
 *
 * @evidence contracts/development/design.md#principled-representation A scalar over the requests' authored times; the layer request is the Gaze family's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, `AutoMovieMotionHumanConversation.share`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the family's request type; no consumer is special-cased.
 */
export function conversationShare(
  params: IAutoMovieMotionHumanConversation.IShare,
): number {
  const { requests, from, to } = params;
  let on: number = 0;
  requests.forEach((r: IAutoMovieMotionHumanGaze.ILayer, i: number): void => {
    const a: number = Math.max(from, r.from);
    const b: number = Math.min(to, r.to ?? to, requests[i + 1]?.from ?? to);
    if (b > a && r.target.kind === "person") on += b - a;
  });
  return on / (to - from);
}
