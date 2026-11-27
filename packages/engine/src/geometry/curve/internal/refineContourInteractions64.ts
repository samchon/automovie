import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieContourLoftCurves64,
  IAutoMovieRefineContourInteractions64,
  IAutoMovieRefineContourInteractions64Ring,
} from "@automovie/interface";

import { AutoMovieEngineBernsteinSubdivision64 as S } from "../../AutoMovieEngineBernsteinSubdivision64";
import { AutoMovieEngineContourLoftCurves64 as C } from "../../AutoMovieEngineContourLoftCurves64";
import { AutoMovieEngineCurveMath64 as M } from "../../AutoMovieEngineCurveMath64";

/*
 * Refine interacting display chords from their retained Bernstein restrictions
 * before slit ownership freezes. A dominant-plane projection is used for the
 * common planar section; exact dyadic orientation tests detect intersections of
 * the represented binary64 chords. Only a contacted curved source restriction
 * is split, retaining its original physical tolerance, parameter interval and
 * existing endpoint identity. A genuine linear contact or exhausted numeric
 * subdivision remains explicit and keeps finite geometry. This is not a
 * certificate of source-curve simplicity, injectivity or exact floating-point
 * subdivision. Actual predicate/refinement counts are returned; elapsed time is
 * measured only on explicit request.
 */
export function refineContourInteractions64<
  R extends IAutoMovieRefineContourInteractions64Ring,
>(
  rings: R[],
  selection: number[],
  leaf: (
    point: AutoMovieVector3Tuple,
  ) => IAutoMovieContourLoftCurves64.Leaf | undefined,
  register: (ring: R, knot: IAutoMovieContourLoftCurves64.Knot) => void,
  toleranceMm: number,
  observeWork: boolean = false,
): IAutoMovieRefineContourInteractions64.IResult {
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
  const points: AutoMovieVector3Tuple[] = rings[selection[0]].points;
  const origin: AutoMovieVector3Tuple = points[0];
  const endpoint: AutoMovieVector3Tuple = points.find(
    (p: AutoMovieVector3Tuple): boolean =>
      p.some((x: number, k: number): boolean => x !== origin[k]),
  )!;
  const axis: AutoMovieVector3Tuple = M.sub(endpoint, origin);
  let normal: AutoMovieVector3Tuple = [0, 0, 0];
  for (const point of points) {
    const p: AutoMovieVector3Tuple = M.sub(point, origin);
    const candidate: AutoMovieVector3Tuple = [
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
  const encode = (p: AutoMovieVector3Tuple): [bigint, bigint] => [
    integer(p[axes[0]]),
    integer(p[axes[1]]),
  ];
  const orient = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    c: AutoMovieVector3Tuple,
  ): bigint => {
    exactOrientationTests++;
    const p: [bigint, bigint] = encode(a),
      q: [bigint, bigint] = encode(b),
      r: [bigint, bigint] = encode(c);
    const value: bigint =
      (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    return value < 0n ? -1n : value > 0n ? 1n : 0n;
  };
  const intersects = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    p: AutoMovieVector3Tuple,
    q: AutoMovieVector3Tuple,
  ): boolean => {
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
  const error = (point: AutoMovieVector3Tuple): number => {
    const source: IAutoMovieContourLoftCurves64.Leaf | undefined = leaf(point);
    if (source === undefined) return 0;
    const net: AutoMovieVector3Tuple[] = C.controls(source);
    return Math.max(
      C.closest(net[1], net[0], net[3]).distance,
      C.closest(net[2], net[0], net[3]).distance,
    );
  };
  const refine = (ring: R, point: AutoMovieVector3Tuple): boolean => {
    const source: IAutoMovieContourLoftCurves64.Leaf | undefined = leaf(point);
    if (source === undefined || source.depth >= 30 || !(error(point) > 0))
      return false;
    const mid: number = (source.start + source.end) / 2;
    if (!(mid > source.start && mid < source.end)) return false;
    let children: IAutoMovieContourLoftCurves64.Leaf[];
    try {
      const halves: [
        AutoMovieBernsteinPolynomial64,
        AutoMovieBernsteinPolynomial64,
      ] = S.split(C.controls(source), 0.5);
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
      children.some((child: IAutoMovieContourLoftCurves64.Leaf): boolean =>
        C.controls(child).every((p: AutoMovieVector3Tuple): boolean =>
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
    const knots: IAutoMovieContourLoftCurves64.Knot[] = children.map(
      (
        child: IAutoMovieContourLoftCurves64.Leaf,
        i: number,
      ): IAutoMovieContourLoftCurves64.Knot => ({
        p: i === 0 ? point : M.clone(C.controls(child)[0]),
        phase: child.start,
        leaf: child,
      }),
    );
    for (const knot of knots) register(ring, knot);
    const replacement: AutoMovieVector3Tuple[] = knots.map(
      (knot: IAutoMovieContourLoftCurves64.Knot): AutoMovieVector3Tuple =>
        knot.p,
    );
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
        let contact: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] | undefined;
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
        const choices: [R, AutoMovieVector3Tuple][] = [
          [a, contact[0]],
          [b, contact[1]],
        ];
        choices.sort(
          (
            x: [R, AutoMovieVector3Tuple],
            y: [R, AutoMovieVector3Tuple],
          ): number => error(y[1]) - error(x[1]),
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
