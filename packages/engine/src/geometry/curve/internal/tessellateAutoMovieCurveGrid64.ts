import type {
  AutoMovieBernsteinGrid64,
  AutoMovieBernsteinPolynomial64,
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieCurveGrid64,
  IAutoMovieMesh,
} from "@automovie/interface";

import { AutoMovieBernstein64 as B } from "../AutoMovieBernstein64";
import { AutoMovieBernsteinGrid64 as G } from "../AutoMovieBernsteinGrid64";
import { AutoMovieBernsteinSubdivision64 as S } from "../AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "../AutoMovieCurveMath64";
import { AutoMovieEnginePchipField64 } from "../AutoMovieEnginePchipField64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { compileAutoMovieNormalizedPhases64 } from "./compileAutoMovieNormalizedPhases64";
import { isDenseFinite } from "./isDenseFinite";

type Row = { interval: number; t: number; station: number };
type SpanFamily = { grids: AutoMovieBernsteinGrid64[] };

/**
 * Generate a metre mesh from complete corresponding cubic courses. Exact
 * common-span restrictions feed componentwise PCHIP control fields and
 * longitudinal Bernstein Hermite grids. Periodic fields use three copies and
 * the central period, sharing the seam derivative. The representation preserves
 * source courses before floating rounding; station interpolation is
 * coefficientwise, not pointwise PCHIP or an injectivity guarantee.
 *
 * Sampling uses course control-polygon length and longitudinal control
 * displacement to choose requested display density, then includes declared
 * guide parameters. It is not an adaptive surface-error bound and may miss an
 * unrequested narrow feature. Normals come from generated triangles. Zero-area
 * triangles are counted and omitted; zero or nonfinite accumulated vertex
 * normals remain zero with explicit counts, retaining finite generated faces
 * without inventing a normal. Other unresolved geometric arithmetic still
 * rejects.
 */
export function tessellateAutoMovieCurveGrid64(
  input: IAutoMovieCurveGrid64.Input,
): IAutoMovieCurveGrid64.Result {
  const courses: readonly IAutoMovieCubicBezierCurve64[] = input.courses;
  const stations: readonly number[] = input.stations;
  const periodic: boolean = input.period !== undefined;
  const count: number = courses.length;
  if (!input.name.trim() || !input.topologyDomain.trim())
    throw new Error("Named grid and physical instance domain required");
  if (count < (periodic ? 3 : 2) || stations.length !== count)
    throw new Error("Corresponding station courses required");
  if (
    !(input.resolutionMm > 0) ||
    !Number.isFinite(input.resolutionMm) ||
    !Number.isSafeInteger(input.maxVertices) ||
    input.maxVertices < 4
  )
    throw new Error("Positive finite spacing and safe vertex budget required");
  if (
    !isDenseFinite(stations) ||
    stations.some(
      (x: number, i: number): boolean => i > 0 && x <= stations[i - 1]!,
    )
  )
    throw new Error("Increasing finite station coordinates required");
  const period: number = input.period ?? 0;
  if (
    periodic &&
    (!(period > 0) ||
      !Number.isFinite(period) ||
      !Number.isFinite(stations[0]! + period) ||
      period <= stations[count - 1]! - stations[0]!)
  )
    throw new Error("Explicit complete station period required");
  if (
    !isDenseFinite(input.guides) ||
    input.guides.some((u: number): boolean => u < 0 || u > 1)
  )
    throw new Error("Normalized guide coordinates required");
  const stationEnd: number = periodic
    ? stations[0]! + period
    : stations.at(-1)!;
  if (
    (input.stationSamples !== undefined &&
      !isDenseFinite(input.stationSamples)) ||
    input.stationSamples?.some(
      (x: number): boolean => x < stations[0]! || x > stationEnd,
    )
  )
    throw new Error(
      "Additional station samples must lie inside the supported chart",
    );
  const partitions: number[][] = courses.map(
    (course: IAutoMovieCubicBezierCurve64): number[] => {
      assertAutoMovieCurve64(course);
      if (
        course.type !== "cubicBezier" ||
        course.closed ||
        course.unit !== "mm" ||
        course.phaseUnit !== "normalized"
      )
        throw new Error("Open normalized millimetre cubic courses required");
      return compileAutoMovieNormalizedPhases64(
        course.phaseIntervals,
        course.spans.length,
      );
    },
  );
  const common: number[] = [...new Set(partitions.flat())].sort(
    (a: number, b: number): number => a - b,
  );
  const nets: AutoMovieBernsteinPolynomial64[][] = courses.map(
    (course: IAutoMovieCubicBezierCurve64): AutoMovieBernsteinPolynomial64[] =>
      course.spans.map(
        (span: AutoMovieCubicBezierControls3): AutoMovieBernsteinPolynomial64 =>
          span.map(V.clone),
      ),
  );
  const locate: (knots: readonly number[], value: number) => number = (
    knots: readonly number[],
    value: number,
  ): number => {
    let lo: number = 0;
    let hi: number = knots.length - 2;
    while (lo < hi) {
      const middle: number = Math.floor((lo + hi + 1) / 2);
      if (knots[middle]! <= value) lo = middle;
      else hi = middle - 1;
    }
    return lo;
  };
  const norm: (p: readonly number[]) => number = (
    p: readonly number[],
  ): number => Math.hypot(p[0]!, p[1]!, p[2]!);
  const cross: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ) => AutoMovieVector3Tuple = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const courseLength: number = Math.max(
    ...courses.map((course: IAutoMovieCubicBezierCurve64): number =>
      course.spans.reduce(
        (total: number, span: AutoMovieCubicBezierControls3): number =>
          total +
          span
            .slice(1)
            .reduce(
              (
                sum: number,
                p: Readonly<AutoMovieVector3Tuple>,
                i: number,
              ): number => sum + norm(V.sub(p, span[i]!)),
              0,
            ),
        0,
      ),
    ),
  );
  const courseSteps: number = Math.max(
    1,
    Math.ceil(courseLength / input.resolutionMm),
  );
  if (courseSteps + 1 > input.maxVertices)
    throw new Error("Requested course sampling exceeds vertex budget");
  const us: number[] = [
    ...new Set([
      0,
      1,
      ...input.guides,
      ...Array.from(
        { length: courseSteps + 1 },
        (_: unknown, i: number): number => i / courseSteps,
      ),
    ]),
  ].sort((a: number, b: number): number => a - b);
  // Every admitted station contributes at least one output row, independently
  // of displacement refinement and additional station samples.
  if (count * us.length > input.maxVertices)
    throw new Error("Requested station sampling exceeds vertex budget");
  const guides: Set<number> = new Set(input.guides);
  const intervalCount: number = count - (periodic ? 0 : 1);
  const stationAt: (index: number) => number = (index: number): number =>
    stations[index % count]! + Math.floor(index / count) * period;
  const sourceAt: (index: number, u: number) => AutoMovieVector3Tuple = (
    index: number,
    u: number,
  ): AutoMovieVector3Tuple => {
    const j: number = index % count;
    const k: number = locate(partitions[j]!, u);
    const t: number =
      (u - partitions[j]![k]!) / (partitions[j]![k + 1]! - partitions[j]![k]!);
    return B.value(nets[j]![k]!, t);
  };
  const rows: Row[] = [];
  for (let j: number = 0; j < intervalCount; j++) {
    let displacement: number = 0;
    for (const u of us)
      displacement = Math.max(
        displacement,
        norm(V.sub(sourceAt(j + 1, u), sourceAt(j, u))),
      );
    const steps: number = Math.max(
      1,
      Math.ceil((3 * displacement) / input.resolutionMm),
    );
    if ((rows.length + steps + 1) * us.length > input.maxVertices)
      throw new Error("Requested station sampling exceeds vertex budget");
    const sampleStations: number[] = [
      ...new Set([
        ...(input.stationSamples ?? []).filter(
          (x: number): boolean => x >= stationAt(j) && x < stationAt(j + 1),
        ),
        ...Array.from(
          { length: steps },
          (_: unknown, k: number): number =>
            stationAt(j) + ((stationAt(j + 1) - stationAt(j)) * k) / steps,
        ),
      ]),
    ].sort((a: number, b: number): number => a - b);
    if (
      (rows.length + sampleStations.length + (periodic ? 0 : 1)) * us.length >
      input.maxVertices
    )
      throw new Error("Additional station sampling exceeds vertex budget");
    for (const x of sampleStations)
      rows.push({
        interval: j,
        t: (x - stationAt(j)) / (stationAt(j + 1) - stationAt(j)),
        station: x,
      });
  }
  if (!periodic)
    rows.push({ interval: intervalCount - 1, t: 1, station: stations.at(-1)! });
  const vertexCount: number = rows.length * us.length;
  const positions: number[] = new Array<number>(vertexCount * 3);
  const normalSums: number[] = new Array<number>(vertexCount * 3).fill(0);
  const incidences: Uint32Array = new Uint32Array(vertexCount);
  const indices: number[] = [];
  const boundaries: IAutoMovieCurveGrid64.Result["boundaries"] = {
    courseStart: { positions: [], coursePartials: [], stationPartials: [] },
    courseEnd: { positions: [], coursePartials: [], stationPartials: [] },
    stationFirst: { positions: [], coursePartials: [], stationPartials: [] },
    stationLast: { positions: [], coursePartials: [], stationPartials: [] },
  };
  const lines: IAutoMovieCurveGrid64.Result["construction"]["lines"] =
    courses.map(
      (
        course: IAutoMovieCubicBezierCurve64,
      ): IAutoMovieCurveGrid64.Result["construction"]["lines"][number] => ({
        id: course.name,
        closed: false,
        points: [],
      }),
    );
  let activeSpan: number = -1;
  let family: SpanFamily = { grids: [] };
  let evaluatedSpans: number = 0;
  const buildSpan: (index: number) => SpanFamily = (
    index: number,
  ): SpanFamily => {
    const a: number = common[index]!;
    const b: number = common[index + 1]!;
    const controls: AutoMovieBernsteinPolynomial64[] = courses.map(
      (
        _course: IAutoMovieCubicBezierCurve64,
        j: number,
      ): AutoMovieBernsteinPolynomial64 => {
        const k: number = locate(partitions[j]!, a);
        const start: number = partitions[j]![k]!;
        const width: number = partitions[j]![k + 1]! - start;
        return S.restrict(
          nets[j]![k]!,
          (a - start) / width,
          (b - start) / width,
        );
      },
    );
    const values: number[][] = controls.map(
      (poly: AutoMovieBernsteinPolynomial64): number[] => poly.flat(),
    );
    const coordinates: number[] = periodic
      ? [-1, 0, 1].flatMap((turn: number): number[] =>
          stations.map((x: number): number => x + turn * period),
        )
      : [...stations];
    const field: AutoMovieEnginePchipField64 = new AutoMovieEnginePchipField64(
      coordinates,
      periodic ? [...values, ...values, ...values] : values,
    );
    const derivatives: AutoMovieBernsteinPolynomial64[] = controls.map(
      (
        _: AutoMovieBernsteinPolynomial64,
        j: number,
      ): AutoMovieBernsteinPolynomial64 =>
        Array.from(
          { length: 4 },
          (_unused: unknown, k: number): AutoMovieVector3Tuple =>
            V.clone(
              field.derivatives[j + (periodic ? count : 0)]!.slice(
                k * 3,
                k * 3 + 3,
              ),
            ),
        ),
    );
    const grids: AutoMovieBernsteinGrid64[] = Array.from(
      { length: intervalCount },
      (_: unknown, j: number): AutoMovieBernsteinGrid64 =>
        G.hermite(
          controls[j]!,
          controls[(j + 1) % count]!,
          derivatives[j]!,
          derivatives[(j + 1) % count]!,
          stationAt(j + 1) - stationAt(j),
        ),
    );
    return { grids };
  };
  for (let i: number = 0; i < us.length; i++) {
    const u: number = us[i]!;
    const span: number = locate(common, u);
    if (span !== activeSpan) {
      activeSpan = span;
      family = buildSpan(span);
      evaluatedSpans++;
    }
    const t: number = (u - common[span]!) / (common[span + 1]! - common[span]!);
    const guide:
      | IAutoMovieCurveGrid64.Result["construction"]["lines"][number]
      | undefined = guides.has(u)
      ? { id: `${input.name}.guide.${u}`, closed: periodic, points: [] }
      : undefined;
    for (let j: number = 0; j < count; j++)
      lines[j]!.points.push(V.scale(sourceAt(j, u), 0.001));
    for (let r: number = 0; r < rows.length; r++) {
      const row: Row = rows[r]!;
      const p: AutoMovieVector3Tuple = V.scale(
        B.value(G.gridValue(family.grids[row.interval]!, row.t), t),
        0.001,
      );
      const offset: number = (r * us.length + i) * 3;
      for (let axis: number = 0; axis < 3; axis++)
        positions[offset + axis] = p[axis]!;
      if (guide) guide.points.push(p);
      if (
        i === 0 ||
        i === us.length - 1 ||
        r === 0 ||
        (!periodic && r === rows.length - 1)
      ) {
        const poly: AutoMovieBernsteinPolynomial64 = G.gridValue(
          family.grids[row.interval]!,
          row.t,
        );
        const du: AutoMovieVector3Tuple = V.scale(
          B.value(B.tangent(poly, 1 / (common[span + 1]! - common[span]!)), t),
          0.001,
        );
        const dv: AutoMovieVector3Tuple = V.scale(
          B.value(
            G.gridValue(
              G.gridTangent(
                family.grids[row.interval]!,
                1 / (stationAt(row.interval + 1) - stationAt(row.interval)),
              ),
              row.t,
            ),
            t,
          ),
          0.001,
        );
        const targets: IAutoMovieCurveGrid64.Result["boundaries"]["courseStart"][] =
          [];
        if (i === 0) targets.push(boundaries.courseStart);
        if (i === us.length - 1) targets.push(boundaries.courseEnd);
        if (r === 0) targets.push(boundaries.stationFirst);
        if (!periodic && r === rows.length - 1)
          targets.push(boundaries.stationLast);
        for (const target of targets) {
          target.positions.push(V.clone(p));
          target.coursePartials.push(V.clone(du));
          target.stationPartials.push(V.clone(dv));
        }
      }
    }
    if (guide) lines.push(guide);
  }
  let omittedZeroAreaTriangles: number = 0;
  let minimumTriangleAreaMm2: number = Number.MAX_VALUE;
  const emit: (a: number, b: number, c: number) => void = (
    a: number,
    b: number,
    c: number,
  ): void => {
    const pa: AutoMovieVector3Tuple = V.clone(
      positions.slice(a * 3, a * 3 + 3),
    );
    const pb: AutoMovieVector3Tuple = V.clone(
      positions.slice(b * 3, b * 3 + 3),
    );
    const pc: AutoMovieVector3Tuple = V.clone(
      positions.slice(c * 3, c * 3 + 3),
    );
    const n: AutoMovieVector3Tuple = cross(V.sub(pb, pa), V.sub(pc, pa));
    const magnitude: number = norm(n);
    if (!(magnitude > 0) || !Number.isFinite(magnitude)) {
      omittedZeroAreaTriangles++;
      return;
    }
    const area: number = magnitude * 500000;
    if (!Number.isFinite(area))
      throw new Error("Generated triangle area must remain finite");
    minimumTriangleAreaMm2 = Math.min(minimumTriangleAreaMm2, area);
    indices.push(a, b, c);
    for (const index of [a, b, c]) {
      incidences[index] = incidences[index]! + 1;
      for (let axis: number = 0; axis < 3; axis++)
        normalSums[index * 3 + axis]! += n[axis]!;
    }
  };
  for (let r: number = 0; r < rows.length - (periodic ? 0 : 1); r++)
    for (let i: number = 0; i < us.length - 1; i++) {
      const a: number = r * us.length + i;
      const c: number = ((r + 1) % rows.length) * us.length + i;
      emit(a, a + 1, c);
      emit(a + 1, c + 1, c);
    }
  const normals: number[] = new Array<number>(positions.length);
  let unresolvedVertexNormals: number = 0;
  let isolatedVertices: number = 0;
  let nonfiniteNormalSums: number = 0;
  for (let i: number = 0; i < vertexCount; i++) {
    const n: AutoMovieVector3Tuple = V.clone(
      normalSums.slice(i * 3, i * 3 + 3),
    );
    const finite: boolean = n.every(Number.isFinite);
    const length: number = finite ? norm(n) : Number.NaN;
    const regular: boolean = finite && Number.isFinite(length) && length > 0;
    if (!regular) {
      unresolvedVertexNormals++;
      if (!finite || !Number.isFinite(length)) nonfiniteNormalSums++;
      if (incidences[i] === 0) isolatedVertices++;
    }
    for (let axis: number = 0; axis < 3; axis++)
      normals[i * 3 + axis] = regular ? n[axis]! / length : 0;
  }
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals,
    uvs: null,
    skin: null,
    physicalVertices: {
      sources: Array.from(
        { length: vertexCount },
        (_: unknown, id: number): { domain: string; id: number } => ({
          domain: input.topologyDomain,
          id,
        }),
      ),
      vertices: Array.from(
        { length: vertexCount },
        (_: unknown, i: number): number => i,
      ),
    },
  };
  if (periodic)
    boundaries.stationLast = {
      positions: boundaries.stationFirst.positions.map(V.clone),
      coursePartials: boundaries.stationFirst.coursePartials.map(V.clone),
      stationPartials: boundaries.stationFirst.stationPartials.map(V.clone),
    };
  return {
    mesh,
    construction: { units: "m", lines },
    boundaries,
    parameters: {
      course: us,
      station: rows.map((row: Row): number => row.station),
    },
    counts: {
      courses: count,
      inputSpans: courses.reduce(
        (sum: number, course: IAutoMovieCubicBezierCurve64): number =>
          sum + course.spans.length,
        0,
      ),
      commonSpans: common.length - 1,
      evaluatedSpans,
      vertices: vertexCount,
      triangles: indices.length / 3,
      omittedZeroAreaTriangles,
      unresolvedVertexNormals,
      isolatedVertices,
      nonfiniteNormalSums,
      minimumTriangleAreaMm2,
    },
  };
}
