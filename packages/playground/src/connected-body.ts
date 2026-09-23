/**
 * Browser entry for the connected body editor. Native browser IO resolves the
 * shipped CC0 body basis; all editing, history, numerical admission and
 * rendering delegate to the same package/viewport owners as the connected
 * face page. The neutral connected face is built once by the face worker and
 * shown seated on the body's head bone, so the whole figure is judged
 * together; it never enters the body document or its export. The face
 * document names the face basis revision read off the head of the basis
 * asset, so this page loads no face study and never parses the face basis
 * itself. A companion that cannot be built is reported on the status line and
 * body editing continues without it.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodyShoulderPose,
  type IAutoMovieHumanBodySimpleShape,
  type IAutoMovieHumanFaceBasisDocument,
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
import { createBodySimpleWorkerTransport } from "./human/bodySimpleWorkerTransport";
import {
  readConnectedAssetRevision,
  readConnectedFaceAsset,
} from "./human/connectedAsset";
import { mountConnectedBodyPanel } from "./human/connectedBodyPanel";
import { createConnectedBodyPort } from "./human/connectedBodyPort";
import { createConnectedBodyViewport } from "./human/connectedBodyViewport";
import type {
  ConnectedFaceRequest,
  ConnectedFaceResult,
} from "./human/connectedRuntime";
import { prepareHumanPreview } from "./human/previewScene";
import { createHumanResidentPort } from "./human/residentPort";
import { createHumanResidentWorker } from "./human/residentWorker";

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

const shoulder = (
  bone: IAutoMovieHumanBodyShoulderPose["bone"],
  plane: number,
  elevation: number,
  axialRotation = 0,
): IAutoMovieHumanBodyShoulderPose => ({
  bone,
  plane,
  elevation,
  axialRotation,
});

async function main(): Promise<void> {
  const basis = await readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
    read: () =>
      fetch(
        new URL(
          "../../../test/studies/human-body/connected-basis/basis.json.gz",
          import.meta.url,
        ),
      ),
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
  let viewport!: ReturnType<typeof createConnectedBodyViewport>;
  // The face is one neutral build of the connected face basis, decoded once.
  // Its worker is the face page's own resident worker; the body page asks it
  // for one exported file through the same request protocol the face page
  // uses and draws that file, so a change of the face worker's protocol
  // reaches this page through its types rather than as a failure at runtime.
  const faceWorker = createHumanResidentWorker<
    ConnectedFaceRequest,
    ConnectedFaceResult
  >(() =>
    createHumanResidentPort(
      new Worker(new URL("./connected-face-worker.ts", import.meta.url), {
        type: "module",
      }),
    ),
  );
  const face = {
    build: async (
      document: IAutoMovieHumanFaceBasisDocument,
    ): Promise<{ group: THREE.Group }> => {
      const result = await faceWorker.request({
        operation: "export",
        document: serializeHumanFaceBasisDocument(document),
      }).result;
      if (result.operation !== "export")
        throw new Error("Expected an exported companion face.");
      const group = await decode(result.glb);
      prepareHumanPreview(group, viewport.renderer() === undefined ? 1 : 8);
      return { group };
    },
  };
  // The face document names the face basis revision, which is the id the
  // basis asset opens with; reading it off the head of the stream is all this
  // page needs of the face basis. The build is display only, so its failure
  // settles as a value to report where the body is seated, never as a page
  // error.
  const faceReady: Promise<{ group: THREE.Group } | Error> =
    readConnectedAssetRevision({
      read: () =>
        fetch(
          new URL(
            "../../../test/studies/human-face/connected-basis/global-face/basis.json.gz",
            import.meta.url,
          ),
        ),
    })
      .then((revision) =>
        face.build({
          id: "companion-face",
          name: "companion face",
          basis: revision,
          shape: {},
          expression: {},
        }),
      )
      .catch((error: unknown) =>
        error instanceof Error ? error : new Error(String(error)),
      );
  // The face is built in the neutral body's frame, so it is seated relative
  // to the neutral head joint, read off the basis rather than off whichever
  // body happened to be shown first.
  const headJoint = basis.joints.find((one) => one.bone === "head")!;
  const headMark = basis.landmarks.ids.indexOf(headJoint.head);
  const neutralHead: IAutoMovieVector3 = {
    x: basis.landmarks.positions[headMark * 3],
    y: basis.landmarks.positions[headMark * 3 + 1],
    z: basis.landmarks.positions[headMark * 3 + 2],
  };
  const seat = (model: { extras?: Record<string, unknown> } | null): void => {
    if (model === null) {
      viewport.companion.show(undefined);
      return;
    }
    const bones = (model.extras?.bones ?? []) as Bones;
    const head = bones.find((one) => one.bone === "head");
    if (head === undefined) return;
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
    // This runs after the panel has written this body's status, so a
    // companion failure is appended to that line rather than overwritten by it.
    void faceReady.then((built) => {
      if (built instanceof Error) {
        document.querySelector<HTMLDivElement>("#body-status")!.textContent +=
          "\nCompanion face unavailable: " + built.message;
        return;
      }
      viewport.companion.show(built.group);
      viewport.companion.place(matrix);
    });
  };
  // the simple tier's measured inversions run in their own worker
  const { ask } = createBodySimpleWorkerTransport(
    () =>
      new Worker(
        new URL("./connected-body-simple-worker.ts", import.meta.url),
        {
          type: "module",
        },
      ),
  );
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
          pose: [joint("leftLowerArm", 0), joint("rightLowerArm", 0)],
          shoulders: [
            shoulder("leftUpperArm", 0, 90),
            shoulder("rightUpperArm", 0, 90),
          ],
        },
        // solved on the current body: each arm hangs as low as its skin lets it
        { name: "Arms down", solve: "armsDown" },
        {
          name: "Elbows 90",
          pose: [joint("leftLowerArm", 90), joint("rightLowerArm", 90)],
        },
        {
          name: "Arms overhead",
          shoulders: [
            shoulder("leftUpperArm", 0, 180),
            shoulder("rightUpperArm", 0, 180),
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
        (viewport = createConnectedBodyViewport({
          canvas,
          pixelRatio: devicePixelRatio,
          renderer: new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            preserveDrawingBuffer: true,
          }),
          orbit: (camera) => new OrbitControls(camera, canvas),
          worker: () =>
            createConnectedBodyPort(
              new Worker(
                new URL("./connected-body-worker.ts", import.meta.url),
                { type: "module" },
              ),
            ),
          loadTexture: (asset) => new THREE.TextureLoader().loadAsync(asset),
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
