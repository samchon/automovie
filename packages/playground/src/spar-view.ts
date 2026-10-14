import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieSkeleton } from "@automovie/interface";
import {
  AutoMoviePlayer,
  buildModel,
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { SPAR_DURATION } from "./SPAR_DURATION";
import { blueClip } from "./blueClip";
import { buildBlueBoxer } from "./buildBlueBoxer";
import { buildRedBoxer } from "./buildRedBoxer";
import { redClip } from "./redClip";

const params: URLSearchParams = new URLSearchParams(location.search);

// ── two boxers, squared off along Z and facing each other ────────────────────
const red: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } =
  buildRedBoxer();
const blue: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel } =
  buildBlueBoxer();
const redObj: ReturnType<typeof buildModel> = buildModel(red.model);
const blueObj: ReturnType<typeof buildModel> = buildModel(blue.model);

// Each boxer sits in a positioned group; the clip's root (identity, or the KO
// fall) is applied to the model inside that group, so the figures stand at
// their corners and the loser topples within his own frame.
// arm reach ≈ upperArm+lowerArm ≈ 0.55 m; put the boxers within that so a jab
// actually lands on the opponent's head (heads ~0.7 m apart) instead of miming
const gap: number = 0.35;
const redGroup: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
redGroup.position.set(0, 0, gap);
redGroup.rotation.y = Math.PI; // red faces −Z (toward blue)
redGroup.add(redObj.object);
const blueGroup: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
blueGroup.position.set(0, 0, -gap); // blue faces +Z (toward red) at rest
blueGroup.add(blueObj.object);

const redPlayer: AutoMoviePlayer = new AutoMoviePlayer(
  redObj,
  red.skeleton,
  redClip(red.skeleton.id),
  HUMANOID_JOINT_AXES,
  false,
  undefined,
  HUMANOID_REST_FRAME,
);
const bluePlayer: AutoMoviePlayer = new AutoMoviePlayer(
  blueObj,
  blue.skeleton,
  blueClip(blue.skeleton.id),
  HUMANOID_JOINT_AXES,
  false,
  undefined,
  HUMANOID_REST_FRAME,
);

// ── scene ────────────────────────────────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
scene.add(redGroup);
scene.add(blueGroup);

const grid: THREE.GridHelper = new THREE.GridHelper(10, 20, 0xb8c0cc, 0xd5dbe4);
scene.add(grid);

const hemi: THREE.HemisphereLight = new THREE.HemisphereLight(
  0xffffff,
  0x9aa3b2,
  1.1,
);
scene.add(hemi);
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(3, 4, 2);
scene.add(sun);

// view from the side so both boxers are in profile, facing each other; `?az`
// orbits (90 = straight side), `?t` freezes a deterministic frame.
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  42,
  1,
  0.05,
  100,
);
const az: number = (Number(params.get("az") ?? 86) * Math.PI) / 180;
const target: number = 0.7;
const dist: number = Number(params.get("dist") ?? 4.2);
camera.position.set(dist * Math.sin(az), target + 0.5, dist * Math.cos(az));
camera.lookAt(0, target, 0);

const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
const step: (elapsed: number) => void = (elapsed: number): void => {
  redPlayer.update(elapsed);
  bluePlayer.update(elapsed);
};
if (freezeAt !== null && Number.isFinite(freezeAt)) step(freezeAt);

const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
// `?cap=1` lets a recorder drive frame timing via window.__afSeek.
const capMode: boolean = params.get("cap") === "1";
const handle: ReturnType<typeof mountViewer> = mountViewer(
  canvas,
  scene,
  camera,
  (elapsed: number): void => {
    if (!capMode && freezeAt === null) step(elapsed % (SPAR_DURATION + 1.2));
  },
);
(window as unknown as { __afSeek: (t: number) => void }).__afSeek = (
  t: number,
): void => {
  step(t);
  guardAutoMovieSceneShadowRetirement(scene, handle.renderer);
  guardAutoMovieRenderModeRetirement(scene);
  handle.renderer.render(scene, camera);
  handle.completeFrame(t);
};

(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  duration: SPAR_DURATION,
  redBones: (): number => redObj.bones.size,
  blueBones: (): number => blueObj.bones.size,
};
