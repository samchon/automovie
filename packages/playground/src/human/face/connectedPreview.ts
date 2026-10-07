import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { serializeHumanFaceBasisDocument } from "@automovie/human/face/document/serializeHumanFaceBasisDocument";

import { createHumanResidentWorker } from "../common/residentWorker";
import type { IConnectedFacePreviewProps } from "./IConnectedFacePreviewProps";

/**
 * Build connected preview candidates through a resident numerical worker.
 * Request and texture preparation share one generation. Publication is explicit;
 * export captures its own committed document and never interrupts an edit.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Prevents cancelled numerical or texture results from becoming the displayed face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates preview transactions from explicit asynchronous file export.
 */
export function createConnectedFacePreview(props: IConnectedFacePreviewProps) {
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
      document: IAutoMovieHumanFaceBasisDocument,
      measure = false,
      occlusion = false,
    ) => {
      cancel();
      const ticket = generation;
      const request = worker.request({
        operation: "preview",
        document: serializeHumanFaceBasisDocument(document),
        measure,
        occlusion,
      });
      withdraw = request.cancel;
      const result = await request.result;
      if (result.operation !== "preview")
        throw new Error("Expected a numerical face preview.");
      const frame = await props.renderer.prepare(result.model);
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        throw new Error("Superseded while preparing face geometry.");
      }
      withdraw = undefined;
      return {
        frame,
        parts: result.model.parts.length,
        articulation: result.articulation,
        contact: result.contact,
        crossings: result.crossings,
      };
    },
    /** Prepare the complete construction while retaining its independent admission verdict. */
    construct: async (
      document: IAutoMovieHumanFaceBasisDocument,
      occlusion = false,
    ) => {
      cancel();
      const ticket = generation;
      const request = worker.request({
        operation: "construct",
        document: serializeHumanFaceBasisDocument(document),
        occlusion,
      });
      withdraw = request.cancel;
      const result = await request.result;
      if (result.operation !== "construct")
        throw new Error("Expected a whole numerical face construction.");
      const frame = await props.renderer.prepare(result.model);
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        throw new Error(
          "Superseded while preparing face construction geometry.",
        );
      }
      withdraw = undefined;
      return {
        model: {
          frame,
          parts: result.model.parts.length,
          articulation: result.articulation,
          contact: result.contact,
          crossings: result.crossings,
        },
        admission: result.admission,
        periocularMappings: result.periocularMappings,
      };
    },
    export: async (
      document: IAutoMovieHumanFaceBasisDocument,
      occlusion = false,
    ) => {
      const result = await worker.request({
        operation: "export",
        document: serializeHumanFaceBasisDocument(document),
        occlusion,
      }).result;
      if (result.operation !== "export")
        throw new Error("Expected an exported face file.");
      return result.glb;
    },
  };
}
