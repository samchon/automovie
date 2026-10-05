/**
 * Browser entry for the connected person editor. It reads the published
 * person generation's head and body files (the head and body partition views
 * of one connected skin), opens the standard person (the CC0 reference face
 * on the neutral body, one linked identity) and mounts the person panel over
 * a resident person worker and a measurement worker. All evaluation happens
 * in the workers through the product person runtime.
 */
import {
  type IAutoMovieHumanBodyShoulderPose,
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonDocument,
  type IAutoMovieHumanPersonHeadView,
  serializeHumanPersonDocument,
} from "@automovie/human";
import type { AutoMovieHumanoidBone, IAutoMovieJointPose } from "@automovie/interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { createBodySimpleWorkerTransport } from "./human/body/bodySimpleWorkerTransport";
import { createConnectedBodyPort } from "./human/body/connectedBodyPort";
import { createConnectedBodyViewport } from "./human/body/connectedBodyViewport";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import type { IConnectedPersonMeasurement } from "./human/person/IConnectedPersonMeasurement";
import { mountConnectedPersonPanel } from "./human/person/connectedPersonPanel";

const joint = (
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });

const shoulder = (
  bone: IAutoMovieHumanBodyShoulderPose["bone"],
  plane: number,
  elevation: number,
): IAutoMovieHumanBodyShoulderPose => ({ bone, plane, elevation, axialRotation: 0 });

async function main(): Promise<void> {
  // Literal asset URLs, which the bundler resolves relative to this module.
  const asset = <T,>(url: URL): Promise<T> => readConnectedFaceAsset<T>({ read: () => fetch(url) });
  const [head, body] = await Promise.all([
    asset<IAutoMovieHumanPersonHeadView>(new URL("../../../test/studies/human-person/generation/head.json.gz", import.meta.url)),
    asset<IAutoMovieHumanPersonBodyView>(new URL("../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
  ]);
  const initial: IAutoMovieHumanPersonDocument = {
    id: "connected-person",
    name: "CC0 connected person",
    population: "linked",
    face: { id: "connected-person-face", name: "reference face", basis: head.face.id, shape: {}, expression: {} },
    body: { id: "connected-person-body", name: "neutral body", basis: body.body.id, shape: {} },
  };
  const { ask } = createBodySimpleWorkerTransport(
    () => new Worker(new URL("./connected-person-measure-worker.ts", import.meta.url), { type: "module" }),
  );
  const panel = mountConnectedPersonPanel(document.querySelector<HTMLDivElement>("#app")!, {
    face: head.face,
    body: body.body,
    initial,
    poses: [
      { name: "A-pose", pose: [] },
      {
        name: "T-pose",
        pose: [joint("leftLowerArm", 0), joint("rightLowerArm", 0)],
        shoulders: [shoulder("leftUpperArm", 0, 90), shoulder("rightUpperArm", 0, 90)],
      },
      { name: "Head turn", pose: [joint("neck", null, null, 30), joint("head", 10, null, 20)] },
      { name: "Head flexion", pose: [joint("neck", 20), joint("head", 15)] },
      { name: "Head extension", pose: [joint("neck", -20), joint("head", -15)] },
      { name: "Arms overhead", shoulders: [shoulder("leftUpperArm", 0, 180), shoulder("rightUpperArm", 0, 180)] },
      {
        name: "Sitting",
        pose: [joint("leftUpperLeg", 90), joint("rightUpperLeg", 90), joint("leftLowerLeg", 90), joint("rightLowerLeg", 90)],
      },
    ],
    expressions: [
      { name: "Neutral", expression: {} },
      { name: "Smile", expression: { mouthSmileLeft: 0.5, mouthSmileRight: 0.5 } },
      { name: "Open jaw", expression: { jawOpen: 0.5 } },
      { name: "Wink", expression: { eyeBlinkRight: 1 } },
    ],
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
      ask<IConnectedPersonMeasurement>({ kind: "solveMeasurement", shape, channel, targetMetres }),
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
