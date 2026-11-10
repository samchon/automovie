import type { IAutoMovieSequenceRenderTransitionSpan } from "@automovie/render";

/**
 * One diagnostic transition interval with selected frame/index/alpha and mean absolute RGB byte distances. verified means the existing sampled frame satisfies baseline>0.1 and both probe distances>0.01 but below baseline; it is not an exact alpha-composition, color-pipeline or all-frame proof. Unsampled/missing frames retain false plus a reason.
 *
 *
 * @evidence contracts/development/design.md#principled-representation RGB distances compare the saved mixed frame against isolated incoming and outgoing samples nearest the transition midpoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record keeps transition identity, selected frame, distances and a reason together for inspectable diagnostics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The heuristic can report false and does not certify exact blend arithmetic or visual quality.
 * @evidence contracts/development/common.md#meaningful-documentation The comments define nullable sample fields, byte-distance observations, verified status and the reason.
 */
export interface IAutoMovieSequenceDissolvePixelCheck {
  /** Outgoing and incoming shots with the transition's film interval. */
  transition: Pick<
    IAutoMovieSequenceRenderTransitionSpan,
    "from" | "to" | "start" | "end"
  >;

  /** Captured frame nearest the middle blend, or null when none was sampled. */
  frame: number | null;

  /** Incoming-shot blend weight at the sampled frame. */
  alpha: number | null;

  /** Mean RGB distance between isolated outgoing and incoming probes. */
  baselineDistance: number;

  /** Mean RGB distance from the blended frame to the incoming probe. */
  actualToIncoming: number;

  /** Mean RGB distance from the blended frame to the outgoing probe. */
  actualToOutgoing: number;

  /** Whether the existing strict RGB-distance predicate accepts this sample. */
  verified: boolean;

  /** Explanation retained when the observation cannot verify the dissolve. */
  reason: string | null;
}
