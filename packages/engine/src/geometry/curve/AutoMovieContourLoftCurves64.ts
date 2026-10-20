import { AutoMovieBernstein64 as B } from "./AutoMovieBernstein64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourSlit64 as Slit } from "./AutoMovieContourSlit64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

/** Local vector aliases preserve the engine's complete binary64 arithmetic. */
const add: typeof M.add = M.add,
  sub: typeof M.sub = M.sub,
  mul: typeof M.scale = M.scale;
/** Three-dimensional projection helpers in one common physical chart. */
/** Stable private binding preserves internal call ownership across the public facade. */
const closestPoint: typeof Slit.closest = Slit.closest;
const dist: (a: M.V, b: M.V) => number = (a: M.V, b: M.V): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Curve sampling and oriented slit construction for a generic closed-section loft.
 * The input cubic coefficients remain authoritative; emitted polygons are downstream tessellation.
 *
 * @evidence contracts/common.md#principled-implementation Physical arclength correspondence and exact Bernstein subdivision compose the contour-loft helper operations.
 * @evidence contracts/common.md#clear-and-simple-design One stateless namespace groups only the curve operations needed by contour lofting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Human or reference-source dependency enters the engine.
 * @evidence contracts/common.md#meaningful-documentation Member comments state physical units, sampling and slit behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace computes nothing; members state their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace owns no memoization table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No state survives a helper call.
 */
export namespace AutoMovieContourLoftCurves64 {
  /**
   * A closed polygon's physical arclength chart, in millimetres.
   *
   * @evidence contracts/common.md#principled-implementation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/common.md#clear-and-simple-design Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/common.md#meaningful-documentation States physical point units and parameter meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime storage belongs to the caller.
   */
  export interface Curve {
    /** Ordered closed polygon samples in millimetres; the caller keeps them stable during evaluation. */
    points: M.V[];

    /** Chord-length prefixes, including zero and the closing edge's final total. */
    cumulative: number[];

    /** Complete closed chord length in millimetres. */
    length: number;
  }

  /**
   * Builds the cyclic arclength chart without rescaling any physical coordinate.
   *
   * @evidence contracts/common.md#principled-implementation Cyclic chord accumulation preserves a closed polygon in its supplied millimetre frame.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms One linear pass over N points uses N+1 cumulative values.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function curve(points: M.V[]): Curve {
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
   * @evidence contracts/common.md#principled-implementation Binary search selects one cyclic arclength interval and interpolates its two endpoints.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms The interval search is O(log N) with constant-size vector output.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function at(c: Curve, phase: number): M.V {
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
   * @evidence contracts/common.md#principled-implementation Equal normalized arclength phases call the same polygon evaluator.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms M samples require O(M log N) interval queries and O(M) output vectors.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function sample(c: Curve, count: number, offset: number = 0): M.V[] {
    return Array.from(
      { length: count },
      (_: unknown, i: number): M.V => at(c, i / count + offset),
    );
  }

  /**
   * Returns the arithmetic centre of the supplied samples in their common frame.
   *
   * @evidence contracts/common.md#principled-implementation Component sums divided by the supplied sample count define their arithmetic centre.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms One O(N) traversal creates only a three-component accumulator.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function centroid(points: M.V[]): M.V {
    const sum: M.V = points.reduce(
      (a: M.V, p: M.V): M.V => add(a, p),
      [0, 0, 0],
    );
    return mul(sum, 1 / points.length);
  }

  /** Original join operation owned by the continuous contour slit helper. */
  export const join: typeof Slit.join = Slit.join;

  /**
   * An evaluated curve point and its inherited source phase, distinct from a control.
   *
   * @evidence contracts/common.md#principled-implementation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/common.md#clear-and-simple-design Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/common.md#meaningful-documentation States physical point units and parameter meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime storage belongs to the caller.
   */
  export interface Knot {
    /** Evaluated point in millimetres, distinct from an authored control. */
    p: M.V;

    /** Inherited parameter in the primitive's declared phase chart. */
    phase: number;

    /** Retained outgoing positive-orientation source restriction; absent for an unsupported diagnostic knot. */
    leaf?: Leaf;
  }

  /**
   * An exact algebraic Bernstein restriction before binary64 rounding.
   *
   * @evidence contracts/common.md#principled-implementation An immutable original span and recorded half path, or a materialized child net, preserve the generating restriction independently of its display chord.
   * @evidence contracts/common.md#clear-and-simple-design One leaf is shared by initial sampling and interaction-driven refinement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This record is not a fitted control table or a source mesh witness.
   * @evidence contracts/common.md#meaningful-documentation Fields state source orientation, inherited phase and arithmetic scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns source-restriction reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The invocation owns the descriptor and any materialized copy; the caller keeps referenced original controls immutable.
   */
  export interface Leaf {
    /** Materialized positive source restriction; absent until needed for a compact half-path leaf. */
    net?: M.V[];
    /** Immutable original cubic authority for lazy materialization. */
    original?: C.Span;
    /** Binary left/right half path from the original span, with length depth. */
    path?: number;
    /** Inherited source phase of its first control. */
    start: number;
    /** Inherited source phase of its last control, before any constant-interval quotient. */
    end: number;
    /** Subdivision depth; a compact original half path has exactly this many bits. */
    depth: number;
  }

  /**
   * Materialize a compact source leaf through its original De Casteljau half path.
   *
   * @evidence contracts/common.md#principled-implementation Original controls and the exact recorded left/right half path reproduce the restriction's subdivision arithmetic; an explicitly supplied child net is reused.
   * @evidence contracts/common.md#clear-and-simple-design All leaf consumers resolve one coefficient authority through this accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled fit, source mesh or new coefficient definition replaces the saved cubic.
   * @evidence contracts/common.md#meaningful-documentation States lazy ownership and the retained arithmetic path.
   * @evidence contracts/performance.md#efficient-algorithms A previously unmaterialized leaf takes O(depth) constant-degree splits, with depth at most thirty for original sampling.
   * @evidence contracts/performance.md#reuse-equivalent-work Contacted leaves cache their resolved net; ordinary leaves retain only the original span reference and half-path metadata.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only contacted leaf nets remain materialized in the invocation; immutable caller controls are never mutated.
   */
  export function controls(leaf: Leaf): M.V[] {
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
    let net: M.V[] = leaf.original.map((p: C.Vector): M.V => M.clone(p));
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
   * @evidence contracts/common.md#principled-implementation Exact De Casteljau children retain their source phases and controls; nonconstant zero-chord restrictions split even under a coarse physical tolerance.
   * @evidence contracts/common.md#clear-and-simple-design Initial tessellation and later geometric interaction refinement use the same adaptive owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No minimum population, changed tolerance, fitted child or positional snap supplies a restriction.
   * @evidence contracts/common.md#meaningful-documentation Separates exact-restriction ancestry from additional adaptive work; compressed half-path addresses retain their thirty-level representation limit.
   * @evidence contracts/performance.md#efficient-algorithms Constant-degree tests visit K retained leaves. Adaptive half subdivision stops at depth thirty; deeper explicit restrictions can only be retained when their current physical bound already passes.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each restriction is evaluated once by this recursive partition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned child nets transfer to the caller; recursive scratch expires on return.
   */
  export function partition(leaf: Leaf, toleranceMm: number): Leaf[] {
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
    const result: Leaf[] = [];
    const visit: (current: Leaf) => void = (current: Leaf): void => {
      const p: M.V[] = controls(current);
      const error: number = Math.max(
        closestPoint(p[1], p[0], p[3]).distance,
        closestPoint(p[2], p[0], p[3]).distance,
      );
      const constant: boolean = p.every((q: M.V): boolean =>
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
      const halves: [B.Poly, B.Poly] = S.split(p, 0.5);
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
   * @evidence contracts/common.md#principled-implementation A nonzero chord and a nonzero cross product establish affine rank at least two under binary64 arithmetic; nonfinite arithmetic rejects rather than certifies a rank.
   * @evidence contracts/common.md#clear-and-simple-design One linear rank check is shared by cubic boundary representation and downstream tile admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate merge, distance epsilon or sample population floor establishes area.
   * @evidence contracts/common.md#meaningful-documentation States affine-rank meaning and numerical scope; this does not establish simple-curve embedding or nonzero signed area.
   * @evidence contracts/performance.md#efficient-algorithms Two linear scans use constant extra vector storage for N points.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure per-boundary query retains no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes; vector scratch expires on return.
   */
  export function hasArea(points: readonly M.V[]): boolean {
    if (points.length < 3) return false;
    const origin: M.V = points[0];
    const endpoint: M.V | undefined = points.find((p: M.V): boolean =>
      p.some((x: number, k: number): boolean => x !== origin[k]),
    );
    if (endpoint === undefined) return false;
    const axis: M.V = sub(endpoint, origin);
    return points.some((p: M.V): boolean => {
      const q: M.V = sub(p, origin);
      const normal: M.V = [
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
   * @evidence contracts/common.md#principled-implementation C0-closed coefficients are split by Bernstein subdivision until control-hull chord error meets tolerance. Exact constant leaf intervals are quotiented from the cyclic trace; a wholly constant source retains one diagnostic knot. A nonconstant zero-chord leaf must split; a rank-one closed graph is refined at a source leaf carrying omitted transverse extent. Collinear sources remain rank deficient for local diagnostics.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact source subdivision supplies every new knot with its inherited phase. No minimum sampling density, tolerance change, artificial point, coordinate weld or source coefficient change repairs a collapsed cyclic polygon.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms Each cubic subproblem has constant degree; K retained leaves use O(K) storage and at most 30 recursive levels. R topology refinements inspect O(RK) leaf data and use the same adaptive chord test on exact children.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function tessellate(primitive: C.Cubic, toleranceMm: number): Knot[] {
    assertAutoMovieCurve64(primitive);
    if (!primitive.closed || !Number.isFinite(toleranceMm) || toleranceMm <= 0)
      throw new Error(
        "Closed cubic and positive physical chord tolerance required",
      );
    if (
      primitive.spans.some((span: C.Span, i: number): boolean =>
        span[3].some(
          (x: number, k: number): boolean =>
            x !== primitive.spans[(i + 1) % primitive.spans.length][0][k],
        ),
      )
    )
      throw new Error(
        "A closed contour requires exact C0-connected source spans",
      );
    let leaves: Leaf[] = [];
    let phase: number = 0;
    primitive.spans.forEach((span: C.Span, i: number): void => {
      const width: number = primitive.phaseIntervals[i]!;
      for (const leaf of partition(
        {
          net: span.map((p: C.Vector): M.V => M.clone(p)),
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
      (leaf: Leaf): boolean =>
        !controls(leaf).every((p: M.V): boolean =>
          p.every(
            (x: number, k: number): boolean => x === controls(leaf)[0][k],
          ),
        ),
    );
    leaves = moving.length ? moving : leaves.slice(0, 1);
    while (!hasArea(leaves.map((leaf: Leaf): M.V => controls(leaf)[0]))) {
      const origin: M.V = controls(leaves[0])[0];
      const endpoint: M.V | undefined = leaves
        .map((leaf: Leaf): M.V => controls(leaf)[0])
        .find((p: M.V): boolean =>
          p.some((x: number, k: number): boolean => x !== origin[k]),
        );
      const axis: M.V | undefined =
        endpoint === undefined ? undefined : sub(endpoint, origin);
      const at: number = leaves.findIndex((leaf: Leaf): boolean =>
        controls(leaf).some((p: M.V): boolean => {
          if (axis === undefined)
            return p.some((x: number, k: number): boolean => x !== origin[k]);
          const q: M.V = sub(p, origin);
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
      const halves: [B.Poly, B.Poly] = S.split(controls(leaf), 0.5);
      const replacement: Leaf[] = [
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
      (leaf: Leaf): Knot => ({
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
   * @evidence contracts/common.md#principled-implementation The farthest sampled-boundary point from its arclength centre avoids an ambiguous doubled branch slit.
   * @evidence contracts/common.md#clear-and-simple-design This helper owns the named curve operation and composes only the shared vector and Bernstein owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.
   * @evidence contracts/common.md#meaningful-documentation States the curve chart, boundary meaning or degeneracy relevant to this operation.
   * @evidence contracts/performance.md#efficient-algorithms Sixty-four logarithmic arclength queries and one O(N) scan choose the seam.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure local curve operation owns no cross-request cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local scratch expires on return; only the declared result transfers to the caller.
   */
  export function exterior(points: M.V[]): M.V[] {
    const centre: M.V = centroid(sample(curve(points), 64));
    let offset: number = 0,
      farthest: number = -Infinity;
    points.forEach((p: M.V, i: number): void => {
      const d: number = dist(p, centre);
      if (d > farthest) {
        farthest = d;
        offset = i;
      }
    });
    return [...points.slice(offset), ...points.slice(0, offset)];
  }
}
