import type { IAutoMovieSequenceRenderTransitionSpan } from "@automovie/render";

/**
 * One diagnostic transition interval with selected frame/index/alpha and mean absolute RGB byte distances. verified means the existing sampled frame satisfies baseline>0.1 and both probe distances>0.01 but below baseline; it is not an exact alpha-composition, color-pipeline or all-frame proof. Unsampled/missing frames retain false plus a reason.
 *
 * @evidence contracts/common.md#principled-implementation Named dimensions, paths and canonical render/sequence references expose the existing typed capture boundary without a second protocol.
 * @evidence contracts/common.md#clear-and-simple-design The original CLI and capture function consume this record; rendering, page capture and output admission remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An erased type does not validate physical anatomy, resource existence, pixels or successful encoding; the comment separates requested values from observations.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased shape declarations perform no capture, numerical sampling or pixel iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased shape declarations own no cache or repeated runtime work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased shape declarations acquire no native handle; runtime owners release browser/page/encoder resources.
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
  /** Whether the sampled frame lies measurably between both isolated probes. */
  verified: boolean;
  /** Explanation retained when the observation cannot verify the dissolve. */
  reason: string | null;
}
