import type { AutoMovieSolidBlendChain, AutoMovieSolidIntersection, AutoMovieSolidJoin, AutoMovieSolidTrim, IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ConstructionShapes } from "./ConstructionShapes";

type V3 = [number, number, number];

/**
 * Checks of a realized construction against the properties its types
 * promise, each returning its findings (empty when it holds), so a spec
 * test proves each check red on made data and green on the realization.
 *
 * Every check reads the realization's own outputs (surfaces by name, the
 * joins' curves and rails, the trims' loops, the tessellated skin) against a
 * closed form of the analytic fixture (`ConstructionShapes`); none
 * recomputes the engine's formulas.
 */
export namespace ConstructionChecks {
  /** A straight axis's point and chart coordinates of a world point at a station. */
  export function chart(frame: ConstructionShapes.IFrame, s: number, p: V3): [number, number] {
    const w: V3 = cross(vec(frame.v), vec(frame.u));
    const o: V3 = add(vec(frame.origin), scale(w, s));
    const d: V3 = sub(p, o);
    return [dot(d, vec(frame.u)), dot(d, vec(frame.v))];
  }

  /**
   * The touch at the four guides of every knot station (`IAutoMovieConstructionView`):
   * the section's point at phase `g pi / 2` stands on its box's side, the
   * half extent along the guide's chart axis, and the section's phase
   * tangent there is square to the guide (zero angular slope).
   *
   * @param surface The part's realized surface, `u` its station and `v` its phase.
   * @param frame Its straight axis.
   * @param stations The knot stations to read.
   * @param half The closed form's half extents `[+u, +v, -u, -v]` at a station.
   * @param tol Largest miss, metres.
   */
  export function touch(
    surface: IAutoMovieSolidSurface,
    frame: ConstructionShapes.IFrame,
    stations: readonly number[],
    half: (s: number) => [number, number, number, number],
    tol: number,
  ): string[] {
    const out: string[] = [];
    for (const s of stations)
      for (let g: number = 0; g < 4; g++) {
        const e: number = half(s)[g]!;
        if (!(e > 0)) continue;
        const jet: IAutoMovieSolidSurface.IJet = surface.jet(s, (g * Math.PI) / 2);
        const [x, z]: [number, number] = chart(frame, s, jet.p);
        const want: [number, number] = [[e, 0], [0, e], [-e, 0], [0, -e]][g] as [number, number];
        const miss: number = Math.hypot(x - want[0], z - want[1]);
        if (!(miss <= tol)) out.push(`${surface.name} station ${s} guide ${g}: point (${x}, ${z}) is ${miss} m off the box side (${want.join(", ")})`);
        const ray: V3 = g % 2 === 0 ? scale(vec(frame.u), g === 0 ? 1 : -1) : scale(vec(frame.v), g === 1 ? 1 : -1);
        const slope: number = Math.abs(dot(jet.v, ray)) / norm(jet.v);
        if (!(slope <= tol / e)) out.push(`${surface.name} station ${s} guide ${g}: angular slope ${slope}, expected 0`);
      }
    return out;
  }

  /**
   * How far points stand from an ellipsoid of half axes `a`, `b`, `c` about
   * a frame, to first order in metres: `(r - 1) min(a, b, c)` with
   * `r = sqrt(x^2 / a^2 + z^2 / b^2 + s^2 / c^2)` in the frame's chart and
   * station, so a point on the surface reads 0.
   */
  export function ellipsoid(points: readonly V3[], frame: ConstructionShapes.IFrame, a: number, b: number, c: number): number {
    const w: V3 = cross(vec(frame.v), vec(frame.u));
    let worst: number = 0;
    for (const p of points) {
      const d: V3 = sub(p, vec(frame.origin));
      const r: number = Math.sqrt((dot(d, vec(frame.u)) / a) ** 2 + (dot(d, vec(frame.v)) / b) ** 2 + (dot(d, w) / c) ** 2);
      worst = Math.max(worst, Math.abs(r - 1) * Math.min(a, b, c));
    }
    return worst;
  }

  /**
   * The natural cubic spline's error bound on an ellipsoid's outline
   * `a sin(sigma)` in the pole parameter `sigma = acos(-s / c)`, metres:
   * `max_span h^4 max|f''''| / 384` with `f'''' = a sin`, at most `a`; the
   * natural end conditions hold exactly, since `f'' = -a sin` vanishes at
   * both poles.
   */
  export function poleSpline(a: number, c: number, stations: readonly number[]): number {
    let worst: number = 0;
    for (let i: number = 0; i + 1 < stations.length; i++) {
      const h: number = Math.acos(-stations[i + 1]! / c) - Math.acos(-stations[i]! / c);
      worst = Math.max(worst, h ** 4 / 384);
    }
    return a * worst;
  }

  /**
   * The periodic cubic spline's error bound on a section drawn through `n`
   * points at uniform phases, metres: `5 h^4 max|P''''| / 384` with
   * `h = 2 pi / n` and `|P''''|` at most the larger half extent for an
   * ellipse parameterised by its phase.
   */
  export function sectionSpline(extent: number, n: number): number {
    return (5 * (2 * Math.PI / n) ** 4 * extent) / 384;
  }

  /**
   * A join's rails at their declared chords: at each traced point the
   * part's and the host's rail points stand the declared chord from the
   * curve's point (`AutoMovieConstructionWidth`).
   */
  export function chords(join: AutoMovieSolidJoin.IJoin, part: (t: number) => number, host: (t: number) => number, tol: number): string[] {
    const out: string[] = [];
    for (const point of join.curve.points) {
      const rail: ReturnType<AutoMovieSolidJoin.IJoin["rail"]> = join.rail(point.t);
      if (rail === null) {
        const back: AutoMovieSolidIntersection.IPoint | null = join.curve.at(point.t);
        out.push(`no rail at t ${point.t} (the curve at t ${back === null ? "fails" : `is ${Math.hypot(back.point[0] - point.point[0], back.point[1] - point.point[1], back.point[2] - point.point[2])} mm from the traced point`})`);
        continue;
      }
      const dp: number = norm(sub(rail.partPoint, rail.curve.point));
      const dh: number = norm(sub(rail.hostPoint, rail.curve.point));
      if (!(Math.abs(dp - part(point.t)) <= tol)) out.push(`part chord ${dp} m at t ${point.t}, declared ${part(point.t)}`);
      if (!(Math.abs(dh - host(point.t)) <= tol)) out.push(`host chord ${dh} m at t ${point.t}, declared ${host(point.t)}`);
    }
    return out;
  }

  /**
   * A blend's G1 and G2 at both rails, at its columns (`AutoMovieConstructionContinuity`):
   * at column `k` the blend's station 0 meets the host at its rail's chart
   * point and its station `L` the part at its rail's; there the two normals
   * agree, and the normal curvature along the blend's station direction
   * agrees with the surface's along its cross direction past the rail (the
   * same normal plane, since the blend leaves each rail along that
   * direction), each read from the surfaces' exact jets.
   *
   * @param blend The published blend: its rails' chart points and cross directions.
   * @param surface The blend's surface, `u` its station from the host rail.
   * @param host The host's surface where the rail lies.
   * @param part The part's surface.
   * @param angle Largest normal angle, radians.
   * @param bend Largest normal-curvature jump, 1 per metre.
   */
  export function rails(
    blend: AutoMovieSolidBlendChain.IBlend,
    surface: IAutoMovieSolidSurface,
    host: IAutoMovieSolidSurface,
    part: IAutoMovieSolidSurface,
    angle: number,
    bend: number,
  ): string[] {
    const out: string[] = [];
    const count: number = blend.host.chart.length;
    for (let k: number = 0; k < count; k++) {
      const phase: number = (2 * Math.PI * k) / count;
      const across: [number, number] = blend.across[k]!;
      const partAcross: [number, number] = blend.partAcross[k]!;
      for (const [side, at, face, chart, d] of [
        ["host", 0, host, blend.host.chart[k]!, across],
        ["part", blend.length, part, blend.part.chart[k]!, partAcross],
      ] as [string, number, IAutoMovieSolidSurface, [number, number], [number, number]][]) {
        const b: IAutoMovieSolidSurface.IJet = surface.jet(at, phase);
        const s: IAutoMovieSolidSurface.IJet = face.jet(chart[0], chart[1]);
        const nb: V3 = unit(cross(b.u, b.v));
        const ns: V3 = unit(cross(s.u, s.v));
        const cosine: number = Math.min(1, Math.abs(dot(nb, ns)));
        const turn: number = Math.acos(cosine);
        if (!(turn <= angle)) out.push(`${side} rail column ${k}: normals ${turn} rad apart`);
        const first: V3 = add(scale(s.u, d[0]), scale(s.v, d[1]));
        const second: V3 = add(add(scale(s.uu, d[0] * d[0]), scale(s.uv, 2 * d[0] * d[1])), scale(s.vv, d[1] * d[1]));
        const sign: number = dot(nb, ns) < 0 ? -1 : 1;
        const kb: number = (sign * dot(b.uu, nb)) / dot(b.u, b.u);
        const ks: number = dot(second, ns) / dot(first, first);
        if (!(Math.abs(kb - ks) <= bend)) out.push(`${side} rail column ${k}: normal curvature ${kb} on the blend against ${ks} on the face`);
      }
    }
    return out;
  }

  /**
   * The chord a fold width declares at a curve parameter
   * (`IAutoMovieConstructionFoldWidth`): `radius tan(beta / 2)`, capped at
   * `cap`, `beta` the turn between the two surfaces' outward normals at the
   * curve's point there, each normal read from its surface's own jet at the
   * point's preimage and turned outward by the surface's orientation. Pass it
   * to {@link chords} as the expected width.
   */
  export function fold(join: AutoMovieSolidJoin.IJoin, part: IAutoMovieSolidSurface, host: IAutoMovieSolidSurface, radius: number, cap: number): (t: number) => number {
    return (t: number): number => {
      const point: ReturnType<AutoMovieSolidJoin.IJoin["curve"]["at"]> = join.curve.at(t);
      if (point === null) return NaN;
      const a: IAutoMovieSolidSurface.IJet = part.jet(point.s, point.phi);
      const b: IAutoMovieSolidSurface.IJet = host.jet(point.y, point.theta);
      const na: V3 = scale(unit(cross(a.u, a.v)), part.orientation);
      const nb: V3 = scale(unit(cross(b.u, b.v)), host.orientation);
      const beta: number = Math.acos(Math.max(-1, Math.min(1, dot(na, nb))));
      return Math.min(radius * Math.tan(beta / 2), cap);
    };
  }

  /**
   * A continuation's shared ring (`IAutoMovieConstructionContinuation`): at
   * `count` phases the part face's end section equals the host face's, and
   * its station derivatives are the host's signed into the part's station
   * direction, the first by `sign` and the second unchanged, so the skin is
   * C2 across the ring.
   *
   * @param sign 1 when one end is the host's top and the other the part's bottom (both stations run the same way), -1 when both are tops or both bottoms.
   */
  export function shared(
    host: IAutoMovieSolidSurface,
    hostStation: number,
    part: IAutoMovieSolidSurface,
    partStation: number,
    sign: 1 | -1,
    count: number,
    tol: number,
  ): string[] {
    const out: string[] = [];
    for (let k: number = 0; k < count; k++) {
      const phase: number = (2 * Math.PI * k) / count;
      const h: IAutoMovieSolidSurface.IJet = host.jet(hostStation, phase);
      const p: IAutoMovieSolidSurface.IJet = part.jet(partStation, phase);
      const gap: number = norm(sub(p.p, h.p));
      const slope: number = norm(sub(p.u, scale(h.u, sign)));
      const bend: number = norm(sub(p.uu, h.uu));
      if (!(gap <= tol && slope <= tol * norm(h.u) && bend <= tol * Math.max(1, norm(h.uu)))) out.push(`phase ${phase}: gap ${gap}, slope difference ${slope}, curvature difference ${bend}`);
    }
    return out;
  }

  /** Every point lying on both of two closed-form surfaces, each given as its signed distance: findings past `tol`. */
  export function onBoth(points: readonly V3[], a: (p: V3) => number, b: (p: V3) => number, tol: number): string[] {
    const out: string[] = [];
    points.forEach((p: V3, i: number): void => {
      const da: number = a(p);
      const db: number = b(p);
      if (!(Math.abs(da) <= tol && Math.abs(db) <= tol)) out.push(`curve point ${i} at ${p.join(", ")}: ${da} m and ${db} m off the two surfaces`);
    });
    return out;
  }

  /** Mesh vertices of named owners that stand inside a sphere by more than `tol`: the host left inside its cutter. */
  export function outside(mesh: { positions: number[]; coordinates: number[]; owners: string[] }, owners: ReadonlySet<string>, centre: IAutoMovieVector3, R: number, tol: number): string[] {
    const out: string[] = [];
    for (let v: number = 0; v < mesh.positions.length / 3; v++) {
      if (!owners.has(mesh.owners[mesh.coordinates[3 * v]!]!)) continue;
      const p: V3 = [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];
      const d: number = Math.hypot(p[0] - centre.x, p[1] - centre.y, p[2] - centre.z) - R;
      if (!(d >= -tol)) out.push(`vertex ${v} of ${mesh.owners[mesh.coordinates[3 * v]!]} stands ${-d} m inside the cutter`);
    }
    return out;
  }

  /** A trim's loop at its knots on its landmarks' feet: each `trim.at(2 pi m / M)` evaluated on the face against the landmark's foot. */
  export function feet(trim: AutoMovieSolidTrim.ITrim, surface: IAutoMovieSolidSurface, foot: (m: number) => V3, tol: number): string[] {
    const out: string[] = [];
    const M: number = trim.feet.length;
    for (let m: number = 0; m < M; m++) {
      const [u, v]: [number, number, number, number] = trim.at((2 * Math.PI * m) / M);
      const miss: number = norm(sub(surface.jet(u, v).p, foot(m)));
      if (!(miss <= tol)) out.push(`loop knot ${m} is ${miss} m from its landmark's foot (knot chart ${u}, ${v}; solved foot ${trim.feet[m]!.join(", ")})`);
    }
    return out;
  }

  /**
   * Two realized skins the same surface: every vertex of the first,
   * evaluated by its owner coordinates on the second's surface of the same
   * name, lands on its own position. `unit` turns a surface's point into the
   * skin's unit, 1/1000 for the kernel's millimetre surfaces against a skin
   * in metres.
   */
  export function same(
    first: { positions: number[]; coordinates: number[]; owners: string[] },
    second: ReadonlyMap<string, IAutoMovieSolidSurface>,
    tol: number,
    unit: number = 1,
  ): string[] {
    const out: string[] = [];
    for (let v: number = 0; v < first.positions.length / 3; v++) {
      const name: string = first.owners[first.coordinates[3 * v]!]!;
      const surface: IAutoMovieSolidSurface | undefined = second.get(name);
      if (surface === undefined) {
        out.push(`vertex ${v}: owner ${name} absent from the second realization`);
        continue;
      }
      const p: V3 = scale(surface.jet(first.coordinates[3 * v + 1]!, first.coordinates[3 * v + 2]!).p, unit);
      const miss: number = norm(sub(p, [first.positions[3 * v]!, first.positions[3 * v + 1]!, first.positions[3 * v + 2]!]));
      if (!(miss <= tol)) out.push(`vertex ${v} of ${name} is ${miss} m from the second realization's surface`);
    }
    return out;
  }

  /** Two numeric buffers equal entry for entry: the first index where they differ, or none. */
  export function identical(a: readonly number[], b: readonly number[]): string[] {
    if (a.length !== b.length) return [`lengths ${a.length} and ${b.length}`];
    for (let i: number = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return [`entry ${i}: ${a[i]} against ${b[i]}`];
    return [];
  }

  /** An interface vector as a tuple. */
  function vec(p: IAutoMovieVector3): V3 {
    return [p.x, p.y, p.z];
  }

  /** Sum of two vectors. */
  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Difference of two vectors. */
  function sub(a: readonly number[], b: readonly number[]): V3 {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** A vector scaled. */
  function scale(a: V3, k: number): V3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /** Dot product. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }

  /** Cross product. */
  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Euclidean length. */
  function norm(a: readonly number[]): number {
    return Math.hypot(a[0]!, a[1]!, a[2]!);
  }

  /** A vector scaled to unit length. */
  function unit(a: V3): V3 {
    return scale(a, 1 / norm(a));
  }
}
