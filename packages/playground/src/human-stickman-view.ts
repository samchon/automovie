import type {
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";
import {
  AutoMovieTextureCache,
  buildModel,
  materialTextureBindings,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

import { AutoMovieHuman } from "../../human/src/AutoMovieHuman";
import { AutoMovieHumanSkeleton } from "../../human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../human/src/structures/IAutoMovieHumanParameters";
import { f1, f2, m1, m2 } from "./human-parameters";
import { HUMAN_STICKMAN_POSES } from "./human-stickman/HUMAN_STICKMAN_POSES";
import { buildHumanStickman } from "./human-stickman/buildHumanStickman";

/**
 * Human stickman page: the generated Human's rule-derived skeleton as a
 * rod-and-ball figure, posed by `params.pose` with range-of-motion clamping.
 *
 * Query: `alias` (f1, f2, m1, m2; default f1), `pose` (rest, demo, limit;
 * default rest), `clamp=0` to apply the pose without clamping, `skin=1` to
 * overlay the neutral skin translucently (it stays in rest pose; `garment=0`
 * hides the underwear), `view` (front, side, back, oblique; default front).
 * `window.__humanStickman.ready` turns true once a frame is drawn, and
 * `clamped` lists the fields the clamp changed.
 */
async function bootstrapHumanStickman(): Promise<void> {
  const query: URLSearchParams = new URLSearchParams(location.search);
  const people: Record<string, IAutoMovieHumanParameters> = { f1, f2, m1, m2 };
  const base: IAutoMovieHumanParameters | undefined =
    people[query.get("alias") ?? "f1"];
  if (base === undefined) throw new Error("Unknown alias");
  const poseName: string = Object.hasOwn(
    HUMAN_STICKMAN_POSES,
    query.get("pose") ?? "",
  )
    ? query.get("pose")!
    : "rest";
  const params: IAutoMovieHumanParameters = {
    ...base,
    pose: HUMAN_STICKMAN_POSES[poseName]!,
  };

  // Skeleton posed by params.pose.
  const clamp: boolean = query.get("clamp") !== "0";
  const output: AutoMovieHumanSkeleton.IOutput =
    AutoMovieHumanSkeleton.generate(params, clamp);
  const stickman: ReturnType<typeof buildHumanStickman> =
    buildHumanStickman(output);

  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f3f6);
  scene.add(stickman.object);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 1.2));
  const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 4, 2);
  scene.add(sun);
  scene.add(new THREE.GridHelper(4, 40, 0xb8c0cc, 0xd5dbe4));

  // Optional translucent skin overlay of the same parameters, in rest pose.
  if (query.get("skin") === "1") {
    const model: IAutoMovieModel = AutoMovieHuman.generate(params).model;
    const textures: AutoMovieTextureCache = new AutoMovieTextureCache(
      (asset: string): Promise<THREE.Texture> =>
        Promise.reject(new Error("Unserved texture asset " + asset)),
    );
    await textures.prime(
      model.materials.flatMap(materialTextureBindings),
      model.images ?? [],
    );
    const garment: boolean = query.get("garment") !== "0";
    const skin: ReturnType<typeof buildModel> = buildModel(
      {
        ...model,
        parts: model.parts.filter(
          (p: IAutoMovieModelPart): boolean =>
            !p.id.startsWith("human.construction.") &&
            (garment || !p.id.startsWith("human.garment.")),
        ),
      },
      textures.resolve,
    );
    skin.object.traverse((o: THREE.Object3D): void => {
      const mesh: THREE.Mesh = o as THREE.Mesh;
      if (mesh.material === undefined) return;
      for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
        m.transparent = true;
        m.opacity = 0.35;
        m.depthWrite = false;
      }
      mesh.renderOrder = 1;
    });
    scene.add(skin.object);
  }

  // Camera framing the rest skeleton from the requested direction.
  const box: THREE.Box3 = new THREE.Box3();
  for (const b of output.bones) {
    box.expandByPoint(new THREE.Vector3(...b.position));
    if (b.tip !== null) box.expandByPoint(new THREE.Vector3(...b.tip));
  }
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  const size: number = box.getSize(new THREE.Vector3()).length();
  const directions: Record<string, [number, number, number]> = {
    front: [1, 0, 0],
    side: [0, 0, 1],
    back: [-1, 0, 0],
    oblique: [Math.SQRT1_2, 0, Math.SQRT1_2],
  };
  const dir: [number, number, number] = directions[
    query.get("view") ?? "front"
  ] ?? [1, 0, 0];
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    30,
    1,
    0.05,
    50,
  );
  const distance: number = (size * 0.62) / Math.tan((15 * Math.PI) / 180);
  camera.position
    .copy(centre)
    .add(new THREE.Vector3(...dir).multiplyScalar(distance));
  camera.lookAt(centre);

  const canvas: HTMLCanvasElement =
    document.querySelector<HTMLCanvasElement>("#view")!;
  const state: {
    ready: boolean;
    pose: string;
    clamped: AutoMovieHumanSkeleton.IClamp[];
  } = { ready: false, pose: poseName, clamped: output.clamped };
  Object.assign(window, { __humanStickman: state });
  mountViewer(
    canvas,
    scene,
    camera,
    (): void => {
      state.ready = true;
    },
    { preserveDrawingBuffer: true },
  );

  // Pose selector and status line.
  const bar: HTMLElement | null = document.getElementById("clips");
  for (const name of Object.keys(HUMAN_STICKMAN_POSES)) {
    const b: HTMLButtonElement = document.createElement("button");
    b.textContent = name;
    b.className = name === poseName ? "on" : "";
    b.addEventListener("click", (): void => {
      const next: URLSearchParams = new URLSearchParams(location.search);
      next.set("pose", name);
      location.search = next.toString();
    });
    bar?.appendChild(b);
  }
  const status: HTMLElement | null = document.getElementById("status");
  if (status !== null)
    status.textContent =
      `${query.get("alias") ?? "f1"} · ${poseName} · clamp ${clamp ? "on" : "off"} · ${output.bones.length} bones` +
      output.clamped
        .map(
          (c: AutoMovieHumanSkeleton.IClamp): string =>
            `\n${c.path}: ${c.requested} → ${Math.round(c.applied * 100) / 100}`,
        )
        .join("");
}

void bootstrapHumanStickman().catch((error: unknown): void => {
  console.error(error);
  const status: HTMLElement | null = document.getElementById("status");
  if (status !== null)
    status.textContent =
      "Human stickman failed: " +
      (error instanceof Error ? error.message : String(error));
});
