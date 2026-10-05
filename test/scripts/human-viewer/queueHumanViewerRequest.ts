import { classifyHumanViewerRefusal } from "./classifyHumanViewerRefusal";
import type { IQueueHumanViewerRequestProps } from "./IQueueHumanViewerRequestProps";
import { describeHumanViewerFailure } from "./describeHumanViewerFailure";

/**
 * Bind one HTTP response to its queued GPU request. Only an unfinished
 * response close means client loss; an IncomingMessage close also happens
 * after a healthy GET body completes. Each guarded operation is awaited to
 * physical settlement before an aborted result is discarded, so client loss
 * never releases shared-page ownership through an abort race. The queue owns
 * removal of waiting work and active-slot settlement. This adapter owns
 * response refusal (logged as `REFUSED` with its cause), listener cleanup
 * and admission of subsequent operations.
 *
 * @evidence contracts/common.md#principled-implementation Uses unfinished response closure for client loss and awaits actual operations before discarding their results.
 * @evidence contracts/common.md#clear-and-simple-design One request adapter owns HTTP cancellation and refusal while the queue retains GPU serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not race physical page work, restart a viewer or rewrite source freshness.
 * @evidence contracts/common.md#meaningful-documentation Separates request completion, physical operation settlement and response-write ownership.
 */
export function queueHumanViewerRequest<Value>(
  props: IQueueHumanViewerRequestProps<Value>,
): Promise<Value | undefined> {
  const controller = new AbortController();
  const close = (): void => {
    if (!props.response.writableFinished)
      controller.abort(new Error("Viewer request client disconnected"));
  };
  props.response.on("close", close);
  if (props.response.destroyed) close();
  const check = (): void => {
    // Transport state can precede its close notification.
    if (props.response.destroyed) close();
    controller.signal.throwIfAborted();
  };
  const request = {
    signal: controller.signal,
    check,
    run: async <Result>(operation: () => Promise<Result>): Promise<Result> => {
      check();
      const result = await operation();
      check();
      return result;
    },
  };
  return props.queue
    .run(props.label, () => props.task(request), props.lane, controller.signal)
    .catch((error: unknown): undefined => {
      const message = error instanceof Error ? error.message : String(error);
      if (controller.signal.aborted || props.response.destroyed) {
        console.log(`REFUSED ${new Date().toISOString()} ${props.label} client gone: ${message.slice(0, 300)}`);
        return undefined;
      }
      const refusal = classifyHumanViewerRefusal(error);
      // Every refusal is logged with its cause, so a failed request can be
      // traced afterwards like a served one.
      console.log(`REFUSED ${new Date().toISOString()} ${props.label} ${refusal.status}: ${message.slice(0, 500)}`);
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
    .finally(() => props.response.off("close", close));
}
