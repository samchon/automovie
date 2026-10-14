import type { IAutoMovieSequenceRenderTransitionSpan } from "@automovie/render";

/**
 * One diagnostic transition interval with selected frame/index/alpha and mean absolute RGB byte distances. verified means the existing sampled frame satisfies baseline>0.1 and both probe distances>0.01 but below baseline; it is not an exact alpha-composition, color-pipeline or all-frame proof. Unsampled/missing frames retain false plus a reason.
 *
 * @author Samchon
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
