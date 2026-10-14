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
  type IAutoMovieCamera,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  type IAutoMovieQuaternion,
  type IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieShot,
  type IAutoMovieShotPerformance,
  type IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMoviePlayer,
  applyObjectMotion,
  applyObjectMotions,
  assertAutoMovieViewerCameraDepthPrecision,
  buildModel,
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

// The `launch` verb on screen: the archer looses, the engine solves the aim and
// bakes the arrow's flight into the shot's `objectMotions` (a world-space node
// clip: a projectile has no rig, so it moves the way the camera does), and
// schedules the target's recoil at the *computed* contact. The viewer samples
// that clip onto the arrow's group each frame: the read side of the whole
// launch arc. Deterministic via renderAt(t) for capture.

// ── the arrow prop: a thin shaft, no rig (driven wholly by its objectMotion) ──
const arrowModel: IAutoMovieModel = {
  id: "arrow",
  name: "arrow",
  origin: "generated",
  skeleton: null,
  body: null,
  materials: [
    {
      id: "shaft-mat",
      name: "shaft",
      baseColor: { r: 0.14, g: 0.1, b: 0.08, a: 1, hex: null },
      metallic: 0.1,
      roughness: 0.7,
      emissive: null,
      opacity: 1,
      baseColorTexture: null,
    },
  ],
  parts: [
    {
      id: "shaft",
      name: "shaft",
      geometry: {
        type: "primitive",
        shape: { type: "box", width: 0.035, height: 0.035, depth: 0.72 },
      },
      material: "shaft-mat",
      attachedBone: null,
      transform: null,
    },
  ],
  asset: null,
};

// ── the coding-agent-authored stage values ──────────────────────────────────
const script: IAutoMovieScript = {
  logline: "An archer looses; the shaft finds its mark across the field.",
  theme: "a computed arc",
  cast: [
    { node: "archer", character: "the archer", modelRef: "stickman" },
    { node: "target", character: "the mark", modelRef: "stickman" },
    { node: "arrow", character: "the arrow", modelRef: null },
  ],
  beats: [
    {
      id: "loose",
      name: "the loosing",
      summary:
        "the archer looses at the mark; the shaft arcs across and strikes",
      durationHint: 3,
    },
  ],
};

const staging: IAutoMovieStage = {
  scene: { id: "scene-range", name: "the range" },
  plan: "archer at the near mark facing downrange (+Z); the mark 6.5 m away; the arrow nocked at bow height; camera side-on to read the whole arc.",
  actors: [
    { node: "archer", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
    { node: "target", position: { x: 0, y: 0, z: 6.5 }, facingDeg: 180 },
    { node: "arrow", position: { x: 0, y: 1.35, z: 0.25 }, facingDeg: 0 },
  ],
  cameras: [
    {
      node: "cam-main",
      position: { x: 7.4, y: 2.2, z: 3.25 },
      lookAt: { kind: "point", point: { x: 0, y: 1.1, z: 3.25 } },
      fovDeg: 42,
      near: 0.1,
      far: 1000,
      depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0.6 },
    },
  ],
  lights: [
    {
      node: "sun",
      role: "sun",
      direction: { x: -0.8, y: -1.3, z: 0.3 },
      intensity: 1.4,
    },
  ],
};

const performance: IAutoMoviePerformance = {
  beat: "loose",
  plan: "the archer tracks the mark and looses; the engine flies the arrow and recoils the mark on the hit.",
  draft: [
    {
      verb: "lookAt",
      actor: "archer",
      start: 0,
      duration: 3,
      to: { kind: "node", node: "target" },
    },
    {
      verb: "launch",
      actor: "archer",
      start: 0.6,
      duration: "auto",
      region: "upperBody",
      projectile: "arrow",
      at: { kind: "node", node: "target" },
      speed: 9.2,
      onHit: { force: 0.9, unbalance: true },
    },
    {
      verb: "lookAt",
      actor: "target",
      start: 0,
      duration: 3,
      to: { kind: "node", node: "archer" },
    },
  ],
  revise: {
    review: "the loose lands; the mark reacts on the computed contact.",
    final: null,
  },
  duration: 3,
};

// ── rigs + the content seam ──────────────────────────────────────────────────
const archerRig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } =
  buildStickman(DEFAULT_STICKMAN);
const targetRig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } =
  buildStickman(DEFAULT_STICKMAN);
const rigOf: {
  readonly archer: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel };
  readonly target: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel };
} = { archer: archerRig, target: targetRig } as const;
const isActor: (node: string) => node is keyof typeof rigOf = (
  node: string,
): node is keyof typeof rigOf => node in rigOf;

const staged: ReturnType<typeof stageScene> = stageScene(script, staging);
if (staged.success !== true)
  throw new Error(`staging failed: ${JSON.stringify(staged)}`);

const nodePositions: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>(
  staged.scene.nodes.map(
    (n: IAutoMovieSceneNode): [string, IAutoMovieVector3] => [
      n.id,
      n.transform.translation,
    ],
  ),
);
const contexts: Map<string, IAutoMovieActorContext> = new Map<
  string,
  IAutoMovieActorContext
>(
  staged.scene.nodes
    .filter((n: IAutoMovieSceneNode): boolean => isActor(n.id))
    .map((n: IAutoMovieSceneNode): [string, IAutoMovieActorContext] => {
      const rig: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } =
        rigOf[n.id as keyof typeof rigOf];
      return [
        n.id,
        {
          skeleton: rig.skeleton.id,
          rig: rig.skeleton, // physics/IK verbs (react) need the rig geometry
          gaits: [],
          position: n.transform.translation,
          speed: 0.75,
          facingDeg: n.id === "target" ? 180 : 0,
          eyeHeight: 1.45,
          restPose: { skeleton: rig.skeleton.id, root: null, joints: [] },
        },
      ];
    }),
);
const synthesize: ReturnType<typeof makeActorSynthesizer> =
  makeActorSynthesizer(contexts, nodePositions);

// ── the ladder: perform → cut ────────────────────────────────────────────────
const performed: ReturnType<typeof performShot> = performShot({
  script,
  staged,
  performance,
  synthesize,
  skeleton: (node: string): IAutoMovieSkeleton | null =>
    isActor(node) ? rigOf[node].skeleton : null,
});
if (performed.success !== true)
  throw new Error(`perform failed: ${JSON.stringify(performed.violations)}`);
const shots: IAutoMovieShot[] = [performed.shot];
const motionsByShot: Map<string, Record<string, IAutoMovieMotion>> = new Map<
  string,
  Record<string, IAutoMovieMotion>
>([[performed.shot.id, performed.motions]]);

const cut: ReturnType<typeof cutSequence> = cutSequence(
  {
    sequence: { id: "seq-range", name: "the range" },
    fps: 30,
    entries: shots.map(
      (s: IAutoMovieShot): { shot: string; trim: null; transition: null } => ({
        shot: s.id,
        trim: null,
        transition: null,
      }),
    ),
    pacing: "one continuous loose.",
    continuity: "the arrow leaves the bow and lands on the mark.",
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

const groupsById: Map<string, THREE.Group<THREE.Object3DEventMap>> = new Map<
  string,
  THREE.Group
>();
const built: Record<string, ReturnType<typeof buildModel>> = {};
for (const node of staged.scene.nodes) {
  const obj: ReturnType<typeof buildModel> = buildModel(
    isActor(node.id) ? rigOf[node.id].model : arrowModel,
  );
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

// One player per performing actor (poses ride inside the staged-facing group);
// the arrow has no performance: its group is driven by the objectMotion.
const playersByShot: Map<string, { node: string; player: AutoMoviePlayer }[]> =
  new Map(
    shots.map(
      (
        shot: IAutoMovieShot,
      ): [string, { node: string; player: AutoMoviePlayer }[]] => [
        shot.id,
        shot.performances
          .filter((p: IAutoMovieShotPerformance): boolean => isActor(p.node))
          .map(
            (
              p: IAutoMovieShotPerformance,
            ): { node: string; player: AutoMoviePlayer } => ({
              node: p.node,
              player: new AutoMoviePlayer(
                built[p.node]!,
                rigOf[p.node as keyof typeof rigOf].skeleton,
                motionsByShot.get(shot.id)![p.node]!,
                HUMANOID_JOINT_AXES,
              ),
            }),
          ),
      ],
    ),
  );

// ── the projector: global seconds → posed actors + flying arrow + camera ─────
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

const shotById: Map<string, IAutoMovieShot> = new Map(
  shots.map((s: IAutoMovieShot): [string, IAutoMovieShot] => [s.id, s]),
);
const renderAt: (seconds: number) => void = (seconds: number): void => {
  const sample: ReturnType<typeof resolveSequencePlayback> =
    resolveSequencePlayback(cut.sequence, shots, seconds);
  if (sample === null) return;
  for (const { player } of playersByShot.get(sample.shot)!)
    player.update(sample.time);
  const live: IAutoMovieShot = shotById.get(sample.shot)!;
  // objectMotions: world-space node clips (the arrow's flight). Drive the
  // object's group transform straight from the sampled clip: the read side of
  // compileLaunch/projectileTrajectory.
  applyObjectMotions(
    live.objectMotions,
    sample.time,
    (node: string): THREE.Group<THREE.Object3DEventMap> | undefined =>
      groupsById.get(node),
  );
  if (live.cameraMotion === null) applyStagedCamera();
  else
    applyObjectMotion(
      live.cameraMotion,
      sample.time,
      (): THREE.PerspectiveCamera => camera,
    );
};

// ── mount + deterministic seek contract (capture) ────────────────────────────
const params: URLSearchParams = new URLSearchParams(location.search);
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const capMode: boolean = params.get("cap") === "1";
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
if (freezeAt !== null && Number.isFinite(freezeAt)) renderAt(freezeAt);

const handle: ReturnType<typeof mountViewer> = mountViewer(
  canvas,
  scene,
  camera,
  (elapsed: number): void => {
    if (!capMode && freezeAt === null)
      renderAt(elapsed % (FILM_DURATION + 0.8));
  },
);
const cameraDepthPrecision: ReturnType<
  typeof assertAutoMovieViewerCameraDepthPrecision
> = assertAutoMovieViewerCameraDepthPrecision({
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
