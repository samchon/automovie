import { type IAutoMovieSkeleton, type IAutoMovieModel, type IAutoMovieSceneNode, type IAutoMovieQuaternion, type IAutoMovieShotPerformance, type IAutoMovieCamera, IAutoMovieMotion, IAutoMoviePerformance, IAutoMovieScript, IAutoMovieShot, IAutoMovieStage, IAutoMovieVector3 } from "@automovie/interface";





import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  IAutoMovieActorContext,
  cutSequence,
  makeActorSynthesizer,
  performShot,
  resolveSequencePlayback,
  stageScene,
} from "@automovie/engine";

import {
  AutoMoviePlayer,
  assertAutoMovieViewerCameraDepthPrecision,
  buildModel,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

// The whole-body `jump` gesture on screen: a figure coils, leaps (the pose
// root arcs up on Y), tucks its legs at the apex, and absorbs the landing,
// then throws both arms overhead in a celebration. The celebrate gesture is
// authored in clinical space (abduction 180 = straight up, no per-side mirror);
// the player is handed HUMANOID_REST_FRAME so it reads those angles up. Engine-
// authored, ROM-safe, deterministic via renderAt(t).

const script: IAutoMovieScript = {
  logline: "A figure jumps, then celebrates.",
  theme: "a coil, a leap, and a cheer",
  cast: [{ node: "jumper", character: "the jumper", modelRef: "stickman" }],
  beats: [
    {
      id: "leap",
      name: "the leap",
      summary: "the figure jumps twice, then throws its arms up",
      durationHint: 5,
    },
  ],
};

const staging: IAutoMovieStage = {
  scene: { id: "scene-leap", name: "the leap" },
  plan: "the jumper stands centre, facing +Z; a side-on camera reads the vertical arc.",
  actors: [{ node: "jumper", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 }],
  cameras: [
    {
      node: "cam-main",
      position: { x: 3.4, y: 1.5, z: 0.2 },
      lookAt: { kind: "point", point: { x: 0, y: 1, z: 0 } },
      fovDeg: 48,
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
  beat: "leap",
  plan: "two jumps back to back, then both arms thrown up in a cheer.",
  draft: [
    {
      verb: "gesture",
      actor: "jumper",
      start: 0,
      duration: 1.4,
      kind: "jump",
      region: "fullBody",
    },
    {
      verb: "gesture",
      actor: "jumper",
      start: 1.5,
      duration: 1.4,
      kind: "jump",
      region: "fullBody",
    },
    {
      verb: "gesture",
      actor: "jumper",
      start: 3.1,
      duration: 1.4,
      kind: "celebrate",
      region: "upperBody",
    },
  ],
  revise: { review: "two clean leaps into a cheer.", final: null },
  duration: 4.6,
};

// ── rigs + the content seam ──────────────────────────────────────────────────
const jumperRig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = buildStickman(DEFAULT_STICKMAN);
const rigOf: { readonly jumper: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; }; } = { jumper: jumperRig } as const;
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
    .map((n: IAutoMovieSceneNode): [string, { skeleton: string; rig: IAutoMovieSkeleton; gaits: never[]; position: IAutoMovieVector3; speed: number; facingDeg: number; eyeHeight: number; restPose: { skeleton: string; root: null; joints: never[]; }; }] => {
      const rig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = rigOf[n.id as keyof typeof rigOf];
      return [
        n.id,
        {
          skeleton: rig.skeleton.id,
          rig: rig.skeleton,
          gaits: [],
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
    sequence: { id: "seq-leap", name: "the leap" },
    fps: 30,
    entries: shots.map((s: IAutoMovieShot): { shot: string; trim: null; transition: null; } => ({ shot: s.id, trim: null, transition: null })),
    pacing: "two leaps.",
    continuity: "the figure lands where it took off.",
  },
  shots,
);
if (cut.success !== true) throw new Error("cut failed");

/**
 * Compiled sequence runtime in seconds, consumed locally by this page's interactive loop and published through its existing window capture metadata. It is a timeline value, not evidence that a frame was drawn, captured or visually healthy.
 */
const FILM_DURATION: number = cut.runtime;

// ── the set ──────────────────────────────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f6);
scene.add(new THREE.GridHelper(12, 24, 0xb8c0cc, 0xd5dbe4));
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.15));
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(3, 4, -1.4);
scene.add(sun);

const built: Record<string, ReturnType<typeof buildModel>> = Object.fromEntries(
  staged.scene.nodes.map((node: IAutoMovieSceneNode): readonly [string, ReturnType<typeof buildModel>] => {
    const obj: ReturnType<typeof buildModel> = buildModel(rigOf[node.id as keyof typeof rigOf].model);
    const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
    const t: IAutoMovieVector3 = node.transform.translation;
    group.position.set(t.x, t.y, t.z);
    const r: IAutoMovieQuaternion = node.transform.rotation;
    group.quaternion.set(r.x, r.y, r.z, r.w);
    group.add(obj.object);
    scene.add(group);
    return [node.id, obj] as const;
  }),
);

const playersByShot: Map<string, { node: string; player: AutoMoviePlayer; }[]> = new Map(
  shots.map((shot: IAutoMovieShot): [string, { node: string; player: AutoMoviePlayer; }[]] => [
    shot.id,
    shot.performances.map((p: IAutoMovieShotPerformance): { node: string; player: AutoMoviePlayer; } => ({
      node: p.node,
      player: new AutoMoviePlayer(
        built[p.node]!,
        rigOf[p.node as keyof typeof rigOf].skeleton,
        motionsByShot.get(shot.id)![p.node]!,
        HUMANOID_JOINT_AXES,
        false,
        undefined,
        HUMANOID_REST_FRAME,
      ),
    })),
  ]),
);

// ── the projector ────────────────────────────────────────────────────────────
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
  if (live.cameraMotion === null) applyStagedCamera();
};

// ── mount + deterministic seek contract (capture) ────────────────────────────
const params: URLSearchParams = new URLSearchParams(location.search);
const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#view")!;
const capMode: boolean = params.get("cap") === "1";
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
if (freezeAt !== null && Number.isFinite(freezeAt)) renderAt(freezeAt);

const handle: ReturnType<typeof mountViewer> = mountViewer(canvas, scene, camera, (elapsed: number): void => {
  if (!capMode && freezeAt === null) renderAt(elapsed % (FILM_DURATION + 0.6));
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
  handle.renderer.render(scene, camera);
  handle.completeFrame(t);
};
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  duration: FILM_DURATION,
  shots: shots.map((s: IAutoMovieShot): string => s.id),
  cameraDepthPrecision,
};
