import type { IHumanResidentHandlerProps } from "./IHumanResidentHandlerProps";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";

/**
 * Bind asynchronous preparation and evaluation to the initiating request ID.
 * A refusal is local to its request; other queued replies keep their identity.
 */
export function createHumanResidentHandler<Input, Output>(
  props: IHumanResidentHandlerProps<Input, Output>,
) {
  return async (request: IHumanResidentRequest<Input>): Promise<void> => {
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
