import { type IAutoMovieModel, type IAutoMovieBone, AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotion, IAutoMoviePose, IAutoMovieSkeleton } from "@automovie/interface";

import { HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME } from "@automovie/engine";

import {
  AutoMoviePlayer,
  IAutoMovieModelObject,
  applyPose,
  buildModel,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { DEFAULT_PARAMS } from "./DEFAULT_PARAMS";
import type { IHumanoidParams } from "./IHumanoidParams";
import { buildHumanoid } from "./buildHumanoid";
import { registerPlaygroundViewerApplication } from "./viewer/registerPlaygroundViewerApplication";

// ── editor state ──────────────────────────────────────────────────────────
const params: IHumanoidParams = { ...DEFAULT_PARAMS };

/**
 * Clinical joint angles retained by the humanoid editor's pose state.
 *
 * @author Samchon
 */
interface JointState {
  flexion: number;
  abduction: number;
  twist: number;
}
const pose: Partial<Record<AutoMovieHumanoidBone, JointState>> = {};

let object: IAutoMovieModelObject;
let skeleton: IAutoMovieSkeleton;
let player: AutoMoviePlayer | null = null;
let playing: boolean = false;

const currentPose: () => IAutoMoviePose = (): IAutoMoviePose => {
  const joints: IAutoMovieJointPose[] = Object.entries(pose).map(
    ([bone, s]: [string, JointState]): { bone: AutoMovieHumanoidBone; flexion: number; abduction: number; twist: number; } => ({
      bone: bone as AutoMovieHumanoidBone,
      flexion: s!.flexion,
      abduction: s!.abduction,
      twist: s!.twist,
    }),
  );
  return { skeleton: "humanoid", root: null, joints };
};

// ── a small procedural "wave" clip, so Play does something visible ──────────
const waveMotion: () => IAutoMovieMotion = (): IAutoMovieMotion => {
  const arm: (flexion: number, abduction: number) => IAutoMoviePose = (flexion: number, abduction: number): IAutoMoviePose => ({
    skeleton: "humanoid",
    root: null,
    joints: [
      { bone: "leftUpperArm", flexion, abduction, twist: 0 },
      { bone: "leftLowerArm", flexion: 20, abduction: 0, twist: 0 },
    ],
  });
  return {
    id: "wave",
    skeleton: "humanoid",
    duration: 1.2,
    loop: true,
    keyframes: [
      {
        time: 0,
        pose: arm(0, 110),
        expression: null,
        easing: "easeInOut",
        bezier: null,
      },
      {
        time: 0.6,
        pose: arm(-120, 150),
        expression: null,
        easing: "easeInOut",
        bezier: null,
      },
      {
        time: 1.2,
        pose: arm(0, 110),
        expression: null,
        easing: "easeInOut",
        bezier: null,
      },
    ],
  };
};

// ── three.js scene scaffolding ──────────────────────────────────────────────
const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
scene.background = new THREE.Color(0x1b1e24);

const figure: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
scene.add(figure);

const grid: THREE.GridHelper = new THREE.GridHelper(6, 12, 0x445066, 0x2a3040);
scene.add(grid);

const hemi: THREE.HemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404050, 1.1);
scene.add(hemi);
const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(2, 4, 3);
scene.add(sun);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
camera.position.set(0.2, 1.25, 3.1);
camera.lookAt(0, 1.0, 0);

const rebuild: () => void = (): void => {
  const built: { skeleton: IAutoMovieSkeleton; model: IAutoMovieModel; } = buildHumanoid(params);
  skeleton = built.skeleton;
  figure.clear();
  object = buildModel(built.model);
  figure.add(object.object);
  player = new AutoMoviePlayer(
    object,
    skeleton,
    waveMotion(),
    HUMANOID_JOINT_AXES,
    false,
    undefined,
    HUMANOID_REST_FRAME,
  );
  if (!playing)
    applyPose(
      object,
      currentPose(),
      skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    );
};

// ── editor UI ───────────────────────────────────────────────────────────────
/**
 * One numerical editor slider and its original value read/write ports.
 *
 * @author Samchon
 */
interface SliderSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (n: number) => void;
}

const proportionSliders: SliderSpec[] = [
  prop("Hip height", "hipHeight", 0.5, 1.2),
  prop("Torso length", "torsoLength", 0.3, 0.9),
  prop("Shoulder width", "shoulderWidth", 0.2, 0.55),
  prop("Hip width", "hipWidth", 0.1, 0.35),
  prop("Upper-arm length", "upperArmLength", 0.15, 0.45),
  prop("Forearm length", "lowerArmLength", 0.15, 0.4),
  prop("Thigh length", "thighLength", 0.25, 0.65),
  prop("Shin length", "shinLength", 0.25, 0.6),
  prop("Limb thickness", "limbRadius", 0.03, 0.12),
  prop("Head size", "headRadius", 0.07, 0.2),
];

function prop(
  label: string,
  key: keyof IHumanoidParams,
  min: number,
  max: number,
): SliderSpec {
  return {
    label,
    min,
    max,
    step: 0.005,
    get: (): number => params[key],
    set: (n: number): void => {
      params[key] = n;
      rebuild();
    },
  };
}

const poseSlider: (label: string, bone: AutoMovieHumanoidBone, axis: keyof JointState, min: number, max: number) => SliderSpec = (
  label: string,
  bone: AutoMovieHumanoidBone,
  axis: keyof JointState,
  min: number,
  max: number,
): SliderSpec => ({
  label,
  min,
  max,
  step: 1,
  get: (): number => pose[bone]?.[axis] ?? 0,
  set: (n: number): void => {
    const s: JointState = (pose[bone] ??= { flexion: 0, abduction: 0, twist: 0 });
    s[axis] = n;
    if (!playing)
      applyPose(
        object,
        currentPose(),
        skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      );
  },
});

const poseSliders: SliderSpec[] = [
  poseSlider("Head tilt", "head", "flexion", -40, 40),
  poseSlider("R shoulder raise", "rightUpperArm", "abduction", 0, 180),
  poseSlider("R elbow bend", "rightLowerArm", "flexion", -140, 0),
  poseSlider("L hip raise", "leftUpperLeg", "flexion", -40, 90),
  poseSlider("L knee bend", "leftLowerLeg", "flexion", 0, 140),
  poseSlider("Spine twist", "spine", "twist", -40, 40),
];

const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font: 13px/1.4 system-ui, sans-serif; color: #dfe3ea; }
    #stage { display: grid; grid-template-columns: 1fr 320px; height: 100vh; }
    #view { width: 100%; height: 100%; display: block; background: #1b1e24; }
    #panel { background: #14171c; border-left: 1px solid #2a2f37; padding: 14px;
             overflow-y: auto; }
    #panel h1 { font-size: 15px; margin: 0 0 2px; }
    #panel .sub { color: #8b93a1; font-size: 11px; margin-bottom: 12px; }
    #panel h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em;
                color: #7f8a9c; margin: 16px 0 6px; }
    .row { margin: 7px 0; }
    .row label { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .row label span:last-child { color: #9aa3b2; font-variant-numeric: tabular-nums; }
    .row input { width: 100%; accent-color: #4f9dff; }
    button { width: 100%; padding: 9px; margin-top: 14px; border: 0; border-radius: 6px;
             background: #2f6fd6; color: #fff; font-weight: 600; cursor: pointer; }
    button:hover { background: #3a7ce4; }
  </style>
  <div id="stage">
    <canvas id="view"></canvas>
    <div id="panel">
      <h1>automovie · character editor</h1>
      <div class="sub">Procedural humanoid: adjust body, pose, or play a clip.</div>
      <button id="play">▶ Play wave</button>
      <h2>Proportions</h2>
      <div id="proportions"></div>
      <h2>Pose</h2>
      <div id="poses"></div>
    </div>
  </div>
`;

const mountSliders: (host: HTMLElement, specs: SliderSpec[]) => void = (host: HTMLElement, specs: SliderSpec[]): void => {
  for (const s of specs) {
    const row: HTMLDivElement = document.createElement("div");
    row.className = "row";
    const value: (n: number) => string = (n: number): string => n.toFixed(s.step < 1 ? 3 : 0);
    row.innerHTML = `
      <label><span>${s.label}</span><span class="v">${value(s.get())}</span></label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.get()}" />
    `;
    const input: HTMLInputElement = row.querySelector("input")!;
    const out: Element = row.querySelector(".v")!;
    input.addEventListener("input", (): void => {
      const n: number = Number(input.value);
      s.set(n);
      out.textContent = value(n);
    });
    host.appendChild(row);
  }
};

mountSliders(document.querySelector("#proportions")!, proportionSliders);
mountSliders(document.querySelector("#poses")!, poseSliders);

const playBtn: HTMLButtonElement = document.querySelector<HTMLButtonElement>("#play")!;
playBtn.addEventListener("click", (): void => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pause" : "▶ Play wave";
  if (!playing)
    applyPose(
      object,
      currentPose(),
      skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    );
});

// ── boot ─────────────────────────────────────────────────────────────────────
rebuild();

const canvas: HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#view")!;
mountViewer(canvas, scene, camera, (elapsed: number): void => {
  if (playing && player !== null) player.update(elapsed);
});
registerPlaygroundViewerApplication({
  ready: Promise.resolve(), capture: (): { params: { hipHeight: number; torsoLength: number; neckLength: number; shoulderWidth: number; hipWidth: number; upperArmLength: number; lowerArmLength: number; thighLength: number; shinLength: number; limbRadius: number; headRadius: number; }; pose: Partial<Record<AutoMovieHumanoidBone, JointState>>; playing: boolean; } => ({ params: { ...params }, pose: structuredClone(pose), playing }),
  restore: async (state: unknown): Promise<void> => {
    if (state === null || typeof state !== "object") throw new Error("Humanoid transfer has no editor state.");
    const values: unknown = Reflect.get(state, "params"), joints: unknown = Reflect.get(state, "pose");
    const playback: unknown = Reflect.get(state, "playing");
    if (values === null || typeof values !== "object" || joints === null || typeof joints !== "object" || typeof playback !== "boolean")
      throw new Error("Humanoid transfer has invalid parameters/pose/playback.");
    const next: { hipHeight: number; torsoLength: number; neckLength: number; shoulderWidth: number; hipWidth: number; upperArmLength: number; lowerArmLength: number; thighLength: number; shinLength: number; limbRadius: number; headRadius: number; } = { ...DEFAULT_PARAMS };
    for (const key of Object.keys(DEFAULT_PARAMS)) {
      const value: unknown = Reflect.get(values, key);
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error("Humanoid transfer has invalid " + key + ".");
      Reflect.set(next, key, value);
    }
    const nextPose: Partial<Record<AutoMovieHumanoidBone, JointState>> = {};
    for (const [name, angles] of Object.entries(joints)) {
      const bone: AutoMovieHumanoidBone | undefined = skeleton.bones.find((part: IAutoMovieBone): boolean => part.bone === name)?.bone;
      if (bone === undefined || angles === null || typeof angles !== "object") throw new Error("Humanoid transfer has an unknown joint.");
      const flexion: unknown = Reflect.get(angles, "flexion"), abduction: unknown = Reflect.get(angles, "abduction"), twist: unknown = Reflect.get(angles, "twist");
      if (typeof flexion !== "number" || typeof abduction !== "number" || typeof twist !== "number" ||
          ![flexion, abduction, twist].every(Number.isFinite)) throw new Error("Humanoid transfer has non-finite joint angles.");
      nextPose[bone] = { flexion, abduction, twist };
    }
    Object.assign(params, next);
    for (const key of Object.keys(pose)) Reflect.deleteProperty(pose, key);
    Object.assign(pose, nextPose); playing = playback; rebuild();
    playBtn.textContent = playing ? "Pause" : "Play wave";
    for (const [selector, specs] of [["#proportions", proportionSliders], ["#poses", poseSliders]] as const) {
      const host: HTMLElement = document.querySelector<HTMLElement>(selector)!;
      host.replaceChildren(); mountSliders(host, specs);
    }
  },
});

// expose for headless verification (screenshot harness reads this)
(window as unknown as { __automovie: unknown }).__automovie = {
  ready: true,
  boneCount: (): number => object.bones.size,
};
