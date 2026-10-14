import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";

import type { IHumanResidentHandlerProps } from "@automovie/viewer/human/common/IHumanResidentHandlerProps";

/**
 * Bind asynchronous preparation and evaluation to the initiating request ID. A refusal is local to its request; other queued replies keep their identity. Preparation is shared by all requests, including a shared rejection. Evaluation and reply failures are reported under the same ID; if sending that refusal itself throws, the returned promise rejects to the native worker error path.
 *
 * @evidence contracts/common.md#principled-implementation Each invocation captures its own request ID across awaiting shared preparation and numerical evaluation, then sends the typed success-or-refusal envelope for that initiating request.
 * @evidence contracts/common.md#clear-and-simple-design The handler bridges preparation and reply IO only; numerical admission belongs to the prepared evaluator and request ordering belongs to the role or transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Errors retain their request identity without retrying a different source, patching the evaluator or treating elapsed time as numerical failure.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared preparation, per-request correlation, evaluation refusal and the remaining native failure when even refusal delivery throws.
 * @evidence contracts/performance.md#efficient-algorithms Each request performs constant envelope and error-format work around its evaluator; numerical cost depends on that evaluator's input and no request-history scan is added.
 * @evidence contracts/performance.md#reuse-equivalent-work All invocations await the exact supplied preparation promise, including its failure, while numerical evaluations remain distinct because their inputs and effects are request-owned.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains one preparation promise and send port; per-request input and output references leave after reply or rejection, with concurrent task count controlled by the calling role rather than a queue in this handler.
 */
export function createHumanResidentHandler<Input, Output>(
  props: IHumanResidentHandlerProps<Input, Output>,
): (request: IHumanResidentRequest<Input>) => Promise<void> {
  return async (request: IHumanResidentRequest<Input>): Promise<void> => {
    try {
      const evaluate: (input: Input) => Promise<Output> = await props.prepare;
      const value: Output = await evaluate(request.input);
      props.send({ id: request.id, success: true, value });
    } catch (error) {
      props.send({
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
