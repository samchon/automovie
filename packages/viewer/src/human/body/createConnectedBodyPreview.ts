import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyFemoralHeads } from "@automovie/human/body/runtime/IConnectedBodyFemoralHeads";
import type { IConnectedBodyMeasuredAnatomy } from "@automovie/human/body/runtime/IConnectedBodyMeasuredAnatomy";
import type { IConnectedBodyPreviewResult } from "@automovie/human/body/runtime/IConnectedBodyPreviewResult";
import type { IConnectedBodyRigReading } from "@automovie/human/body/runtime/IConnectedBodyRigReading";
import type { IConnectedBodyUnavailableAnatomy } from "@automovie/human/body/runtime/IConnectedBodyUnavailableAnatomy";
import type { IAutoMovieHumanBodyFootSupport } from "@automovie/human/body/structures/IAutoMovieHumanBodyFootSupport";
import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieJointPose } from "@automovie/interface";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { createHumanResidentWorker } from "../common/createHumanResidentWorker.js";
import type { IConnectedBodyFrame } from "./IConnectedBodyFrame.js";
import type { IConnectedBodyPreviewProps } from "./IConnectedBodyPreviewProps.js";

/**
 * Keep one worker alive across edits and separate exported bytes from frames.
 * A superseded prepared frame rejects after its resource retirement settles,
 * retaining both the supersession and any cleanup failure.
 *
 * @evidence contracts/common.md#principled-implementation Resident requests use correlation ids and preview generation tickets. A superseded reply loses publication authority before GPU preparation can return a frame; any prepared stale frame is disposed and its retirement is awaited with the supersession cause. The default serializer requires a body basis document, while person consumers supply their grammar explicitly.
 * @evidence contracts/common.md#clear-and-simple-design Preview and construction share one cancellation generation; exports and arms-down requests are separate transactions that do not cancel the current preview. The numerical worker coordinates transport and the borrowed renderer owns frame preparation, leaving publication to the viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy is reconstructed in the viewer or admitted through a fixture exception. Auxiliary arms-down serialization uses the loaded source authority. Cancellation withdraws a result rather than pretending to abort worker computation; a failed request can retain its cancel closure until the next cancel or preview release.
 * @evidence contracts/common.md#meaningful-documentation The comment states separation of frame and byte exports, stale-frame retirement, and cleanup failure preservation. Renderer ownership stays with the viewport; disposeWorker terminates the acquired connection and rejects pending requests.
 * @evidence contracts/performance.md#efficient-algorithms Each transaction serializes its document and transfers numerical output; frame work scales with the renderer's model vertices, indices and materials. Generation comparison and cancellation bookkeeping are constant work, but concurrent independent exports add pending requests without an imposed count bound.
 * @evidence contracts/performance.md#reuse-equivalent-work The coordinator shares one live resident worker and its admitted basis across successful edits. Preview requests still serialize and execute independently; exports preserve their own committed document and effects rather than reusing a possibly stale frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The preview owns one lazy connection, one current withdrawal closure and the worker coordinator's pending map. cancel withdraws only preview authority; disposeWorker rejects all pending requests and terminates the connection. Superseded GPU frames are retired here, accepted frames transfer to the viewport, and this function does not close the borrowed renderer.
 */
export function createConnectedBodyPreview<
  Document extends
    | IAutoMovieHumanBodyBasisDocument
    | IAutoMovieHumanPersonDocument = IAutoMovieHumanBodyBasisDocument,
>(
  props: IConnectedBodyPreviewProps<Document>,
): {
  cancel: () => void;
  build: (
    document: Document,
    measure?: boolean,
    anatomy?: boolean,
  ) => Promise<{
    frame: IConnectedBodyFrame;
    parts: number;
    crossings: IAutoMovieModelCrossing[] | null;
    anatomy:
      | IConnectedBodyMeasuredAnatomy
      | IConnectedBodyUnavailableAnatomy
      | null;
    femoralHeads: IConnectedBodyFemoralHeads | null | undefined;
    groundSupport: IAutoMovieHumanBodyFootSupport[] | null | undefined;
    extras: Record<string, unknown>;
    anatomicalRequest: IAutoMovieHumanBodyAnatomicalInspection | undefined;
    exteriorCandidate: IConnectedBodyPreviewResult["exteriorCandidate"];
  }>;
  construct: (document: Document) => Promise<{
    model: {
      frame: IConnectedBodyFrame;
      parts: number;
      crossings: IAutoMovieModelCrossing[] | null;
      anatomy:
        | IConnectedBodyMeasuredAnatomy
        | IConnectedBodyUnavailableAnatomy
        | null;
      extras: Record<string, unknown>;
      rigReading: IConnectedBodyRigReading | undefined;
      groundSupport: IAutoMovieHumanBodyFootSupport[] | null | undefined;
      femoralHeads: IConnectedBodyFemoralHeads | null | undefined;
      anatomicalRequest: IAutoMovieHumanBodyAnatomicalInspection | undefined;
      exteriorCandidate: IConnectedBodyPreviewResult["exteriorCandidate"];
    };
    admission: IAutoMovieHumanConstructionAdmission;
  }>;
  exportConstruction: (document: Document) => Promise<{
    glb: Uint8Array<ArrayBuffer>;
    admission: IAutoMovieHumanConstructionAdmission;
  }>;
  export: (document: Document) => Promise<Uint8Array<ArrayBuffer>>;
  armsDown: (document: IAutoMovieHumanBodyBasisDocument) => Promise<{
    pose: IAutoMovieJointPose[];
    shoulders: IAutoMovieHumanBodyShoulderPose[];
  }>;
  disposeWorker: () => void;
} {
  const serialize: (document: Document) => string =
    props.serialize ??
    ((document: Document): string =>
      serializeHumanBodyBasisDocument(
        document as IAutoMovieHumanBodyBasisDocument,
      ));
  const worker: {
    request: (input: ConnectedBodyRequest) => {
      result: Promise<ConnectedBodyResult>;
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
      document: Document,
      measure: boolean = false,
      anatomy: boolean = false,
    ): Promise<{
      frame: IConnectedBodyFrame;
      parts: number;
      crossings: IAutoMovieModelCrossing[] | null;
      anatomy:
        | IConnectedBodyMeasuredAnatomy
        | IConnectedBodyUnavailableAnatomy
        | null;
      femoralHeads: IConnectedBodyFemoralHeads | null | undefined;
      groundSupport: IAutoMovieHumanBodyFootSupport[] | null | undefined;
      extras: Record<string, unknown>;
      anatomicalRequest: IAutoMovieHumanBodyAnatomicalInspection | undefined;
      exteriorCandidate: IConnectedBodyPreviewResult["exteriorCandidate"];
    }> => {
      cancel();
      const ticket: number = generation;
      const request: {
        result: Promise<ConnectedBodyResult>;
        cancel: () => void;
      } = worker.request({
        operation: "preview",
        document: serialize(document),
        measure,
        anatomy,
      });
      withdraw = request.cancel;
      const result: ConnectedBodyResult = await request.result;
      if (result.operation !== "preview")
        throw new Error("Expected a numerical body preview.");
      const frame: IConnectedBodyFrame = await props.renderer.prepare(
        result.model,
      );
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        return createAutoMovieResourceRetirement(
          [(): Promise<void> => props.renderer.settleRetirements()],
          { error: new Error("Superseded while preparing body geometry.") },
        )();
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
    construct: async (
      document: Document,
    ): Promise<{
      model: {
        frame: IConnectedBodyFrame;
        parts: number;
        crossings: IAutoMovieModelCrossing[] | null;
        anatomy:
          | IConnectedBodyMeasuredAnatomy
          | IConnectedBodyUnavailableAnatomy
          | null;
        extras: Record<string, unknown>;
        rigReading: IConnectedBodyRigReading | undefined;
        groundSupport: IAutoMovieHumanBodyFootSupport[] | null | undefined;
        femoralHeads: IConnectedBodyFemoralHeads | null | undefined;
        anatomicalRequest: IAutoMovieHumanBodyAnatomicalInspection | undefined;
        exteriorCandidate: IConnectedBodyPreviewResult["exteriorCandidate"];
      };
      admission: IAutoMovieHumanConstructionAdmission;
    }> => {
      cancel();
      const ticket: number = generation;
      const request: {
        result: Promise<ConnectedBodyResult>;
        cancel: () => void;
      } = worker.request({
        operation: "construct",
        document: serialize(document),
      });
      withdraw = request.cancel;
      const result: ConnectedBodyResult = await request.result;
      if (result.operation !== "construct")
        throw new Error("Expected a full construction draft.");
      const frame: IConnectedBodyFrame = await props.renderer.prepare(
        result.model,
      );
      if (ticket !== generation) {
        props.renderer.dispose(frame);
        return createAutoMovieResourceRetirement(
          [(): Promise<void> => props.renderer.settleRetirements()],
          {
            error: new Error(
              "Superseded while preparing construction geometry.",
            ),
          },
        )();
      }
      withdraw = undefined;
      return {
        model: {
          frame,
          parts: result.model.parts.length,
          crossings: result.crossings,
          anatomy: result.anatomy,
          extras: result.extras,
          rigReading: result.rigReading,
          groundSupport: result.groundSupport,
          femoralHeads: result.femoralHeads,
          anatomicalRequest: result.anatomicalRequest,
          exteriorCandidate: result.exteriorCandidate,
        },
        admission: result.admission,
      };
    },
    exportConstruction: async (
      document: Document,
    ): Promise<{
      glb: Uint8Array<ArrayBuffer>;
      admission: IAutoMovieHumanConstructionAdmission;
    }> => {
      const result: ConnectedBodyResult = await worker.request({
        operation: "exportConstruction",
        document: serialize(document),
      }).result;
      if (result.operation !== "exportConstruction")
        throw new Error("Expected a guarded construction asset.");
      return { glb: result.glb, admission: result.admission };
    },
    export: async (document: Document): Promise<Uint8Array<ArrayBuffer>> => {
      const result: ConnectedBodyResult = await worker.request({
        operation: "export",
        document: serialize(document),
      }).result;
      if (result.operation !== "export")
        throw new Error("Expected an exported body file.");
      return result.glb;
    },
    armsDown: async (
      document: IAutoMovieHumanBodyBasisDocument,
    ): Promise<{
      pose: IAutoMovieJointPose[];
      shoulders: IAutoMovieHumanBodyShoulderPose[];
    }> => {
      const result: ConnectedBodyResult = await worker.request({
        operation: "armsDown",
        document: serializeHumanBodyBasisDocument(document, props.source),
      }).result;
      if (result.operation !== "armsDown")
        throw new Error("Expected a solved arms-down pose.");
      return { pose: result.pose, shoulders: result.shoulders };
    },
    disposeWorker: (): void => worker.dispose(),
  };
}
