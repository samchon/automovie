import type { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyStrip } from "./AutoMovieHumanBodyStrip";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Root loops on a chain's chart and the transition strips that join an
 * appendage to them.
 *
 * A root loop is a closed curve `(s(u), t(u))` in a base chain's chart. The
 * base is lofted with every cell touching the loop's inside left out; the
 * hole's edge of grid vertices and the loop itself are joined by a zipper,
 * so the base surface runs up to the loop. Between the loop and the
 * appendage's end ring runs the strip of `AutoMovieHumanBodyStrip`, which
 * meets both with their positions, tangent planes and curvatures (G2);
 * this module samples it in rings and zips its base edge to the hole.
 */
export namespace AutoMovieHumanBodyRoots {
  /** Chart point and derivative of a root loop at loop parameter u. */
  export function point(
    root: readonly number[],
    u: number,
  ): [number, number, number, number] {
    return AutoMovieHumanSplineCurve.evaluate(root, root.length / 2, u);
  }

  /** The loop sampled at n uniform parameters, `[s, t]` per sample. */
  export function polygon(
    root: readonly number[],
    n: number,
  ): [number, number][] {
    return Array.from({ length: n }, (_: unknown, i: number): [number, number] => {
      const p: [number, number, number, number] = point(
        root,
        (2 * Math.PI * i) / n,
      );
      return [p[0], p[1]];
    });
  }

  /**
   * Whether a chart point lies inside a loop polygon. The point's phase is
   * taken on the branch nearest the loop's mean phase.
   */
  export function inside(
    loop: readonly [number, number][],
    s: number,
    t: number,
  ): boolean {
    const centre: number =
      loop.reduce((sum: number, p: [number, number]): number => sum + p[1], 0) /
      loop.length;
    const phase: number =
      t + 2 * Math.PI * Math.round((centre - t) / (2 * Math.PI));
    let crossings: boolean = false;
    for (let i: number = 0, j: number = loop.length - 1; i < loop.length; j = i++) {
      const a: [number, number] = loop[i]!;
      const b: [number, number] = loop[j]!;
      if (
        a[0] > s !== b[0] > s &&
        phase < ((b[1] - a[1]) * (s - a[0])) / (b[0] - a[0]) + a[1]
      )
        crossings = !crossings;
    }
    return crossings;
  }

  /**
   * Join an appendage to its base: the strip from the appendage's end ring
   * to the root loop, and the zipper from the loop to the base's hole.
   *
   * @param mesh Mesh buffers to grow.
   * @param coordinates Loft coordinates to grow, `[chain, station, phase]`
   *   per new vertex.
   * @param base Base chain.
   * @param baseIndex Index of the base chain in the calibration.
   * @param appendage Appendage chain.
   * @param root Root description.
   * @param ring The appendage's end ring vertices, in phase order.
   * @param phases Phase of each end ring vertex.
   * @param hole The base's hole edge, a closed vertex loop of grid vertices.
   * @param holeCharts Chart point `[s, t]` of each hole vertex.
   */
  export function join(
    mesh: AutoMovieHumanLoftMesh.IContext,
    coordinates: number[],
    base: IAutoMovieHumanLoftChain,
    baseIndex: number,
    appendage: IAutoMovieHumanLoftChain,
    root: IAutoMovieHumanBodyCalibration.IAppendage,
    ring: readonly number[],
    phases: readonly number[],
    hole: readonly number[],
    holeCharts: readonly [number, number][],
  ): void {
    // The loop's turning sense in the (phase, station) plane: the outward
    // normal is its tangent turned clockwise for a counter-clockwise loop.
    const sense: number =
      polygonArea(
        AutoMovieHumanBodyRoots.polygon(root.root, 64).map(
          (p: [number, number]): [number, number] => [p[1], p[0]],
        ),
      ) >= 0
        ? 1
        : -1;

    // Columns: the strip's control rows at each end ring vertex's phase,
    // and the loop's chart point there.
    const columns: V[][] = phases.map((u: number): V[] =>
      AutoMovieHumanBodyStrip.controls(base, appendage, root, u, sense),
    );
    const charts: [number, number][] = phases.map((u: number): [number, number] => {
      const p: [number, number, number, number] = point(root.root, u);
      return [p[0], p[1]];
    });

    // Rings of the strip from the appendage (w = 0, its own end ring) to
    // the base (w = 1).
    const rings: number[][] = [[...ring]];
    for (let k: number = 1; k <= STEPS; k++) {
      const points: V[] = columns.map((c: V[]): V =>
        AutoMovieHumanBodyStrip.point(c, k / STEPS),
      );
      const vertices: number[] = AutoMovieHumanLoftMesh.vertices(mesh, points);
      for (const [s, t] of charts)
        if (k === STEPS) coordinates.push(baseIndex, s, wrap(t));
        else coordinates.push(NaN, NaN, NaN);
      rings.push(vertices);
    }
    const reference: V = normal(base, charts[0]![0], charts[0]![1]);
    for (let k: number = 0; k < STEPS; k++)
      oriented(mesh, reference, (): void =>
        AutoMovieHumanLoftMesh.band(mesh, rings[k]!, rings[k + 1]!),
      );

    // The base's hole edge to the loop.
    oriented(mesh, reference, (): void =>
      seam(mesh, rings[STEPS]!, charts, hole, holeCharts),
    );
  }

  /** Rings of the strip between its edges, plus one. */
  const STEPS: number = 8;

  /**
   * Chart points of a chain whose surface points project along an
   * opening's forward axis onto each point of its projected outline: the
   * opening's trim loop on that chain. Each point solves the 2 by 2 system
   * of the projection by Newton's method from its neighbour's solution;
   * the first starts from the nearest forward-facing sample of the chain
   * within the margin's height range.
   *
   * @param chain Base chain.
   * @param outline Projected outline of the opening.
   * @param heights World height range of the opening's margin, mm.
   * @returns `[station, phase]` per outline point.
   */
  export function trim(
    chain: IAutoMovieHumanLoftChain,
    outline: AutoMovieHumanLoftAperture.IOutline,
    heights: [number, number],
  ): [number, number][] {
    const y0: number = chain.layers[0]!.y;
    const y1: number = chain.layers[chain.layers.length - 1]!.y;
    const project = (s: number, t: number): [number, number, number] => {
      const p: V = at(chain, s, t);
      return [dot(p, outline.lateral), dot(p, outline.up), dot(p, outline.forward)];
    };
    // Starting point: a coarse search over the margin's heights.
    const target0: [number, number] = outline.points[0]!;
    let guess: [number, number] = [(heights[0] + heights[1]) / 2, 0];
    let best: number = Infinity;
    for (let s: number = Math.max(y0, heights[0] - 8); s <= Math.min(y1, heights[1] + 8); s += 0.5)
      for (let i: number = 0; i < 512; i++) {
        const t: number = (2 * Math.PI * i) / 512;
        const [a, b, f] = project(s, t);
        // Forward-facing skin only: the opening's own side of the head.
        const d: number = Math.hypot(a - target0[0], b - target0[1]) - 1e-3 * f;
        if (d < best) {
          best = d;
          guess = [s, t];
        }
      }
    return outline.points.map((target: [number, number]): [number, number] => {
      let [s, t] = guess;
      for (let iteration: number = 0; iteration < 30; iteration++) {
        const [a, b] = project(s, t);
        const ra: number = a - target[0];
        const rb: number = b - target[1];
        if (Math.hypot(ra, rb) < 1e-4) break;
        const ps = project(s + 0.01, t);
        const pt = project(s, t + 1e-4);
        const j11: number = (ps[0] - a) / 0.01;
        const j21: number = (ps[1] - b) / 0.01;
        const j12: number = (pt[0] - a) / 1e-4;
        const j22: number = (pt[1] - b) / 1e-4;
        const det: number = j11 * j22 - j12 * j21;
        if (Math.abs(det) < 1e-12) break;
        let ds: number = (-ra * j22 + rb * j12) / det;
        let dt: number = (ra * j21 - rb * j11) / det;
        // Bound the step to a millimetre of skin.
        const length: number = Math.hypot(ds, dt * 50);
        if (length > 1) {
          ds /= length;
          dt /= length;
        }
        s = Math.min(y1, Math.max(y0, s + ds));
        t += dt;
      }
      guess = [s, t];
      return [s, t];
    });
  }

  /** {@link seam}, for openings. */
  export const zip = seam;

  /** {@link oriented}, for openings. */
  export const orient = oriented;

  /** Outward unit normal of a chain at a chart point. */
  export const outward = normal;

  /** Outward first and second derivatives of a chain across a loop, by arc length. */
  export const across = AutoMovieHumanBodyStrip.across;
}

const dot = (a: V, b: readonly number[]): number => a[0] * b[0]! + a[1] * b[1]! + a[2] * b[2]!;

type V = [number, number, number];

/** Station step of the numerical derivatives, mm. */
const H: number = 0.05;

const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Phase reduced to `[0, 2 pi)`. */
function wrap(t: number): number {
  const r: number = t % (2 * Math.PI);
  return r < 0 ? r + 2 * Math.PI : r;
}

/** Signed area of a closed polygon `[x, y]`, positive counter-clockwise. */
function polygonArea(loop: readonly [number, number][]): number {
  let a: number = 0;
  for (let i: number = 0; i < loop.length; i++) {
    const p: [number, number] = loop[i]!;
    const q: [number, number] = loop[(i + 1) % loop.length]!;
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

/** Surface point of a chain at a chart point, the station clamped into it. */
const at: (chain: IAutoMovieHumanLoftChain, s: number, t: number) => V =
  AutoMovieHumanBodyStrip.surface;

/** Unit outward surface normal of a chain at a chart point: away from its axis. */
function normal(chain: IAutoMovieHumanLoftChain, s: number, t: number): V {
  const ds: V = sub(at(chain, s + H, t), at(chain, s - H, t));
  const dt: V = sub(at(chain, s, t + 1e-3), at(chain, s, t - 1e-3));
  const n: V = [
    dt[1] * ds[2] - dt[2] * ds[1],
    dt[2] * ds[0] - dt[0] * ds[2],
    dt[0] * ds[1] - dt[1] * ds[0],
  ];
  const l: number = Math.hypot(...n) || 1;
  const p: V = at(chain, s, t);
  const y0: number = chain.layers[0]!.y;
  const y1: number = chain.layers[chain.layers.length - 1]!.y;
  const c: V = AutoMovieHumanLoftChain.axis(chain, Math.min(y1, Math.max(y0, s)));
  const sign: number = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1] + (p[2] - c[2]) * n[2] < 0 ? -1 : 1;
  return [(sign * n[0]) / l, (sign * n[1]) / l, (sign * n[2]) / l];
}

/**
 * Emit triangles, then reverse the new ones if their mean normal faces
 * away from the reference outward normal.
 */
function oriented(
  mesh: AutoMovieHumanLoftMesh.IContext,
  reference: V,
  emit: () => void,
): void {
  const start: number = mesh.indices.length;
  emit();
  let sum: number = 0;
  for (let i: number = start; i < mesh.indices.length; i += 3) {
    const a: V = AutoMovieHumanLoftMesh.position(mesh, mesh.indices[i]!);
    const b: V = AutoMovieHumanLoftMesh.position(mesh, mesh.indices[i + 1]!);
    const c: V = AutoMovieHumanLoftMesh.position(mesh, mesh.indices[i + 2]!);
    const u: V = sub(b, a);
    const v: V = sub(c, a);
    sum +=
      (u[1] * v[2] - u[2] * v[1]) * reference[0] +
      (u[2] * v[0] - u[0] * v[2]) * reference[1] +
      (u[0] * v[1] - u[1] * v[0]) * reference[2];
  }
  if (sum >= 0) return;
  for (let i: number = start; i < mesh.indices.length; i += 3) {
    const b: number = mesh.indices[i + 1]!;
    mesh.indices[i + 1] = mesh.indices[i + 2]!;
    mesh.indices[i + 2] = b;
  }
}

/**
 * Zipper between two closed vertex loops in one chart: the root loop and
 * the hole's edge round it. Both are put in the same orientation and
 * started at their nearest pair, then merged by the share of their chart
 * perimeter walked so far.
 */
function seam(
  mesh: AutoMovieHumanLoftMesh.IContext,
  inner: readonly number[],
  innerCharts: readonly [number, number][],
  outer: readonly number[],
  outerCharts: readonly [number, number][],
): void {
  // Phases of both loops on the branch of the inner loop's mean.
  const centre: number =
    innerCharts.reduce((a: number, p: [number, number]): number => a + p[1], 0) /
    innerCharts.length;
  const near = (p: [number, number]): [number, number] => [
    p[0],
    p[1] + 2 * Math.PI * Math.round((centre - p[1]) / (2 * Math.PI)),
  ];
  const I: [number, number][] = innerCharts.map(near);
  let O: [number, number][] = outerCharts.map(near);
  let outerVertices: number[] = [...outer];
  const area = (loop: [number, number][]): number =>
    loop.reduce((a: number, p: [number, number], i: number): number => {
      const q: [number, number] = loop[(i + 1) % loop.length]!;
      return a + (p[1] * q[0] - q[1] * p[0]);
    }, 0);
  if (Math.sign(area(I)) !== Math.sign(area(O))) {
    O = O.reverse();
    outerVertices = outerVertices.reverse();
  }
  // Start the outer loop at the vertex nearest the inner loop's first.
  let first: number = 0;
  let best: number = Infinity;
  O.forEach((p: [number, number], i: number): void => {
    const d: number = Math.hypot(p[0] - I[0]![0], p[1] - I[0]![1]);
    if (d < best) {
      best = d;
      first = i;
    }
  });
  O = [...O.slice(first), ...O.slice(0, first)];
  outerVertices = [...outerVertices.slice(first), ...outerVertices.slice(0, first)];
  const fractions = (loop: [number, number][]): number[] => {
    const lengths: number[] = loop.map((p: [number, number], i: number): number => {
      const q: [number, number] = loop[(i + 1) % loop.length]!;
      return Math.hypot(q[0] - p[0], q[1] - p[1]);
    });
    const total: number = lengths.reduce((a: number, b: number): number => a + b, 0) || 1;
    const out: number[] = [0];
    for (let i: number = 0; i < loop.length; i++) out.push(out[i]! + lengths[i]! / total);
    return out;
  };
  const fi: number[] = fractions(I);
  const fo: number[] = fractions(O);
  let i: number = 0;
  let j: number = 0;
  const n: number = I.length;
  const m: number = O.length;
  while (i < n || j < m) {
    const advanceInner: boolean = j >= m || (i < n && fi[i + 1]! <= fo[j + 1]!);
    if (advanceInner) {
      mesh.indices.push(inner[i % n]!, outerVertices[j % m]!, inner[(i + 1) % n]!);
      i++;
    } else {
      mesh.indices.push(inner[i % n]!, outerVertices[j % m]!, outerVertices[(j + 1) % m]!);
      j++;
    }
  }
}
