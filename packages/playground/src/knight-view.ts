import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  resolveAttachment,
  sampleMotion,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieAttachment,
  IAutoMovieJointPose,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMoviePlayer,
  buildModel,
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_HORSE } from "./DEFAULT_HORSE";
import { HORSE_CLIPS } from "./HORSE_CLIPS";
import { QUADRUPED_JOINT_AXES } from "./QUADRUPED_JOINT_AXES";
import { QUADRUPED_REST_FRAME } from "./QUADRUPED_REST_FRAME";
import { buildHorse } from "./buildHorse";
import { buildKnight } from "./buildKnight";
import { registerViewerSelection } from "./viewer/registerViewerSelection";

const params: InstanceType<typeof URLSearchParams> = new URLSearchParams(
  location.search,
);

// ── build the horse (mount) and the knight (rider) ──────────────────────────
const horse: ReturnType<typeof buildHorse> = buildHorse(DEFAULT_HORSE);
const knight: ReturnType<typeof buildKnight> = buildKnight();
const horseObj: ReturnType<typeof buildModel> = buildModel(horse.model);
const knightObj: ReturnType<typeof buildModel> = buildModel(knight.model);

const horseClips: Record<string, IAutoMovieMotion> = HORSE_CLIPS(
  horse.skeleton.id,
);
const clipName: string =
  params.get("clip") !== null && Object.hasOwn(horseClips, params.get("clip")!)
    ? params.get("clip")!
    : "performance";
let horseClip: IAutoMovieMotion = horseClips[clipName]!;

const horsePlayer: AutoMoviePlayer = new AutoMoviePlayer(
  horseObj,
  horse.skeleton,
  horseClip,
  QUADRUPED_JOINT_AXES,
  false,
  // the tail trails with damped follow-through
  {
    joints: [
      "leftLittleProximal",
      "leftLittleIntermediate",
      "leftLittleDistal",
    ] as AutoMovieHumanoidBone[],
    stiffness: 70,
    damping: 8,
  },
  QUADRUPED_REST_FRAME,
);

// ── the rider's body pose: sitting astride, lance couched, shield up ────────
const j: (
  bone: AutoMovieHumanoidBone,
  a: { flexion?: number; abduction?: number; twist?: number },
) => IAutoMovieJointPose = (
  bone: AutoMovieHumanoidBone,
  a: { flexion?: number; abduction?: number; twist?: number },
): IAutoMovieJointPose => ({
  bone,
  flexion: a.flexion ?? 0,
  abduction: a.abduction ?? 0,
  twist: a.twist ?? 0,
});
const ridePose: (lean: number) => IAutoMoviePose = (
  lean: number,
): IAutoMoviePose => ({
  skeleton: knight.skeleton.id,
  root: null,
  joints: [
    j("spine", { flexion: 6 + lean }),
    j("chest", { flexion: 4 }),
    // legs straddle the barrel and grip: thighs forward-and-out, knees bent
    j("leftUpperLeg", { flexion: -52, abduction: 24 }),
    j("rightUpperLeg", { flexion: -52, abduction: -24 }),
    j("leftLowerLeg", { flexion: 74 }),
    j("rightLowerLeg", { flexion: 74 }),
    // right arm couches the lance forward
    // Rider arms are authored in clinical abduction. The horse clip remains
    // rig-space because its front legs reuse upper-arm names on a quadruped.
    j("rightUpperArm", { flexion: 52, abduction: 82 }),
    j("rightLowerArm", { flexion: 22 }),
    // left arm holds the shield up in front
    j("leftUpperArm", { flexion: -34, abduction: 60 }),
    j("leftLowerArm", { flexion: -86 }),
  ],
});
const rideClip: IAutoMovieMotion = {
  id: "ride",
  skeleton: knight.skeleton.id,
  duration: 0.62,
  loop: true,
  keyframes: [
    {
      time: 0,
      pose: ridePose(0),
      expression: null,
      easing: "easeInOut",
      bezier: null,
    },
    {
      time: 0.31,
      pose: ridePose(4),
      expression: null,
      easing: "easeInOut",
      bezier: null,
    },
    {
      time: 0.62,
      pose: ridePose(0),
      expression: null,
      easing: "easeInOut",
      bezier: null,
    },
  ],
};
const knightPlayer: AutoMoviePlayer = new AutoMoviePlayer(
  knightObj,
  knight.skeleton,
  rideClip,
  HUMANOID_JOINT_AXES,
  false,
  undefined,
  HUMANOID_REST_FRAME,
);

// ── the saddle attachment: fix the rider's root into the horse's spine bone ──
// The seat offset drops the rider's root so its pelvis lands on the back, a
// touch behind the withers; the rider rides the bone's world frame, so when the
// horse rears (spine pitches up) the knight is carried back with it.
const seatY: number = Number(params.get("seatY") ?? -0.72);
const seatZ: number = Number(params.get("seatZ") ?? -0.04);
const attachment: IAutoMovieAttachment = {
  parentBone: "spine",
  offset: {
    translation: { x: 0, y: seatY, z: seatZ },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
};
const placeRider: (seconds: number) => void = (seconds: number): void => {
  const horsePose: IAutoMoviePose = sampleMotion(horseClip, seconds).pose;
  const seat: ReturnType<typeof resolveAttachment> = resolveAttachment(
    horsePose,
    horse.skeleton,
    attachment,
  );
  knightObj.object.position.set(
    seat.translation.x,
    seat.translation.y,
    seat.translation.z,
  );
  knightObj.object.quaternion.set(
    seat.rotation.x,
    seat.rotation.y,
    seat.rotation.z,
    seat.rotation.w,
  );
};

// ── scene ────────────────────────────────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xeef1f6);
scene.add(horseObj.object);
scene.add(knightObj.object);

const grid: THREE.GridHelper = new THREE.GridHelper(
  60,
  120,
  0xb8c0cc,
  0xd5dbe4,
);
scene.add(grid);

const hemi: THREE.HemisphereLight = new THREE.HemisphereLight(
  0xffffff,
  0x9aa3b2,
  1.1,
);
scene.add(hemi);
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(3, 5, 4);
scene.add(sun);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  42,
  1,
  0.05,
  200,
);
const az: number = (Number(params.get("az") ?? 35) * Math.PI) / 180;
const target: number = 1.2;
const dist: number = Number(params.get("dist") ?? 5.2);
const camY: number = 1.9;
const followMode: boolean = params.get("follow") === "1";
const followCamera: () => void = (): void => {
  const px: number = horseObj.object.position.x;
  const pz: number = horseObj.object.position.z;
  camera.position.set(px + dist * Math.sin(az), camY, pz + dist * Math.cos(az));
  camera.lookAt(px, target, pz);
};
camera.position.set(dist * Math.sin(az), camY, dist * Math.cos(az));
camera.lookAt(0, target, 0);

// `?t=<seconds>` freezes a deterministic frame for capture.
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
const step: (elapsed: number) => void = (elapsed: number): void => {
  horsePlayer.update(elapsed);
  knightPlayer.update(elapsed);
  placeRider(elapsed);
  if (followMode) followCamera();
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
    if (!capMode && freezeAt === null) step(elapsed);
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

// ── clip selector ────────────────────────────────────────────────────────────
const bar: HTMLDivElement | null =
  document.querySelector<HTMLDivElement>("#clips");
let selectedClip: string = clipName;
const selectClip: (name: string) => void = (name: string): void => {
  horseClip = horseClips[name]!;
  horsePlayer.setMotion(horseClip);
  selectedClip = name;
  if (bar !== null)
    for (const el of bar.children)
      el.className = el.textContent === name ? "on" : "";
};
if (bar !== null) {
  for (const name of Object.keys(horseClips)) {
    const b: HTMLButtonElement = document.createElement("button");
    b.textContent = name;
    b.className = name === clipName ? "on" : "";
    b.addEventListener("click", (): void => {
      selectClip(name);
    });
    bar.appendChild(b);
  }
}
registerViewerSelection({
  names: Object.keys(horseClips),
  read: (): string => selectedClip,
  select: selectClip,
});

(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  clip: clipName,
  horseBones: (): number => horseObj.bones.size,
  knightBones: (): number => knightObj.bones.size,
};
