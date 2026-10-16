import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { IAutoMovieSweepTransport } from "./IAutoMovieSweepTransport";
import { checkAutoMovieSweepFeature } from "./checkAutoMovieSweepFeature";
import { compileAutoMovieSweepFeature } from "./compileAutoMovieSweepFeature";
import { compileAutoMovieSweepProfile } from "./compileAutoMovieSweepProfile";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";
import { loadAutoMovieSweepSpine } from "./loadAutoMovieSweepSpine";
import { orientAutoMovieSweep } from "./orientAutoMovieSweep";
import { parameterizeAutoMovieSweepSection } from "./parameterizeAutoMovieSweepSection";
import { pathAutoMovieSweepTransport } from "./pathAutoMovieSweepTransport";
import { sampleAutoMovieSweepSection } from "./sampleAutoMovieSweepSection";

/** Directions each section is sampled in; the radius between two is linear in angle. */
const DIRECTIONS: number = 512;

/** Cached rows of guided radii before the cache is cleared. */
const CACHE_LIMIT: number = 8192;

/** Parameter step of the central differences for normals and derivatives. */
const STEP: number = 1e-4;

/**
 * Compile a sweep into an evaluable surface.
 *
 * Under direction correspondence, the default, each station's section is
 * sampled at 512 directions by `sampleAutoMovieSweepSection`. For each
 * direction the radii of the stations form a profile along `u`, interpolated
 * by `interpolateAutoMovieSpline`, a C2 spline under tension, so curvature is
 * continuous at interior stations, with its sampled overshoot policy;
 * queried non-positive radii are refused. Before the
 * first or after the last station it holds that station's radius.
 *
 * Under parameter correspondence each loop of each station, the section and
 * then its holes, is sampled at the same parameters of
 * `parameterizeAutoMovieSweepSection`: a polygon at its corners, any other
 * curve at 512 even parameters. Each sample's two coordinates are interpolated
 * along `u` by the same spline and joined linearly round the loop,
 * so corner `k` of every station meets corner `k` of the next, as a loft
 * between corresponding polygons blends them. Guides and features read radii
 * by direction and are refused here; the scale profile applies to every loop.
 *
 * Guides make the radius field a Gordon surface (Gordon 1969, "Spline-blended
 * surface interpolation through curve networks", J. Math. Mech. 18(10)): the
 * Boolean sum `P + G - T` of the profile interpolant `P` (the stations, along
 * `u`), the guide interpolant `G` (the guides, round the turn) and their
 * tensor interpolant `T` (the profile interpolant read at the guide
 * directions, round the turn). Both directions use the spline, round
 * the turn its periodic form over the guide directions. At a guide's
 * direction `G - T` is the guide's radius less the profile's, so the surface
 * passes through every guide at every `u` on the sampled angular grid;
 * non-grid guide directions are reconstructed linearly from that grid. Where a guide disagrees
 * with a station at the station's `u`, the network is incompatible and the
 * guide wins, so the station's section is moved by the guides' disagreement
 * interpolated round the turn; a single guide moves the whole section by its
 * one difference. Rows are cached by `u`.
 *
 * Features next: each feature curve is the smooth curve through its points
 * that `compileAutoMovieSweepFeature` builds, and at a query point the radius
 * moves by the feature's residual at the course point found by its
 * dense-seeded local search in the cylindrical metric approximation, the declared radius less the guided radius there or
 * the declared offset, times `(1 - (d / width)^2)^3` within `width`. The
 * surface therefore follows each feature curve to the search's accuracy where no
 * other feature's band overlaps it, and the band has no crease along it.
 *
 * A scale profile, where the sweep gives one, multiplies the result last,
 * features included, so it resizes the section as shaped; `profile` reads the
 * radius before it and `scale` the profile's factor. Posing relies on this
 * order: it changes only the scale, so the shape before it is pose-invariant.
 *
 * The section plane at `u` is the spine's rotation-minimizing frame, or under
 * the `fixed` orientation the start frame's axes at the spine point (a
 * translational sweep), turned by the stations' rotations: each station's
 * rotation relative to that frame at its `at` is interpolated by normalized linear quaternion interpolation
 * between stations, as sweep-based deformation interpolates key-ellipse
 * orientations (Hyun et al. 2005, The Visual Computer 21(8-10):542-550), and held
 * beyond the end stations; `loadAutoMovieSweepSpine` and `orientAutoMovieSweep`
 * compute both.
 *
 * @param sweep The sweep, only read and retained by the returned surface.
 * @returns The compiled surface.
 * @throws Error when the spine is refused by `frameAutoMovieSweepSpine`, a section by `sampleAutoMovieSweepSection`, a station, guide or feature is out of range, unordered or not finite, or two guides share a direction; and, when a row is first evaluated, when a profile, guide, feature or scale query is non-positive or not finite.
 *
 * @evidence contracts/common.md#principled-implementation Per-direction interpolation of key-section radii by a C2 spline under tension keeps curvature continuous through the stations with the scalar spline's sampled overshoot policy; queried non-positive radius and scale values are refused; guides form a sampled Gordon correction of the station profiles and guide curves in radius, exact at grid-aligned guide directions with linear angular reconstruction elsewhere; features target smooth curves, applied as a compactly supported C2 bump of the residual in the local cylindrical metric approximation; orientations follow the nlerp of key-section rotations from the sweep-based deformation literature. Limitation: overlapping feature bands add, so neither passes exactly through its curve there.
 * @evidence contracts/common.md#clear-and-simple-design One compile owns the four layers in their fixed order; section evaluation, spine transport and orientation are delegated to their own modules, the last two shared with posed sweeps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid stations, guides and features are refused rather than reordered or clamped, and nothing is tuned for a particular caller.
 * @evidence contracts/common.md#meaningful-documentation States each layer's rule and guarantee, the Gordon construction and how incompatible guides are resolved, the feature metric and kernel, the frame rule and its source, the overlap limitation and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For S stations, G guides, F feature segments and D = 512 directions: compile is O(S D) section sampling plus D interpolants and each feature's O(n log n) seeds and O(n) per value-spline tension trial; a new row costs O(D (log S + log G)); a point query costs O(1) on a cached row plus O(F) for features whose band reaches its `u`, with each feature's course compiled and unwrapped once, scalar profile queries allocate nothing when every needed guided row is cached, while point and frame queries return small records.
 * @evidence contracts/performance.md#reuse-equivalent-work The mean station radius is computed once for all feature compiles without a flattened copy. Guided rows are cached by exact `u`, because sampling a grid queries every row at many `v`; a row depends only on the immutable compiled stations and guides, so the cache never invalidates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The surface retains the station radii (S D numbers), the D interpolants, O(16 F) feature seeds and coefficients, the spine's transport tables and at most 8,192 cached rows of D numbers, cleared when full; everything is released with the surface.
 */
export const compileAutoMovieSweep: (
  sweep: IAutoMovieSweep,
) => IAutoMovieSweepSurface = (
  sweep: IAutoMovieSweep,
): IAutoMovieSweepSurface => {
  const transport: IAutoMovieSweepTransport = loadAutoMovieSweepSpine(
    sweep.spine,
    true,
  );
  const path: IAutoMovieSweepPath = pathAutoMovieSweepTransport(transport);
  const stations: IAutoMovieSweep.IStation[] = sweep.stations;
  if (stations.length === 0)
    throw new Error("sweep needs at least one station");
  stations.forEach((s: IAutoMovieSweep.IStation, k: number): void => {
    if (!Number.isFinite(s.at) || s.at < 0 || s.at > 1)
      throw new Error(
        `sweep station ${k} must lie on the spine, at from 0 to 1`,
      );
    if (k > 0 && !(s.at > stations[k - 1]!.at))
      throw new Error(`sweep station ${k} does not follow station ${k - 1}`);
  });
  const knots: number[] = stations.map(
    (s: IAutoMovieSweep.IStation): number => s.at,
  );
  const byParameter: boolean = sweep.correspondence === "parameter";
  const holes: number = stations[0]!.holes?.length ?? 0;
  stations.forEach((s: IAutoMovieSweep.IStation, k: number): void => {
    if ((s.holes?.length ?? 0) !== holes)
      throw new Error(
        `sweep station ${k} must declare the same ${holes} holes as station 0`,
      );
  });
  if (!byParameter && holes > 0)
    throw new Error("sweep holes need parameter correspondence");
  if (
    byParameter &&
    ((sweep.guides?.length ?? 0) > 0 || (sweep.features?.length ?? 0) > 0)
  )
    throw new Error("sweep guides and features need direction correspondence");
  const loops: ICompiledLoop[] = byParameter
    ? Array.from(
        { length: 1 + holes },
        (_: unknown, l: number): ICompiledLoop =>
          compileLoop(
            stations.map(
              (s: IAutoMovieSweep.IStation): IAutoMovieSweepSection =>
                l === 0 ? s.section : s.holes![l - 1]!,
            ),
            knots,
            l,
          ),
      )
    : [];
  const radii: number[][] = byParameter
    ? []
    : stations.map((s: IAutoMovieSweep.IStation): number[] =>
        sampleAutoMovieSweepSection({ section: s.section, count: DIRECTIONS }),
      );
  const profiles: Array<(u: number) => number> = byParameter
    ? []
    : Array.from(
        { length: DIRECTIONS },
        (_: unknown, d: number): ((u: number) => number) =>
          interpolateAutoMovieSpline({
            knots,
            values: radii.map((r: number[]): number => r[d]!),
          }),
      );
  const guides: ICompiledGuide[] = (sweep.guides ?? [])
    .map(compileGuide)
    .sort((a: ICompiledGuide, b: ICompiledGuide): number => a.angle - b.angle);
  guides.forEach((g: ICompiledGuide, k: number): void => {
    if (k > 0 && g.angle === guides[k - 1]!.angle)
      throw new Error("sweep guides must have distinct directions");
  });
  const scale: ((u: number) => number) | null =
    sweep.scale === undefined
      ? null
      : compileAutoMovieSweepProfile(sweep.scale, "sweep scale");
  (sweep.features ?? []).forEach(checkAutoMovieSweepFeature);
  const featureRadius: number =
    (sweep.features?.length ?? 0) === 0
      ? 0
      : radii.reduce(
          (sum: number, row: number[]): number =>
            row.reduce(
              (total: number, radius: number): number => total + radius,
              sum,
            ),
          0,
        ) / Math.max(1, radii.length * DIRECTIONS);
  const features: ReturnType<typeof compileAutoMovieSweepFeature>[] = (
    sweep.features ?? []
  ).map(
    (
      f: IAutoMovieSweep.IFeature,
    ): ReturnType<typeof compileAutoMovieSweepFeature> =>
      compileAutoMovieSweepFeature(f, {
        length: path.length,
        // the sweep's mean station radius, which spaces a feature's knots in metres
        radius: featureRadius,
      }),
  );

  const cache: Map<number, Float64Array> = new Map();
  function row(input: number): Float64Array {
    const u: number = Math.min(1, Math.max(0, input));
    const cached: Float64Array | undefined = cache.get(u);
    if (cached !== undefined) return cached;
    const base: Float64Array = new Float64Array(DIRECTIONS);
    for (let d: number = 0; d < DIRECTIONS; ++d) base[d] = profiles[d]!(u);
    const out: Float64Array =
      guides.length === 0 ? base : guide(base, guides, u);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(u, out);
    return out;
  }
  function guided(u: number, angle: number): number {
    const r: Float64Array = row(u);
    const x: number = ((((angle / (2 * Math.PI)) % 1) + 1) % 1) * DIRECTIONS;
    const d: number = Math.floor(x) % DIRECTIONS;
    const t: number = x - Math.floor(x);
    const value: number = r[d]! * (1 - t) + r[(d + 1) % DIRECTIONS]! * t;
    if (!(value > 0) || !Number.isFinite(value))
      throw new Error(`sweep profile is not positive and finite at u ${u}`);
    return value;
  }
  function directional(u: number, v: number): number {
    const angle: number = 2 * Math.PI * v;
    const own: number = guided(u, angle);
    let r: number = own;
    for (const feature of features)
      r += feature.displacement(u, angle, own, path.length, guided);
    if (!(r > 0) || !Number.isFinite(r))
      throw new Error(
        `featured sweep is not positive and finite at u ${u}, v ${v}`,
      );
    return r;
  }
  function scaleAt(input: number): number {
    return scale === null ? 1 : scale(Math.min(1, Math.max(0, input)));
  }
  // the loop point before the scale profile
  function shaped(
    u: number,
    v: number,
    loop: number,
  ): IAutoMovieSweepSection.IPoint {
    if (!byParameter) {
      if (loop !== 0) throw new Error("a sweep by direction has one loop");
      const r: number = directional(u, v);
      const angle: number = 2 * Math.PI * v;
      return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
    }
    const compiled: ICompiledLoop | undefined = loops[loop];
    if (compiled === undefined) throw new Error(`sweep has no loop ${loop}`);
    return compiled.point(u, v);
  }
  function section(
    input: number,
    v: number,
    loop: number = 0,
  ): IAutoMovieSweepSection.IPoint {
    const u: number = Math.min(1, Math.max(0, input));
    const p: IAutoMovieSweepSection.IPoint = shaped(u, v, loop);
    const k: number = scaleAt(u);
    const x: number = p.x * k;
    const y: number = p.y * k;
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error("scaled sweep section is not finite");
    return { x, y };
  }
  function profile(input: number, v: number): number {
    const u: number = Math.min(1, Math.max(0, input));
    if (!byParameter) return directional(u, v);
    const p: IAutoMovieSweepSection.IPoint = shaped(u, v, 0);
    return Math.hypot(p.x, p.y);
  }
  function radius(u: number, v: number): number {
    const value: number = scaleAt(u) * profile(u, v);
    if (!(value > 0) || !Number.isFinite(value))
      throw new Error("scaled sweep radius is not positive and finite");
    return value;
  }

  // each station's plane, turned relative to the carried frame by the orientation kernel
  const orientation: IAutoMovieSweepOrientation = orientAutoMovieSweep({
    transport,
    knots: Float64Array.from(knots),
    fixed: sweep.orientation === "fixed",
  });
  stations.forEach((s: IAutoMovieSweep.IStation, k: number): void => {
    if (s.rotation === undefined) return;
    const q: IAutoMovieQuaternion = s.rotation;
    if (
      ![q.x, q.y, q.z, q.w].every(Number.isFinite) ||
      Math.hypot(q.x, q.y, q.z, q.w) === 0
    )
      throw new Error(
        "sweep station rotation must be a finite non-zero quaternion",
      );
    orientation.given[k] = 1;
    orientation.rotations.set([q.x, q.y, q.z, q.w], 4 * k);
  });
  orientation.update();
  const scratch: Float64Array = new Float64Array(12);
  function vector(at: number): IAutoMovieVector3 {
    return {
      x: scratch[at]!,
      y: scratch[at + 1]!,
      z: scratch[at + 2]!,
    };
  }
  function frame(u: number): IAutoMovieSweepFrame {
    orientation.frame(u, scratch, 0);
    return { origin: vector(0), x: vector(3), y: vector(6), normal: vector(9) };
  }
  function point(u: number, v: number, loop: number = 0): IAutoMovieVector3 {
    const f: IAutoMovieSweepFrame = frame(u);
    const p: IAutoMovieSweepSection.IPoint = section(u, v, loop);
    return Vector3.add(
      f.origin,
      Vector3.add(Vector3.scale(f.x, p.x), Vector3.scale(f.y, p.y)),
    );
  }
  function along(u: number, v: number, loop: number = 0): IAutoMovieVector3 {
    const a: number = Math.max(0, u - STEP);
    const b: number = Math.min(1, u + STEP);
    return Vector3.scale(
      Vector3.subtract(point(b, v, loop), point(a, v, loop)),
      1 / (b - a),
    );
  }
  function normal(u: number, v: number, loop: number = 0): IAutoMovieVector3 {
    const around: IAutoMovieVector3 = Vector3.subtract(
      point(u, v + STEP, loop),
      point(u, v - STEP, loop),
    );
    return Vector3.normalize(Vector3.cross(around, along(u, v, loop)));
  }
  return {
    sweep,
    path,
    step: STEP,
    loops: byParameter ? loops.length : 1,
    feature: (index: number, t: number): { u: number; v: number } => {
      const feature:
        | ReturnType<typeof compileAutoMovieSweepFeature>
        | undefined = features[index];
      if (feature === undefined)
        throw new Error(`sweep has no feature ${index}`);
      return feature.point(t);
    },
    radius,
    profile,
    scale: scaleAt,
    section,
    frame,
    point,
    normal,
    along,
  };
};

/** One loop of a sweep by parameter: its point at any spine and loop parameter. */
interface ICompiledLoop {
  point: (u: number, v: number) => IAutoMovieSweepSection.IPoint;
}

/** Samples of a smooth section under parameter correspondence; a polygon is sampled at its corners. */
const PARAMETER_SAMPLES: number = 512;

/**
 * Compile one loop of a sweep by parameter: each station's curve sampled at the same parameters,
 * each sample's coordinates interpolated along the spine by the spline, linear between samples.
 */
function compileLoop(
  sections: IAutoMovieSweepSection[],
  knots: number[],
  loop: number,
): ICompiledLoop {
  const polygon: boolean = sections[0]!.type === "polygon";
  const count: number = polygon
    ? (sections[0] as IAutoMovieSweepSection.IPolygon).points.length
    : PARAMETER_SAMPLES;
  const samples: IAutoMovieSweepSection.IPoint[][] = sections.map(
    (
      section: IAutoMovieSweepSection,
      k: number,
    ): IAutoMovieSweepSection.IPoint[] => {
      if (section.type === "radial")
        throw new Error("radial sections need direction correspondence");
      if (
        (section.type === "polygon") !== polygon ||
        (polygon &&
          (section as IAutoMovieSweepSection.IPolygon).points.length !== count)
      )
        throw new Error(
          `sweep station ${k} loop ${loop} must be a polygon of ${count} corners like station 0, or a curve like it`,
        );
      const curve: ReturnType<typeof parameterizeAutoMovieSweepSection> =
        parameterizeAutoMovieSweepSection(section);
      return Array.from(
        { length: count },
        (_: unknown, j: number): IAutoMovieSweepSection.IPoint =>
          curve.point(j / count),
      );
    },
  );
  function axis(key: "x" | "y"): Array<(u: number) => number> {
    return Array.from(
      { length: count },
      (_: unknown, j: number): ((u: number) => number) =>
        interpolateAutoMovieSpline({
          knots,
          values: samples.map(
            (s: IAutoMovieSweepSection.IPoint[]): number => s[j]![key],
          ),
        }),
    );
  }
  const xs: Array<(u: number) => number> = axis("x");
  const ys: Array<(u: number) => number> = axis("y");
  return {
    point: (u: number, v: number): IAutoMovieSweepSection.IPoint => {
      const x: number = (v - Math.floor(v)) * count;
      const j: number = Math.min(count - 1, Math.floor(x));
      const t: number = x - j;
      const a: IAutoMovieSweepSection.IPoint = { x: xs[j]!(u), y: ys[j]!(u) };
      if (t === 0) return a;
      const l: number = (j + 1) % count;
      return { x: a.x + (xs[l]!(u) - a.x) * t, y: a.y + (ys[l]!(u) - a.y) * t };
    },
  };
}

/** A guide with its profile compiled. */
interface ICompiledGuide {
  /** Direction in radians within one turn from 0. */
  angle: number;
  /** Radius along the direction by `u`. */
  radius: (u: number) => number;
}

function compileGuide(
  g: IAutoMovieSweep.IGuide,
  index: number,
): ICompiledGuide {
  if (!Number.isFinite(g.angle))
    throw new Error(`sweep guide ${index} angle is not finite`);
  return {
    angle: ((g.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    radius: compileAutoMovieSweepProfile(g.radii, `sweep guide ${index}`),
  };
}

/**
 * Correct a row of section radii by the guides, the Gordon surface's guide term less its tensor term.
 *
 * The row is the profile interpolant at `u`. At each guide's direction the guide interpolant gives
 * the guide's radius and the tensor interpolant gives the row's own radius there, so the correction
 * is their difference at the guide directions, interpolated round the turn by the periodic spline
 * scheme over the guide directions.
 */
function guide(
  base: Float64Array,
  guides: ICompiledGuide[],
  u: number,
): Float64Array {
  const n: number = base.length;
  function at(angle: number): number {
    const x: number = (angle / (2 * Math.PI)) * n;
    const d: number = Math.floor(x) % n;
    const t: number = x - Math.floor(x);
    return base[d]! * (1 - t) + base[(d + 1) % n]! * t;
  }
  const correction: (angle: number) => number = interpolateAutoMovieSpline({
    knots: guides.map((g: ICompiledGuide): number => g.angle),
    values: guides.map(
      (g: ICompiledGuide): number => g.radius(u) - at(g.angle),
    ),
    period: 2 * Math.PI,
  });
  const out: Float64Array = new Float64Array(n);
  for (let d: number = 0; d < n; ++d) {
    out[d] = base[d]! + correction((2 * Math.PI * d) / n);
    if (!(out[d]! > 0))
      throw new Error(
        `sweep guides make the section's radius vanish at u = ${u}`,
      );
  }
  return out;
}
