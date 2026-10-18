import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieBernstein64 as B } from "./AutoMovieBernstein64";
import { AutoMovieBernsteinGrid64 as G } from "./AutoMovieBernsteinGrid64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { AutoMoviePchipField64 } from "./AutoMoviePchipField64";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";
import type { IAutoMovieCurveGrid64 as C } from "./IAutoMovieCurveGrid64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";

type Row = { interval: number; t: number; station: number };
type SpanFamily = { grids: B.Grid[] };

/**
 * Generate a metre mesh from complete corresponding cubic courses. Exact common-span restrictions feed componentwise PCHIP control fields and longitudinal Bernstein Hermite grids. Periodic fields use three copies and the central period, sharing the seam derivative. The representation preserves source courses before floating rounding; station interpolation is coefficientwise, not pointwise PCHIP or an injectivity guarantee.
 *
 * Sampling uses course control-polygon length and longitudinal control displacement to choose requested display density, then includes declared guide parameters. It is not an adaptive surface-error bound and may miss an unrequested narrow feature. Normals come from generated triangles. Zero-area triangles are counted and omitted; zero or nonfinite accumulated vertex normals remain zero with explicit counts, retaining finite generated faces without inventing a normal. Other unresolved geometric arithmetic still rejects.
 *
 * @evidence contracts/common.md#principled-implementation De Casteljau restrictions preserve each supplied cubic; shared Fritsch-Butland derivative fields construct complete Hermite tensor coefficients, evaluated by engine Bernstein operators into new mesh buffers.
 * @evidence contracts/common.md#clear-and-simple-design The operator owns geometry, admission, sampling and actual construction; source observation and fitting remain caller responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source vertex/index/normal arrays, anatomy branches, clamped overshoot or through-point refit supply the surface; independent contact sheets retain explicit topology domains.
 * @evidence contracts/common.md#meaningful-documentation States coordinate conversion, periodic derivative ownership, coefficientwise interpolation, sampling limits and failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Admission and partition union cost O(K log K) for K input boundaries; O(S U) support probes use logarithmic source-span lookup. Each sampled common span restricts S courses with logarithmic lookup and constructs O(S) tensor data. Guide membership is prepared once in O(G) storage and queried in constant expected time. Output evaluation and face-normal accumulation are linear in requested vertices and triangles; the explicit vertex budget rejects excess before buffer allocation, with the unavoidable station-row lower bound checked before displacement probes.
 * @evidence contracts/performance.md#reuse-equivalent-work Sorted course sampling retains only the current common-span tensor family, reused across every station sample and guide at that parameter; station PCHIP coefficients are constructed once per visited common span.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary tensor storage is O(S), partition and guide storage O(K+G), and returned mesh/construction storage O(V+S U); no process-wide cache or external handle survives the invocation.
 */
export function tessellateAutoMovieCurveGrid64(input: C.Input): C.Result {
  const courses: readonly IAutoMovieCurve64.Cubic[] = input.courses;
  const stations: readonly number[] = input.stations;
  const periodic: boolean = input.period !== undefined;
  const count: number = courses.length;
  if (!input.name.trim() || !input.topologyDomain.trim())
    throw new Error("Named grid and physical instance domain required");
  if (count < (periodic ? 3 : 2) || stations.length !== count)
    throw new Error("Corresponding station courses required");
  if (
    !Number.isFinite(input.resolutionMm) ||
    input.resolutionMm <= 0 ||
    !Number.isSafeInteger(input.maxVertices) ||
    input.maxVertices < 4
  )
    throw new Error("Positive finite spacing and safe vertex budget required");
  if (
    stations.some(
      (x: number, i: number): boolean =>
        !Number.isFinite(x) || (i > 0 && x <= stations[i - 1]!),
    )
  )
    throw new Error("Increasing finite station coordinates required");
  const period: number = input.period ?? 0;
  if (
    periodic &&
    (!Number.isFinite(period) || period <= stations[count - 1]! - stations[0]!)
  )
    throw new Error("Explicit complete station period required");
  if (
    input.guides.some(
      (u: number): boolean => !Number.isFinite(u) || u < 0 || u > 1,
    )
  )
    throw new Error("Normalized guide coordinates required");
  const stationEnd: number = periodic
    ? stations[0]! + period
    : stations.at(-1)!;
  if (
    input.stationSamples?.some(
      (x: number): boolean =>
        !Number.isFinite(x) || x < stations[0]! || x > stationEnd,
    )
  )
    throw new Error(
      "Additional station samples must lie inside the supported chart",
    );
  const partitions: number[][] = courses.map(
    (course: IAutoMovieCurve64.Cubic): number[] => {
      assertAutoMovieCurve64(course);
      if (
        course.type !== "cubicBezier" ||
        course.closed ||
        course.unit !== "mm" ||
        course.phaseUnit !== "normalized"
      )
        throw new Error("Open normalized millimetre cubic courses required");
      const knots: number[] = [0];
      for (const width of course.phaseIntervals)
        knots.push(knots.at(-1)! + width);
      if (Math.abs(knots.at(-1)! - 1) > 32 * Number.EPSILON)
        throw new Error(
          "Every course must cover the same normalized unit chart",
        );
      // Only the summed chart endpoint is canonicalized; interior boundaries retain their supplied arithmetic.
      knots[knots.length - 1] = 1;
      return knots;
    },
  );
  const common: number[] = [...new Set(partitions.flat())].sort(
    (a: number, b: number): number => a - b,
  );
  const nets: B.Poly[][] = courses.map(
    (course: IAutoMovieCurve64.Cubic): B.Poly[] =>
      course.spans.map(
        (span: IAutoMovieCurve64.Span): B.Poly => span.map(V.clone),
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
  const cross: (a: B.Vec, b: B.Vec) => B.Vec = (a: B.Vec, b: B.Vec): B.Vec => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const courseLength: number = Math.max(
    ...courses.map((course: IAutoMovieCurve64.Cubic): number =>
      course.spans.reduce(
        (total: number, span: IAutoMovieCurve64.Span): number =>
          total +
          span
            .slice(1)
            .reduce(
              (sum: number, p: IAutoMovieCurve64.Vector, i: number): number =>
                sum + norm(V.sub(p, span[i]!)),
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
  if (!Number.isSafeInteger(courseSteps) || courseSteps + 1 > input.maxVertices)
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
  const sourceAt: (index: number, u: number) => B.Vec = (
    index: number,
    u: number,
  ): B.Vec => {
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
    if (
      !Number.isSafeInteger(steps) ||
      (rows.length + steps + 1) * us.length > input.maxVertices
    )
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
  const boundaries: C.Result["boundaries"] = {
    courseStart: { positions: [], coursePartials: [], stationPartials: [] },
    courseEnd: { positions: [], coursePartials: [], stationPartials: [] },
    stationFirst: { positions: [], coursePartials: [], stationPartials: [] },
    stationLast: { positions: [], coursePartials: [], stationPartials: [] },
  };
  const lines: C.Result["construction"]["lines"] = courses.map(
    (
      course: IAutoMovieCurve64.Cubic,
    ): C.Result["construction"]["lines"][number] => ({
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
    const controls: B.Poly[] = courses.map(
      (_course: IAutoMovieCurve64.Cubic, j: number): B.Poly => {
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
    const values: number[][] = controls.map((poly: B.Poly): number[] =>
      poly.flat(),
    );
    const coordinates: number[] = periodic
      ? [-1, 0, 1].flatMap((turn: number): number[] =>
          stations.map((x: number): number => x + turn * period),
        )
      : [...stations];
    const field: AutoMoviePchipField64 = new AutoMoviePchipField64(
      coordinates,
      periodic ? [...values, ...values, ...values] : values,
    );
    const derivatives: B.Poly[] = controls.map(
      (_: B.Poly, j: number): B.Poly =>
        Array.from(
          { length: 4 },
          (_unused: unknown, k: number): B.Vec =>
            V.clone(
              field.derivatives[j + (periodic ? count : 0)]!.slice(
                k * 3,
                k * 3 + 3,
              ),
            ),
        ),
    );
    const grids: B.Grid[] = Array.from(
      { length: intervalCount },
      (_: unknown, j: number): B.Grid =>
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
    const guide: C.Result["construction"]["lines"][number] | undefined =
      guides.has(u)
        ? { id: `${input.name}.guide.${u}`, closed: periodic, points: [] }
        : undefined;
    for (let j: number = 0; j < count; j++)
      lines[j]!.points.push(V.scale(sourceAt(j, u), 0.001));
    for (let r: number = 0; r < rows.length; r++) {
      const row: Row = rows[r]!;
      const p: B.Vec = V.scale(
        B.value(G.gridValue(family.grids[row.interval]!, row.t), t),
        0.001,
      );
      if (!p.every(Number.isFinite))
        throw new Error("Unresolved tensor position");
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
        const poly: B.Poly = G.gridValue(family.grids[row.interval]!, row.t);
        const du: B.Vec = V.scale(
          B.value(B.tangent(poly, 1 / (common[span + 1]! - common[span]!)), t),
          0.001,
        );
        const dv: B.Vec = V.scale(
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
        if (![...du, ...dv].every(Number.isFinite))
          throw new Error("Unresolved tensor boundary derivative");
        const targets: C.Result["boundaries"]["courseStart"][] = [];
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
    const pa: B.Vec = V.clone(positions.slice(a * 3, a * 3 + 3));
    const pb: B.Vec = V.clone(positions.slice(b * 3, b * 3 + 3));
    const pc: B.Vec = V.clone(positions.slice(c * 3, c * 3 + 3));
    const n: B.Vec = cross(V.sub(pb, pa), V.sub(pc, pa));
    if (!n.every(Number.isFinite))
      throw new Error("Unresolved triangle arithmetic");
    if (norm(n) === 0) {
      omittedZeroAreaTriangles++;
      return;
    }
    minimumTriangleAreaMm2 = Math.min(minimumTriangleAreaMm2, norm(n) * 500000);
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
    const n: B.Vec = V.clone(normalSums.slice(i * 3, i * 3 + 3));
    const length: number = norm(n);
    const regular: boolean = Number.isFinite(length) && length > 0;
    if (!regular) {
      unresolvedVertexNormals++;
      if (incidences[i] === 0) isolatedVertices++;
      if (!Number.isFinite(length)) nonfiniteNormalSums++;
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
        (sum: number, course: IAutoMovieCurve64.Cubic): number =>
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
