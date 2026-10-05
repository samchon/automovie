/**
 * Correlate body edits and prepare their GPU frames before publication. A
 * canceled edit withdraws its reply and releases any prepared stale frame,
 * while the worker and admitted basis stay alive. Export asks for the caller's
 * committed document without canceling a preview transaction.
 */
import {
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanPersonDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";

import { createHumanResidentWorker } from "../common/residentWorker";
import type { IConnectedBodyPreviewProps } from "./IConnectedBodyPreviewProps";

/** Keep one worker alive across edits and separate exported bytes from frames.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Withdraws stale edits and prepares only the latest numerical body for publication.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Requests GLB independently for the committed body document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the admitted worker resident while correlating preview and export transactions.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Leaves file encoding to the explicit worker export request.
 */
export function createConnectedBodyPreview<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(props: IConnectedBodyPreviewProps<Document>) {
  const serialize =
    props.serialize ??
    ((document: Document) =>
      serializeHumanBodyBasisDocument(
        document as IAutoMovieHumanBodyBasisDocument,
      ));
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
      document: Document,
      measure = false,
      anatomy = false,
    ) => {
      cancel();
      const ticket = generation;
      const request = worker.request({
        operation: "preview",
        document: serialize(document),
        measure,
        anatomy,
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
        anatomy: result.anatomy,
        femoralHeads: result.femoralHeads,
        groundSupport: result.groundSupport,
        extras: result.extras,
        anatomicalRequest: result.anatomicalRequest,
        exteriorCandidate: result.exteriorCandidate,
      };
    },
    export: async (document: Document) => {
      const result = await worker.request({
        operation: "export",
        document: serialize(document),
      }).result;
      if (result.operation !== "export")
        throw new Error("Expected an exported body file.");
      return result.glb;
    },
    armsDown: async (document: IAutoMovieHumanBodyBasisDocument) => {
      const result = await worker.request({
        operation: "armsDown",
        document: serializeHumanBodyBasisDocument(document),
      }).result;
      if (result.operation !== "armsDown")
        throw new Error("Expected a solved arms-down pose.");
      return { pose: result.pose, shoulders: result.shoulders };
    },
    disposeWorker: () => worker.dispose(),
  };
}
