/**
 * Browser entry for the connected person editor. It reads the published
 * person generation's head and body files (the head and body partition views
 * of one connected skin), opens the standard person (the CC0 reference face
 * on the neutral body, one linked identity) and mounts the person panel over
 * one resident person worker that answers preview and measurement. All
 * evaluation happens in that worker through the product person runtime.
 * Optional headSource/bodySource URLs select caller-owned typed views for the
 * same page, preview and measurement workers, separate from numerical documents.
 */
import type { AutoMovieHumanFaceMeasurementReading, IAutoMovieHumanBodySimpleShape, IAutoMovieHumanPersonBodyView, IAutoMovieHumanPersonDocument, IAutoMovieHumanPersonHeadView } from "@automovie/human";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createBodySimpleWorkerTransport } from "./human/body/bodySimpleWorkerTransport";
import { CONNECTED_BODY_STAGE_SILENCE_MS } from "./human/body/CONNECTED_BODY_STAGE_SILENCE_MS";
import { createConnectedBodyPort } from "./human/body/connectedBodyPort";
import { createConnectedBodyViewport } from "./human/body/connectedBodyViewport";
import { downloadConnectedFile } from "./human/common/downloadConnectedFile";
import { readConnectedBodyView } from "./human/body/readConnectedBodyView";
import { readConnectedHeadView } from "./human/body/readConnectedHeadView";
import type { IConnectedBodyMeasurement } from "./human/body/IConnectedBodyMeasurement";
import type { IConnectedPersonFaceSolution } from "./human/person/IConnectedPersonFaceSolution";
import type { IConnectedPersonHeadSolution } from "./human/person/IConnectedPersonHeadSolution";
import type { IConnectedPersonMeasuredSolution } from "./human/person/IConnectedPersonMeasuredSolution";
import { mountConnectedPersonPanel } from "./human/person/connectedPersonPanel";
import { connectedPersonExpressionPresets } from "./human/person/connectedPersonExpressionPresets";
import { connectedPersonPosePresets } from "./human/person/connectedPersonPosePresets";
import { connectedPersonStandardDocument } from "./human/person/connectedPersonStandardDocument";
import { readConnectedPersonSourceUrls } from "./human/person/readConnectedPersonSourceUrls";
import { connectedPersonSourceWorkerName } from "./human/person/connectedPersonSourceWorkerName";
import { createConnectedPersonWorkerShare } from "./human/person/createConnectedPersonWorkerShare";
import { mountConnectedPersonSourceSelection } from "./human/person/mountConnectedPersonSourceSelection";
import { createHumanWorker } from "./human/common/createHumanWorker";

async function main(): Promise<void> {
  const source = readConnectedPersonSourceUrls(location.search, location.href);
  mountConnectedPersonSourceSelection(source);
  const [head, body] = await Promise.all([readConnectedHeadView(source?.head), readConnectedBodyView(source?.body)]);
  const initial = connectedPersonStandardDocument(head.face.id, body.body.id);
  // one worker reads the views once and answers preview and measurement
  const share = createConnectedPersonWorkerShare(
    () => createHumanWorker(connectedPersonSourceWorkerName(source)),
  );
  // a measurement can wait behind one preview stage of the shared worker
  const { ask } = createBodySimpleWorkerTransport(() => share.measure(), undefined, CONNECTED_BODY_STAGE_SILENCE_MS);
  const panel = mountConnectedPersonPanel(document.querySelector<HTMLDivElement>("#app")!, {
    face: head.face,
    aliases: head.aliases ?? [],
    headShapeSource: head.headShapeSource,
    body: body.body,
    initial,
    projectSimple: (person) => ask<IAutoMovieHumanBodySimpleShape>({ kind: "projectPersonSimple", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly) }),
    expandSimple: (person, simple) => ask<Record<string, number>>({ kind: "expandPersonSimple", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly), simple }),
    poses: connectedPersonPosePresets,
    expressions: connectedPersonExpressionPresets,
    viewport: (canvas) =>
      createConnectedBodyViewport<IAutoMovieHumanPersonDocument>({
        canvas,
        pixelRatio: devicePixelRatio,
        renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
        orbit: (camera) => new OrbitControls(camera, canvas),
        worker: () => createConnectedBodyPort(share.preview()),
        loadTexture: (texture) => new THREE.TextureLoader().loadAsync(texture),
        observeResize: (resize) => { new ResizeObserver(resize).observe(canvas); },
        serialize: (person) => serializeHumanPersonDocument(person, body.body.anatomicalAssembly),
        source: body.body.anatomicalAssembly,
      }),
    solveMeasurement: (shape, channel, targetMetres) =>
      ask<IConnectedBodyMeasurement>({ kind: "solveMeasurement", shape, channel, targetMetres }),
    readPersonMeasurement: (person, channel) =>
      ask<number>({ kind: "readPersonMeasurement", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly), channel }),
    solvePersonMeasurement: (person, channel, targetMetres) =>
      ask<IConnectedPersonMeasuredSolution>({
        kind: "solvePersonMeasurement",
        document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly),
        channel,
        targetMetres,
      }),
    readPersonHead: (person) =>
      ask<Record<string, number>>({ kind: "readPersonHead", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly) }),
    solvePersonHead: (person, targets) =>
      ask<IConnectedPersonHeadSolution>({ kind: "solvePersonHead", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly), targets }),
    readFaceMeasurements: (person) =>
      ask<AutoMovieHumanFaceMeasurementReading[]>({ kind: "readFaceMeasurements", document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly) }),
    solveFaceMeasurement: (person, measurement, target) =>
      ask<IConnectedPersonFaceSolution>({
        kind: "solveFaceMeasurement",
        document: serializeHumanPersonDocument(person, body.body.anatomicalAssembly),
        measurement,
        target,
      }),
    download: downloadConnectedFile,
  });
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
