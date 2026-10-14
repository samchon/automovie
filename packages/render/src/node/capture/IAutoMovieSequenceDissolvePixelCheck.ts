import type { IAutoMovieSequenceRenderTransitionSpan } from "../../index.js";

/**
 * One diagnostic transition interval with selected frame/index/alpha and mean absolute RGB byte distances. verified means the existing sampled frame satisfies baseline>0.1 and both probe distances>0.01 but below baseline; it is not an exact alpha-composition, color-pipeline or all-frame proof. Unsampled/missing frames retain false plus a reason.
 *
 *
 * @evidence contracts/common.md#principled-implementation RGB distances compare the saved mixed frame against isolated incoming and outgoing samples nearest the transition midpoint.
 * @evidence contracts/common.md#clear-and-simple-design One record keeps transition identity, selected frame, distances and a reason together for inspectable diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The heuristic can report false and does not certify exact blend arithmetic or visual quality.
 * @evidence contracts/common.md#meaningful-documentation The comments define nullable sample fields, byte-distance observations, verified status and the reason.
 * @evidence contracts/performance.md#efficient-algorithms The erased type performs no image decoding or pixel traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each observation is a distinct transition result; this record coordinates no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned values retain only numbers, strings and transition identity, without decoded PNG buffers or browser handles.
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
