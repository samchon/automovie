/**
 * Correlate body edits and prepare their GPU frames before publication. A
 * canceled edit withdraws its reply and releases any prepared stale frame,
 * while the worker and admitted basis stay alive. Export asks for the caller's
 * committed document without canceling a preview transaction.
 */
import {
  type IAutoMovieHumanBodyBasisDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";

import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "./connectedBodyProtocol";
import type { createConnectedBodyRenderer } from "./connectedBodyRenderer";
import {
  type HumanResidentPort,
  createHumanResidentWorker,
} from "./residentWorker";

/** Keep one worker alive across edits and separate exported bytes from frames. */
export function createConnectedBodyPreview(props: {
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
  renderer: ReturnType<typeof createConnectedBodyRenderer>;
}) {
  const worker = createHumanResidentWorker(props.worker);
  let generation = 0;
  let withdraw: (() => void) | undefined;
  const cancel = (): void => {
    ++generation;
    withdraw?.();
    withdraw = undefined;
  };
  return {
    cancel,
    build: async (
      document: IAutoMovieHumanBodyBasisDocument,
      measure = false,
    ) => {
      cancel();
      const ticket = generation;
      const request = worker.request({
        operation: "preview",
        document: serializeHumanBodyBasisDocument(document),
        measure,
      });
      withdraw = request.cancel;
      const result = await request.result;
      if (result.operation !== "preview")
        throw new Error("Expected a numerical body preview.");
      const frame = await props.renderer.prepare(result.model);
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        throw new Error("Superseded while preparing body geometry.");
      }
      withdraw = undefined;
      return {
        frame,
        parts: result.model.parts.length,
        crossings: result.crossings,
        extras: result.extras,
      };
    },
    export: async (document: IAutoMovieHumanBodyBasisDocument) => {
      const result = await worker.request({
        operation: "export",
        document: serializeHumanBodyBasisDocument(document),
      }).result;
      if (result.operation !== "export")
        throw new Error("Expected an exported body file.");
      return result.glb;
    },
    disposeWorker: () => worker.dispose(),
  };
}
