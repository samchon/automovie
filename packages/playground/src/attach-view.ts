import { type IAutoMovieSkeleton, type IAutoMovieSceneNode, type IAutoMovieGait, type IAutoMovieQuaternion, type IAutoMovieShotPerformance, type IAutoMovieCamera, IAutoMovieModel, IAutoMovieMotion, IAutoMoviePerformance, IAutoMovieScript, IAutoMovieShot, IAutoMovieStage, IAutoMovieVector3 } from "@automovie/interface";





import { HUMANOID_GAITS } from "@automovie/archetypes";
import {
  HUMANOID_JOINT_AXES,
  IAutoMovieActorContext,
  cutSequence,
  makeActorSynthesizer,
  performShot,
  resolveSequencePlayback,
  stageScene,
} from "@automovie/engine";

import {
  AutoMoviePlayer,
  applyObjectMotion,
  applyObjectMotions,
  assertAutoMovieViewerCameraDepthPrecision,
  buildModel,
  mountViewer,
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

// The `attachTo` verb on screen: a figure walks the floor with a blade coupled
// to its left hand. The engine bakes the coupling into the shot's objectMotions
// (a world-space node clip that, each frame, is the hand's frame (the walker's
// FK) composed onto the walker's placement) so the blade rides the hand across
// the shot. The viewer drives the blade's group from that clip: the read side
// of compileAttach. Deterministic via renderAt(t) for capture.

// ── the blade prop: grip at origin, blade rising +Y; no rig ──────────────────
const bladeModel: IAutoMovieModel = {
  id: "blade",
  name: "blade",
  origin: "generated",
  skeleton: null,
  body: null,
  materials: [
    {
      id: "steel",
      name: "steel",
      baseColor: { r: 0.62, g: 0.66, b: 0.72, a: 1, hex: null },
      metallic: 0.8,
      roughness: 0.3,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
    },
  ],
  parts: [
    {
      id: "blade",
      name: "blade",
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 0.05, height: 0.66, depth: 0.05 },
      },
      material: "steel",
      attachedBone: null,
      // rise from the grip (the hand) rather than centring through it
      transform: {
        translation: { x: 0, y: 0.36, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    },
  ],
  asset: null,
};

// ── the stage payloads ───────────────────────────────────────────────────────
const script: IAutoMovieScript = {
  logline: "A figure walks the floor, blade in hand.",
  theme: "a prop rides the hand",
  cast: [
    { node: "walker", character: "the walker", modelRef: "stickman" },
    { node: "blade", character: "the blade", modelRef: null },
  ],
  beats: [
    {
      id: "carry",
      name: "the carry",
      summary: "the walker crosses the floor and the blade rides the left hand",
      durationHint: 4,
    },
  ],
};

const staging: IAutoMovieStage = {
  scene: { id: "scene-carry", name: "the carry" },
  plan: "the walker starts near and crosses to far along +Z, facing +Z; the blade is nocked in the left hand; a side-on camera reads the crossing.",
  actors: [
    { node: "walker", position: { x: 0, y: 0, z: -1.8 }, facingDeg: 0 },
    { node: "blade", position: { x: 0.25, y: 1.05, z: -1.8 }, facingDeg: 0 },
  ],
  cameras: [
    {
      node: "cam-main",
      position: { x: 4.2, y: 1.6, z: 0.1 },
      lookAt: { kind: "point", point: { x: 0, y: 1, z: 0.1 } },
      fovDeg: 46,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.6 },
    },
  ],
  lights: [
    {
      node: "sun",
      role: "sun",
      direction: { x: -0.7, y: -1.3, z: 0.35 },
      intensity: 1.4,
    },
  ],
};

const performance: IAutoMoviePerformance = {
  beat: "carry",
  plan: "the walker crosses the floor; the blade is attached to its left hand for the whole shot.",
  draft: [
    {
      verb: "locomote",
      actor: "walker",
      start: 0,
      duration: 4,
      gait: "walk",
      to: { kind: "point", point: { x: 0, y: 0, z: 1.8 } },
    },
    {
      verb: "attachTo",
      actor: "blade",
      parent: "walker",
      bone: "leftHand",
      start: 0,
      duration: "auto",
    },
  ],
  revise: {
    review: "the walker covers the floor; the blade tracks the left hand.",
    final: null,
  },
  duration: 4,
};

// ── rigs + the content seam ──────────────────────────────────────────────────
const walkerRig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = buildStickman(DEFAULT_STICKMAN);
const rigOf: { readonly walker: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; }; } = { walker: walkerRig } as const;
const isActor: (node: string) => node is keyof typeof rigOf = (node: string): node is keyof typeof rigOf => node in rigOf;

const staged: ReturnType<typeof stageScene> = stageScene(script, staging);
if (staged.success !== true)
  throw new Error(`staging failed: ${JSON.stringify(staged)}`);

const nodePositions: Map<string, IAutoMovieVector3> = new Map<string, IAutoMovieVector3>(
  staged.scene.nodes.map((n: IAutoMovieSceneNode): [string, IAutoMovieVector3] => [n.id, n.transform.translation]),
);
const contexts: Map<string, IAutoMovieActorContext> = new Map<string, IAutoMovieActorContext>(
  staged.scene.nodes
    .filter((n: IAutoMovieSceneNode): boolean => isActor(n.id))
    .map((n: IAutoMovieSceneNode): [string, { skeleton: string; rig: IAutoMovieSkeleton; gaits: IAutoMovieGait[]; position: IAutoMovieVector3; speed: number; facingDeg: number; eyeHeight: number; restPose: { skeleton: string; root: null; joints: never[]; }; }] => {
      const rig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = rigOf[n.id as keyof typeof rigOf];
      return [
        n.id,
        {
          skeleton: rig.skeleton.id,
          rig: rig.skeleton,
          gaits: [HUMANOID_GAITS.walk],
          position: n.transform.translation,
          speed: 0.7,
          facingDeg: 0,
          eyeHeight: 1.45,
          restPose: { skeleton: rig.skeleton.id, root: null, joints: [] },
        },
      ];
    }),
);
const synthesize: ReturnType<typeof makeActorSynthesizer> = makeActorSynthesizer(contexts, nodePositions);

// ── the ladder: perform → cut ────────────────────────────────────────────────
const performed: ReturnType<typeof performShot> = performShot({
  script,
  staged,
  performance,
  synthesize,
  skeleton: (node: string): IAutoMovieSkeleton | null => (isActor(node) ? rigOf[node].skeleton : null),
});
if (performed.success !== true)
  throw new Error(`perform failed: ${JSON.stringify(performed.violations)}`);
const shots: IAutoMovieShot[] = [performed.shot];
const motionsByShot: Map<string, Record<string, IAutoMovieMotion>> = new Map<string, Record<string, IAutoMovieMotion>>([
  [performed.shot.id, performed.motions],
]);

const cut: ReturnType<typeof cutSequence> = cutSequence(
  {
    sequence: { id: "seq-carry", name: "the carry" },
    fps: 30,
    entries: shots.map((s: IAutoMovieShot): { shot: string; trim: null; transition: null; } => ({ shot: s.id, trim: null, transition: null })),
    pacing: "one continuous carry.",
    continuity: "the blade never leaves the hand.",
  },
  shots,
);
if (cut.success !== true) throw new Error("cut failed");

/**
 * Compiled sequence runtime in seconds, consumed locally by this page's interactive loop and published through its existing window capture metadata. It is a timeline value, not evidence that a frame was drawn, captured or visually healthy.
 */
const FILM_DURATION: number = cut.runtime;

// ── the set: scene nodes → three.js (groups tracked by id) ───────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f6);
scene.add(new THREE.GridHelper(16, 32, 0xb8c0cc, 0xd5dbe4));
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.15));
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 4, -1.4);
scene.add(sun);

const groupsById: Map<string, THREE.Group<THREE.Object3DEventMap>> = new Map<string, THREE.Group>();
const built: Record<string, ReturnType<typeof buildModel>> = {};
for (const node of staged.scene.nodes) {
  const obj: ReturnType<typeof buildModel> = buildModel(isActor(node.id) ? rigOf[node.id].model : bladeModel);
  const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  const t: IAutoMovieVector3 = node.transform.translation;
  group.position.set(t.x, t.y, t.z);
  const r: IAutoMovieQuaternion = node.transform.rotation;
  group.quaternion.set(r.x, r.y, r.z, r.w);
  // the FULL staged base, scale included (#1087)
  const s: IAutoMovieVector3 = node.transform.scale;
  group.scale.set(s.x, s.y, s.z);
  group.add(obj.object);
  scene.add(group);
  built[node.id] = obj;
  groupsById.set(node.id, group);
}

const playersByShot: Map<string, { node: string; player: AutoMoviePlayer; }[]> = new Map(
  shots.map((shot: IAutoMovieShot): [string, { node: string; player: AutoMoviePlayer; }[]] => [
    shot.id,
    shot.performances
      .filter((p: IAutoMovieShotPerformance): boolean => isActor(p.node))
      .map((p: IAutoMovieShotPerformance): { node: string; player: AutoMoviePlayer; } => ({
        node: p.node,
        player: new AutoMoviePlayer(
          built[p.node]!,
          rigOf[p.node as keyof typeof rigOf].skeleton,
          motionsByShot.get(shot.id)![p.node]!,
          HUMANOID_JOINT_AXES,
        ),
      })),
  ]),
);

// ── the projector: global seconds → posed walker + carried blade + camera ────
const stagedCam: IAutoMovieCamera = staged.scene.cameras[0]!;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  stagedCam.fovY,
  16 / 9,
  stagedCam.near,
  stagedCam.far,
);
const applyStagedCamera: () => void = (): void => {
  const t: IAutoMovieVector3 = stagedCam.transform.translation;
  const r: IAutoMovieQuaternion = stagedCam.transform.rotation;
  camera.position.set(t.x, t.y, t.z);
  camera.quaternion.set(r.x, r.y, r.z, r.w);
  camera.fov = stagedCam.fovY;
  camera.updateProjectionMatrix();
};
applyStagedCamera();

const shotById: Map<string, IAutoMovieShot> = new Map(shots.map((s: IAutoMovieShot): [string, IAutoMovieShot] => [s.id, s]));
const renderAt: (seconds: number) => void = (seconds: number): void => {
  const sample: ReturnType<typeof resolveSequencePlayback> = resolveSequencePlayback(cut.sequence, shots, seconds);
  if (sample === null) return;
  for (const { player } of playersByShot.get(sample.shot)!)
    player.update(sample.time);
  const live: IAutoMovieShot = shotById.get(sample.shot)!;
  // objectMotions: the blade's world-space follow clip (compileAttach).
  applyObjectMotions(live.objectMotions, sample.time, (node: string): THREE.Group<THREE.Object3DEventMap> | undefined =>
    groupsById.get(node),
  );
  if (live.cameraMotion === null) applyStagedCamera();
  else applyObjectMotion(live.cameraMotion, sample.time, (): THREE.PerspectiveCamera => camera);
};

// ── mount + deterministic seek contract (capture) ────────────────────────────
const params: URLSearchParams = new URLSearchParams(location.search);
const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#view")!;
const capMode: boolean = params.get("cap") === "1";
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
if (freezeAt !== null && Number.isFinite(freezeAt)) renderAt(freezeAt);

const handle: ReturnType<typeof mountViewer> = mountViewer(canvas, scene, camera, (elapsed: number): void => {
  if (!capMode && freezeAt === null) renderAt(elapsed % (FILM_DURATION + 0.8));
});
const cameraDepthPrecision: ReturnType<typeof assertAutoMovieViewerCameraDepthPrecision> = assertAutoMovieViewerCameraDepthPrecision({
  renderer: handle.renderer,
  source: stagedCam,
  realized: camera,
});
(window as unknown as { __afSeek: (t: number) => void }).__afSeek = (
  t: number,
): void => {
  renderAt(t);
  guardAutoMovieSceneShadowRetirement(scene, handle.renderer);
  guardAutoMovieRenderModeRetirement(scene);
  handle.renderer.render(scene, camera);
  handle.completeFrame(t);
};
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  duration: FILM_DURATION,
  shots: shots.map((s: IAutoMovieShot): string => s.id),
  cameraDepthPrecision,
};
