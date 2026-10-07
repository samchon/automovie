import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";

/**
 * Answer `/rescan` once every sidecar read, generation view read and page
 * admission it starts has finished, so a new candidate is decided rather than
 * "still being read"; waiting admissions are asked again first, only
 * documents no viewer frame could judge stay pending, and the answer marks
 * those `pending`, with the reason, apart from refusals. The
 * settled catalogue is published to the host before the answer. Returns
 * whether the path was `/rescan`.
 *
 * @evidence contracts/common.md#principled-implementation Answers with decided inputs, keeping pending and refused apart.
 * @evidence contracts/common.md#clear-and-simple-design Settling belongs to the host; this route publishes and answers.
 * @evidence contracts/common.md#meaningful-documentation States when it answers and what the answer holds.
 */
export function serveHumanViewerRescan(
  props: IServeHumanViewerDataProps,
): boolean {
  if (props.url.pathname !== "/rescan") return false;
  void props
    .settleInputs()
    .then((settled) => {
      props.publish(settled);
      props.json({
        documents: settled.documents
          .filter((entry) => entry.id.startsWith("file:"))
          .map((entry) => entry.id),
        rejected: settled.rejected,
      });
    })
    .catch((error: unknown) => {
      props.response.statusCode = 500;
      props.json({
        error:
          "Rescan failed: " +
          (error instanceof Error ? error.message : String(error)),
      });
    });
  return true;
}
