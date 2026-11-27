import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieContourLoftCurves64,
  IAutoMovieCubicBezierCurve64,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourSlit64 as Slit } from "./AutoMovieContourSlit64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { assertAutoMovieCurve64 } from "./curve/internal/assertAutoMovieCurve64";

/*
 * Local vector aliases preserve the engine's complete binary64 arithmetic.
 */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/*
 * Three-dimensional projection helpers in one common physical chart.
 */
/*
 * Stable private binding preserves internal call ownership across the public
 * facade.
 */
const closestPoint: typeof Slit.closest = Slit.closest;
const dist: (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Curve sampling and oriented slit construction for a generic closed-section
 * loft. The input cubic coefficients remain authoritative; emitted polygons are
 * downstream tessellation.
 */
export namespace AutoMovieContourLoftCurves64 {
  /**
   * Builds the cyclic arclength chart without rescaling any physical
   * coordinate.
   */
  export function curve(
    points: AutoMovieVector3Tuple[],
  ): IAutoMovieContourLoftCurves64.Curve {
    const cumulative: number[] = [0];
    for (let i: number = 0; i < points.length; i++)
      cumulative.push(
        cumulative[i] + dist(points[i], points[(i + 1) % points.length]),
      );
    return { points, cumulative, length: cumulative[cumulative.length - 1] };
  }

  /** Evaluates one periodic, normalized arclength phase on a closed polygon. */
  export function at(
    c: IAutoMovieContourLoftCurves64.Curve,
    phase: number,
  ): AutoMovieVector3Tuple {
    const target: number = (((phase % 1) + 1) % 1) * c.length;
    let lo: number = 0,
      hi: number = c.points.length;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (c.cumulative[mid] <= target) lo = mid;
      else hi = mid;
    }
    const width: number = c.cumulative[lo + 1] - c.cumulative[lo];
    const t: number = width > 0 ? (target - c.cumulative[lo]) / width : 0;
    return add(
      c.points[lo],
      mul(sub(c.points[(lo + 1) % c.points.length], c.points[lo]), t),
    );
  }

  /**
   * Samples equal physical arclengths for geometric correspondence, not curve
   * fitting.
   */
  export function sample(
    c: IAutoMovieContourLoftCurves64.Curve,
    count: number,
    offset: number = 0,
  ): AutoMovieVector3Tuple[] {
    return Array.from(
      { length: count },
      (_: unknown, i: number): AutoMovieVector3Tuple =>
        at(c, i / count + offset),
    );
  }

  /**
   * Returns the arithmetic centre of the supplied samples in their common
   * frame.
   */
  export function centroid(
    points: AutoMovieVector3Tuple[],
  ): AutoMovieVector3Tuple {
    const sum: AutoMovieVector3Tuple = points.reduce(
      (
        a: AutoMovieVector3Tuple,
        p: AutoMovieVector3Tuple,
      ): AutoMovieVector3Tuple => add(a, p),
      [0, 0, 0],
    );
    return mul(sum, 1 / points.length);
  }

  /** Original join operation owned by the continuous contour slit helper. */
  export const join: typeof Slit.join = Slit.join;

  /**
   * Materialize a compact source leaf through its original De Casteljau half
   * path.
   */
  export function controls(
    leaf: IAutoMovieContourLoftCurves64.Leaf,
  ): AutoMovieVector3Tuple[] {
    if (leaf.net !== undefined) return leaf.net;
    if (
      leaf.original === undefined ||
      leaf.path === undefined ||
      leaf.path < 0 ||
      leaf.path >= 2 ** leaf.depth ||
      leaf.depth < 0 ||
      leaf.depth > 30
    )
      throw new Error("Source leaf lacks its generating restriction");
    const path: number = leaf.path;
    let net: AutoMovieVector3Tuple[] = leaf.original.map(
      (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => M.clone(p),
    );
    for (let level: number = leaf.depth - 1; level >= 0; level--)
      net = S.split(net, 0.5)[Math.floor(path / 2 ** level) % 2];
    leaf.net = net;
    return net;
  }

  /**
   * Partition one source restriction under the unchanged physical chord
   * condition. Exact restrictions of an already qualified explicit net may
   * carry deeper ancestry without requiring another adaptive half subdivision.
   * The thirty-level limit still refuses additional adaptive work, not an
   * already satisfied bound.
   */
  export function partition(
    leaf: IAutoMovieContourLoftCurves64.Leaf,
    toleranceMm: number,
  ): IAutoMovieContourLoftCurves64.Leaf[] {
    if (
      !(toleranceMm > 0) ||
      !(leaf.end > leaf.start) ||
      leaf.depth < 0 ||
      (leaf.depth > 30 && leaf.original !== undefined)
    )
      throw new Error(
        "A finite increasing source restriction and positive chord tolerance are required",
      );
    if (
      leaf.original !== undefined &&
      (leaf.path === undefined || leaf.path < 0 || leaf.path >= 2 ** leaf.depth)
    )
      throw new Error("Source half-path metadata is unresolved");
    const result: IAutoMovieContourLoftCurves64.Leaf[] = [];
    const visit: (current: IAutoMovieContourLoftCurves64.Leaf) => void = (
      current: IAutoMovieContourLoftCurves64.Leaf,
    ): void => {
      const p: AutoMovieVector3Tuple[] = controls(current);
      const error: number = Math.max(
        closestPoint(p[1], p[0], p[3]).distance,
        closestPoint(p[2], p[0], p[3]).distance,
      );
      const constant: boolean = p.every((q: AutoMovieVector3Tuple): boolean =>
        q.every((x: number, k: number): boolean => x === p[0][k]),
      );
      if (error <= toleranceMm && (dist(p[0], p[3]) > 0 || constant)) {
        result.push(current);
        return;
      }
      if (current.depth >= 30)
        throw new Error("Cubic tessellation reached numeric subdivision limit");
      const mid: number = (current.start + current.end) / 2;
      if (!(mid > current.start && mid < current.end))
        throw new Error("Cubic subdivision phase is unresolved");
      const halves: [
        AutoMovieBernsteinPolynomial64,
        AutoMovieBernsteinPolynomial64,
      ] = S.split(p, 0.5);
      visit({
        net: halves[0],
        start: current.start,
        end: mid,
        depth: current.depth + 1,
        ...(current.original === undefined
          ? {}
          : { original: current.original, path: current.path! * 2 }),
      });
      visit({
        net: halves[1],
        start: mid,
        end: current.end,
        depth: current.depth + 1,
        ...(current.original === undefined
          ? {}
          : { original: current.original, path: current.path! * 2 + 1 }),
      });
    };
    visit(leaf);
    return result;
  }

  /** Original closest operation owned by the continuous contour slit helper. */
  export const closest: typeof Slit.closest = Slit.closest;

  /**
   * Whether physical samples span an affine plane rather than one line or
   * point.
   */
  export function hasArea(points: readonly AutoMovieVector3Tuple[]): boolean {
    if (points.length < 3) return false;
    const origin: AutoMovieVector3Tuple = points[0];
    const endpoint: AutoMovieVector3Tuple | undefined = points.find(
      (p: AutoMovieVector3Tuple): boolean =>
        p.some((x: number, k: number): boolean => x !== origin[k]),
    );
    if (endpoint === undefined) return false;
    const axis: AutoMovieVector3Tuple = sub(endpoint, origin);
    return points.some((p: AutoMovieVector3Tuple): boolean => {
      const q: AutoMovieVector3Tuple = sub(p, origin);
      const normal: AutoMovieVector3Tuple = [
        axis[1] * q[2] - axis[2] * q[1],
        axis[2] * q[0] - axis[0] * q[2],
        axis[0] * q[1] - axis[1] * q[0],
      ];
      return normal.some((x: number): boolean => x !== 0);
    });
  }

  /**
   * De Casteljau subdivision bounds chord error and retains a two-dimensional
   * closed boundary.
   */
  export function tessellate(
    primitive: IAutoMovieCubicBezierCurve64,
    toleranceMm: number,
  ): IAutoMovieContourLoftCurves64.Knot[] {
    assertAutoMovieCurve64(primitive);
    if (!primitive.closed || toleranceMm <= 0)
      throw new Error(
        "Closed cubic and positive physical chord tolerance required",
      );
    if (
      primitive.spans.some(
        (span: AutoMovieCubicBezierControls3, i: number): boolean =>
          span[3].some(
            (x: number, k: number): boolean =>
              x !== primitive.spans[(i + 1) % primitive.spans.length][0][k],
          ),
      )
    )
      throw new Error(
        "A closed contour requires exact C0-connected source spans",
      );
    let leaves: IAutoMovieContourLoftCurves64.Leaf[] = [];
    let phase: number = 0;
    primitive.spans.forEach(
      (span: AutoMovieCubicBezierControls3, i: number): void => {
        const width: number = primitive.phaseIntervals[i]!;
        for (const leaf of partition(
          {
            net: span.map(
              (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple =>
                M.clone(p),
            ),
            original: span,
            path: 0,
            start: phase,
            end: phase + width,
            depth: 0,
          },
          toleranceMm,
        ))
          leaves.push(leaf);
        phase += width;
      },
    );
    const moving: typeof leaves = leaves.filter(
      (leaf: IAutoMovieContourLoftCurves64.Leaf): boolean =>
        !controls(leaf).every((p: AutoMovieVector3Tuple): boolean =>
          p.every(
            (x: number, k: number): boolean => x === controls(leaf)[0][k],
          ),
        ),
    );
    leaves = moving.length ? moving : leaves.slice(0, 1);
    while (
      !hasArea(
        leaves.map(
          (leaf: IAutoMovieContourLoftCurves64.Leaf): AutoMovieVector3Tuple =>
            controls(leaf)[0],
        ),
      )
    ) {
      const origin: AutoMovieVector3Tuple = controls(leaves[0])[0];
      const endpoint: AutoMovieVector3Tuple | undefined = leaves
        .map(
          (leaf: IAutoMovieContourLoftCurves64.Leaf): AutoMovieVector3Tuple =>
            controls(leaf)[0],
        )
        .find((p: AutoMovieVector3Tuple): boolean =>
          p.some((x: number, k: number): boolean => x !== origin[k]),
        );
      const axis: AutoMovieVector3Tuple | undefined =
        endpoint === undefined ? undefined : sub(endpoint, origin);
      const at: number = leaves.findIndex(
        (leaf: IAutoMovieContourLoftCurves64.Leaf): boolean =>
          controls(leaf).some((p: AutoMovieVector3Tuple): boolean => {
            if (axis === undefined)
              return p.some((x: number, k: number): boolean => x !== origin[k]);
            const q: AutoMovieVector3Tuple = sub(p, origin);
            return [
              axis[1] * q[2] - axis[2] * q[1],
              axis[2] * q[0] - axis[0] * q[2],
              axis[0] * q[1] - axis[1] * q[0],
            ].some((x: number): boolean => x !== 0);
          }),
      );
      if (at < 0) break; // The source control hull itself has no transverse extent.
      const leaf: (typeof leaves)[number] = leaves[at];
      const mid: number = (leaf.start + leaf.end) / 2;
      if (leaf.depth >= 30 || !(mid > leaf.start && mid < leaf.end))
        throw new Error(
          "Closed boundary representation reached numeric subdivision limit",
        );
      const halves: [
        AutoMovieBernsteinPolynomial64,
        AutoMovieBernsteinPolynomial64,
      ] = S.split(controls(leaf), 0.5);
      const replacement: IAutoMovieContourLoftCurves64.Leaf[] = [
        ...partition(
          {
            net: halves[0],
            start: leaf.start,
            end: mid,
            depth: leaf.depth + 1,
            ...(leaf.original === undefined
              ? {}
              : { original: leaf.original, path: leaf.path! * 2 }),
          },
          toleranceMm,
        ),
        ...partition(
          {
            net: halves[1],
            start: mid,
            end: leaf.end,
            depth: leaf.depth + 1,
            ...(leaf.original === undefined
              ? {}
              : { original: leaf.original, path: leaf.path! * 2 + 1 }),
          },
          toleranceMm,
        ),
      ];
      leaves = [
        ...leaves.slice(0, at),
        ...replacement,
        ...leaves.slice(at + 1),
      ];
    }
    return leaves.map(
      (
        leaf: IAutoMovieContourLoftCurves64.Leaf,
      ): IAutoMovieContourLoftCurves64.Knot => ({
        p: M.clone(controls(leaf)[0]),
        phase: leaf.start,
        leaf:
          leaf.original === undefined
            ? leaf
            : {
                original: leaf.original,
                path: leaf.path,
                start: leaf.start,
                end: leaf.end,
                depth: leaf.depth,
              },
      }),
    );
  }

  /** Start away from duplicated branch slits, whose nearest seam has two sheets. */
  export function exterior(
    points: AutoMovieVector3Tuple[],
  ): AutoMovieVector3Tuple[] {
    const centre: AutoMovieVector3Tuple = centroid(sample(curve(points), 64));
    let offset: number = 0,
      farthest: number = -Infinity;
    points.forEach((p: AutoMovieVector3Tuple, i: number): void => {
      const d: number = dist(p, centre);
      if (d > farthest) {
        farthest = d;
        offset = i;
      }
    });
    return [...points.slice(offset), ...points.slice(0, offset)];
  }
}
