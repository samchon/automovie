import type {
  IAutoMovieFilmShading,
  IAutoMovieMeasureRenderSimulation,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";

import { AUTOMOVIE_FILM_GLARE_KERNELS } from "./filmResponse/AUTOMOVIE_FILM_GLARE_KERNELS";

/** Bytes of one RGBA half-float texel. */
const HALF: number = 8;

/** Bytes of one RGBA 32-bit float texel. */
const FLOAT: number = 16;

/**
 * Bytes of one depth texel: three.js's default depth texture and depth
 * renderbuffer hold 24 bits in a 32-bit word.
 */
const DEPTH: number = 4;

/** Side of one probe cube face in texels, as the probe bake draws it. */
const PROBE_FACE: number = 32;

/**
 * Measure the GPU targets a directly rendered film's stage allocates for one
 * frame, as render's film response, sample sum, indirect and medium stages make
 * them at the beauty pass's drawing buffer, `width × pixelRatio` by `height ×
 * pixelRatio` pixels; the draw host's drawing buffer for the beauty pass is
 * twice the delivered raster on each side.
 *
 * With `subject.film`, and nothing without it:
 *
 * - Optics: the linear half-float target and its depth texture at the raster; the
 *   glare pyramid, one half-float level per halving down to the deepest
 *   kernel's level `max(0, ⌊log₂(σ × height / 2)⌋)`, each side rounded up; and
 *   two half-float blur targets per kernel at its level. The stage makes them
 *   whether or not glare is asked for.
 * - `samples`: two 32-bit float sum targets at the raster.
 * - `shading.occlusion`: the normal prepass's half-float target and its depth
 *   texture, and the raw and blurred visibility half-float targets.
 * - `shading.probes`: the bake's 192 × 32 float target with its depth
 *   renderbuffer, held while a bake runs, and the baked grid's float texture of
 *   nine texels per probe.
 * - A scene `medium`: the march's half-float target at the raster.
 *
 * Each target and depth texture is one runtime texture allocation, and a depth
 * renderbuffer adds only its bytes, as the feed targets count. Rows go to
 * `render-pass:film-*` owners, marked `runtime`. Without `settings` the raster,
 * and with it the pyramid's depth, is unknown, so both totals are null and a
 * `not-run` gap for each names the missing settings.
 *
 * @param props The subject, the target settings, and the row and gap sinks.
 * @returns The allocations and their bytes, or nulls without settings.
 */
export function measureAutoMovieRenderFilmTargets(
  props: measureAutoMovieRenderFilmTargets.IProps,
): measureAutoMovieRenderFilmTargets.IResult {
  const film: IAutoMovieRenderSubject["film"] = props.subject.film;
  if (film === undefined) return { targets: 0, bytes: 0 };
  const settings: IAutoMovieRenderTargetSettings | undefined = props.settings;
  if (settings === undefined) {
    for (const metric of ["textures", "textureBytes"] as const)
      props.gaps.push({
        metric,
        status: "not-run",
        reason:
          "the film stage's targets are sized by the beauty pass's drawing buffer, and no target settings were supplied",
        remedy:
          "pass the render target settings whose width, height and pixel ratio the beauty pass draws at",
      });
    return { targets: null, bytes: null };
  }
  const width: number = Math.round(settings.width * settings.pixelRatio);
  const height: number = Math.round(settings.height * settings.pixelRatio);
  const area: number = width * height;
  const rows: measureAutoMovieRenderFilmTargets.IRow[] = [];

  // The response stage: the linear frame with its depth, the pyramid and the
  // kernel pairs, at the levels the glare plan blurs each kernel at.
  const levelSize: (at: number) => number = (at: number): number =>
    Math.max(1, Math.ceil(width / 2 ** at)) *
    Math.max(1, Math.ceil(height / 2 ** at));
  const levels: number[] = AUTOMOVIE_FILM_GLARE_KERNELS.map(
    (kernel: { sigma: number }): number =>
      Math.max(0, Math.floor(Math.log2((kernel.sigma * height) / 2))),
  );
  const deepest: number = Math.max(...levels);
  let pyramid: number = 0;
  for (let at: number = 1; at <= deepest; ++at) pyramid += levelSize(at) * HALF;
  const kernels: number = levels.reduce(
    (sum: number, at: number): number => sum + 2 * levelSize(at) * HALF,
    0,
  );
  rows.push({
    owner: "render-pass:film-response",
    source: "film.optics",
    targets: 2 + deepest + 2 * levels.length,
    bytes: area * (HALF + DEPTH) + pyramid + kernels,
  });

  if (film.optics.samples !== undefined)
    rows.push({
      owner: "render-pass:film-samples",
      source: "film.optics.samples",
      targets: 2,
      bytes: 2 * area * FLOAT,
    });
  const shading: IAutoMovieFilmShading | undefined = film.shading;
  if (shading?.occlusion !== undefined)
    rows.push({
      owner: "render-pass:film-occlusion",
      source: "film.shading.occlusion",
      targets: 4,
      bytes: area * (HALF + DEPTH + HALF + HALF),
    });
  if (shading?.probes !== undefined) {
    const probes: IAutoMovieFilmShading.IProbes = shading.probes;
    const count: number = (["x", "y", "z"] as const).reduce(
      (product: number, axis: "x" | "y" | "z"): number =>
        product *
        (Math.floor(
          (probes.max[axis] - probes.min[axis]) / probes.spacing + 1e-9,
        ) +
          1),
      1,
    );
    rows.push({
      owner: "render-pass:film-probes",
      source: "film.shading.probes",
      targets: 2,
      bytes: 6 * PROBE_FACE * PROBE_FACE * (FLOAT + DEPTH) + 9 * count * FLOAT,
    });
  }
  if ((props.subject.scene.medium ?? null) !== null)
    rows.push({
      owner: "render-pass:film-medium",
      source: "scene.medium",
      targets: 1,
      bytes: area * HALF,
    });

  for (const entry of rows) {
    props.add(entry.owner, entry.source, "textures", entry.targets, "runtime");
    props.add(
      entry.owner,
      entry.source,
      "textureBytes",
      entry.bytes,
      "runtime",
    );
  }
  return {
    targets: rows.reduce(
      (sum: number, entry: measureAutoMovieRenderFilmTargets.IRow): number =>
        sum + entry.targets,
      0,
    ),
    bytes: rows.reduce(
      (sum: number, entry: measureAutoMovieRenderFilmTargets.IRow): number =>
        sum + entry.bytes,
      0,
    ),
  };
}

/** What the film target phase reads and returns. */
export namespace measureAutoMovieRenderFilmTargets {
  /** The subject, the raster and the sinks. */
  export interface IProps {
    /** The measured subject; only `film` and `scene.medium` are read. */
    subject: IAutoMovieRenderSubject;

    /** The target settings whose drawing buffer the beauty pass draws into. */
    settings?: IAutoMovieRenderTargetSettings;

    /** Appends one owner row. */
    add: IAutoMovieMeasureRenderSimulation.IProps["add"];

    /** Receives the gaps when the raster is unknown. */
    gaps: IAutoMovieRenderAnalysisGap[];
  }

  /** One stage's allocations. */
  export interface IRow {
    /** The `render-pass:film-*` owner. */
    owner: string;

    /** The setting that makes the stage allocate. */
    source: string;

    /** Texture allocations. */
    targets: number;

    /** Their bytes at the raster. */
    bytes: number;
  }

  /** The film stage's totals. */
  export interface IResult {
    /** Texture allocations, or null when no settings give the raster. */
    targets: number | null;

    /** Their bytes, or null when no settings give the raster. */
    bytes: number | null;
  }
}
