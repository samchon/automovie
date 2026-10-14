/**
 * Browser entry for the connected person editor. It reads the caller-selected
 * person generation's head and body files (the head and body partition views
 * of one connected skin), opens the standard person (the reference face
 * on the neutral body, one linked identity) and mounts the person panel over
 * one resident person worker that answers preview and measurement. All
 * evaluation happens in that worker through the product person runtime.
 * Optional headSource/bodySource URLs select caller-owned typed views for the
 * same page, preview and measurement workers, separate from numerical documents.
 */
import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanBodySimpleShape,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonDocument,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { humanPersonBodyReach } from "@automovie/human/human/measure/humanPersonBodyReach";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";
import { createConnectedBodyBrowserViewport } from "@automovie/viewer/human/body/createConnectedBodyBrowserViewport";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { IConnectedBodyMeasurement } from "./human/body/IConnectedBodyMeasurement";
import { createBodySimpleWorkerTransport } from "./human/body/createBodySimpleWorkerTransport";
import { createConnectedBodyPort } from "./human/body/createConnectedBodyPort";
import { readConnectedBodyView } from "@automovie/viewer/human/body/readConnectedBodyView";
import { readConnectedHeadView } from "@automovie/viewer/human/body/readConnectedHeadView";
import { createHumanWorker } from "@automovie/viewer/human/common/createHumanWorker";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import type { ConnectedPersonWorkerEnd } from "./human/person/ConnectedPersonWorkerEnd";
import type { IConnectedPersonFaceSolution } from "./human/person/IConnectedPersonFaceSolution";
import type { IConnectedPersonHeadSolution } from "@automovie/human/human/runtime/IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "@automovie/human/human/runtime/IConnectedPersonMeasuredSolution";
import type { IConnectedPersonSourceUrls } from "@automovie/viewer/human/person/IConnectedPersonSourceUrls";
import type { IConnectedPersonWorkerShare } from "./human/person/IConnectedPersonWorkerShare";
import { connectedPersonExpressionPresets } from "./human/person/connectedPersonExpressionPresets";
import { connectedPersonPosePresets } from "./human/person/connectedPersonPosePresets";
import { connectedPersonSourceWorkerName } from "./human/person/connectedPersonSourceWorkerName";
import { connectedPersonStandardDocument } from "./human/person/connectedPersonStandardDocument";
import { createConnectedPersonWorkerShare } from "./human/person/createConnectedPersonWorkerShare";
import { mountConnectedPersonPanel } from "./human/person/mountConnectedPersonPanel";
import { mountConnectedPersonSourceSelection } from "./human/person/mountConnectedPersonSourceSelection";
import { readConnectedPersonSourceUrls } from "@automovie/viewer/human/person/readConnectedPersonSourceUrls";
import { registerPlaygroundEditor } from "./viewer/registerPlaygroundEditor";

async function main(): Promise<void> {
  const source: IConnectedPersonSourceUrls | undefined =
    readConnectedPersonSourceUrls(location.search, location.href);
  mountConnectedPersonSourceSelection(source);
  const [head, body]: [
    IAutoMovieHumanPersonHeadView,
    IAutoMovieHumanPersonBodyView,
  ] = await Promise.all([
    readConnectedHeadView(source?.head),
    readConnectedBodyView(source?.body),
  ]);
  const initial: IAutoMovieHumanPersonDocument =
    connectedPersonStandardDocument(head.face.id, body.body.id);
  // one worker reads the views once and answers preview and measurement
  const share: IConnectedPersonWorkerShare = createConnectedPersonWorkerShare(
    (): Worker => createHumanWorker(connectedPersonSourceWorkerName(source)),
  );
  // A measurement can wait behind a preview without an elapsed-time deadline.
  const {
    ask,
    close: closeMeasurement,
  }: ReturnType<typeof createBodySimpleWorkerTransport> =
    createBodySimpleWorkerTransport(
      (): ConnectedPersonWorkerEnd => share.measure(),
    );
  const panel: ReturnType<typeof mountConnectedPersonPanel> =
    mountConnectedPersonPanel(document.querySelector<HTMLDivElement>("#app")!, {
      face: head.face,
      aliases: head.aliases ?? [],
      headShapeSource: head.headShapeSource,
      body: body.body,
      bodyReach: humanPersonBodyReach(joinHumanPersonGeneration(head, body)),
      initial,
      projectSimple: (
        person: IAutoMovieHumanPersonDocument,
      ): Promise<IAutoMovieHumanBodySimpleShape> =>
        ask<IAutoMovieHumanBodySimpleShape>({
          kind: "projectPersonSimple",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
        }),
      expandSimple: (
        person: IAutoMovieHumanPersonDocument,
        simple: IAutoMovieHumanBodySimpleShape,
      ): Promise<Record<string, number>> =>
        ask<Record<string, number>>({
          kind: "expandPersonSimple",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
          simple,
        }),
      poses: connectedPersonPosePresets,
      expressions: connectedPersonExpressionPresets,
      viewport: (
        canvas: HTMLCanvasElement,
      ): ReturnType<
        typeof createConnectedBodyBrowserViewport<IAutoMovieHumanPersonDocument>
      > =>
        createConnectedBodyBrowserViewport<IAutoMovieHumanPersonDocument>({
          canvas,
          worker: (): HumanResidentPort<
            ConnectedBodyRequest,
            ConnectedBodyResult
          > => createConnectedBodyPort(share.preview()),
          serialize: (person: IAutoMovieHumanPersonDocument): string =>
            serializeHumanPersonDocument(person, body.body.anatomicalAssembly),
          source: body.body.anatomicalAssembly,
        }),
      solveMeasurement: (
        shape: Record<string, number>,
        channel: string,
        targetMetres: number,
      ): Promise<IConnectedBodyMeasurement> =>
        ask<IConnectedBodyMeasurement>({
          kind: "solveMeasurement",
          shape,
          channel,
          targetMetres,
        }),
      readPersonMeasurement: (
        person: IAutoMovieHumanPersonDocument,
        channel: string,
      ): Promise<number> =>
        ask<number>({
          kind: "readPersonMeasurement",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
          channel,
        }),
      solvePersonMeasurement: (
        person: IAutoMovieHumanPersonDocument,
        channel: string,
        targetMetres: number,
      ): Promise<IConnectedPersonMeasuredSolution> =>
        ask<IConnectedPersonMeasuredSolution>({
          kind: "solvePersonMeasurement",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
          channel,
          targetMetres,
        }),
      readPersonHead: (
        person: IAutoMovieHumanPersonDocument,
      ): Promise<Record<string, number>> =>
        ask<Record<string, number>>({
          kind: "readPersonHead",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
        }),
      solvePersonHead: (
        person: IAutoMovieHumanPersonDocument,
        targets: Record<string, number>,
      ): Promise<IConnectedPersonHeadSolution> =>
        ask<IConnectedPersonHeadSolution>({
          kind: "solvePersonHead",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
          targets,
        }),
      readFaceMeasurements: (
        person: IAutoMovieHumanPersonDocument,
      ): Promise<AutoMovieHumanFaceMeasurementReading[]> =>
        ask<AutoMovieHumanFaceMeasurementReading[]>({
          kind: "readFaceMeasurements",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
        }),
      solveFaceMeasurement: (
        person: IAutoMovieHumanPersonDocument,
        measurement: string,
        target: number,
      ): Promise<IConnectedPersonFaceSolution> =>
        ask<IConnectedPersonFaceSolution>({
          kind: "solveFaceMeasurement",
          document: serializeHumanPersonDocument(
            person,
            body.body.anatomicalAssembly,
          ),
          measurement,
          target,
        }),
      download: downloadConnectedFile,
    });
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    panel.close,
    closeMeasurement,
  ]);
  window.addEventListener("pagehide", (event: PageTransitionEvent): void => {
    if (!event.persisted)
      void close().catch((error: unknown): void => {
        console.error(error);
      });
  });
  registerPlaygroundEditor({
    ready: panel.ready,
    document: (): IAutoMovieHumanPersonDocument | undefined =>
      panel.session().draft?.document ?? panel.snapshot()?.document,
    facts: (): {
      qualification: string;
      admission: IAutoMovieHumanConstructionAdmission | undefined;
    } => ({
      qualification:
        panel.session().draft === null ? "accepted" : "construction draft",
      admission: panel.session().draft?.admission,
    }),
    load: panel.load,
    controls: document,
  });
  await panel.ready;
}
void main().catch((error: unknown): void => {
  window.__playgroundViewerPage?.fail(error);
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
