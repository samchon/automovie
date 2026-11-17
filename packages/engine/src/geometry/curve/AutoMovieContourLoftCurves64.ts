import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieContourLoftCurves64,
  IAutoMovieCurve64,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourSlit64 as Slit } from "./AutoMovieContourSlit64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/** Local vector aliases preserve the engine's complete binary64 arithmetic. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/** Three-dimensional projection helpers in one common physical chart. */
/** Stable private binding preserves internal call ownership across the public facade. */
const closestPoint: typeof Slit.closest = Slit.closest;
const dist: (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Curve sampling and oriented slit construction for a generic closed-section loft.
 * The input cubic coefficients remain authoritative; emitted polygons are downstream tessellation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Member comments state physical units, sampling and slit behavior.
 * @evidence contracts/development/design.md#principled-representation Represents Curve sampling and oriented slit construction for a generic closed-section loft: companion namespace of 14 members (`Curve`, `curve`, `at`, `sample`, `centroid`, `join`, ...); units and frames named in its text: frame, local, degree. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieContourLoftCurves64` in packages/engine/src/geometry/curve/AutoMovieContourLoftCurves64.ts; its surface is the 14 members listed and the text shows 11 other files naming it, mostly packages/engine (9), packages/recovery (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieContourLoftCurves64 {
  /**
   * Builds the cyclic arclength chart without rescaling any physical coordinate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Cyclic chord accumulation preserves a closed polygon in its supplied millimetre frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One linear pass over N points uses N+1 cumulative values.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
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

  /**
   * Evaluates one periodic, normalized arclength phase on a closed polygon.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Binary search selects one cyclic arclength interval and interpolates its two endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms The interval search is O(log N) with constant-size vector output.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
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
   * Samples equal physical arclengths for geometric correspondence, not curve fitting.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Equal normalized arclength phases call the same polygon evaluator.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms M samples require O(M log N) interval queries and O(M) output vectors.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
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
   * Returns the arithmetic centre of the supplied samples in their common frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Component sums divided by the supplied sample count define their arithmetic centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(N) traversal creates only a three-component accumulator.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
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
   * Materialize a compact source leaf through its original De Casteljau half path.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Original controls and the exact recorded left/right half path reproduce the restriction's subdivision arithmetic; an explicitly supplied child net is reused.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure All leaf consumers resolve one coefficient authority through this accessor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled fit, source mesh or new coefficient definition replaces the saved cubic.
   * @evidence contracts/development/common.md#meaningful-documentation States lazy ownership and the retained arithmetic path.
   * @evidence contracts/development/implementation.md#efficient-algorithms A previously unmaterialized leaf takes O(depth) constant-degree splits, with depth at most thirty for original sampling.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Contacted leaves cache their resolved net; ordinary leaves retain only the original span reference and half-path metadata.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only contacted leaf nets remain materialized in the invocation; immutable caller controls are never mutated.
   */
  export function controls(
    leaf: IAutoMovieContourLoftCurves64.Leaf,
  ): AutoMovieVector3Tuple[] {
    if (leaf.net !== undefined) return leaf.net;
    if (
      leaf.original === undefined ||
      leaf.path === undefined ||
      !Number.isSafeInteger(leaf.path) ||
      leaf.path < 0 ||
      leaf.path >= 2 ** leaf.depth ||
      !Number.isInteger(leaf.depth) ||
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
   * Partition one source restriction under the unchanged physical chord condition.
   * Exact restrictions of an already qualified explicit net may carry deeper
   * ancestry without requiring another adaptive half subdivision. The thirty-level
   * limit still refuses additional adaptive work, not an already satisfied bound.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact De Casteljau children retain their source phases and controls; nonconstant zero-chord restrictions split even under a coarse physical tolerance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Initial tessellation and later geometric interaction refinement use the same adaptive owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No minimum population, changed tolerance, fitted child or positional snap supplies a restriction.
   * @evidence contracts/development/common.md#meaningful-documentation Separates exact-restriction ancestry from additional adaptive work; compressed half-path addresses retain their thirty-level representation limit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-degree tests visit K retained leaves. Adaptive half subdivision stops at depth thirty; deeper explicit restrictions can only be retained when their current physical bound already passes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each restriction is evaluated once by this recursive partition.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned child nets transfer to the caller; recursive scratch expires on return.
   */
  export function partition(
    leaf: IAutoMovieContourLoftCurves64.Leaf,
    toleranceMm: number,
  ): IAutoMovieContourLoftCurves64.Leaf[] {
    if (
      !(toleranceMm > 0 && Number.isFinite(toleranceMm)) ||
      !(
        Number.isFinite(leaf.start) &&
        Number.isFinite(leaf.end) &&
        leaf.end > leaf.start
      ) ||
      !Number.isSafeInteger(leaf.depth) ||
      leaf.depth < 0 ||
      (leaf.depth > 30 && leaf.original !== undefined)
    )
      throw new Error(
        "A finite increasing source restriction and positive chord tolerance are required",
      );
    if (
      leaf.original !== undefined &&
      (leaf.path === undefined ||
        !Number.isSafeInteger(leaf.path) ||
        leaf.path < 0 ||
        leaf.path >= 2 ** leaf.depth)
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
   * Whether physical samples span an affine plane rather than one line or point.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A nonzero chord and a nonzero cross product establish affine rank at least two under binary64 arithmetic; nonfinite arithmetic rejects rather than certifies a rank.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One linear rank check is shared by cubic boundary representation and downstream tile admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate merge, distance epsilon or sample population floor establishes area.
   * @evidence contracts/development/common.md#meaningful-documentation States affine-rank meaning and numerical scope; this does not establish simple-curve embedding or nonzero signed area.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two linear scans use constant extra vector storage for N points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure per-boundary query retains no cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a boolean escapes; vector scratch expires on return.
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
      if (!normal.every(Number.isFinite))
        throw new Error("Unresolved boundary affine rank");
      return normal.some((x: number): boolean => x !== 0);
    });
  }

  /**
   * De Casteljau subdivision bounds chord error and retains a two-dimensional closed boundary.
   *
   * @evidence contracts/development/implementation.md#principled-implementation C0-closed coefficients are split by Bernstein subdivision until control-hull chord error meets tolerance. Exact constant leaf intervals are quotiented from the cyclic trace; a wholly constant source retains one diagnostic knot. A nonconstant zero-chord leaf must split; a rank-one closed graph is refined at a source leaf carrying omitted transverse extent. Collinear sources remain rank deficient for local diagnostics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact source subdivision supplies every new knot with its inherited phase. No minimum sampling density, tolerance change, artificial point, coordinate weld or source coefficient change repairs a collapsed cyclic polygon.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each cubic subproblem has constant degree; K retained leaves use O(K) storage and at most 30 recursive levels. R topology refinements inspect O(RK) leaf data and use the same adaptive chord test on exact children.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function tessellate(
    primitive: IAutoMovieCurve64.Cubic,
    toleranceMm: number,
  ): IAutoMovieContourLoftCurves64.Knot[] {
    assertAutoMovieCurve64(primitive);
    if (!primitive.closed || !Number.isFinite(toleranceMm) || toleranceMm <= 0)
      throw new Error(
        "Closed cubic and positive physical chord tolerance required",
      );
    if (
      primitive.spans.some((span: IAutoMovieCurve64.Span, i: number): boolean =>
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
    primitive.spans.forEach((span: IAutoMovieCurve64.Span, i: number): void => {
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
    });
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

  /**
   * Start away from duplicated branch slits, whose nearest seam has two sheets.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The farthest sampled-boundary point from its arclength centre avoids an ambiguous doubled branch slit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/development/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixty-four logarithmic arclength queries and one O(N) scan choose the seam.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
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
