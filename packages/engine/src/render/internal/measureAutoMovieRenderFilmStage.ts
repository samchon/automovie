import type {
  AutoMovieRenderMetric,
  IAutoMovieFilmShading,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";

import type { AutoMovieEngineRenderMeasureTypes } from "../AutoMovieEngineRenderMeasureTypes";

import { measureAutoMovieFilmResponseTargets } from "./measureAutoMovieFilmResponseTargets";

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
 * Scene renders one probe bake makes per probe: six faces of radiance and the
 * same six again with the back-face material.
 */
const PROBE_RENDERS: number = 12;

/**
 * Measure what a directly rendered film's stage adds to one frame: the GPU
 * targets render's film response, sample sum, indirect and medium stages
 * allocate at the beauty pass's drawing buffer, `width 횞 pixelRatio` by `height
 * 횞 pixelRatio` pixels (the draw host's is twice the delivered raster on each
 * side), and the further passes they draw.
 *
 * With `subject.film`, and nothing without it, one row pair per stage under a
 * `render-pass:film-*` owner:
 *
 * - Optics (`response`): the targets `measureAutoMovieFilmResponseTargets` counts
 *   at the raster, the linear frame with its depth texture and the glare
 *   pyramid and kernel pairs, made whether or not glare is asked for. Its
 *   passes are the final full-frame quad and, with a glare strength above zero,
 *   one quad into each glare target.
 * - `samples` S: two 32-bit float sum targets. The beauty pass is drawn S times
 *   instead of once, each with its shadow maps, so S ??1 more scene passes, and
 *   one accumulation quad per sample plus the average.
 * - `shading.occlusion`: the normal prepass's half-float target and its depth
 *   texture, and the raw and blurred visibility targets; per beauty sample one
 *   scene pass of the prepass, with its shadow maps, and two quads.
 * - `shading.probes`: the bake's 192 횞 32 float target with its depth
 *   renderbuffer and the grid's float texture of nine texels per probe; a frame
 *   that bakes draws twelve scene passes per probe. The layer's share of the
 *   scene is not known here, so each is bounded by the whole scene.
 * - A scene `medium`: the march's half-float target; two quads per sample.
 *
 * A scene pass is the opaque frame plus its shadow maps' depth passes, as the
 * feed passes count it, and a quad is one call of two triangles. Targets and
 * depth textures are runtime texture allocations, a depth renderbuffer adds
 * only bytes, and the passes are `pass` rows. Without `settings` the raster is
 * unknown: both texture totals are null with a `not-run` gap each, and so are
 * the draw and triangle totals when glare is asked for, since its pass count
 * follows from the raster's height.
 *
 * @param props The subject, the settings, the frame's opaque counts and shadow
 *   casters, and the row and gap sinks.
 * @returns What the stage adds to each total, null where it is unknown.
 */
export function measureAutoMovieRenderFilmStage(
  props: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IProps,
): AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IResult {
  const film: IAutoMovieRenderSubject["film"] = props.subject.film;
  if (film === undefined)
    return { targets: 0, bytes: 0, drawCalls: 0, triangles: 0 };
  const settings: IAutoMovieRenderTargetSettings | undefined = props.settings;
  const width: number =
    settings === undefined
      ? NaN
      : Math.round(settings.width * settings.pixelRatio);
  const height: number =
    settings === undefined
      ? NaN
      : Math.round(settings.height * settings.pixelRatio);
  const area: number = width * height;
  const scene: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IPass = props.casters.reduce(
    (
      sum: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IPass,
      caster: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.ICaster,
    ): AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IPass => ({
      draws:
        sum.draws + props.drawCalls * caster.depthFaces + caster.filterDraws,
      triangles:
        sum.triangles +
        props.triangles * caster.depthFaces +
        caster.filterDraws,
    }),
    { draws: props.drawCalls, triangles: props.triangles },
  );
  const passes: (
    scenes: number,
    quads: number,
  ) => AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IPass = (
    scenes: number,
    quads: number,
  ): AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IPass => ({
    draws: scenes * scene.draws + quads,
    triangles: scenes * scene.triangles + 2 * quads,
  });
  const samples: number = film.optics.samples ?? 1;
  const rows: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow[] = [];

  // The response stage. Glare draws one quad into each target beyond the
  // linear frame and its depth: a pyramid level or a kernel's blur pass.
  const response: ReturnType<typeof measureAutoMovieFilmResponseTargets> =
    measureAutoMovieFilmResponseTargets(width, height);
  const glare: boolean = (film.optics.glare?.strength ?? 0) > 0;
  rows.push({
    owner: "render-pass:film-response",
    source: "film.optics",
    targets: response.targets,
    bytes: response.bytes,
    passes: passes(0, 1 + (glare ? response.targets - 2 : 0)),
  });
  if (film.optics.samples !== undefined)
    rows.push({
      owner: "render-pass:film-samples",
      source: "film.optics.samples",
      targets: 2,
      bytes: 2 * area * FLOAT,
      passes: passes(samples - 1, samples + 1),
    });
  const shading: IAutoMovieFilmShading | undefined = film.shading;
  if (shading?.occlusion !== undefined)
    rows.push({
      owner: "render-pass:film-occlusion",
      source: "film.shading.occlusion",
      targets: 4,
      bytes: area * (HALF + DEPTH + HALF + HALF),
      passes: passes(samples, 2 * samples),
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
      passes: passes(PROBE_RENDERS * count, 0),
    });
  }
  if ((props.subject.scene.medium ?? null) !== null)
    rows.push({
      owner: "render-pass:film-medium",
      source: "scene.medium",
      targets: 1,
      bytes: area * HALF,
      passes: passes(0, 2 * samples),
    });

  // Rows for what is known, gaps for what the missing raster leaves unknown.
  const sized: boolean = settings !== undefined;
  const counted: boolean = sized || !glare;
  const write: (
    entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind: "runtime" | "pass",
  ) => void = (
    entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow,
    metric: AutoMovieRenderMetric,
    cost: number,
    kind: "runtime" | "pass",
  ): void => {
    if (cost !== 0) props.add(entry.owner, entry.source, metric, cost, kind);
  };
  for (const entry of rows) {
    if (sized) {
      write(entry, "textures", entry.targets, "runtime");
      write(entry, "textureBytes", entry.bytes, "runtime");
    }
    if (counted) {
      write(entry, "drawCalls", entry.passes.draws, "pass");
      write(entry, "triangles", entry.passes.triangles, "pass");
    }
  }
  const unknown: AutoMovieRenderMetric[] = [
    ...(sized ? [] : (["textures", "textureBytes"] as const)),
    ...(counted ? [] : (["drawCalls", "triangles"] as const)),
  ];
  for (const metric of unknown)
    props.gaps.push({
      metric,
      status: "not-run",
      reason:
        "the film stage's targets and glare passes are sized by the beauty pass's drawing buffer, and no target settings were supplied",
      remedy:
        "pass the render target settings whose width, height and pixel ratio the beauty pass draws at",
    });
  const sum: (
    read: (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow) => number,
  ) => number = (
    read: (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow) => number,
  ): number =>
    rows.reduce(
      (total: number, entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow): number =>
        total + read(entry),
      0,
    );
  return {
    targets: sized
      ? sum(
          (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow): number =>
            entry.targets,
        )
      : null,
    bytes: sized
      ? sum(
          (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow): number => entry.bytes,
        )
      : null,
    drawCalls: counted
      ? sum(
          (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow): number =>
            entry.passes.draws,
        )
      : null,
    triangles: counted
      ? sum(
          (entry: AutoMovieEngineRenderMeasureTypes.measureAutoMovieRenderFilmStage.IRow): number =>
            entry.passes.triangles,
        )
      : null,
  };
}
