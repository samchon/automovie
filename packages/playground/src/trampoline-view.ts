import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  projectileAt,
  resolveImpact,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { applyPose, buildModel, mountViewer } from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_STICKMAN } from "./DEFAULT_STICKMAN";
import { buildStickman } from "./buildStickman";

// ── trampoline bounce: the figure falls, the engine's resolveImpact returns the
// rebound velocity off a springy trampoline, and a projectile arc carries it up
// again, tucking at the apex, extending to land. The bounce heights come from
// the physics, not a hand-keyed sine. ─────────────────────────────────────────
const params: URLSearchParams = new URLSearchParams(location.search);
const v: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
const j: (bone: AutoMovieHumanoidBone, a: { flexion?: number; abduction?: number; twist?: number; }) => IAutoMovieJointPose = (
  bone: AutoMovieHumanoidBone,
  a: { flexion?: number; abduction?: number; twist?: number },
): IAutoMovieJointPose => ({
  bone,
  flexion: a.flexion ?? 0,
  abduction: a.abduction ?? 0,
  twist: a.twist ?? 0,
});

const { skeleton, model }: ReturnType<typeof buildStickman> = buildStickman(DEFAULT_STICKMAN);
const object: ReturnType<typeof buildModel> = buildModel(model);

const SURFACE: number = 0.32; // trampoline bed height; the figure's feet ride here
const G: number = -12;
const DUR: number = 9;

// Precompute the bounce timeline: each landing, resolveImpact gives the rebound
// speed, and a 1-D vertical projectile arc carries the figure to the next.
/**
 * One precomputed trampoline flight interval and its upward launch velocity.
 *
 * @author Samchon
 */
interface Arc {
  start: number;
  end: number;
  v0: number;
} // up-velocity launched at `start`, returns to the bed at `end`
const arcs: Arc[] = [];
{
  let t: number = 0;
  let v0: number = 4.6; // initial launch speed off the bed
  while (t < DUR && v0 > 0.6) {
    const flight: number = (-2 * v0) / G; // up and back to the bed
    arcs.push({ start: t, end: t + flight, v0 });
    // landing speed = v0 (symmetric); resolveImpact off the springy bed
    const impact: ReturnType<typeof resolveImpact> = resolveImpact(
      {
        mass: 70,
        velocity: v(0, -v0, 0),
        restitution: 0.86,
        hardness: 0.5,
        penetrability: 0.05,
      },
      {
        mass: 1e9,
        velocity: v(0, 0, 0),
        restitution: 0.92,
        hardness: 0.9,
        penetrability: 0.02,
      },
      v(0, -1, 0), // normal from faller (above) to bed (below)
    );
    v0 = Math.abs(impact.velocityA.y); // rebound up-speed the engine returned
    t += flight;
  }
}

const arcAt: (t: number) => { y: number; phase: number; } = (t: number): { y: number; phase: number } => {
  const a: Arc =
    arcs.find((s: Arc): boolean => t >= s.start && t < s.end) ?? arcs[arcs.length - 1];
  const dt: number = Math.min(Math.max(t - a.start, 0), a.end - a.start);
  const y: number = a.v0 * dt + 0.5 * G * dt * dt; // height above the bed
  const phase: number = a.end - a.start > 0 ? dt / (a.end - a.start) : 0; // 0 launch → 1 land
  return { y: Math.max(0, y), phase };
};

// pose: tuck the knees and throw the arms up near the apex, extend to land,
// and squash slightly at the bed
const poseAt: (phase: number, y: number) => IAutoMovieJointPose[] = (phase: number, y: number): IAutoMovieJointPose[] => {
  const air: number = Math.sin(Math.PI * phase); // 0 at bed, 1 at apex
  const squash: number = y < 0.12 ? 1 - y / 0.12 : 0; // compress when near the bed
  const tuck: number = 60 * air;
  const knee: number = 24 + 90 * air + 28 * squash;
  // Clinical arm raise: both sides share one anatomical value. 120 starts as a
  // readable V, 180 reaches overhead at the apex without rig-space overshoot.
  const clinicalArmRaise: number = 120 + 60 * air;
  return [
    j("leftUpperLeg", { flexion: -tuck - 14 * squash, abduction: 10 }),
    j("rightUpperLeg", { flexion: -tuck - 14 * squash, abduction: -10 }),
    j("leftLowerLeg", { flexion: knee }),
    j("rightLowerLeg", { flexion: knee }),
    j("leftUpperArm", { abduction: clinicalArmRaise }),
    j("rightUpperArm", { abduction: clinicalArmRaise }),
    j("spine", { flexion: -6 * air }),
  ];
};

const step: (t: number) => void = (t: number): void => {
  const { y, phase }: ReturnType<typeof arcAt> = arcAt(t);
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: {
      translation: { x: 0, y: SURFACE + y, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: poseAt(phase, y),
  };
  applyPose(object, pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME);
  // the bed dips when the figure lands
  bed.position.y = SURFACE - (y < 0.12 ? (0.12 - y) * 0.6 : 0);
};

// trampoline: a bed disc on four legs
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
scene.add(object.object);
const bed: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.7, 0.05, 28),
  new THREE.MeshStandardMaterial({ color: 0x2f6fd6 }),
);
bed.position.set(0, SURFACE, 0);
scene.add(bed);
const rim: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = new THREE.Mesh(
  new THREE.TorusGeometry(0.7, 0.04, 8, 28),
  new THREE.MeshStandardMaterial({ color: 0x9aa3b2 }),
);
rim.rotation.x = Math.PI / 2;
rim.position.set(0, SURFACE, 0);
scene.add(rim);
for (const [dx, dz] of [
  [0.5, 0.5],
  [0.5, -0.5],
  [-0.5, 0.5],
  [-0.5, -0.5],
]) {
  const leg: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap> = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, SURFACE, 8),
    new THREE.MeshStandardMaterial({ color: 0x9aa3b2 }),
  );
  leg.position.set(dx, SURFACE / 2, dz);
  scene.add(leg);
}
scene.add(new THREE.GridHelper(8, 16, 0xb8c0cc, 0xd5dbe4));
scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.1));
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(2, 5, 3);
scene.add(sun);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
const az: number = (Number(params.get("az") ?? 30) * Math.PI) / 180;
const dist: number = Number(params.get("dist") ?? 6.2);
camera.position.set(dist * Math.sin(az), 2.0, dist * Math.cos(az));
camera.lookAt(0, 1.5, 0);

const frozen: string | null = params.get("t");
const freezeAt: number | null = frozen !== null ? Number(frozen) : null;
if (freezeAt !== null && Number.isFinite(freezeAt)) step(freezeAt);

const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#view")!;
const capMode: boolean = params.get("cap") === "1";
const handle: ReturnType<typeof mountViewer> = mountViewer(canvas, scene, camera, (elapsed: number): void => {
  if (!capMode && freezeAt === null) step(elapsed % DUR);
});
(window as unknown as { __afSeek: (t: number) => void }).__afSeek = (
  t: number,
): void => {
  step(t);
  handle.renderer.render(scene, camera);
  handle.completeFrame(t);
};

(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  bounces: arcs.length,
  duration: DUR,
};
