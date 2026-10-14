import {
  HUMANOID_JOINT_AXES,
  resolveSequencePlayback,
} from "@automovie/engine";
import {
  AutoMovieGuidePass,
  type IAutoMovieCamera,
  type IAutoMovieQuaternion,
  type IAutoMovieSceneNode,
  IAutoMovieShot,
  type IAutoMovieShotPerformance,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { type IAutoMovieSequenceRenderFrame } from "@automovie/render";
import {
  AutoMoviePlayer,
  type IAutoMovieViewerCompletedFrame,
  applyCaptureCanvasSize,
  applyObjectMotion,
  applyObjectMotions,
  applyPose,
  applySceneFog,
  assertAutoMovieViewerCameraDepthPrecision,
  buildLight,
  buildModel,
  buildSpaceObject,
  mountViewer,
  renderAutoMovieFilmFrame,
  renderAutoMovieScenePass,
} from "@automovie/viewer";
import * as THREE from "three";

import type { ICompilePursuitFilm } from "./film/ICompilePursuitFilm";
import { blockings } from "./film/blockings";
import { compilePursuitFilm } from "./film/compilePursuitFilm";
import { performances } from "./film/performances";
// The film pipeline end to end, on screen: the same tracked TypeScript values
// a coding agent authors (script → staging → blocking → performance → assemble),
// consumed by the engine's film compilers, played back through the sequence
// resolver: real gait travel, a follow camera compiled from a `frame` verb,
// a cross-dissolve into an orbiting full shot. Explicit seeks replay the same
// source timeline; native rasterization still depends on the browser/GPU host.

// ── the coding-agent-authored stage values ──────────────────────────────────
import { script } from "./film/script";
import { staging } from "./film/staging";

const {
  staged,
  rigOf,
  rigFor,
  modelForNode,
  shots,
  motionsByShot,
  cut,
}: ReturnType<typeof compilePursuitFilm> = compilePursuitFilm({
  script,
  staging,
  blockings,
  performances,
});

/**
 * Compiled sequence runtime in seconds, consumed locally by this page's interactive loop and published through its existing window capture metadata. It is a timeline value, not evidence that a frame was drawn, captured or visually healthy.
 */
const FILM_DURATION: number = cut.runtime;

// ── the set: scene nodes → three.js ─────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
// The staged support is a real structural mesh (#1173). This replaces the
// GridHelper that used to stand in for support: a grid is a LineSegments, which
// every structural guide pass hides (#1226), so depth/mask/outline saw no ground
// at all. Its ordinary material writes no beauty; the staged slab does.
scene.add(buildSpaceObject(staged.scene.space!));
// The staged ATMOSPHERE, through the viewer's one call. This page is what the
// offline renderer captures, so a fog declared on the scene and honoured only
// by `buildScene` would be honoured everywhere except in the frames that get
// encoded. A staging that declares none clears it, which is exactly today.
applySceneFog(scene, staged.scene.fog);
// Ambient fill stays a page decision (staging models no sky), but the KEY light
// is the staged one, built through the viewer. A hardcoded sun stood here and
// `staged.scene.lights` went unused, so every capture proved the page's own
// lighting and nothing about the film's: the direction #1356 restored had no
// witness on the render side at all.
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.1));
for (const light of staged.scene.lights) scene.add(buildLight(light));

// node id → its scene group, so a shot's objectMotions (a projectile/prop's
// baked clip) can drive the object's world transform each frame.
const groupsById: Map<string, THREE.Group<THREE.Object3DEventMap>> = new Map<
  string,
  THREE.Group
>();

// Staged base per node: the FULL transform, scale included (the hand-rolled
// group setup used to drop staged scale, #1087).
const stagedNodeById: Map<string, IAutoMovieSceneNode> = new Map(
  staged.scene.nodes.map(
    (n: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [n.id, n],
  ),
);
const applyStagedBase: (group: THREE.Group, nodeId: string) => void = (
  group: THREE.Group,
  nodeId: string,
): void => {
  const {
    translation: t,
    rotation: r,
    scale: s,
  }: IAutoMovieSceneNode["transform"] = stagedNodeById.get(nodeId)!.transform;
  group.position.set(t.x, t.y, t.z);
  group.quaternion.set(r.x, r.y, r.z, r.w);
  group.scale.set(s.x, s.y, s.z);
};
const built: Record<string, ReturnType<typeof buildModel>> = Object.fromEntries(
  staged.scene.nodes.map(
    (
      node: IAutoMovieSceneNode,
    ): readonly [string, ReturnType<typeof buildModel>] => {
      const obj: ReturnType<typeof buildModel> = buildModel(modelForNode(node));
      const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
      applyStagedBase(group, node.id);
      group.add(obj.object);
      scene.add(group);
      groupsById.set(node.id, group);
      return [node.id, obj] as const;
    },
  ),
);

// One player per (shot, performing node); seeking a shot drives its players.
const playersByShot: Map<string, { node: string; player: AutoMoviePlayer }[]> =
  new Map<string, { node: string; player: AutoMoviePlayer }[]>(
    shots.map(
      (
        shot: IAutoMovieShot,
      ): [string, { node: string; player: AutoMoviePlayer }[]] => [
        shot.id,
        shot.performances.map(
          (
            p: IAutoMovieShotPerformance,
          ): { node: string; player: AutoMoviePlayer } => ({
            node: p.node,
            player: new AutoMoviePlayer(
              built[p.node]!,
              rigFor(p.node).skeleton,
              motionsByShot.get(shot.id)![p.node]!,
              HUMANOID_JOINT_AXES,
            ),
          }),
        ),
      ],
    ),
  );

// ── the projector: global seconds → posed set + framed camera ────────────────
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

type SequenceRenderFrameSample = Pick<
  IAutoMovieSequenceRenderFrame,
  "shot" | "shotTimeSeconds" | "blend"
>;

type SequenceRenderShotSample = {
  shot: string;
  shotTimeSeconds: number;
};

// Pose the scene and aim the camera for one shot at its shot-local time: advance
// each player, ride any objectMotions, and set the camera (its motion or the
// staged default). The read side used both for a plain frame and for each half
// of a cross-dissolve.
const poseShot: (shot: IAutoMovieShot, time: number) => void = (
  shot: IAutoMovieShot,
  time: number,
): void => {
  // The applyObjectMotion host contract: a host that swaps clips mid-scene
  // restores staged bases itself (#1087). Without this reset a node driven by
  // shot A's objectMotion but absent from shot B kept A's tail transform,
  // order-dependent frames that break chunked capture's determinism promise
  // (a fresh page at a chunk boundary would render the staged base instead).
  // Rigs without a performance in this shot likewise return to rest, not the
  // previous shot's last pose, the same reset applyStagedCamera performs.
  const performing: Set<string> = new Set(
    shot.performances.map((p: IAutoMovieShotPerformance): string => p.node),
  );
  for (const node of staged.scene.nodes) {
    applyStagedBase(groupsById.get(node.id)!, node.id);
    // A set piece has no rig to rest: its staged base IS its whole state.
    if (performing.has(node.id) || rigOf[node.id] === undefined) continue;
    const rig: ICompilePursuitFilm.IRig = rigFor(node.id);
    applyPose(
      built[node.id]!,
      { skeleton: rig.skeleton.id, root: null, joints: [] },
      rig.skeleton,
      HUMANOID_JOINT_AXES,
    );
  }
  for (const { player } of playersByShot.get(shot.id)!) player.update(time);
  applyObjectMotions(
    shot.objectMotions,
    time,
    (node: string): THREE.Group<THREE.Object3DEventMap> | undefined =>
      groupsById.get(node),
  );
  if (shot.cameraMotion === null) applyStagedCamera();
  else
    applyObjectMotion(
      shot.cameraMotion,
      time,
      (): THREE.PerspectiveCamera => camera,
    );
};

// The last exact source samples are reused when the capture host requests a pass.
let lastSequenceFrame: SequenceRenderFrameSample | null = null;
let completedPass: AutoMovieGuidePass = "beauty";
let completedFrame: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined;
let completedLayers: {
  shot: string;
  time: number;
  weight: number;
  pass: AutoMovieGuidePass;
  camera: {
    position: number[];
    quaternion: number[];
    projection: number[];
    world: number[];
  };
  models: { id: string; name: string; kind: string; world: number[] }[];
}[] = [];

const drawSequenceFrame: (
  frame: SequenceRenderFrameSample,
  pass?: AutoMovieGuidePass,
  seconds?: number,
) => boolean = (
  frame: SequenceRenderFrameSample,
  pass: AutoMovieGuidePass = "beauty",
  seconds?: number,
): boolean => {
  lastSequenceFrame = frame;
  const incoming: { shot: string; time: number; weight: number } = {
    shot: frame.shot,
    time: frame.shotTimeSeconds,
    weight: frame.blend === null ? 1 : frame.blend.alpha,
  };
  const layers: { shot: string; time: number; weight: number }[] =
    frame.blend === null
      ? [incoming]
      : [
          {
            shot: frame.blend.shot,
            time: frame.blend.shotTimeSeconds,
            weight: 1 - frame.blend.alpha,
          },
          incoming,
        ];
  completedLayers = [];
  renderAutoMovieFilmFrame(
    renderer,
    layers,
    pass,
    (
      layer: Omit<{ shot: string; time: number; weight: number }, "weight"> & {
        weight: number;
      },
      selectedPass: AutoMovieGuidePass,
    ): void => {
      poseShot(shotById.get(layer.shot)!, layer.time);
      renderAutoMovieScenePass(
        renderer,
        scene,
        camera,
        staged.scene.environment,
        selectedPass,
      );
      const models: {
        id: string;
        name: string;
        kind: string;
        world: number[];
      }[] = [];
      scene.traverseVisible(
        (object: THREE.Object3D<THREE.Object3DEventMap>): void => {
          if ("isMesh" in object && object.isMesh === true)
            models.push({
              id: object.uuid,
              name: object.name,
              kind: object.type,
              world: object.matrixWorld.toArray(),
            });
        },
      );
      completedLayers.push({
        ...layer,
        pass: selectedPass,
        camera: {
          position: camera.position.toArray(),
          quaternion: camera.quaternion.toArray(),
          projection: camera.projectionMatrix.toArray(),
          world: camera.matrixWorld.toArray(),
        },
        models,
      });
    },
  );
  completedPass = pass;
  completedFrame = {
    scene,
    camera,
    pass,
    facts: { sequence: lastSequenceFrame, layers: completedLayers },
  };
  handle.completeFrame(seconds);
  return true;
};

const drawFrame: (seconds: number, displayedSeconds?: number) => boolean = (
  seconds: number,
  displayedSeconds?: number,
): boolean => {
  const sample: ReturnType<typeof resolveSequencePlayback> =
    resolveSequencePlayback(cut.sequence, shots, seconds);
  if (sample === null) {
    completedFrame = undefined;
    return false;
  }
  return drawSequenceFrame(
    {
      shot: sample.shot,
      shotTimeSeconds: sample.time,
      blend:
        sample.blend === null
          ? null
          : {
              shot: sample.blend.shot,
              shotTimeSeconds: sample.blend.time,
              alpha: sample.blend.alpha,
            },
    },
    completedPass,
    displayedSeconds,
  );
};

const renderSequenceFrame: (frame: SequenceRenderFrameSample) => void = (
  frame: SequenceRenderFrameSample,
): void => {
  drawSequenceFrame(frame);
};

const renderShotOnly: (sample: SequenceRenderShotSample) => void = (
  sample: SequenceRenderShotSample,
): void => {
  const shot: IAutoMovieShot | undefined = shotById.get(sample.shot);
  if (shot === undefined)
    throw new Error(`unknown film shot "${sample.shot}" for sequence probe`);
  drawSequenceFrame(
    { shot: shot.id, shotTimeSeconds: sample.shotTimeSeconds, blend: null },
    "beauty",
  );
};

// ── mount + deterministic seek contract (capture-shots.ts) ───────────────────
const params: URLSearchParams = new URLSearchParams(location.search);
const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
const capMode: boolean = params.get("cap") === "1";
// Pin the capture canvas to the render plan's exact frame size (#1251), so a
// headless screenshot of `#view` is that size regardless of the host window.
if (capMode)
  applyCaptureCanvasSize(
    canvas,
    Number(params.get("w")),
    Number(params.get("h")),
  );
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
const handle: ReturnType<typeof mountViewer> = mountViewer(
  canvas,
  scene,
  camera,
  (elapsed: number): boolean => {
    // In capture/freeze mode the frame is driven by draw() below; returning
    // true keeps the mount loop from overwriting a composited dissolve with a
    // plain single-pass render.
    if (capMode || freezeAt !== null) return true;
    return drawFrame(elapsed % (FILM_DURATION + 0.8));
  },
  // Capture renders with AA off and a pinned pixel ratio (#1169) so structural
  // guide passes avoid antialiasing and device-pixel-ratio variation. These
  // settings do not establish identical native pixels across browser/GPU hosts.
  {
    ...(capMode ? { antialias: false, pixelRatio: 1 } : {}),
    completedFrame: ():
      | Omit<IAutoMovieViewerCompletedFrame, "control">
      | undefined => completedFrame,
    redrawCompleted: (): void => {
      if (lastSequenceFrame !== null)
        drawSequenceFrame(lastSequenceFrame, completedPass);
      else {
        renderAutoMovieScenePass(
          renderer,
          scene,
          camera,
          staged.scene.environment,
          completedPass,
        );
        completedFrame = { scene, camera, pass: completedPass };
        handle.completeFrame();
      }
    },
  },
);
const renderer: THREE.WebGLRenderer = handle.renderer;
const cameraDepthPrecision: ReturnType<
  typeof assertAutoMovieViewerCameraDepthPrecision
> = assertAutoMovieViewerCameraDepthPrecision({
  renderer,
  source: stagedCam,
  realized: camera,
});
const draw: (t: number) => void = (t: number): void => {
  if (!drawFrame(t, t)) {
    // The empty-sequence fallback shares the same failed-retirement admission
    // and reversible beauty environment as the page's other scene draws.
    renderAutoMovieScenePass(
      renderer,
      scene,
      camera,
      staged.scene.environment,
      "beauty",
    );
    completedPass = "beauty";
    completedFrame = { scene, camera, pass: completedPass };
    handle.completeFrame(t);
  }
};
if (freezeAt !== null && Number.isFinite(freezeAt)) draw(freezeAt);
(window as unknown as { __afSeek: (t: number) => void }).__afSeek = (
  t: number,
): void => draw(t);
// Capture guide requests draw the same samples through the dominant-layer owner.
(
  window as unknown as { __afPass: (pass: AutoMovieGuidePass) => void }
).__afPass = (pass: AutoMovieGuidePass): void => {
  if (lastSequenceFrame !== null) drawSequenceFrame(lastSequenceFrame, pass);
  else {
    // A guide requested before any seek still closes its own reversible pass.
    renderAutoMovieScenePass(
      renderer,
      scene,
      camera,
      staged.scene.environment,
      pass,
    );
    completedPass = pass;
    completedFrame = { scene, camera, pass };
    handle.completeFrame();
  }
};
(
  window as unknown as {
    __afSeekSequenceFrame: (frame: SequenceRenderFrameSample) => void;
  }
).__afSeekSequenceFrame = renderSequenceFrame;
(
  window as unknown as {
    __afSeekSequenceShot: (sample: SequenceRenderShotSample) => void;
  }
).__afSeekSequenceShot = renderShotOnly;
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  duration: FILM_DURATION,
  sequence: cut.sequence,
  shots,
  shotIds: shots.map((s: IAutoMovieShot): string => s.id),
  cameraDepthPrecision,
};
