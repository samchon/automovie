import type { IAutoMovieSequenceRenderTransitionSpan } from "@automovie/render";

/**
 * One diagnostic transition interval with selected frame/index/alpha and mean absolute RGB byte distances. verified means the existing sampled frame satisfies baseline>0.1 and both probe distances>0.01 but below baseline; it is not an exact alpha-composition, color-pipeline or all-frame proof. Unsampled/missing frames retain false plus a reason.
 *
 * @evidence contracts/common.md#principled-implementation The existing verifier reports a selected transition sample's mean absolute RGB byte distances and its original strict distance predicate, with null index/alpha and a reason when no captured sample exists.
 * @evidence contracts/common.md#clear-and-simple-design One observation row augments the sequence artifact while capture, image decoding and comparison remain with the existing verifier and page owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts True records heuristic acceptance, not exact alpha composition, linear-light blending or every transition frame; zero distance fields in missing-sample rows accompany false and a reason rather than a successful observation.
 * @evidence contracts/common.md#meaningful-documentation Specifies transition time and shot identity, nullable sampled index/alpha, RGB byte-distance units, the predicate and failed-observation reason.
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

  /** Whether the existing strict RGB-distance predicate accepts this sample. */
  verified: boolean;

  /** Explanation retained when the observation cannot verify the dissolve. */
  reason: string | null;
}
