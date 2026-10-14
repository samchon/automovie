import { IAutoMovieVisualDeliveryOccurrence } from "./IAutoMovieVisualDeliveryOccurrence";
import { IAutoMovieVisualDeliveryLane } from "./IAutoMovieVisualDeliveryLane";

/**
 * Normalize an explicit legacy all-one-lane declaration without receipt inference.
 *
 * Timeline order is preserved and exactly the selected family's callback runs once per occurrence. Returned source records are borrowed directly from that callback; there is no duplicate/source admission or deep copy here. Callback errors propagate and earlier callback effects are not rolled back.
 *
 * @evidence contracts/common.md#principled-implementation An explicit deterministic/repainted declaration selects one callback for each existing ordered occurrence and sets the other source to null.
 * @evidence contracts/common.md#clear-and-simple-design Legacy all-one-lane expansion produces the planner's existing lane representation without inventing receipt-based source inference.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function never chooses fallback from missing receipts; callback source truth and exact timeline admission remain caller/planner obligations.
 * @evidence contracts/common.md#meaningful-documentation Prose states callback count/order, borrowed nested sources, omitted validation and exception/external-effect behavior.
 * @evidence contracts/performance.md#efficient-algorithms One N-occurrence map allocates N lane wrappers plus occurrence spreads; dominant callback cost is charged once per selected occurrence, including repeated shots.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selected callbacks can be effectful, so this expansion shares neither repeated-shot callback results nor in-flight work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned wrappers belong to the caller and retain callback-provided source records; the normalizer retains no callbacks, timeline cache or task after return/throw.
 */
export const normalizeAutoMovieVisualDeliveryLanes: (props: {
    timeline: readonly IAutoMovieVisualDeliveryOccurrence[];
    visualDelivery: "deterministic" | "repainted";
    deterministic: (occurrence: IAutoMovieVisualDeliveryOccurrence) => {
        path: string;
        digest: string;
    };
    repaint: (occurrence: IAutoMovieVisualDeliveryOccurrence) => {
        path: string;
        digest: string;
        receiptDigest: string;
        selectionDigest: string;
    };
}) => IAutoMovieVisualDeliveryLane[] = (props: {
  timeline: readonly IAutoMovieVisualDeliveryOccurrence[];
  visualDelivery: "deterministic" | "repainted";
  deterministic: (occurrence: IAutoMovieVisualDeliveryOccurrence) => {
    path: string;
    digest: string;
  };
  repaint: (occurrence: IAutoMovieVisualDeliveryOccurrence) => {
    path: string;
    digest: string;
    receiptDigest: string;
    selectionDigest: string;
  };
}): IAutoMovieVisualDeliveryLane[] =>
  props.timeline.map(
    (occurrence: IAutoMovieVisualDeliveryOccurrence): IAutoMovieVisualDeliveryLane =>
      props.visualDelivery === "deterministic"
        ? {
            ...occurrence,
            lane: "deterministic",
            deterministic: props.deterministic(occurrence),
            repaint: null,
          }
        : {
            ...occurrence,
            lane: "repainted",
            deterministic: null,
            repaint: props.repaint(occurrence),
          },
  );
