import type { HumanResidentReply } from "./residentWorker";

/**
 * Bind asynchronous preparation and evaluation to the initiating request ID.
 * A refusal is local to its request; other queued replies keep their identity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Returns numerical failures without publishing partial results.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps initialization and evaluation in a correlated worker error boundary.
 */
export function createHumanResidentHandler<Input, Output>(props: {
  prepare: Promise<(input: Input) => Promise<Output>>;
  send: (reply: HumanResidentReply<Output>) => void;
}) {
  return async (request: { id: number; input: Input }): Promise<void> => {
    try {
      const evaluate = await props.prepare;
      const value = await evaluate(request.input);
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
