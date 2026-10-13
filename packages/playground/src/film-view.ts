import {
  HUMANOID_JOINT_AXES,
  resolveSequencePlayback,
} from "@automovie/engine";
import {
  AutoMovieGuidePass,
  IAutoMovieShot,
} from "@automovie/interface";
import { type IAutoMovieSequenceRenderFrame } from "@automovie/render";
import {
  AutoMoviePlayer,
  applyCaptureCanvasSize,
  applyObjectMotion,
  applyObjectMotions,
  applyPose,
  renderAutoMovieScenePass,
  applySceneFog,
  assertAutoMovieViewerCameraDepthPrecision,
  buildLight,
  buildModel,
  buildSpaceObject,
  mountViewer,
  renderAutoMovieFilmFrame,
  type IAutoMovieViewerCompletedFrame,
} from "@automovie/viewer";
import * as THREE from "three";

import { compilePursuitFilm } from "./film/compilePursuitFilm";
import { registerFilmViewerApplication } from "./viewer/registerFilmViewerApplication";

// The film pipeline end to end, on screen: the same tracked TypeScript values
// a coding agent authors (script → staging → blocking → performance → assemble),
// consumed by the engine's film compilers, played back through the sequence
// resolver: real gait travel, a follow camera compiled from a `frame` verb,
// a hard cut onto an orbiting close-up. Deterministic via `renderAt(t)`, so
// capture-shots.ts bakes the identical film every run.

// ── the coding-agent-authored stage values ──────────────────────────────────
import {script} from "./film/script";
import {staging} from "./film/staging";
import {blockings} from "./film/blockings";
import {performances} from "./film/performances";

const { staged, rigOf, rigFor, modelForNode, shots, motionsByShot, cut } =
  compilePursuitFilm({ script, staging, blockings, performances });

/**
 * Compiled running time, in seconds, of the two-shot pursuit demonstration.
 *
 * This exported value is the stable clock consumed by the interactive viewer
 * and headless capture harness. Its host is therefore the narrow public carrier
 * for what this page actually demonstrates: authored geometry, fixed-clock
 * motion, deterministic replay, and a readable blocking render. The playground
 * neither creates nor publishes a downstream fidelity rendition, so those
 * contracts are declined here instead of being implied by a successful demo.
 *
 * @evidence requirements/product/prototype-quality.md#product-prototype-geometry The staged actors, set pieces, support surface, and camera preserve their authored spatial relations in the rendered demo.
 * @evidence requirements/product/prototype-quality.md#product-prototype-motion-time The compiled duration drives repeatable shot-local motion, transitions, and capture seeks on one film clock.
 * @evidence requirements/product/prototype-quality.md#product-authored-variation-determinism The page renders the same tracked declarations at the same requested second without hidden random state.
 * @evidence requirements/product/prototype-quality.md#product-prototype-readability The browser and capture paths expose the same subject, action, staging, and cut for direct visual judgment.
 * @evidenceExclude requirements/product/prototype-quality.md#product-prototype-handoff This local deterministic viewer demo neither invokes nor publishes an optional downstream finishing lane.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-deterministic-input-identity The exported duration closes the tracked scene, motion, edit, and fixed capture clock into one repeatable demo identity.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-structural-output-invariant The page lowers the declared geometry, motion, camera, light, and transition into a directly inspectable browser frame.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-choice-determinism-invariant The demo keeps authored choices in tracked source and introduces no hidden completion step.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-downstream-fidelity-output This package emits no downstream fidelity result or rendition identity.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-fidelity-failure-choice No external fidelity provider runs in this playground, so provider failure and fallback choices belong outside it.
 * @evidenceExclude specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-prototype-exclusion-compatibility This disposable viewer demonstration does not define product-wide export, editor, or compatibility policy.
 */
export const FILM_DURATION = cut.runtime;

// ── the set: scene nodes → three.js ─────────────────────────────────────────
const scene = new THREE.Scene();
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
const groupsById = new Map<string, THREE.Group>();

// Staged base per node: the FULL transform, scale included (the hand-rolled
// group setup used to drop staged scale, #1087).
const stagedNodeById = new Map(staged.scene.nodes.map((n) => [n.id, n]));
const applyStagedBase = (group: THREE.Group, nodeId: string): void => {
  const {
    translation: t,
    rotation: r,
    scale: s,
  } = stagedNodeById.get(nodeId)!.transform;
  group.position.set(t.x, t.y, t.z);
  group.quaternion.set(r.x, r.y, r.z, r.w);
  group.scale.set(s.x, s.y, s.z);
};
const built = Object.fromEntries(
  staged.scene.nodes.map((node) => {
    const obj = buildModel(modelForNode(node));
    const group = new THREE.Group();
    applyStagedBase(group, node.id);
    group.add(obj.object);
    scene.add(group);
    groupsById.set(node.id, group);
    return [node.id, obj] as const;
  }),
);

// One player per (shot, performing node); seeking a shot drives its players.
const playersByShot = new Map<
  string,
  { node: string; player: AutoMoviePlayer }[]
>(
  shots.map((shot) => [
    shot.id,
    shot.performances.map((p) => ({
      node: p.node,
      player: new AutoMoviePlayer(
        built[p.node]!,
        rigFor(p.node).skeleton,
        motionsByShot.get(shot.id)![p.node]!,
        HUMANOID_JOINT_AXES,
      ),
    })),
  ]),
);

// ── the projector: global seconds → posed set + framed camera ────────────────
const stagedCam = staged.scene.cameras[0]!;
const camera = new THREE.PerspectiveCamera(
  stagedCam.fovY,
  16 / 9,
  stagedCam.near,
  stagedCam.far,
);
const applyStagedCamera = (): void => {
  const t = stagedCam.transform.translation;
  const r = stagedCam.transform.rotation;
  camera.position.set(t.x, t.y, t.z);
  camera.quaternion.set(r.x, r.y, r.z, r.w);
  camera.fov = stagedCam.fovY;
  camera.updateProjectionMatrix();
};
applyStagedCamera();

const shotById = new Map(shots.map((s) => [s.id, s]));

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
const poseShot = (shot: IAutoMovieShot, time: number): void => {
  // The applyObjectMotion host contract: a host that swaps clips mid-scene
  // restores staged bases itself (#1087). Without this reset a node driven by
  // shot A's objectMotion but absent from shot B kept A's tail transform,
  // order-dependent frames that break chunked capture's determinism promise
  // (a fresh page at a chunk boundary would render the staged base instead).
  // Rigs without a performance in this shot likewise return to rest, not the
  // previous shot's last pose, the same reset applyStagedCamera performs.
  const performing = new Set(shot.performances.map((p) => p.node));
  for (const node of staged.scene.nodes) {
    applyStagedBase(groupsById.get(node.id)!, node.id);
    // A set piece has no rig to rest: its staged base IS its whole state.
    if (performing.has(node.id) || rigOf[node.id] === undefined) continue;
    const rig = rigFor(node.id);
    applyPose(
      built[node.id]!,
      { skeleton: rig.skeleton.id, root: null, joints: [] },
      rig.skeleton,
      HUMANOID_JOINT_AXES,
    );
  }
  for (const { player } of playersByShot.get(shot.id)!) player.update(time);
  applyObjectMotions(shot.objectMotions, time, (node) => groupsById.get(node));
  if (shot.cameraMotion === null) applyStagedCamera();
  else applyObjectMotion(shot.cameraMotion, time, () => camera);
};

// The last exact source samples are reused when the capture host requests a pass.
let lastSequenceFrame: SequenceRenderFrameSample | null = null;
let completedPass: AutoMovieGuidePass = "beauty";
let completedFrame: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined;
let completedLayers: { shot: string; time: number; weight: number; pass: AutoMovieGuidePass;
  camera: { position: number[]; quaternion: number[]; projection: number[]; world: number[] };
  models: { id: string; name: string; kind: string; world: number[] }[] }[] = [];

const drawSequenceFrame = (frame: SequenceRenderFrameSample, pass: AutoMovieGuidePass = "beauty", seconds?: number): boolean => {
  lastSequenceFrame = frame;
  const incoming = {shot:frame.shot,time:frame.shotTimeSeconds,weight:frame.blend===null?1:frame.blend.alpha};
  const layers = frame.blend===null ? [incoming] : [
    {shot:frame.blend.shot,time:frame.blend.shotTimeSeconds,weight:1-frame.blend.alpha},incoming,
  ];
  completedLayers = [];
  renderAutoMovieFilmFrame(renderer,layers,pass,(layer,selectedPass)=>{
    poseShot(shotById.get(layer.shot)!,layer.time);
    renderAutoMovieScenePass(renderer,scene,camera,staged.scene.environment,selectedPass);
    const models: { id: string; name: string; kind: string; world: number[] }[] = [];
    scene.traverseVisible((object) => {
      if ("isMesh" in object && object.isMesh === true) models.push({ id: object.uuid,
        name: object.name, kind: object.type, world: object.matrixWorld.toArray() });
    });
    completedLayers.push({ ...layer, pass: selectedPass,
      camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(),
        projection: camera.projectionMatrix.toArray(), world: camera.matrixWorld.toArray() }, models });
  });
  completedPass = pass;
  completedFrame = { scene, camera, pass, facts: { sequence: lastSequenceFrame, layers: completedLayers } };
  handle.completeFrame(seconds);
  return true;
};

const drawFrame = (seconds: number, displayedSeconds?: number): boolean => {
  const sample = resolveSequencePlayback(cut.sequence, shots, seconds);
  if (sample === null) { completedFrame = undefined; return false; }
  return drawSequenceFrame({
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
  }, completedPass, displayedSeconds);
};

const renderSequenceFrame = (frame: SequenceRenderFrameSample): void => {
  drawSequenceFrame(frame);
};

const renderShotOnly = (sample: SequenceRenderShotSample): void => {
  const shot = shotById.get(sample.shot);
  if (shot === undefined)
    throw new Error(`unknown film shot "${sample.shot}" for sequence probe`);
  drawSequenceFrame({ shot: shot.id, shotTimeSeconds: sample.shotTimeSeconds, blend: null }, "beauty");
};

// ── mount + deterministic seek contract (capture-shots.ts) ───────────────────
const params = new URLSearchParams(location.search);
const canvas = document.querySelector<HTMLCanvasElement>("#view")!;
const capMode = params.get("cap") === "1";
// Pin the capture canvas to the render plan's exact frame size (#1251), so a
// headless screenshot of `#view` is that size regardless of the host window.
if (capMode)
  applyCaptureCanvasSize(
    canvas,
    Number(params.get("w")),
    Number(params.get("h")),
  );
const frozen = params.get("t");
const freezeAt = frozen !== null ? Number(frozen) : null;
const handle = mountViewer(
  canvas,
  scene,
  camera,
  (elapsed) => {
    // In capture/freeze mode the frame is driven by draw() below; returning
    // true keeps the mount loop from overwriting a composited dissolve with a
    // plain single-pass render.
    if (capMode || freezeAt !== null) return true;
    return drawFrame(elapsed % (FILM_DURATION + 0.8));
  },
  // Capture renders with AA off and a pinned pixel ratio (#1169) so structural
  // guide passes read back crisp and byte-stable across hosts.
  { ...(capMode ? { antialias: false, pixelRatio: 1 } : {}),
    completedFrame: () => completedFrame,
    redrawCompleted: () => {
      if (lastSequenceFrame !== null) drawSequenceFrame(lastSequenceFrame, completedPass);
      else {
        renderAutoMovieScenePass(renderer, scene, camera, staged.scene.environment, completedPass);
        completedFrame = { scene, camera, pass: completedPass };
        handle.completeFrame();
      }
    } },
);
const renderer = handle.renderer;
const cameraDepthPrecision = assertAutoMovieViewerCameraDepthPrecision({
  renderer,
  source: stagedCam,
  realized: camera,
});
const draw = (t: number): void => {
  if (!drawFrame(t, t)) {
    renderer.render(scene, camera);
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
    renderAutoMovieScenePass(renderer,scene,camera,staged.scene.environment,pass);
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
registerFilmViewerApplication({
  capture: () => ({ frame: lastSequenceFrame, pass: completedPass }),
  shots: new Set(shotById.keys()),
  restore: (frame, pass) => {
    if (frame !== null) drawSequenceFrame(frame, pass);
    else {
      renderAutoMovieScenePass(renderer, scene, camera, staged.scene.environment, pass);
      completedPass = pass;
      completedFrame = { scene, camera, pass };
      handle.completeFrame();
    }
  },
});
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  duration: FILM_DURATION,
  sequence: cut.sequence,
  shots,
  shotIds: shots.map((s) => s.id),
  cameraDepthPrecision,
};
