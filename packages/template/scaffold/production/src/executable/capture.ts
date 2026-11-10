import { planViewerFrameTimes } from "@automovie/render";
import ffmpeg from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type * as THREE from "three";

import type { IFilm } from "../IFilm";
import type { IFilmProduction } from "../IFilmProduction";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";
import { planCaptureStills } from "./planCaptureStills";
import { AutoMovieRasterSheet } from "./viewer/node/raster/AutoMovieRasterSheet";
import { type IAutoMovieSceneRaster } from "./viewer/node/raster/IAutoMovieSceneRaster";
import { encodeAutoMovieRasterPng } from "./viewer/node/raster/encodeAutoMovieRasterPng";
import { rasterizeAutoMovieScene } from "./viewer/node/raster/rasterizeAutoMovieScene";
import { stampAutoMovieRasterLabel } from "./viewer/node/raster/stampAutoMovieRasterLabel";

/**
 * Draw film frames straight from Node, with no Viewer server, browser or
 * GPU, for reading poses, contacts, staging and framing frame by frame.
 *
 * `npm run capture -- --film <name>` mounts the film once through its own
 * `create()` and `seek()`, draws each requested second with the installed
 * CPU rasterizer, stamps the second in the corner, and writes
 * `t<seconds>.png` frames, contact sheets `sheet-<from>-<to>.png` with JSON
 * cell indexes, and `manifest.json` into
 * `media/automovie/<film>/frames/capture/<from>-<to>[-<view>]/` or
 * `--out <dir>`, so a catalog case or a 10-second review segment always lands
 * at the same path.
 *
 * Requests: `--from <s>` (default 0) and `--to <s>` (default ten seconds
 * later, at most the film's end) bound a half-open window that
 * {@link planCaptureStills} samples on the film's frame grid at `--rate <n>`
 * per second (default 5, at most 10, so 50 frames per ten seconds), adding 10
 * per second within half a second of each `--events <s,s,…>` second;
 * `--every <frames>` samples the film's own frame grid instead, inclusive of
 * both ends; `--at <s,s,…>` draws exact seconds. `--width`/`--height` set the
 * raster (default the film's delivery raster), `--supersample <1-4>`
 * antialiases, `--view <name>` draws through one of the film's named
 * `IFilmProduction.views` and `--view x,y,z:tx,ty,tz` through a static
 * inspection camera in world metres, `--per-sheet <n>` and `--columns <n>`
 * lay out sheets (default 50 cells in ten columns, one 10-second segment at
 * 5 per second), `--no-label` and `--no-sheet` drop the stamp and the
 * sheets, and `--list` prints the registered films. `--module <file.ts>`
 * (with `--export <name>` when the module has several exports) captures a
 * film that is not registered, such as a motion rehearsal, whole by default,
 * into `media/automovie/modules/<module>/`; several comma-separated modules
 * share one run. `--video` draws every frame of the film's grid in
 * `[from, to)` (default the whole film) and encodes them at the film's rate
 * with the installed FFmpeg into `media/automovie/<film>/videos/capture.mp4`.
 * Run it with `ttsx --no-plugins --noCheck` so no
 * type check or compiler plugin runs before drawing; the type-check watch owns
 * compile errors.
 *
 * Frames are CPU diagnostics: flat-shaded surfaces under the scene's lights,
 * without textures, shadows or post-processing. Delivered pixels come from the
 * Viewer through `npm run render`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives every option with its unit and default, the outputs and their names, the intended runner flags, and what the frames do not show.
 * @evidence contracts/development/implementation.md#principled-implementation The film is mounted through the same create and seek the Viewer calls, so a drawn second shows the state the Viewer would place; grid requests reuse the installed frame planner, and sheets are reduced in memory from the drawn frames by the installed sheet builder, captioned after reduction so every cell's second stays legible.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command parses options, plans seconds, then mounts, draws, writes and summarizes; drawing, encoding, planning and sheet layout belong to installed packages.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown options, missing values, empty or out-of-film windows and ambiguous films throw instead of falling back to a guess.
 * @evidence contracts/development/implementation.md#efficient-algorithms The film is created once for all frames; work is linear in the number of requested frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One mount, one camera and one output directory serve every frame of a run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each frame's pixels are released after writing; the production is disposed on every outcome; only earlier capture files of the same directory are replaced.
 */
export async function capture(): Promise<void> {
  const options: Map<string, string> = new Map();
  const argv: string[] = process.argv.slice(2);
  for (let index: number = 0; index < argv.length; index++) {
    const [key, inline] = argv[index]!.split(/=(.*)/s) as [string, string?];
    if (FLAGS.includes(key)) {
      options.set(key, "1");
      continue;
    }
    if (!VALUED.includes(key)) throw new Error(`Unknown option ${key}`);
    const value: string | undefined = inline ?? argv[++index];
    if (value === undefined || value === "")
      throw new Error(`${key} needs a value`);
    options.set(key, value);
  }
  if (options.has("--list")) {
    for (const [name, film] of Object.entries(films))
      console.log(
        `${name}\t${film.durationSeconds} s\t${film.fps} fps\t${film.width ?? 1280}x${film.height ?? 720}`,
      );
    return;
  }
  const number: (key: string, fallback?: number) => number | undefined = (
    key: string,
    fallback?: number,
  ): number | undefined => {
    if (!options.has(key)) return fallback;
    const value: number = Number(options.get(key));
    if (!Number.isFinite(value)) throw new Error(`${key} must be a number`);
    return value;
  };

  // Plan the seconds before mounting, so a bad request costs nothing.
  if (options.has("--module") && options.has("--film"))
    throw new Error("Give either --film or --module, not both");
  // Several comma-separated modules share one process, one compile and one Human calibration memo.
  const modules: (string | undefined)[] = options.has("--module")
    ? options.get("--module")!.split(",")
    : [undefined];
  if (modules.length > 1 && options.has("--out"))
    throw new Error(
      "--out names one film's folder; omit it with several modules",
    );
  for (const moduleFile of modules) {
    const selected: { name: string; film: IFilm } =
      moduleFile !== undefined
        ? await loadModuleFilm(moduleFile, options.get("--export"))
        : selectFilm(films, options.get("--film") ?? null);
    const film: IFilm = selected.film;
    const from: number = number("--from", 0)!;
    const video: boolean = options.has("--video");
    const to: number = number(
      "--to",
      moduleFile !== undefined || video
        ? film.durationSeconds
        : Math.min(from + 10, film.durationSeconds),
    )!;
    const view: string | undefined = options.get("--view");

    // A video draws every frame of the film's grid in [from, to) and encodes them at the film's rate.
    const first: number = Math.ceil(from * film.fps - 1e-9);
    const times: number[] = video
      ? Array.from(
          { length: Math.max(0, Math.ceil(to * film.fps - 1e-9) - first) },
          (_: unknown, k: number): number => (first + k) / film.fps,
        )
      : options.has("--at")
        ? planViewerFrameTimes({
            fps: film.fps,
            durationSeconds: film.durationSeconds,
            at: options.get("--at")!.split(",").map(Number),
          })
        : options.has("--every")
          ? planViewerFrameTimes({
              fps: film.fps,
              durationSeconds: film.durationSeconds,
              from,
              to,
              every: number("--every"),
            })
          : planCaptureStills({
              fps: film.fps,
              durationSeconds: film.durationSeconds,
              start: from,
              end: to,
              rate: number("--rate", 5),
              events: options.has("--events")
                ? options.get("--events")!.split(",").map(Number)
                : [],
            });
    const width: number = number("--width", film.width ?? 1280)!;
    const height: number = number("--height", film.height ?? 720)!;
    const supersample: number = number("--supersample", 1)!;
    const perSheet: number = number("--per-sheet", 50)!;
    const columns: number = number("--columns", 10)!;
    const label: (seconds: number) => string = (seconds: number): string =>
      seconds.toFixed(3).padStart(7, "0");
    const directory: string =
      options.get("--out") ??
      path.join(
        "media",
        "automovie",
        selected.name,
        "frames",
        video ? "video" : "capture",
        video
          ? ""
          : `${label(times[0]!)}-${label(times.at(-1)!)}` +
              (view === undefined
                ? ""
                : `-${/^[a-z0-9-]+$/u.test(view) ? view : "inspection"}`),
      );
    await mkdir(directory, { recursive: true });

    // Replace only this command's earlier outputs in the directory.
    for (const entry of await readdir(directory))
      if (
        /^(t\d+\.\d+\.png|f\d{5}\.png|sheet-.*\.png(\.json)?|manifest\.json)$/.test(
          entry,
        )
      )
        await rm(path.join(directory, entry));

    const started: number = performance.now();
    const production: IFilmProduction = await film.create(
      (message: string): void => console.error(`[${selected.name}] ${message}`),
    );
    const mounted: number = performance.now();
    try {
      const preset: NonNullable<IFilmProduction["views"]>[string] | undefined =
        view !== undefined &&
        production.views !== undefined &&
        Object.hasOwn(production.views, view)
          ? production.views[view]
          : undefined;
      const camera: THREE.Camera = preset
        ? production.camera.clone()
        : inspectionCamera(production.camera, view);
      const frames: { file: string; seconds: number }[] = [];
      const skipped: Record<string, number> = {};
      const sheets: string[] = [];
      let triangles: number = 0;

      // Sheets fill as frames are drawn: cells scaled so the longer side is 320 pixels.
      const scale: number = 320 / Math.max(width, height);
      const cellWidth: number = Math.max(1, Math.round(width * scale));
      const cellHeight: number = Math.max(1, Math.round(height * scale));
      let sheet: AutoMovieRasterSheet | undefined;
      let group: { file: string; seconds: number }[] = [];
      const flush: () => Promise<void> = async (): Promise<void> => {
        if (sheet === undefined || group.length === 0) return;
        const file: string = path.join(
          directory,
          `sheet-${label(group[0]!.seconds)}-${label(group.at(-1)!.seconds)}.png`,
        );
        await writeFile(file, encodeAutoMovieRasterPng(sheet.finish()));
        await writeFile(
          `${file}.json`,
          JSON.stringify(
            {
              columns,
              cellWidth,
              cellHeight,
              cells: group.map(
                (
                  f: { file: string; seconds: number },
                  index: number,
                ): {
                  row: number;
                  column: number;
                  seconds: number;
                  file: string;
                } => ({
                  row: Math.floor(index / columns),
                  column: index % columns,
                  seconds: f.seconds,
                  file: path.basename(f.file),
                }),
              ),
            },
            null,
            2,
          ),
          "utf8",
        );
        sheets.push(file);
        sheet = undefined;
        group = [];
      };

      for (const seconds of times) {
        production.seek(seconds);
        if (preset) {
          const pose: ReturnType<NonNullable<typeof preset>> = preset(seconds);
          camera.position.set(...pose.position);
          camera.lookAt(...pose.target);
          camera.updateMatrixWorld();
        }
        fitAspect(camera, width, height);
        const raster: IAutoMovieSceneRaster = rasterizeAutoMovieScene({
          scene: production.scene,
          camera,
          width,
          height,
          supersample,
        });
        if (!options.has("--no-label") && !video)
          stampAutoMovieRasterLabel(
            raster,
            `${seconds.toFixed(2)}s`,
            Math.max(2, Math.round(Math.min(width, height) / 240)),
          );
        const file: string = path.join(
          directory,
          video
            ? `f${String(frames.length).padStart(5, "0")}.png`
            : `t${label(seconds)}.png`,
        );
        await writeFile(file, encodeAutoMovieRasterPng(raster));
        frames.push({ file, seconds });
        triangles = Math.max(triangles, raster.statistics.triangles);
        for (const [type, count] of Object.entries(raster.statistics.skipped))
          skipped[type] = Math.max(skipped[type] ?? 0, count);
        if (!options.has("--no-sheet") && !video) {
          sheet ??= new AutoMovieRasterSheet(
            perSheet,
            columns,
            cellWidth,
            cellHeight,
          );
          sheet.add(raster, `${seconds.toFixed(2)}s`);
          group.push({ file, seconds });
          if (group.length === perSheet) await flush();
        }
      }
      await flush();
      const drawn: number = performance.now();

      const manifest: object = {
        film: selected.name,
        durationSeconds: film.durationSeconds,
        fps: film.fps,
        raster: { width, height, supersample },
        camera: options.get("--view") ?? "film",
        times,
        frames: frames.map((f: { file: string; seconds: number }): string =>
          path.basename(f.file),
        ),
        sheets: sheets.map((s: string): string => path.basename(s)),
        maximumTriangles: triangles,
        skipped,
        milliseconds: {
          create: Math.round(mounted - started),
          frames: Math.round(drawn - mounted),
          perFrame: Math.round((drawn - mounted) / times.length),
        },
      };
      await writeFile(
        path.join(directory, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      );
      console.log(
        `capture ${selected.name}: ${times.length} frames in ${directory}`,
      );
      console.log(
        `create ${((mounted - started) / 1000).toFixed(1)} s, draw ${((drawn - mounted) / 1000).toFixed(1)} s` +
          (Object.keys(skipped).length === 0
            ? ""
            : `, not drawn: ${JSON.stringify(skipped)}`),
      );
      for (const sheet of sheets) console.log(sheet);

      // Encode the drawn frames at the film's own rate into one H.264 file.
      if (video) {
        const output: string = path.join(
          "media",
          "automovie",
          selected.name,
          "videos",
          "capture.mp4",
        );
        await mkdir(path.dirname(output), { recursive: true });
        const encoder: string = process.env.FFMPEG_PATH ?? ffmpeg ?? "";
        if (encoder === "")
          throw new Error("Set FFMPEG_PATH; ffmpeg-static found no binary");
        const result: ReturnType<typeof spawnSync> = spawnSync(
          encoder,
          [
            "-y",
            "-framerate",
            String(film.fps),
            "-i",
            path.join(directory, "f%05d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            output,
          ],
          { stdio: "inherit" },
        );
        if (result.status !== 0)
          throw new Error(`ffmpeg exited with ${result.status}`);
        console.log(output);
      }
    } finally {
      production.dispose();
    }
  }
}

/** Options that take no value. */
const FLAGS: readonly string[] = [
  "--list",
  "--no-label",
  "--no-sheet",
  "--video",
];

/** Options that take a value. */
const VALUED: readonly string[] = [
  "--film",
  "--module",
  "--export",
  "--from",
  "--to",
  "--rate",
  "--events",
  "--every",
  "--at",
  "--width",
  "--height",
  "--supersample",
  "--view",
  "--out",
  "--per-sheet",
  "--columns",
];

/**
 * The film a rehearsal module exports: the export named by `--export`, or
 * the module's only export, called first when it is a factory. Its output
 * goes under `media/automovie/modules/<module>[-<export>]/`.
 */
async function loadModuleFilm(
  file: string,
  name: string | undefined,
): Promise<{ name: string; film: IFilm }> {
  const exports: Record<string, unknown> = await import(
    pathToFileURL(path.resolve(file)).href
  );
  const names: string[] = Object.keys(exports);
  const chosen: string | undefined =
    name ?? (names.length === 1 ? names[0] : undefined);
  if (chosen === undefined || !Object.hasOwn(exports, chosen))
    throw new Error(
      `Select the film export of ${file} with --export <name>: ${names.join(", ")}`,
    );
  const value: unknown = exports[chosen];
  const film: unknown = typeof value === "function" ? value() : value;
  const candidate: Partial<IFilm> | null =
    typeof film === "object" ? (film as Partial<IFilm> | null) : null;
  if (
    candidate === null ||
    typeof candidate.durationSeconds !== "number" ||
    typeof candidate.fps !== "number" ||
    typeof candidate.create !== "function"
  )
    throw new Error(`${file}#${chosen} is not an IFilm or a factory of one`);
  const base: string = path.basename(file).replace(/\.[cm]?[jt]s$/u, "");
  return {
    name: path.join("modules", name === undefined ? base : `${base}-${chosen}`),
    film: candidate as IFilm,
  };
}

/** Match a perspective camera's aspect to the raster, as the Viewer does for its canvas. */
function fitAspect(camera: THREE.Camera, width: number, height: number): void {
  const perspective: THREE.PerspectiveCamera =
    camera as THREE.PerspectiveCamera;
  if (
    perspective.isPerspectiveCamera === true &&
    perspective.aspect !== width / height
  ) {
    perspective.aspect = width / height;
    perspective.updateProjectionMatrix();
  }
}

/** The film camera, or a static inspection camera `x,y,z:tx,ty,tz` in world metres. */
function inspectionCamera(
  camera: THREE.PerspectiveCamera,
  view: string | undefined,
): THREE.Camera {
  if (view === undefined) return camera;
  const points: number[][] = view
    .split(":")
    .map((part: string): number[] => part.split(",").map(Number));
  if (
    points.length !== 2 ||
    points.some(
      (p: number[]): boolean => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error("--view must be x,y,z:tx,ty,tz in metres");
  const inspection: THREE.PerspectiveCamera = camera.clone();
  inspection.position.set(points[0]![0]!, points[0]![1]!, points[0]![2]!);
  inspection.lookAt(points[1]![0]!, points[1]![1]!, points[1]![2]!);
  inspection.updateMatrixWorld();
  return inspection;
}

void capture().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
