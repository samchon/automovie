import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps.js";

/**
 * Answer `/rescan` once every sidecar read, generation view read and page admission it starts has finished, so a new candidate is decided rather than "still being read"; waiting admissions are asked again first, only documents no viewer frame could judge stay pending, and the answer marks those `pending`, with the reason, apart from refusals. The settled catalogue is published to the host before the answer. Returns whether the path was `/rescan`.
 *
 * @evidence contracts/common.md#principled-implementation Awaits the existing complete-input settlement, publishes its catalogue and reports actual file documents and refused/pending entries.
 * @evidence contracts/common.md#clear-and-simple-design The route owns JSON/refusal response while sidecar reads, generation facts and browser admission retain their existing catalogue owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending input is not silently promoted to drawable, and failed settlement answers a cause instead of a successful rescan.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains waiting admissions, still-pending documents, complete catalogue publication and path fallthrough.
 * @evidence contracts/performance.md#efficient-algorithms After owner settlement, filtering/mapping scans D catalogue documents and serialization costs response bytes; actual reads/admissions dominate supplied work.
 * @evidence contracts/performance.md#reuse-equivalent-work Settlement shares the existing input/admission tasks and facts under their current identities, with no separate rescan cache keyed only by route text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The route awaits one supplied settlement promise and retains its response through completion, acquiring no file stream or numerical worker itself.
 */
export function serveHumanViewerRescan(
  props: IServeHumanViewerDataProps,
): boolean {
  if (props.url.pathname !== "/rescan") return false;
  void props
    .settleInputs()
    .then((settled: IServeHumanViewerDataProps["inventory"]): void => {
      props.publish(settled);
      props.json({
        documents: settled.documents
          .filter((entry: IServeHumanViewerDataProps["inventory"]["documents"][number]): boolean => entry.id.startsWith("file:"))
          .map((entry: IServeHumanViewerDataProps["inventory"]["documents"][number]): string => entry.id),
        rejected: settled.rejected,
      });
    })
    .catch((error: unknown): void => {
      props.response.statusCode = 500;
      props.json({
        error:
          "Rescan failed: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
  return true;
}
