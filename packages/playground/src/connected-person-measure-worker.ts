/// <reference lib="webworker" />
/**
 * Measurement worker of the connected person editor: solves a measured body
 * channel for a target length against the published body partition view, the
 * same solve the body editor runs against its basis. It answers the body
 * editor's simple-tier transport for `solveMeasurement` and refuses the other
 * kinds by name.
 */
import {
  type IAutoMovieHumanPersonBodyView,
  solveHumanBodyMeasuredChannel,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/common/connectedAsset";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
  read: () =>
    fetch(new URL("../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
});

scope.onmessage = async (event: MessageEvent<IConnectedPersonMeasureMessage>) => {
  const request = event.data;
  try {
    if (request.kind !== "solveMeasurement")
      throw new Error("The person editor's measurement worker only solves measured channels.");
    const view = await prepared;
    const result = solveHumanBodyMeasuredChannel({
      basis: view.body,
      shape: request.shape,
      channel: request.channel,
      targetMetres: request.targetMetres,
    });
    scope.postMessage({ id: request.id, result });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/** One measurement request from the person editor. */
interface IConnectedPersonMeasureMessage {
  /** Correlates the reply. */
  id: number;

  /** The transport kind; only `solveMeasurement` is answered. */
  kind: string;

  /** Body shape to solve from. */
  shape: Record<string, number>;

  /** Measured channel to solve. */
  channel: string;

  /** Target length, metres. */
  targetMetres: number;
}
