import { createConnectedBodyPreview } from "@automovie/playground/src/human/connectedBodyPreview";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "@automovie/playground/src/human/connectedBodyProtocol";
import type { createConnectedBodyRenderer } from "@automovie/playground/src/human/connectedBodyRenderer";
import type { HumanResidentPort } from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { rejectsError } from "../internal/predicates";

type Port = HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

/**
 * The preview asks the resident worker for an arms-down solve as its own
 * operation and accepts only that operation's reply.
 *
 * Scenarios:
 * 1. The request carries the serialized document under `armsDown`, and the
 *    reply's pose and shoulders are returned as document data.
 * 2. A reply of another operation is refused.
 */
export const test_human_body_resident_arms_down_request =
  async (): Promise<void> => {
    const { document } = humanBodyShoulderFixture();
    const sent: { id: number; input: ConnectedBodyRequest }[] = [];
    const port: Port = {
      onmessage: null,
      onerror: null,
      postMessage: (request) => {
        sent.push(request);
      },
      terminate: () => {},
    };
    const preview = createConnectedBodyPreview({
      worker: () => port,
      renderer: {} as ReturnType<typeof createConnectedBodyRenderer>,
    });
    const solved = preview.armsDown(document);
    TestValidator.equals(
      "an arms-down request of its own",
      sent[0].input.operation,
      "armsDown",
    );
    const answer = {
      operation: "armsDown" as const,
      pose: [
        {
          bone: "leftLowerArm" as const,
          flexion: 0,
          abduction: null,
          twist: null,
        },
      ],
      shoulders: [
        {
          bone: "leftUpperArm" as const,
          plane: 0,
          elevation: 12,
          axialRotation: 0,
        },
      ],
    };
    port.onmessage?.({
      data: { id: sent[0].id, success: true, value: answer },
    });
    TestValidator.equals("the solved joints return", await solved, {
      pose: answer.pose,
      shoulders: answer.shoulders,
    });
    const wrong = preview.armsDown(document);
    port.onmessage?.({
      data: {
        id: sent[1].id,
        success: true,
        value: { operation: "export", glb: new Uint8Array() },
      },
    });
    TestValidator.predicate(
      "another operation's reply is refused",
      await rejectsError(() => wrong, "Expected a solved arms-down pose"),
    );
  };
