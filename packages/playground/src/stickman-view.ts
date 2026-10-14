import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  aimRotation,
  solveTwoBoneIK,
} from "@automovie/engine";
import {
  AutoMovieGuidePass,
  IAutoMovieBone,
  IAutoMovieMotion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMoviePlayer,
  IAutoMovieRenderModeHandle,
  applyCaptureCanvasSize,
  applyRenderMode,
  buildModel,
  guardAutoMovieRenderModeRetirement,
  guardAutoMovieSceneShadowRetirement,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { STICKMAN_CLIPS } from "./STICKMAN_CLIPS";
import { buildStickman } from "./buildStickman";
import { registerViewerSelection } from "./viewer/registerViewerSelection";

const params: InstanceType<typeof URLSearchParams> = new URLSearchParams(
  location.search,
);
// `?rom=1` freezes the figure at rest and draws each joint's flexion gamut.
const showRom: boolean = params.get("rom") === "1";

// ── build the stick figure + its clips ──────────────────────────────────────
// The human T-pose rig opts into HUMANOID_JOINT_AXES.
const { model, skeleton }: ReturnType<typeof buildStickman> =
  buildStickman(DEFAULT_STICKMAN);
const object: ReturnType<typeof buildModel> = buildModel(model);
const clips: Record<string, IAutoMovieMotion> = STICKMAN_CLIPS(skeleton.id);

const clipName: string =
  params.get("clip") !== null && Object.hasOwn(clips, params.get("clip")!)
    ? params.get("clip")!
    : "jumpingJack";
// `?clamp=1` enforces ROM.
const player: AutoMoviePlayer = new AutoMoviePlayer(
  object,
  skeleton,
  clips[clipName]!,
  HUMANOID_JOINT_AXES,
  params.get("clamp") === "1",
  undefined,
  HUMANOID_REST_FRAME,
);

// `?t=<seconds>` freezes one sampled frame (deterministic capture); otherwise
// the clip plays live off the render loop.
const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
if (!showRom && freezeAt !== null && Number.isFinite(freezeAt))
  player.update(freezeAt);

// ── scene scaffolding ───────────────────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
scene.add(object.object);

// a large floor so a traveling clip (followed by the camera) always has ground
// scrolling beneath it instead of walking off the edge of a small grid
const grid: THREE.GridHelper = new THREE.GridHelper(40, 80, 0xb8c0cc, 0xd5dbe4);
scene.add(grid);

const hemi: THREE.HemisphereLight = new THREE.HemisphereLight(
  0xffffff,
  0x9aa3b2,
  1.1,
);
scene.add(hemi);
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(2, 4, 3);
scene.add(sun);

// `?az=<deg>` orbits the camera (0 = front, 90 = right side) so sagittal clips
// like walk/hop can be inspected from the side.
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  40,
  1,
  0.05,
  100,
);
const az: number = (Number(params.get("az") ?? 0) * Math.PI) / 180;
const target: number = 0.92;
const dist: number = 3.8;
const camY: number = target + 0.1;

// `?follow=1` makes the camera ride along with the character's root as a
// traveling clip (stroll/sprint) carries it across the floor,
// holding the same orbit offset but re-centred on the moving body, so the
// figure stays framed while the ground scrolls past (a tracking shot). The
// root translation the engine bakes via travelMotion lands on `object.object`,
// so we just read its world position each frame.
const followMode: boolean = params.get("follow") === "1";
const followCamera: () => void = (): void => {
  const px: number = object.object.position.x;
  const pz: number = object.object.position.z;
  camera.position.set(
    px + dist * Math.sin(az),
    camY,
    pz + dist * Math.cos(az),
  );
  camera.lookAt(px, target, pz);
};
camera.position.set(dist * Math.sin(az), camY, dist * Math.cos(az));
camera.lookAt(0, target, 0);
if (followMode) followCamera();

// ── ROM overlay: a flexion-gamut fan at every constrained joint ─────────────
// Each joint's `constraint.flexion` [min,max] swept about its flexion axis (the
// same axis the engine validates against), drawn at rest so the figure's whole
// range of motion is visible at once, the joint-limit idea made tangible.
const buildRomFans: () => void = (): void => {
  scene.updateMatrixWorld(true);
  const pos: THREE.Vector3 = new THREE.Vector3();
  const quat: THREE.Quaternion = new THREE.Quaternion();
  const scl: THREE.Vector3 = new THREE.Vector3();
  for (const b of skeleton.bones) {
    const flex: { min: number; max: number } | null | undefined =
      b.constraint?.flexion;
    if (flex === null || flex === undefined) continue;
    const child: ReturnType<typeof skeleton.bones.find> = skeleton.bones.find(
      (x: IAutoMovieBone): boolean => x.parent === b.bone,
    );
    const tb: THREE.Object3D<THREE.Object3DEventMap> | undefined =
      object.bones.get(b.bone);
    if (child === undefined || tb === undefined) continue;
    tb.matrixWorld.decompose(pos, quat, scl);
    const childDir: THREE.Vector3 = new THREE.Vector3(
      child.rest.translation.x,
      child.rest.translation.y,
      child.rest.translation.z,
    );
    const a: IAutoMovieVector3 = HUMANOID_JOINT_AXES[b.bone]?.flexion ?? {
      x: 1,
      y: 0,
      z: 0,
    };
    const axis: THREE.Vector3 = new THREE.Vector3(a.x, a.y, a.z);
    const arc: THREE.Vector3[] = [];
    const N: number = 28;
    for (let i: number = 0; i <= N; ++i) {
      const deg: number = flex.min + ((flex.max - flex.min) * i) / N;
      const q: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
        axis,
        (deg * Math.PI) / 180,
      );
      arc.push(
        pos
          .clone()
          .add(childDir.clone().applyQuaternion(q).applyQuaternion(quat)),
      );
    }
    const outline: THREE.Vector3[] = [pos.clone(), ...arc, pos.clone()];
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(outline),
        new THREE.LineBasicMaterial({
          color: 0xff7a2f,
          transparent: true,
          opacity: 0.9,
        }),
      ),
    );
  }
};
if (showRom) buildRomFans();

// ── aim / look-at driver (?look=1) ──────────────────────────────────────────
// The head's forward (+Z, where the eyes are) tracks a target orbiting in front
// of the face: each frame compute the world look direction and convert it to the
// head bone's local rotation via the engine's aimRotation.
const lookMode: boolean = params.get("look") === "1";
const headBone: THREE.Object3D<THREE.Object3DEventMap> | undefined =
  object.bones.get("head");
const aimHead: (elapsed: number) => void = (elapsed: number): void => {
  if (headBone === undefined) return;
  scene.updateMatrixWorld(true);
  const parentQ: THREE.Quaternion = new THREE.Quaternion();
  headBone.parent!.getWorldQuaternion(parentQ);
  // a target circling in front of the head (forward +Z, sweeping x/y)
  const dir: THREE.Vector3 = new THREE.Vector3(
    0.6 * Math.cos(elapsed * 1.5),
    0.45 * Math.sin(elapsed * 1.5),
    0.9,
  ).normalize();
  const a: ReturnType<typeof aimRotation> = aimRotation(
    { x: 0, y: 0, z: 1 },
    { x: dir.x, y: dir.y, z: dir.z },
  );
  const world: THREE.Quaternion = new THREE.Quaternion(a.x, a.y, a.z, a.w);
  headBone.quaternion.copy(parentQ.invert().multiply(world));
};

// ── two-bone IK reach driver (?reach=1) ─────────────────────────────────────
// The right arm reaches a moving target: aim the upper arm off the shoulder→goal
// line by the engine's solveTwoBoneIK `lift`, then point the forearm at the goal
//, the hand lands on the target, the elbow bending as it moves in and out.
const reachMode: boolean = params.get("reach") === "1";
const segLen: (b: string) => number = (b: string): number => {
  const t: IAutoMovieVector3 | undefined = skeleton.bones.find(
    (x: IAutoMovieBone): boolean => x.bone === b,
  )?.rest.translation;
  return t ? Math.hypot(t.x, t.y, t.z) : 0.25;
};
const L1: number = segLen("rightLowerArm"); // shoulder → elbow
const L2: number = segLen("rightHand"); // elbow → wrist
const reachTarget: THREE.Mesh<
  THREE.SphereGeometry,
  THREE.MeshStandardMaterial,
  THREE.Object3DEventMap
> = new THREE.Mesh(
  new THREE.SphereGeometry(0.04, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xe5484d }),
);
if (reachMode) scene.add(reachTarget);
const FWD: { x: number; y: number; z: number } = { x: -1, y: 0, z: 0 }; // right-arm rest points down its −X local axis
const toThree: (q: {
  x: number;
  y: number;
  z: number;
  w: number;
}) => THREE.Quaternion = (q: {
  x: number;
  y: number;
  z: number;
  w: number;
}): THREE.Quaternion => new THREE.Quaternion(q.x, q.y, q.z, q.w);

const reach: (elapsed: number) => void = (elapsed: number): void => {
  const upper: THREE.Object3D<THREE.Object3DEventMap> | undefined =
    object.bones.get("rightUpperArm");
  const lower: THREE.Object3D<THREE.Object3DEventMap> | undefined =
    object.bones.get("rightLowerArm");
  if (upper === undefined || lower === undefined) return;
  scene.updateMatrixWorld(true);
  const root: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    upper.matrixWorld,
  );
  // target circles in front of and beside the right shoulder, in and out
  const goal: THREE.Vector3 = root
    .clone()
    .add(
      new THREE.Vector3(
        -0.15 + 0.2 * Math.sin(elapsed * 1.1),
        0.15 * Math.sin(elapsed * 1.7),
        0.18 + (L1 + L2) * (0.55 + 0.4 * Math.sin(elapsed * 0.9)),
      ),
    );
  reachTarget.position.copy(goal);

  const toGoal: THREE.Vector3 = goal.clone().sub(root);
  const dir: THREE.Vector3 = toGoal.clone().normalize();
  const { lift }: ReturnType<typeof solveTwoBoneIK> = solveTwoBoneIK(
    L1,
    L2,
    toGoal.length(),
  );
  const pole: THREE.Vector3 = new THREE.Vector3(0, -1, -0.4).normalize();
  const bendAxis: THREE.Vector3 = new THREE.Vector3()
    .crossVectors(dir, pole)
    .normalize();
  const upperDir: THREE.Vector3 = dir
    .clone()
    .applyQuaternion(
      new THREE.Quaternion().setFromAxisAngle(bendAxis, (lift * Math.PI) / 180),
    );
  const elbow: THREE.Vector3 = root
    .clone()
    .add(upperDir.clone().multiplyScalar(L1));
  const handDir: THREE.Vector3 = goal.clone().sub(elbow).normalize();

  const parentQ: THREE.Quaternion = new THREE.Quaternion();
  upper.parent!.getWorldQuaternion(parentQ);
  const upperWorld: THREE.Quaternion = toThree(aimRotation(FWD, upperDir));
  upper.quaternion.copy(parentQ.clone().invert().multiply(upperWorld));
  upper.updateWorldMatrix(true, false);
  const upperWorldQ: THREE.Quaternion = new THREE.Quaternion();
  upper.getWorldQuaternion(upperWorldQ);
  const lowerWorld: THREE.Quaternion = toThree(
    aimRotation(FWD, { x: handDir.x, y: handDir.y, z: handDir.z }),
  );
  lower.quaternion.copy(upperWorldQ.invert().multiply(lowerWorld));
};

// One frame of animation at `elapsed` seconds, shared by the live render loop
// and the deterministic capture hook below.
const frame: (elapsed: number) => void = (elapsed: number): void => {
  if (reachMode) reach(elapsed);
  else if (lookMode) aimHead(elapsed);
  else if (!showRom) {
    player.update(elapsed);
    if (followMode) followCamera();
  }
};

const canvas: HTMLCanvasElement =
  document.querySelector<HTMLCanvasElement>("#view")!;
// `?cap=1` hands frame timing to the capturer (window.__afSeek) instead of the
// wall clock, so a recorder can step through deterministically in one session.
const capMode: boolean = params.get("cap") === "1";
// Pin the capture canvas to the render plan's exact frame size (#1251), so a
// headless screenshot of `#view` is that size regardless of the host window.
if (capMode)
  applyCaptureCanvasSize(
    canvas,
    Number(params.get("w")),
    Number(params.get("h")),
  );
let observedPass: AutoMovieGuidePass = "beauty";
const handle: ReturnType<typeof mountViewer> = mountViewer(
  canvas,
  scene,
  camera,
  (elapsed: number): void => {
    if (!capMode && freezeAt === null) frame(elapsed);
  },
  // Capture renders with AA off and a pinned pixel ratio (#1169) so structural
  // guide passes avoid antialiasing and device-pixel-ratio variation. These
  // settings do not establish identical native pixels across browser/GPU hosts.
  {
    ...(capMode ? { antialias: false, pixelRatio: 1 } : {}),
    completedFrame: (): {
      scene: THREE.Scene<THREE.Object3DEventMap>;
      camera: THREE.PerspectiveCamera;
      pass: AutoMovieGuidePass;
    } => ({ scene, camera, pass: observedPass }),
  },
);
(window as unknown as { __afSeek: (t: number) => void }).__afSeek = (
  t: number,
): void => {
  frame(t);
  // Refuse an uncertain original scene/context owner before publishing a draw.
  guardAutoMovieSceneShadowRetirement(scene, handle.renderer);
  guardAutoMovieRenderModeRetirement(scene);
  handle.renderer.render(scene, camera);
  handle.completeFrame(t);
};
// `__afPass` switches the guide pass a capturer screenshots (#1165): restore
// whatever pass was live, apply the requested one over the already-seeked
// scene, and re-render, so one seek yields every pass of that frame.
let passHandle: IAutoMovieRenderModeHandle | null = null;
(
  window as unknown as { __afPass: (pass: AutoMovieGuidePass) => void }
).__afPass = (pass: AutoMovieGuidePass): void => {
  // Keep the persistent pass owner and its restoration order; failed ownership
  // must refuse before another pass installs materials on this same scene.
  guardAutoMovieSceneShadowRetirement(scene, handle.renderer);
  guardAutoMovieRenderModeRetirement(scene);
  passHandle?.restore();
  passHandle = applyRenderMode(scene, pass);
  observedPass = pass;
  handle.renderer.render(scene, camera);
  handle.completeFrame();
};

// ── clip selector (live switching) ──────────────────────────────────────────
const bar: HTMLDivElement | null =
  document.querySelector<HTMLDivElement>("#clips");
let activeClip: string = clipName;
const selectClip: (name: string) => void = (name: string): void => {
  activeClip = name;
  player.setMotion(clips[name]!);
  if (bar !== null)
    for (const el of bar.children)
      el.className = el.textContent === name ? "on" : "";
};
if (bar !== null) {
  for (const name of Object.keys(clips)) {
    const b: HTMLButtonElement = document.createElement("button");
    b.textContent = name;
    b.className = name === activeClip ? "on" : "";
    b.addEventListener("click", (): void => {
      selectClip(name);
    });
    bar.appendChild(b);
  }
}
registerViewerSelection({
  names: Object.keys(clips),
  read: (): string => activeClip,
  select: selectClip,
  pass: {
    read: (): AutoMovieGuidePass => observedPass,
    restore: (pass: AutoMovieGuidePass): void => {
      passHandle?.restore();
      passHandle = applyRenderMode(scene, pass);
      observedPass = pass;
    },
  },
});

// expose for headless verification (the screenshot harness reads this)
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  clip: clipName,
  boneCount: (): number => object.bones.size,
  partCount: (): number => model.parts.length,
};
