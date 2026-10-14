import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { serializeHumanFaceBasisDocument } from "@automovie/human/face/document/serializeHumanFaceBasisDocument";
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { createHumanResidentWorker } from "../common/createHumanResidentWorker.js";
import type { IConnectedFaceFrame } from "./IConnectedFaceFrame.js";
import type { IConnectedFacePreviewProps } from "./IConnectedFacePreviewProps.js";

/**
 * Build connected preview candidates through a resident numerical worker.
 * Request and texture preparation share one generation. Publication is explicit;
 * export captures its own committed document and never interrupts an edit.
 * A superseded prepared frame rejects only after its resource retirement
 * settles, retaining both the supersession and any cleanup failure.
 *
 * @evidence contracts/common.md#principled-implementation Serializes the current numerical document, correlates resident replies and binds preview/construction preparation to generation tickets. A superseded prepared frame loses publication authority and is retired with its supersession cause before rejection; exports keep their own document and do not cancel the preview.
 * @evidence contracts/common.md#clear-and-simple-design One preview owns request authority and acquired connection, while the borrowed numerical renderer owns GPU preparation and the viewport owns scene/document publication. Construction additionally returns its actual independent admission result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No likeness registration or private geometry construction occurs here. Cancellation withdraws a reply rather than claiming to stop native computation; output-kind mismatches refuse instead of fabricating frames, and clinical/visual success is not inferred from numerical completion.
 * @evidence contracts/common.md#meaningful-documentation The comment gives explicit candidate publication, independent export, generation supersession and cleanup causes; disposeWorker states acquired connection termination and pending rejection.
 * @evidence contracts/performance.md#efficient-algorithms Each operation serializes document text and transfers numerical buffers; frame preparation scales with mesh/material assets. Generation bookkeeping is constant work, while independent concurrent exports add pending requests without a count bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Successful requests share one resident connection and admitted numerical basis, and renderer compatibility controls native buffer reuse. Matching documents do not merge effectful export requests or stale preview generations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains one withdrawal closure, a lazy connection and pending coordinator entries. cancel removes only preview request authority; stale prepared frames are retired, accepted frames transfer to viewport ownership, and disposeWorker rejects pending work and ends the connection. The borrowed GPU renderer is closed by the viewport.
 */
export function createConnectedFacePreview(props: IConnectedFacePreviewProps): {
  cancel: () => void;
  build: (
    document: IAutoMovieHumanFaceBasisDocument,
    measure?: boolean,
    occlusion?: boolean,
  ) => Promise<{
    frame: IConnectedFaceFrame;
    parts: number;
    articulation: Extract<
      ConnectedFaceResult,
      { operation: "preview" }
    >["articulation"];
    contact: Extract<ConnectedFaceResult, { operation: "preview" }>["contact"];
    crossings: Extract<
      ConnectedFaceResult,
      { operation: "preview" }
    >["crossings"];
  }>;
  construct: (
    document: IAutoMovieHumanFaceBasisDocument,
    occlusion?: boolean,
  ) => Promise<{
    model: {
      frame: IConnectedFaceFrame;
      parts: number;
      articulation: Extract<
        ConnectedFaceResult,
        { operation: "preview" }
      >["articulation"];
      contact: null;
      crossings: Extract<
        ConnectedFaceResult,
        { operation: "preview" }
      >["crossings"];
    };
    admission: Extract<
      ConnectedFaceResult,
      { operation: "construct" }
    >["admission"];
    periocularMappings: Extract<
      ConnectedFaceResult,
      { operation: "construct" }
    >["periocularMappings"];
  }>;
  disposeWorker: () => void;
  export: (
    document: IAutoMovieHumanFaceBasisDocument,
    occlusion?: boolean,
  ) => Promise<Uint8Array<ArrayBuffer>>;
} {
  const worker: {
    request: (input: ConnectedFaceRequest) => {
      result: Promise<ConnectedFaceResult>;
      cancel: () => void;
    };
    dispose: () => void;
  } = createHumanResidentWorker(props.worker);
  let generation: number = 0;
  let withdraw: (() => void) | undefined;
  const cancel: () => void = (): void => {
    ++generation;
    withdraw?.();
    withdraw = undefined;
  };
  return {
    cancel,
    build: async (
      document: IAutoMovieHumanFaceBasisDocument,
      measure: boolean = false,
      occlusion: boolean = false,
    ): Promise<{
      frame: IConnectedFaceFrame;
      parts: number;
      articulation: Extract<
        ConnectedFaceResult,
        { operation: "preview" }
      >["articulation"];
      contact: Extract<
        ConnectedFaceResult,
        { operation: "preview" }
      >["contact"];
      crossings: Extract<
        ConnectedFaceResult,
        { operation: "preview" }
      >["crossings"];
    }> => {
      cancel();
      const ticket: number = generation;
      const request: {
        result: Promise<ConnectedFaceResult>;
        cancel: () => void;
      } = worker.request({
        operation: "preview",
        document: serializeHumanFaceBasisDocument(document),
        measure,
        occlusion,
      });
      withdraw = request.cancel;
      const result: ConnectedFaceResult = await request.result;
      if (result.operation !== "preview")
        throw new Error("Expected a numerical face preview.");
      const frame: IConnectedFaceFrame = await props.renderer.prepare(
        result.model,
      );
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        return createAutoMovieResourceRetirement(
          [(): Promise<void> => props.renderer.settleRetirements()],
          { error: new Error("Superseded while preparing face geometry.") },
        )();
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
      occlusion: boolean = false,
    ): Promise<{
      model: {
        frame: IConnectedFaceFrame;
        parts: number;
        articulation: Extract<
          ConnectedFaceResult,
          { operation: "preview" }
        >["articulation"];
        contact: null;
        crossings: Extract<
          ConnectedFaceResult,
          { operation: "preview" }
        >["crossings"];
      };
      admission: Extract<
        ConnectedFaceResult,
        { operation: "construct" }
      >["admission"];
      periocularMappings: Extract<
        ConnectedFaceResult,
        { operation: "construct" }
      >["periocularMappings"];
    }> => {
      cancel();
      const ticket: number = generation;
      const request: {
        result: Promise<ConnectedFaceResult>;
        cancel: () => void;
      } = worker.request({
        operation: "construct",
        document: serializeHumanFaceBasisDocument(document),
        occlusion,
      });
      withdraw = request.cancel;
      const result: ConnectedFaceResult = await request.result;
      if (result.operation !== "construct")
        throw new Error("Expected a whole numerical face construction.");
      const frame: IConnectedFaceFrame = await props.renderer.prepare(
        result.model,
      );
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        return createAutoMovieResourceRetirement(
          [(): Promise<void> => props.renderer.settleRetirements()],
          {
            error: new Error(
              "Superseded while preparing face construction geometry.",
            ),
          },
        )();
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
    /** Reject pending requests and retire this preview's acquired numerical connection. */
    disposeWorker: (): void => worker.dispose(),
    export: async (
      document: IAutoMovieHumanFaceBasisDocument,
      occlusion: boolean = false,
    ): Promise<Uint8Array<ArrayBuffer>> => {
      const result: ConnectedFaceResult = await worker.request({
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
