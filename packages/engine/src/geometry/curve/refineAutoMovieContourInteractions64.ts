import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieContourLoftCurves64 as C } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

interface Ring {
  id: string;
  points: M.V[];
  winding: number;
}

/**
 * Refine interacting display chords from their retained Bernstein restrictions before slit ownership freezes.
 * A dominant-plane projection is used for the common planar section; exact dyadic orientation tests
 * detect intersections of the represented binary64 chords. Only a contacted curved source restriction
 * is split, retaining its original physical tolerance, parameter interval and existing endpoint identity.
 * A genuine linear contact or exhausted numeric subdivision remains explicit and keeps finite geometry.
 * This is not a certificate of source-curve simplicity, injectivity or exact floating-point subdivision.
 * Actual predicate/refinement counts are returned; elapsed time is measured only on explicit request.
 *
 * @evidence contracts/common.md#principled-implementation Contacted source restrictions undergo De Casteljau half subdivision and the original chord admission. One shared ring receives every new inherited-phase knot before any slit walk or surface is emitted. Exact dyadic signs apply to current chord coordinates; unresolved source contact is separately qualified.
 * @evidence contracts/common.md#clear-and-simple-design Ring ownership and registration are supplied by the contour loft; this operation owns only interaction-driven source restriction and its witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, positional weld, changed tolerance, coordinate correction or minimum segment population supplies geometry. Unresolved contact retains finite candidates with diagnostics instead of fabricating separation.
 * @evidence contracts/common.md#meaningful-documentation States projection, exact chord predicates, source restriction, preparation ordering and the limited geometric claim.
 * @evidence contracts/performance.md#efficient-algorithms R refinements of N and M current points use O(RNM) chord-pair visits plus adaptive child partition. Axis boxes reject disjoint pairs before dyadic predicates. The original thirty-level numeric limit bounds a source restriction; contact refinement can still expand many leaves and is not a constant-cost operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Encoded point coordinates are reused during this invocation. Existing point objects and source leaves survive refinement, and all adjacent slabs consume the same updated ring.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Point encodings and contact scratch are call-local; shared source knots transfer to the loft invocation and expire with it. Witness strings contain counts, source intervals and reasons rather than retained mesh buffers.
 */
export function refineAutoMovieContourInteractions64<R extends Ring>(
  rings: R[],
  selection: number[],
  leaf: (point: M.V) => C.Leaf | undefined,
  register: (ring: R, knot: C.Knot) => void,
  toleranceMm: number,
  observeWork: boolean = false,
): {
  qualified: boolean;
  diagnostics: string[];
  refinements: number;
  chordPairs: number;
  exactOrientationTests: number;
  elapsedMs: number | null;
} {
  const started: number | null = observeWork ? performance.now() : null;
  const diagnostics: string[] = [];
  let qualified: boolean = true;
  let refinements: number = 0,
    chordPairs: number = 0,
    exactOrientationTests: number = 0;
  if (selection.length < 2)
    return {
      qualified,
      diagnostics,
      refinements,
      chordPairs,
      exactOrientationTests,
      elapsedMs: started === null ? null : performance.now() - started,
    };
  const points: M.V[] = rings[selection[0]].points;
  const origin: M.V = points[0];
  const endpoint: M.V = points.find((p: M.V): boolean =>
    p.some((x: number, k: number): boolean => x !== origin[k]),
  )!;
  const axis: M.V = M.sub(endpoint, origin);
  let normal: M.V = [0, 0, 0];
  for (const point of points) {
    const p: M.V = M.sub(point, origin);
    const candidate: M.V = [
      axis[1] * p[2] - axis[2] * p[1],
      axis[2] * p[0] - axis[0] * p[2],
      axis[0] * p[1] - axis[1] * p[0],
    ];
    if (Math.hypot(...candidate) > Math.hypot(...normal)) normal = candidate;
  }
  const drop: number = normal.reduce(
    (best: number, x: number, k: number): number =>
      Math.abs(x) > Math.abs(normal[best]) ? k : best,
    0,
  );
  const axes: number[] = [0, 1, 2].filter((k: number): boolean => k !== drop);
  const encoded: WeakMap<M.V, [bigint, bigint]> = new WeakMap();
  const bits: DataView = new DataView(new ArrayBuffer(8));
  const integer = (x: number): bigint => {
    // Every finite binary64 value scaled by 2^1074 is an integer, including subnormals.
    bits.setFloat64(0, x);
    const value: bigint = bits.getBigUint64(0);
    const exponent: number = Number((value >> 52n) & 2047n);
    const fraction: bigint = value & ((1n << 52n) - 1n);
    const unsigned: bigint =
      exponent === 0
        ? fraction
        : ((1n << 52n) | fraction) << BigInt(exponent - 1);
    return value >> 63n ? -unsigned : unsigned;
  };
  const encode = (p: M.V): [bigint, bigint] => {
    if (!encoded.has(p))
      encoded.set(p, [integer(p[axes[0]]), integer(p[axes[1]])]);
    return encoded.get(p)!;
  };
  const orient = (a: M.V, b: M.V, c: M.V): bigint => {
    exactOrientationTests++;
    const p: [bigint, bigint] = encode(a),
      q: [bigint, bigint] = encode(b),
      r: [bigint, bigint] = encode(c);
    const value: bigint =
      (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    return value < 0n ? -1n : value > 0n ? 1n : 0n;
  };
  const intersects = (a: M.V, b: M.V, p: M.V, q: M.V): boolean => {
    chordPairs++;
    if (
      axes.some(
        (k: number): boolean =>
          Math.max(a[k], b[k]) < Math.min(p[k], q[k]) ||
          Math.max(p[k], q[k]) < Math.min(a[k], b[k]),
      )
    )
      return false;
    return (
      orient(a, b, p) * orient(a, b, q) <= 0n &&
      orient(p, q, a) * orient(p, q, b) <= 0n
    );
  };
  const error = (point: M.V): number => {
    const source: C.Leaf | undefined = leaf(point);
    if (source === undefined) return 0;
    const net: M.V[] = C.controls(source);
    return Math.max(
      C.closest(net[1], net[0], net[3]).distance,
      C.closest(net[2], net[0], net[3]).distance,
    );
  };
  const refine = (ring: R, point: M.V): boolean => {
    const source: C.Leaf | undefined = leaf(point);
    if (source === undefined || source.depth >= 30 || !(error(point) > 0))
      return false;
    const mid: number = (source.start + source.end) / 2;
    if (!(mid > source.start && mid < source.end)) return false;
    let children: C.Leaf[];
    try {
      const halves: ReturnType<typeof S.split> = S.split(
        C.controls(source),
        0.5,
      );
      children = [
        ...C.partition(
          {
            net: halves[0],
            start: source.start,
            end: mid,
            depth: source.depth + 1,
          },
          toleranceMm,
        ),
        ...C.partition(
          {
            net: halves[1],
            start: mid,
            end: source.end,
            depth: source.depth + 1,
          },
          toleranceMm,
        ),
      ];
    } catch (failure: unknown) {
      diagnostics.push(
        `Bernstein interaction refinement unresolved: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
      return false;
    }
    if (
      children.some((child: C.Leaf): boolean =>
        C.controls(child).every((p: M.V): boolean =>
          p.every(
            (x: number, k: number): boolean => x === C.controls(child)[0][k],
          ),
        ),
      )
    )
      return false;
    const at: number = ring.points.indexOf(point);
    if (at < 0)
      throw new Error("Interaction refinement lost shared source ownership");
    const knots: C.Knot[] = children.map(
      (child: C.Leaf, i: number): C.Knot => ({
        p: i === 0 ? point : M.clone(C.controls(child)[0]),
        phase: child.start,
        leaf: child,
      }),
    );
    for (const knot of knots) register(ring, knot);
    const replacement: M.V[] = knots.map((knot: C.Knot): M.V => knot.p);
    ring.points.splice(
      at,
      1,
      ...(ring.winding > 0 ? replacement : replacement.reverse()),
    );
    refinements++;
    diagnostics.push(
      `Bernstein source leaf split: ${ring.id}; interval ${source.start}..${source.end}; depth ${source.depth}; retained children ${children.length}`,
    );
    return true;
  };
  for (let first: number = 0; first < selection.length; first++)
    for (let second: number = first + 1; second < selection.length; second++) {
      const a: R = rings[selection[first]],
        b: R = rings[selection[second]];
      let changes: number = 0;
      for (;;) {
        let contact: [M.V, M.V] | undefined;
        for (
          let i: number = 0;
          i < a.points.length && contact === undefined;
          i++
        )
          for (let j: number = 0; j < b.points.length; j++)
            if (
              intersects(
                a.points[i],
                a.points[(i + 1) % a.points.length],
                b.points[j],
                b.points[(j + 1) % b.points.length],
              )
            ) {
              contact = [
                a.points[a.winding > 0 ? i : (i + 1) % a.points.length],
                b.points[b.winding > 0 ? j : (j + 1) % b.points.length],
              ];
              break;
            }
        if (contact === undefined) {
          if (changes)
            diagnostics.push(
              `Bernstein interaction separated projected chords: ${a.id}; ${b.id}; refinement steps ${changes}; node counts ${a.points.length},${b.points.length}; dropped axis ${drop}`,
            );
          break;
        }
        diagnostics.push(
          `Projected chord contact: ${a.id}@${leaf(contact[0])?.start}..${leaf(contact[0])?.end}; ${b.id}@${leaf(contact[1])?.start}..${leaf(contact[1])?.end}; dropped axis ${drop}`,
        );
        const choices: [R, M.V][] = [
          [a, contact[0]],
          [b, contact[1]],
        ];
        choices.sort(
          (x: [R, M.V], y: [R, M.V]): number => error(y[1]) - error(x[1]),
        );
        if (refine(...choices[0]) || refine(...choices[1])) {
          changes++;
          continue;
        }
        qualified = false;
        diagnostics.push(
          `Source interaction remains unresolved in projected chords: ${a.id}; ${b.id}; refinement steps ${changes}; finite geometry retained`,
        );
        break;
      }
    }
  return {
    qualified,
    diagnostics,
    refinements,
    chordPairs,
    exactOrientationTests,
    elapsedMs: started === null ? null : performance.now() - started,
  };
}
