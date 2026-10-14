import type { IQueueHumanViewerRequestProps } from "./IQueueHumanViewerRequestProps.js";
import { classifyHumanViewerRefusal } from "./classifyHumanViewerRefusal.js";
import { describeHumanViewerFailure } from "./describeHumanViewerFailure.js";

/**
 * Bind a real response to its queued request. Only an unfinished response close means client loss; IncomingMessage also closes after a healthy GET body. Await guarded operations before discarding aborted results, holding logical page ownership until promise completion or accepted host lifetime settlement. These host reports do not independently measure OS/GPU termination. The queue removes waiting work; this adapter reports refusal and withdraws response listeners.
 *
 * @evidence contracts/common.md#principled-implementation Response-close cancellation checks surround each actually awaited operation, while the existing queue retains running-page ownership until its task settles.
 * @evidence contracts/common.md#clear-and-simple-design One abort controller and guarded request capability join queue admission, refusal response and listener cleanup without another physical-slot scheduler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Healthy IncomingMessage completion is not lost-client evidence, and abort does not race away guarded promise settlement; accepted host lifetime signals do not independently prove OS/GPU termination.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes response lifetime, guarded operation settlement, host signal limits, logical queue ownership and refusal transport.
 * @evidence contracts/performance.md#efficient-algorithms Fixed checks surround task work and refusal formatting scans error text; scheduling and actual GPU work remain with the queue/page owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each response owns a distinct request and abort signal; equal labels do not authorize sharing work or a previous result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The response listener leaves in finally when the queue promise settles; aborted running operations retain their actual ownership until settlement, and response/task handles are not cached after completion.
 */
export function queueHumanViewerRequest<Value>(
  props: IQueueHumanViewerRequestProps<Value>,
): Promise<Value | undefined> {
  const controller: AbortController = new AbortController();
  const close: () => void = (): void => {
    if (!props.response.writableFinished)
      controller.abort(new Error("Viewer request client disconnected"));
  };
  props.response.on("close", close);
  if (props.response.destroyed) close();
  const check: () => void = (): void => {
    // Transport state can precede its close notification.
    if (props.response.destroyed) close();
    controller.signal.throwIfAborted();
  };
  const request: Parameters<IQueueHumanViewerRequestProps<Value>["task"]>[0] = {
    signal: controller.signal,
    check,
    run: async <Result>(operation: () => Promise<Result>): Promise<Result> => {
      check();
      const result: Result = await operation();
      check();
      return result;
    },
  };
  return props.queue
    .run(
      props.label,
      (): Promise<Value> => props.task(request),
      props.lane,
      controller.signal,
    )
    .catch((error: unknown): undefined => {
      const message: string =
        error instanceof Error ? error.message : String(error);
      if (controller.signal.aborted || props.response.destroyed) {
        console.log(
          `REFUSED ${new Date().toISOString()} ${props.label} client gone: ${message.slice(0, 300)}`,
        );
        return undefined;
      }
      const refusal: ReturnType<typeof classifyHumanViewerRefusal> =
        classifyHumanViewerRefusal(error);
      // Every refusal is logged with its cause, so a failed request can be
      // traced afterwards like a served one.
      console.log(
        `REFUSED ${new Date().toISOString()} ${props.label} ${refusal.status}: ${message.slice(0, 500)}`,
      );
      props.response.statusCode = refusal.status;
      if (refusal.retryAfter !== null)
        props.response.setHeader("Retry-After", String(refusal.retryAfter));
      props.response.setHeader("Content-Type", "application/json");
      props.response.end(
        JSON.stringify({
          error: describeHumanViewerFailure(message),
        }),
      );
      return undefined;
    })
    .finally((): void => {
      props.response.off("close", close);
    });
}
