import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionRequest,
  type IAutoMovieSceneRaster,
  type IAutoMovieViewerSubjectBounds,
  applyAutoMovieInspection,
  parseAutoMovieInspectionRequest,
  planViewerFrameTimes,
  rasterizeAutoMovieScene,
  stampAutoMovieRasterLabel,
} from "@automovie/render";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type * as THREE from "three";

import type { IFilm } from "../IFilm";
import type { IFilmProduction } from "../IFilmProduction";
import type { InspectionView } from "../InspectionView";
import { films } from "../composition/films";
import { placeInspectionView } from "../placeInspectionView";
import { planInspectionViews } from "../planInspectionViews";
import { selectFilm } from "../selectFilm";
import { CaptureDirectory } from "./CaptureDirectory";
import { captureEncodedStills } from "./captureEncodedStills";
import { formatCaptureSeconds } from "./formatCaptureSeconds";
import { listCapturePaths } from "./listCapturePaths";
import { loadModuleFilm } from "./loadModuleFilm";
import { planCaptureStills } from "./planCaptureStills";
import { readCaptureOptions } from "./readCaptureOptions";
import { runCaptureFfmpeg } from "./runCaptureFfmpeg";

/**
 * Draw film frames straight from Node, with no Viewer server, browser or GPU, for reading forms, poses, contacts, staging and framing frame by frame.
 *
 * `npm run capture -- --film <name>` mounts the film once through its own `create()` and `seek()`, draws each requested second with the installed CPU rasterizer, stamps the second in the corner, and writes `t<seconds>.png` stills, contact sheets `sheet-<from>-<to>.png` with JSON cell indexes, and `manifest.json` into `media/automovie/<film>/frames/capture/<first>-<last>[-<view>]/` or `--out <dir>`, where `<first>` and `<last>` are the seconds of the first and the last still drawn, so a catalog case or a 10-second review segment always lands at the same path.
 *
 * **Seconds.** `--from <s>` (default 0) and `--to <s>` (default ten seconds later, at most the film's end) bound a half-open window that {@link planCaptureStills} samples on the film's frame grid at `--rate <n>` per second (default 5, at most 10, so 50 stills per ten seconds), adding 10 per second within half a second of each `--events <s,s,…>` second. `--every <frames>` samples the film's own frame grid instead, inclusive of both ends, and `--at <s,s,…>` draws exact seconds.
 *
 * **Views.** `--view` takes what {@link planInspectionViews} reads: one or several comma-separated names, each a key of the film's `IFilmProduction.views`, `film` for the film camera, or one of `front`, `back`, `right`, `left`, `top`, `bottom`, `three-quarter` and `three-quarter-back`; or `x,y,z:tx,ty,tz`, a fixed camera in world metres. A named view is framed once on everything the run draws across all its seconds, so the camera holds still and a subject's travel reads as travel. Several views draw every second through each: stills are `t<seconds>-<view>.png`, the folder ends in `-views`, and a sheet row is one second unless `--columns` says otherwise.
 *
 * **Inspection.** The Viewer's inspection parameters are options of the same names, read by the viewer's own request reader: `--parts` and `--hide` select objects by path pattern, `--shade` colours surfaces (`beauty`, `depth`, `mask`, `normal`, `outline`, `pose`, `clay`, `faces`), `--surface 0` removes them, `--wire` draws triangle edges, `--marks <kind patterns>` draws marks of the named kinds, the film's `IFilmProduction.marks` and the mesh defects the inspection measures (`defect/open`, `defect/non-manifold`, `defect/inconsistent`, `defect/degenerate`, and `defect/sliver` under `--sliver <aspect>`), `--section <y:1.2>` cuts the scene, `--xray` draws marks over surfaces and `--stroke <px>` sets their width. `--paths` prints every path of the mounted film and draws nothing. The manifest records the request, the legend of mark colours with their counts and the selected paths, and the legend is printed.
 *
 * **Rounds.** `--round <name>` keeps the run under `rounds/<name>/` of its folder, where later runs leave it. `--compare <name>` compares the run's stills against that round, writing `diff-<still>` for each changed still and `comparison.json`; `--tolerance <bytes>` (default 0) is the channel difference still counted as unchanged.
 *
 * **Layout.** `--width`/`--height` set the raster (default the film's delivery raster), `--supersample <1-4>` antialiases, `--per-sheet <n>` and `--columns <n>` lay out sheets (default 50 cells in ten columns, one 10-second segment at 5 per second), `--no-label` and `--no-sheet` drop the stamp and the sheets, and `--list` prints the registered films.
 *
 * **Other sources.** `--module <file.ts>` (with `--export <name>` when the module has several exports) captures a film that is not registered, such as a motion rehearsal, whole by default, into `media/automovie/modules/<module>/`; several comma-separated modules share one run. `--video` draws every frame of the film's grid in `[from, to)` (default the whole film) through one view and encodes them at the film's rate with the installed FFmpeg into `media/automovie/<film>/videos/capture.mp4`. `--file <video>` samples an encoded file instead of a film through {@link captureEncodedStills}, taking only `--from`, `--to`, `--rate` (default 5, uncapped), `--out`, the sheet layout and the round options.
 *
 * Run it with `ttsx --no-plugins --noCheck` so no type check or compiler plugin runs before drawing; the type-check watch owns compile errors.
 *
 * Film stills are CPU diagnostics: flat-shaded surfaces under the scene's lights, without textures, shadows or post-processing. Delivered pixels come from the Viewer through `npm run render`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives every option with its unit and default, grouped by what it decides, the outputs and their names, the intended runner flags, and what the stills do not show.
 * @evidence contracts/development/implementation.md#principled-implementation The film is mounted through the same create and seek the Viewer calls and inspected through the same request the Viewer applies, so a still shows what the page would; grid requests reuse the installed frame planner, and a named view is framed on the union of the drawn boxes of every planned second, which is what keeps one camera for the whole run.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command reads options, plans seconds, mounts, resolves views and inspection, then draws and summarizes; option reading, view planning and placement, output folders, comparison and FFmpeg each belong to their own module, and drawing to installed packages.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown options, missing values, empty or out-of-film windows, ambiguous films, unknown views, selection patterns that match nothing, a raster the rasterizer refuses, a view the first second cannot place, a sheet too large for the raster and a sheet smaller than one second's views throw before an earlier run's files are replaced, because the folder is opened once the first second is drawn through every view; a view that a later second cannot place, and a sheet too large for an encoded file whose raster only decoding tells, throw while the run writes.
 * @evidence contracts/development/implementation.md#efficient-algorithms The film is created once and the inspection applied once for all stills; a named view adds one seek per planned second to measure what it frames, and work is otherwise linear in stills times views.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One mount, one applied inspection, one camera per view and one output folder serve every still of a run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The stills of one second, one per view, are held together until they are written and are released before the next second is drawn; the inspection is restored and the production disposed on every outcome.
 */
export async function capture(): Promise<void> {
  const options: Map<string, string> = readCaptureOptions(
    process.argv.slice(2),
  );
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
  const layout: Omit<CaptureDirectory.ILayout, "base" | "sheet"> = {
    round: options.get("--round"),
    compare: options.get("--compare"),
    tolerance: number("--tolerance", 0)!,
  };
  const report: (written: CaptureDirectory.IReport) => void = (
    written: CaptureDirectory.IReport,
  ): void => {
    for (const sheet of written.sheets) console.log(sheet);
    if (written.comparison !== null)
      console.log(
        `compare ${options.get("--compare")}: ${written.comparison.changed} of ${written.comparison.compared} stills changed` +
          (written.comparison.missing.length === 0
            ? ""
            : `, ${written.comparison.missing.length} not in that round`) +
          `; ${written.comparison.file}`,
      );
  };

  // An encoded file is sampled by FFmpeg; no film is mounted.
  if (options.has("--file")) {
    for (const key of options.keys())
      if (!FILE_OPTIONS.includes(key))
        throw new Error(`${key} does not apply to --file`);
    const from: number = number("--from", 0)!;
    const written: CaptureDirectory.IReport = await captureEncodedStills({
      file: options.get("--file")!,
      from,
      to: number("--to", from + 10)!,
      rate: number("--rate", 5)!,
      out: options.get("--out"),
      layout: {
        ...layout,
        sheet: options.has("--no-sheet")
          ? null
          : {
              perSheet: number("--per-sheet", 50)!,
              columns: number("--columns", 10)!,
              views: 1,
              // The file's raster is known only once FFmpeg has decoded it.
              raster: undefined,
            },
      },
    });
    console.log(
      `capture ${options.get("--file")}: ${written.frames.length} stills in ${written.directory}`,
    );
    report(written);
    return;
  }

  // Plan the seconds and read the inspection before mounting, so a bad request costs nothing.
  if (options.has("--module") && options.has("--film"))
    throw new Error("Give either --film or --module, not both");
  const request: IAutoMovieInspectionRequest = parseAutoMovieInspectionRequest(
    (key: string): string | undefined => options.get(`--${key}`),
  );
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
    if (times.length === 0) throw new Error("The request plans no frame");
    const width: number = number("--width", film.width ?? 1280)!;
    const height: number = number("--height", film.height ?? 720)!;
    const supersample: number = number("--supersample", 1)!;

    const started: number = performance.now();
    const production: IFilmProduction = await film.create(
      (message: string): void => console.error(`[${selected.name}] ${message}`),
    );
    const mounted: number = performance.now();
    try {
      // The views and the inspection are resolved, and the first second drawn through every view, before the folder is opened, which replaces the previous run.
      production.seek(times[0]!);
      if (options.has("--paths")) {
        for (const line of listCapturePaths(production, times[0]!))
          console.log(line);
        continue;
      }
      const views: InspectionView[] = planInspectionViews(
        view,
        Object.keys(production.views ?? {}),
      );
      if (video && views.length !== 1)
        throw new Error("--video draws through one view");
      if (
        views.length > 1 &&
        views.some((v: InspectionView): boolean => !/^[\w-]+$/u.test(v.id))
      )
        throw new Error(
          "Views drawn together need names of letters, digits, underscores and hyphens",
        );
      const inspection: IAutoMovieInspectionHandle = applyAutoMovieInspection({
        scene: production.scene,
        request,
        ...(production.marks === undefined
          ? {}
          : { marks: production.marks(times[0]!) }),
      });
      try {
        // A named view is framed on everything the run draws, so its camera holds still.
        let bounds: IAutoMovieViewerSubjectBounds | null = null;
        if (views.some((v: InspectionView): boolean => v.kind === "named"))
          for (const seconds of times) {
            production.seek(seconds);
            inspection.update(production.marks?.(seconds));
            bounds = unite(bounds, inspection.bounds());
          }
        const spares: Map<string, THREE.PerspectiveCamera> = new Map(
          views
            .filter((v: InspectionView): boolean => v.kind !== "film")
            .map((v: InspectionView): [string, THREE.PerspectiveCamera] => [
              v.id,
              production.camera.clone(),
            ]),
        );

        // Opened once the first second is drawn through every view, so a raster the rasterizer refuses or a view that cannot be placed leaves the previous run in place.
        let output: CaptureDirectory | undefined;
        const open: () => Promise<CaptureDirectory> =
          (): Promise<CaptureDirectory> =>
            CaptureDirectory.open({
              ...layout,
              base:
                options.get("--out") ??
                path.join(
                  "media",
                  "automovie",
                  selected.name,
                  "frames",
                  video ? "video" : "capture",
                  video
                    ? ""
                    : `${formatCaptureSeconds(times[0]!)}-${formatCaptureSeconds(times.at(-1)!)}` +
                        (view === undefined
                          ? ""
                          : `-${views.length > 1 ? "views" : /^[\w-]+$/u.test(view) ? view : "inspection"}`),
                ),
              sheet:
                options.has("--no-sheet") || video
                  ? null
                  : {
                      // Several views default to one row per second.
                      perSheet: number(
                        "--per-sheet",
                        Math.max(1, Math.floor(50 / views.length)) *
                          views.length,
                      )!,
                      columns: number(
                        "--columns",
                        views.length > 1 ? views.length : 10,
                      )!,
                      views: views.length,
                      raster: { width, height },
                    },
            });
        const placed: Map<
          string,
          ReturnType<typeof placeInspectionView>
        > = new Map();
        const skipped: Record<string, number> = {};
        let triangles: number = 0;
        let count: number = 0;
        for (const seconds of times) {
          production.seek(seconds);
          inspection.update(production.marks?.(seconds));
          // Every view of the second is drawn before any is written, so a view the first second refuses leaves the previous run in place.
          const stills: [InspectionView, IAutoMovieSceneRaster, string][] = [];
          for (const v of views) {
            const camera: THREE.PerspectiveCamera =
              spares.get(v.id) ?? production.camera;
            if (v.kind === "film") fitAspect(camera, width, height);
            else
              placed.set(
                v.id,
                placeInspectionView({
                  camera,
                  view: v,
                  production,
                  seconds,
                  aspect: width / height,
                  bounds,
                }),
              );
            const raster: IAutoMovieSceneRaster = rasterizeAutoMovieScene({
              scene: production.scene,
              camera,
              width,
              height,
              supersample,
            });
            const caption: string =
              `${seconds.toFixed(2)}s` + (views.length > 1 ? ` ${v.id}` : "");
            if (!options.has("--no-label") && !video)
              stampAutoMovieRasterLabel(
                raster,
                caption,
                Math.max(2, Math.round(Math.min(width, height) / 240)),
              );
            stills.push([v, raster, caption]);
          }
          output ??= await open();
          for (const [v, raster, caption] of stills) {
            await output.add(raster, {
              file: video
                ? `f${String(count).padStart(5, "0")}.png`
                : `t${formatCaptureSeconds(seconds)}${views.length > 1 ? `-${v.id}` : ""}.png`,
              seconds,
              view: views.length > 1 ? v.id : undefined,
              caption,
            });
            count++;
            triangles = Math.max(triangles, raster.statistics.triangles);
            for (const [type, n] of Object.entries(raster.statistics.skipped))
              skipped[type] = Math.max(skipped[type] ?? 0, n);
          }
        }
        const drawn: number = performance.now();

        // Every run plans at least one second through at least one view, so the folder is open by now.
        const written: CaptureDirectory.IReport = await output!.close({
          film: selected.name,
          durationSeconds: film.durationSeconds,
          fps: film.fps,
          raster: { width, height, supersample },
          camera: view ?? "film",
          // A production view moves with the film, so only its name is recorded.
          views: views.map((v: InspectionView): object => ({
            id: v.id,
            kind: v.kind,
            ...(v.kind === "named" || v.kind === "fixed"
              ? { ...placed.get(v.id), fovDeg: spares.get(v.id)!.fov }
              : {}),
          })),
          inspection: {
            request,
            legend: inspection.legend,
            selected: inspection.selected,
          },
          times,
          maximumTriangles: triangles,
          skipped,
          milliseconds: {
            create: Math.round(mounted - started),
            frames: Math.round(drawn - mounted),
            perFrame: Math.round((drawn - mounted) / count),
          },
        });
        console.log(
          `capture ${selected.name}: ${count} frames in ${written.directory}`,
        );
        console.log(
          `create ${((mounted - started) / 1000).toFixed(1)} s, draw ${((drawn - mounted) / 1000).toFixed(1)} s` +
            (Object.keys(skipped).length === 0
              ? ""
              : `, not drawn: ${JSON.stringify(skipped)}`),
        );
        for (const entry of inspection.legend)
          console.log(
            `${entry.label}\t#${entry.color.toString(16).padStart(6, "0")}\tx${entry.count}`,
          );
        report(written);

        // Encode the drawn frames at the film's own rate into one H.264 file.
        if (video) {
          const encoded: string = path.join(
            "media",
            "automovie",
            selected.name,
            "videos",
            "capture.mp4",
          );
          await mkdir(path.dirname(encoded), { recursive: true });
          runCaptureFfmpeg([
            "-y",
            "-framerate",
            String(film.fps),
            "-i",
            path.join(written.directory, "f%05d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "18",
            encoded,
          ]);
          console.log(encoded);
        }
      } finally {
        inspection.restore();
      }
    } finally {
      production.dispose();
    }
  }
}

/** Options that apply when `--file` samples an encoded file. */
const FILE_OPTIONS: readonly string[] = [
  "--file",
  "--from",
  "--to",
  "--rate",
  "--out",
  "--per-sheet",
  "--columns",
  "--no-sheet",
  "--round",
  "--compare",
  "--tolerance",
];

/** Match a perspective camera's aspect to the raster, as the Viewer does for its canvas. */
function fitAspect(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): void {
  if (camera.aspect !== width / height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

/** The smallest box holding two boxes, either of which may be absent. */
function unite(
  a: IAutoMovieViewerSubjectBounds | null,
  b: IAutoMovieViewerSubjectBounds | null,
): IAutoMovieViewerSubjectBounds | null {
  if (a === null || b === null) return a ?? b;
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}

void capture().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
