/**
 * Browser entry for the connected person editor. It reads the published
 * person generation's head and body files (the head and body partition views
 * of one connected skin), opens the standard person (the CC0 reference face
 * on the neutral body, one linked identity) and mounts the person panel over
 * a resident person worker and a measurement worker. All evaluation happens
 * in the workers through the product person runtime.
 */
import {
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonDocument,
  type IAutoMovieHumanPersonHeadView,
  serializeHumanPersonDocument,
} from "@automovie/human";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createBodySimpleWorkerTransport } from "./human/body/bodySimpleWorkerTransport";
import { createConnectedBodyPort } from "./human/body/connectedBodyPort";
import { createConnectedBodyViewport } from "./human/body/connectedBodyViewport";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import type { IConnectedBodyMeasurement } from "./human/body/IConnectedBodyMeasurement";
import type { IConnectedPersonMeasuredSolution } from "./human/person/IConnectedPersonMeasuredSolution";
import { mountConnectedPersonPanel } from "./human/person/connectedPersonPanel";
import { connectedPersonExpressionPresets } from "./human/person/connectedPersonExpressionPresets";
import { connectedPersonPosePresets } from "./human/person/connectedPersonPosePresets";
import { connectedPersonStandardDocument } from "./human/person/connectedPersonStandardDocument";

async function main(): Promise<void> {
  // Literal asset URLs, which the bundler resolves relative to this module.
  const asset = <T,>(url: URL): Promise<T> => readConnectedFaceAsset<T>({ read: () => fetch(url) });
  const [head, body] = await Promise.all([
    asset<IAutoMovieHumanPersonHeadView>(new URL("../../../test/studies/human-person/generation/head.json.gz", import.meta.url)),
    asset<IAutoMovieHumanPersonBodyView>(new URL("../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
  ]);
  const initial = connectedPersonStandardDocument(head.face.id, body.body.id);
  const { ask } = createBodySimpleWorkerTransport(
    () => new Worker(new URL("./connected-person-measure-worker.ts", import.meta.url), { type: "module" }),
  );
  const panel = mountConnectedPersonPanel(document.querySelector<HTMLDivElement>("#app")!, {
    face: head.face,
    aliases: head.aliases ?? [],
    body: body.body,
    initial,
    poses: connectedPersonPosePresets,
    expressions: connectedPersonExpressionPresets,
    viewport: (canvas) =>
      createConnectedBodyViewport<IAutoMovieHumanPersonDocument>({
        canvas,
        pixelRatio: devicePixelRatio,
        renderer: new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }),
        orbit: (camera) => new OrbitControls(camera, canvas),
        worker: () =>
          createConnectedBodyPort(
            new Worker(new URL("./connected-person-worker.ts", import.meta.url), { type: "module" }),
          ),
        loadTexture: (texture) => new THREE.TextureLoader().loadAsync(texture),
        observeResize: (resize) => { new ResizeObserver(resize).observe(canvas); },
        serialize: serializeHumanPersonDocument,
      }),
    solveMeasurement: (shape, channel, targetMetres) =>
      ask<IConnectedBodyMeasurement>({ kind: "solveMeasurement", shape, channel, targetMetres }),
    readPersonMeasurement: (person, channel) =>
      ask<number>({ kind: "readPersonMeasurement", document: serializeHumanPersonDocument(person), channel }),
    solvePersonMeasurement: (person, channel, targetMetres) =>
      ask<IConnectedPersonMeasuredSolution>({
        kind: "solvePersonMeasurement",
        document: serializeHumanPersonDocument(person),
        channel,
        targetMetres,
      }),
    download: (filename, bytes, mime) => {
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
