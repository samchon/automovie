import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieRasterSheet,
  type IAutoMovieSceneRaster,
  applyAutoMovieGhost,
  createAutoMovieDriftMarkers,
  createAutoMovieTargetMarker,
  createAutoMovieTrail,
  encodeAutoMovieRasterPng,
  rasterizeAutoMovieScene,
} from "@automovie/viewer";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";

import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { MotionCaptureFigure } from "./MotionCaptureFigure";
import { MOTION_CAPTURE_CASES } from "./cases/MOTION_CAPTURE_CASES";

/**
 * Draw motion cases on the polygon man straight from Node, with no browser,
 * GPU or viewer server, and report their numeric verdicts.
 *
 * `pnpm --dir packages/motions node:capture -- --case <name>[,<name>??`
 * builds each named case from `MOTION_CAPTURE_CASES` (`--list` prints them),
 * poses every performer and ghost at each of the case's instants and draws
 * them with the CPU rasterizer through four orthographic views fitted to the
 * union of everything drawn: `front` (from +Z), `side` (from the figure's
 * left, +X), `top` (from +Y, the front up) and `threeQuarter`. Trails, target
 * markers, drift markers and boxes are drawn over the figures. Each view
 * becomes `sheet-<view>.png` (one cell per instant, captioned) under the
 * ignored `packages/motions/media/capture/<case>/`, with `manifest.json`
 * holding the instants, the verdicts and the case metrics. `--cell <px>` sets
 * the cell size (default 320) and `--views a,b` selects views. `--only
 * <regex>` keeps the cases of the named factories whose own name matches, a
 * factory that reads the filter not building the others, and throws when none
 * matches; `--verdicts` prints the verdicts without drawing or writing
 * anything. The process exits non-zero when any verdict fails.
 *
 * The rasterizer is the viewer package's. Frames are flat-shaded CPU
 * diagnostics, not delivered pixels.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives every option, the views and their directions, the output paths, the exit status and the rasterizer's owner.
 * @evidence contracts/development/implementation.md#principled-implementation Orthographic cameras fitted to the drawn bounds keep scale comparable across cells; posing uses Human's canonical adapter and drawing the viewer's polygon builder.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Parse, build each case, fit views, draw sheets, write the manifest.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown cases, options or views throw; a failed verdict fails the run.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in instants times views times drawn triangles; figures are built once per case.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One scene, figure set and overlay set serve every view and instant of a case.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Figures and overlays are disposed when a case finishes; frames are reduced into sheets as drawn.
 */
export async function motionCapture(): Promise<void> {
  const options: Map<string, string> = parse(process.argv.slice(2));
  if (options.has("--list")) {
    for (const name of Object.keys(MOTION_CAPTURE_CASES)) console.log(name);
    return;
  }
  const names: string[] = (options.get("--case") ?? "")
    .split(",")
    .filter((n: string): boolean => n !== "");
  if (names.length === 0)
    throw new Error("Name cases with --case a,b or list them with --list");
  const cell: number = Number(options.get("--cell") ?? 320);
  const views: string[] = (
    options.get("--views") ?? Object.keys(VIEWS).join(",")
  ).split(",");
  for (const view of views)
    if (!(view in VIEWS)) throw new Error(`Unknown view ${view}`);
  const pattern: RegExp | undefined = options.has("--only")
    ? new RegExp(options.get("--only")!)
    : undefined;
  const only: ((name: string) => boolean) | undefined =
    pattern === undefined
      ? undefined
      : (name: string): boolean => pattern.test(name);
  let failed: number = 0;
  let built: number = 0;
  for (const name of names) {
    const factory:
      | ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>)
      | undefined = MOTION_CAPTURE_CASES[name];
    if (factory === undefined) throw new Error(`Unknown case ${name}`);
    for (const capture of factory(only)) {
      if (only !== undefined && !only(capture.name)) continue;
      built++;
      failed += options.has("--verdicts")
        ? report(capture, [])
        : await draw(capture, cell, views);
    }
  }
  if (built === 0) throw new Error("No case matches --case and --only");
  if (failed !== 0) process.exitCode = 1;
}

/** Print one case's verdicts; returns the number that failed. */
function report(capture: IMotionCaptureCase, sheets: readonly string[]): number {
  const verdicts: IMotionCaptureCase.IVerdict[] = capture.verdicts ?? [];
  console.log(`${capture.name}: ${capture.times.length} instants`);
  for (const sheet of sheets) console.log(`  ${sheet}`);
  for (const v of verdicts)
    console.log(`  ${v.passed ? "pass" : "FAIL"} ${v.name}: ${v.detail}`);
  return verdicts.filter((v: IMotionCaptureCase.IVerdict): boolean => !v.passed)
    .length;
}

/** The view directions: where the camera stands relative to the target, and its up. */
const VIEWS: Readonly<
  Record<string, { from: IAutoMovieVector3; up: IAutoMovieVector3 }>
> = {
  front: { from: { x: 0, y: 0, z: 1 }, up: { x: 0, y: 1, z: 0 } },
  side: { from: { x: 1, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } },
  top: { from: { x: 0, y: 1, z: 0 }, up: { x: 0, y: 0, z: 1 } },
  threeQuarter: {
    from: { x: 0.62, y: 0.42, z: 0.66 },
    up: { x: 0, y: 1, z: 0 },
  },
};

/** Draw one case; returns the number of failed verdicts. */
async function draw(
  capture: IMotionCaptureCase,
  cell: number,
  views: readonly string[],
): Promise<number> {
  const directory: string = path.join(
    __dirname,
    "..",
    "..",
    "media",
    "capture",
    capture.name,
  );
  await mkdir(directory, { recursive: true });
  for (const entry of await readdir(directory))
    if (/^(sheet-.*\.png|manifest\.json)$/.test(entry))
      await rm(path.join(directory, entry));

  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e6df);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(1.5, 3, 2.5);
  scene.add(sun, sun.target);
  const disposers: (() => void)[] = [];
  const figures: {
    figure: MotionCaptureFigure;
    source: IMotionCaptureCase.IPerformer;
  }[] = [];
  for (const performer of capture.performers) {
    const figure: MotionCaptureFigure = new MotionCaptureFigure(
      performer.body,
      performer.color,
    );
    scene.add(figure.object);
    figures.push({ figure, source: performer });
    disposers.push((): void => figure.dispose());
  }
  for (const ghost of capture.ghosts ?? []) {
    const figure: MotionCaptureFigure = new MotionCaptureFigure(ghost.body);
    disposers.push(
      applyAutoMovieGhost(
        figure.object,
        ghost.color ?? 0x3a6ea5,
        ghost.opacity,
      ),
    );
    scene.add(figure.object);
    figures.push({ figure, source: ghost });
    disposers.push((): void => figure.dispose());
  }
  const overlays: THREE.Object3D[] = [
    ...(capture.trails ?? []).map(
      (t: { color: number; points: IAutoMovieVector3[] }): THREE.Object3D =>
        createAutoMovieTrail(t.points, t.color),
    ),
    ...(capture.targets ?? []).map(
      (t: {
        at: IAutoMovieVector3;
        radius: number;
        color: number;
      }): THREE.Object3D =>
        createAutoMovieTargetMarker(t.at, t.radius, t.color),
    ),
    ...(capture.drift ?? []).map(
      (d: {
        samples: { at: IAutoMovieVector3; drift: number }[];
        limit: number;
      }): THREE.Object3D => createAutoMovieDriftMarkers(d.samples, d.limit),
    ),
    ...(capture.boxes ?? []).map(
      (b: {
        centre: IAutoMovieVector3;
        half: IAutoMovieVector3;
        color: number;
      }): THREE.Object3D => {
        const mesh: THREE.Mesh = new THREE.Mesh(
          new THREE.BoxGeometry(2 * b.half.x, 2 * b.half.y, 2 * b.half.z),
          new THREE.MeshStandardMaterial({ color: b.color, flatShading: true }),
        );
        mesh.position.set(b.centre.x, b.centre.y, b.centre.z);
        return mesh;
      },
    ),
  ];
  if (overlays.length !== 0) scene.add(...overlays);
  disposers.push((): void =>
    overlays.forEach((o: THREE.Object3D): void =>
      o.traverse((x: THREE.Object3D): void => {
        if (
          x instanceof THREE.Mesh ||
          x instanceof THREE.Line ||
          x instanceof THREE.Points
        ) {
          x.geometry.dispose();
          (x.material as THREE.Material).dispose();
        }
      }),
    ),
  );

  // Bounds of everything drawn, over every instant.
  const box: THREE.Box3 = new THREE.Box3();
  for (const time of capture.times)
    for (const { figure, source } of figures)
      for (const p of figure.place(source.pose(time.seconds)))
        box.expandByPoint(
          new THREE.Vector3(p.position.x, p.position.y, p.position.z),
        );
  for (const o of overlays) box.expandByObject(o);
  box.expandByPoint(new THREE.Vector3(box.min.x, 0, box.min.z));
  box.expandByScalar(0.18);
  const grid: THREE.GridHelper = new THREE.GridHelper(
    Math.ceil(Math.max(box.max.x - box.min.x, box.max.z - box.min.z) + 1),
    Math.ceil(Math.max(box.max.x - box.min.x, box.max.z - box.min.z) + 1) * 4,
    0x9a958c,
    0xc9c4ba,
  );
  grid.position.set(
    (box.min.x + box.max.x) / 2,
    0,
    (box.min.z + box.max.z) / 2,
  );
  scene.add(grid);
  disposers.push((): void => {
    grid.geometry.dispose();
    (grid.material as THREE.Material).dispose();
  });

  const columns: number = Math.min(capture.times.length, 8);
  const sheets: string[] = [];
  try {
    for (const view of views) {
      const camera: THREE.OrthographicCamera = fit(box, VIEWS[view]!);
      const sheet: AutoMovieRasterSheet = new AutoMovieRasterSheet(
        capture.times.length,
        columns,
        cell,
        cell,
      );
      for (const time of capture.times) {
        for (const { figure, source } of figures)
          figure.place(source.pose(time.seconds));
        const raster: IAutoMovieSceneRaster = rasterizeAutoMovieScene({
          scene,
          camera,
          width: cell,
          height: cell,
          supersample: 2,
        });
        sheet.add(raster, time.label);
      }
      const file: string = path.join(directory, `sheet-${view}.png`);
      await writeFile(file, encodeAutoMovieRasterPng(sheet.finish()));
      sheets.push(file);
    }
  } finally {
    disposers.forEach((d: () => void): void => d());
  }
  const verdicts: IMotionCaptureCase.IVerdict[] = capture.verdicts ?? [];
  await writeFile(
    path.join(directory, "manifest.json"),
    JSON.stringify(
      {
        case: capture.name,
        times: capture.times,
        performers: capture.performers.map(
          (p: IMotionCaptureCase.IPerformer): string =>
            `${p.id}:${p.body.skeleton.id}`,
        ),
        verdicts,
        metrics: capture.metrics ?? {},
      },
      null,
      1,
    ),
    "utf8",
  );
  return report(capture, sheets);
}

/** An orthographic camera looking at the box's centre from a direction, fitted to its projected extent. */
function fit(
  box: THREE.Box3,
  view: { from: IAutoMovieVector3; up: IAutoMovieVector3 },
): THREE.OrthographicCamera {
  const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
  const from: THREE.Vector3 = new THREE.Vector3(
    view.from.x,
    view.from.y,
    view.from.z,
  ).normalize();
  const up: THREE.Vector3 = new THREE.Vector3(view.up.x, view.up.y, view.up.z);
  const camera: THREE.OrthographicCamera = new THREE.OrthographicCamera();
  camera.up.copy(up);
  camera.position.copy(centre).addScaledVector(from, 20);
  camera.lookAt(centre);
  camera.updateMatrixWorld();
  const inverse: THREE.Matrix4 = camera.matrixWorldInverse;
  let half: number = 0;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const p: THREE.Vector3 = new THREE.Vector3(x, y, z).applyMatrix4(
          inverse,
        );
        half = Math.max(half, Math.abs(p.x), Math.abs(p.y));
      }
  camera.left = -half;
  camera.right = half;
  camera.top = half;
  camera.bottom = -half;
  camera.near = 0.1;
  camera.far = 40;
  camera.updateProjectionMatrix();
  return camera;
}

/** Parse `--key value`, `--key=value` and bare flags. */
function parse(argv: readonly string[]): Map<string, string> {
  const out: Map<string, string> = new Map();
  for (let i: number = 0; i < argv.length; i++) {
    const [key, inline] = argv[i]!.split(/=(.*)/s) as [string, string?];
    if (key === "--") continue;
    if (key === "--list" || key === "--verdicts") {
      out.set(key, "1");
      continue;
    }
    if (!["--case", "--cell", "--views", "--only"].includes(key))
      throw new Error(`Unknown option ${key}`);
    const value: string | undefined = inline ?? argv[++i];
    if (value === undefined) throw new Error(`${key} needs a value`);
    out.set(key, value);
  }
  return out;
}

void motionCapture().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
