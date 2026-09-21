/**
 * Browser entry for the connected body editor. Native browser IO resolves the
 * shipped CC0 body basis; all editing, history, numerical admission and
 * rendering delegate to the same package/viewport owners as the connected
 * face page. The neutral connected face is built once by the face worker and
 * shown seated on the body's head bone, so the whole figure is judged
 * together; it never enters the body document or its export.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodySimpleShape,
  type IAutoMovieHumanFaceBasisDocument,
  serializeHumanBodyBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import archetypes from "../../../test/studies/human-body/connected-basis/archetypes.json";
import faceStudies from "../../../test/studies/human-face/connected-basis/global-face/subjects.json";
import { readConnectedFaceAsset } from "./human/connectedAsset";
import { mountConnectedBodyPanel } from "./human/connectedBodyPanel";
import { createHumanPreviewBuilder } from "./human/previewBuilder";
import { prepareHumanPreview } from "./human/previewScene";
import { createHumanViewport } from "./human/viewport";
import { createHumanPreviewWorkerPort } from "./human/workerPort";

type Transform = {
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};
type Bones = {
  bone: AutoMovieHumanoidBone;
  rest: Transform;
  posed: Transform;
}[];

const joint = (
  bone: AutoMovieHumanoidBone,
  flexion: number | null,
  abduction: number | null = null,
  twist: number | null = null,
): IAutoMovieJointPose => ({ bone, flexion, abduction, twist });

async function main(): Promise<void> {
  const basis = await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
    read: () =>
      fetch(
        new URL(
          "../../../test/studies/human-body/connected-basis/basis.json.gz",
          import.meta.url,
        ),
      ),
    decode: (bytes) =>
      new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text(),
  });
  const initial: IAutoMovieHumanBodyBasisDocument = {
    id: "connected-body",
    name: "CC0 connected body",
    basis: basis.id,
    shape: {},
  };
  const loader = new GLTFLoader();
  const decode = async (bytes: Uint8Array<ArrayBuffer>) =>
    (
      await loader.parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      )
    ).scene;
  let viewport!: ReturnType<
    typeof createHumanViewport<IAutoMovieHumanBodyBasisDocument>
  >;
  // The face is one neutral build of the connected face basis, decoded once.
  // Its worker is the face page's own; the body page only asks it for bytes.
  const face = createHumanPreviewBuilder<
    { group: THREE.Group },
    IAutoMovieHumanFaceBasisDocument
  >({
    serialize: serializeHumanFaceBasisDocument,
    worker: () =>
      createHumanPreviewWorkerPort(
        new Worker(new URL("./connected-face-worker.ts", import.meta.url), {
          type: "module",
        }),
      ),
    decode: async (artifact) => {
      const group = await decode(artifact.glb);
      prepareHumanPreview(group, viewport.renderer() === undefined ? 1 : 8);
      return { group };
    },
    dispose: () => {},
  });
  let neutralHead: IAutoMovieVector3 | undefined;
  const seat = (model: { extras?: Record<string, unknown> } | null): void => {
    if (model === null) {
      viewport.companion.show(undefined);
      return;
    }
    const bones = (model.extras?.bones ?? []) as Bones;
    const head = bones.find((one) => one.bone === "head");
    if (head === undefined) return;
    neutralHead ??= head.rest.position;
    // The face follows the head bone as skin bound to it would: the posed
    // transform undoes the rest rotation about the neutral head position.
    const q = (r: IAutoMovieQuaternion) =>
      new THREE.Quaternion(r.x, r.y, r.z, r.w);
    const v = (p: IAutoMovieVector3) => new THREE.Vector3(p.x, p.y, p.z);
    const rotation = q(head.posed.rotation).multiply(
      q(head.rest.rotation).invert(),
    );
    const matrix = new THREE.Matrix4()
      .makeTranslation(v(head.posed.position))
      .multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation))
      .multiply(new THREE.Matrix4().makeTranslation(v(neutralHead).negate()));
    void faceReady.then((built) => {
      viewport.companion.show(built.group);
      viewport.companion.place(matrix);
    });
  };
  // the simple tier's measured inversions run in their own worker
  const simpleWorker = new Worker(
    new URL("./connected-body-simple-worker.ts", import.meta.url),
    { type: "module" },
  );
  let simpleTicket = 0;
  const pending = new Map<
    number,
    { resolve: (value: never) => void; reject: (error: Error) => void }
  >();
  simpleWorker.onmessage = (
    event: MessageEvent<{ id: number; result?: unknown; error?: string }>,
  ) => {
    const waiting = pending.get(event.data.id);
    if (waiting === undefined) return;
    pending.delete(event.data.id);
    if (event.data.error !== undefined)
      waiting.reject(new Error(event.data.error));
    else waiting.resolve(event.data.result as never);
  };
  const ask = <T>(request: object): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const id = ++simpleTicket;
      pending.set(id, { resolve: resolve as (value: never) => void, reject });
      simpleWorker.postMessage({ id, ...request });
    });
  const panel = mountConnectedBodyPanel(
    document.querySelector<HTMLDivElement>("#app")!,
    {
      basis,
      initial,
      simple: {
        expand: (simple, over) =>
          ask<Record<string, number>>({ kind: "expand", simple, over }),
        project: (shape) =>
          ask<IAutoMovieHumanBodySimpleShape>({ kind: "project", shape }),
      },
      shapes: [
        { name: "Neutral", shape: {} },
        { name: "Female", shape: { macroGender: -1 } },
        { name: "Male", shape: { macroGender: 1 } },
        { name: "Child", shape: { macroAge: -1 } },
        { name: "Old", shape: { macroAge: 1 } },
        { name: "Heavy", shape: { macroWeight: 1 } },
        { name: "Thin", shape: { macroWeight: -1 } },
        { name: "Muscular", shape: { macroMuscle: 1 } },
        { name: "Tall", shape: { macroHeight: 1 } },
        { name: "Short", shape: { macroHeight: -1 } },
        // the simple tier's review population, each solved on click
        ...Object.entries(
          archetypes as Record<
            string,
            {
              simple: IAutoMovieHumanBodySimpleShape;
              detail?: Record<string, number>;
            }
          >,
        ).map(([name, archetype]) => ({
          name: name.replace(/-/g, " "),
          shape: async () => ({
            ...(await ask<Record<string, number>>({
              kind: "expand",
              simple: archetype.simple,
            })),
            ...archetype.detail,
          }),
        })),
      ],
      poses: [
        { name: "A-pose", pose: [] },
        {
          name: "T-pose",
          pose: [
            joint("leftUpperArm", null, 90),
            joint("rightUpperArm", null, 90),
            joint("leftLowerArm", 0),
            joint("rightLowerArm", 0),
          ],
        },
        {
          name: "Arms down",
          pose: [
            joint("leftUpperArm", null, 0),
            joint("rightUpperArm", null, 0),
            joint("leftLowerArm", 0),
            joint("rightLowerArm", 0),
          ],
        },
        {
          name: "Elbows 90",
          pose: [joint("leftLowerArm", 90), joint("rightLowerArm", 90)],
        },
        {
          name: "Arms overhead",
          pose: [
            joint("leftUpperArm", null, 170),
            joint("rightUpperArm", null, 170),
          ],
        },
        {
          name: "Squat",
          pose: [
            joint("leftUpperLeg", 90),
            joint("rightUpperLeg", 90),
            joint("leftLowerLeg", 120),
            joint("rightLowerLeg", 120),
            joint("leftFoot", 20),
            joint("rightFoot", 20),
          ],
        },
        {
          name: "Sitting",
          pose: [
            joint("leftUpperLeg", 90),
            joint("rightUpperLeg", 90),
            joint("leftLowerLeg", 90),
            joint("rightLowerLeg", 90),
          ],
        },
        {
          name: "Trunk twist",
          pose: [
            joint("spine", null, null, 10),
            joint("chest", null, null, 10),
            joint("upperChest", null, null, 10),
          ],
        },
      ],
      viewport: (canvas) =>
        (viewport = createHumanViewport({
          serialize: serializeHumanBodyBasisDocument,
          canvas,
          pixelRatio: devicePixelRatio,
          extent: 1,
          renderer: new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            preserveDrawingBuffer: true,
          }),
          orbit: (camera) => new OrbitControls(camera, canvas),
          worker: () =>
            createHumanPreviewWorkerPort(
              new Worker(
                new URL("./connected-body-worker.ts", import.meta.url),
                { type: "module" },
              ),
            ),
          decode: async (bytes) => (await loader.parseAsync(bytes, "")).scene,
          observeResize: (resize) => {
            new ResizeObserver(resize).observe(canvas);
          },
        })),
      seat,
      download: (filename, bytes, mime) => {
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    },
  );
  // the face study's documents name the face basis revision the worker
  // compiled, which is all the neutral companion needs to know about it
  const faceReady = face.build({
    id: "companion-face",
    name: "companion face",
    basis: faceStudies[0].basis,
    shape: {},
    expression: {},
  });
  Object.assign(window, {
    __connectedBody: {
      snapshot: panel.snapshot,
      document: () => panel.snapshot()?.document,
      change: panel.change,
      camera: viewport.cameraView,
      fit: viewport.fitView,
      clay: viewport.setClay,
      finish: viewport.finish,
      renderer: viewport.renderer,
    },
  });
  await panel.ready;
}
void main().catch((error: unknown) => {
  document.querySelector<HTMLDivElement>("#app")!.textContent =
    error instanceof Error ? error.message : String(error);
});
