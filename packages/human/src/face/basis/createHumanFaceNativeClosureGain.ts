import type { IAutoMovieQuadraticRow } from "@automovie/engine";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import type { IAutoMovieHumanBasisSourceChartPoint as IAutoMovieHumanBasisSourceChartPointImported } from "../../common/basis/IAutoMovieHumanBasisSourceChartPoint";
import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanFaceLipMargin as IAutoMovieHumanFaceLipMarginImported } from "../../index";
import type { IAutoMovieHumanFaceSourcePosePlan as IAutoMovieHumanFaceSourcePosePlanImported } from "../structures/IAutoMovieHumanFaceSourcePosePlan";
import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceMarginGraphViolation } from "./IHumanFaceMarginGraphViolation";
import type { IHumanFaceNativeClosureGainInput } from "./IHumanFaceNativeClosureGainInput";
import type { IHumanFaceNativeClosureStep as IHumanFaceNativeClosureStepImported } from "./IHumanFaceNativeClosureStep";
import { measureHumanFaceMarginGaps } from "./measureHumanFaceMarginGaps";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { readHumanFaceLipMarginPoints } from "./readHumanFaceLipMarginPoints";
import { readHumanFaceMarginGraphViolations } from "./readHumanFaceMarginGraphViolations";
import { replayHumanFaceSourceRefinements } from "./replayHumanFaceSourceRefinements";
import { solveHumanFaceNativeClosureStep } from "./solveHumanFaceNativeClosureStep";

/**
 * Solve continuous lip contact in the actual native vertex closure field.
 *
 * A material point has one weighted response to several vertex gains; solving
 * a point gain and distributing it to corners does not satisfy that equation.
 * This owner instead minimizes squared gain departure from the central field
 * in tissue-budget units. Shared source samples use one variable. Each posed
 * polyline bracket supplies an affine contact row with the current slope;
 * rows from both courses constrain the union of their knots. The central pair
 * stays fixed. Consecutive along differences constrain the same gain field;
 * the original source order supplies their orientation. An initially invalid
 * central field first restores graph feasibility, rather than supplying an
 * invented contact bracket. Later contact steps retain the graph constraints.
 * A changed along coordinate can change a bracket or its slope, so this is a
 * sequential affine solve, not an exact nonlinear solver.
 *
 * Graph-only restoration maximizes a dimensionless spacing slack and then
 * minimizes gain departure at an interior spacing target. Once contact can
 * be linearized, the step owner minimizes a common elastic aperture residual
 * while preserving the hard graph, central-seat and budget domain. These are
 * numerical preferences, not anatomical minima or acceptance conditions: zero
 * spacing and equal-along/equal-height joins remain supported by the unchanged
 * final predicate. A fixed zero-along pair instead constrains height equality.
 * Candidate steps must reduce the actual maximum aperture excess; binary
 * backtracking rejects a changed bracket or graph that does not verify. No
 * step below represented field change or without actual improvement is returned.
 *
 * A maximum of 32 relinearizations bounds work, not correctness. Only actual
 * posed/refined points with monotone along coordinates, finite apertures within
 * the original contact tolerance and unchanged per-vertex tissue budgets are
 * returned. Nonconvergence or an unavailable response refuses. Neither the QP
 * status nor the iteration count establishes contact or anatomical validity.
 *
 * @evidence contracts/common.md#principled-implementation Canonical shared native samples own gain variables scaled by their maximum actual closure reach; source-interpolated material responses form affine graph/contact rows around the current field. Sequential QP candidates retain central seating and tissue budget, then actual posed/refined graph and aperture checks admit the result; floating relinearization has no convergence guarantee.
 * @evidence contracts/common.md#clear-and-simple-design Native support, response coefficients, candidate field reconstruction and actual final predicates stay with this geometry owner; the step solver owns numerical restoration/departure and supplies candidates without deciding physical acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thirty-two relinearizations, solver status and preferred positive spacing do not relax the original graph/contact predicate. Missing movement, exhausted work or nonimproving backtracking refuses; central seating and per-native-sample budgets remain unchanged, with no clinical or GPU success inferred.
 * @evidence contracts/common.md#meaningful-documentation Prose explains shared field versus point gains, budget-normalized preference, graph-only restoration, nonlinear bracket changes, actual replay admission and finite-work/nonconvergence limits.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, M course knots and K supported native variables, response construction visits V; bracket rows can cost O(M squared), and each candidate field can propagate over V against M support vertices. Up to 32 linearizations add two native QP/refinement phases and represented-change-bounded binary backtracking, each with full pose/replay/graph/gap checks; solver and bigint source-interpolation costs remain part of the operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Native alias columns, fixed source supports, zero/one responses and gain scales are compiled once per request; graph-valid linearization points survive a later infeasible candidate. Every candidate rereads actual replayed geometry instead of reusing a stale bracket or solver verdict across changed fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-request arrays/maps follow V/M/K and sparse rows; before/after graph histories retain at most 33 observations for refusal diagnostics. Final gains transfer to the caller and rejected local candidates become collectible; native reactor lifetime belongs to the engine kernel, not a viewer/task acquired here.
 *
 * @author Samchon
 */
export function createHumanFaceNativeClosureGain(
  input: IHumanFaceNativeClosureGainInput,
): Float64Array {
  const {
    surface,
    contact,
    positions,
    motions,
    axis,
    up,
    ratio,
    budget,
    delta,
    movableMetres,
  }: IHumanFaceNativeClosureGainInput = input;
  const margin: IAutoMovieHumanFaceLipMarginImported | undefined =
    contact.margin;
  if (
    margin?.kind !== "material" ||
    delta.length !== positions.length ||
    !delta.every(Number.isFinite) ||
    !Number.isFinite(ratio) ||
    !Number.isFinite(budget) ||
    budget < 0 ||
    !Number.isFinite(movableMetres) ||
    movableMetres <= 0
  )
    throw new Error(
      "Native closure needs material courses, matching finite deltas, a finite ratio and the original nonnegative budget.",
    );
  const count: number = positions.length / 3;
  const initial: IHumanFaceLipMarginPoints = readHumanFaceLipMarginPoints(
    surface,
    margin,
    positions,
  );
  const plan: IAutoMovieHumanFaceSourcePosePlanImported | undefined =
    surface.sourcePosePlan;
  const nativeCount: number = plan?.nativeVertices ?? count;
  const parents: (vertex: number) => number[] = (vertex: number): number[] =>
    vertex < nativeCount
      ? [vertex]
      : plan!.nativeTriangles.slice(
          3 * plan!.samples[vertex - nativeCount].parent,
          3 * plan!.samples[vertex - nativeCount].parent + 3,
        );
  const nativeSupport: (vertex: number) => Map<number, number> = (
    vertex: number,
  ): Map<number, number> => {
    const sample: IAutoMovieHumanBasisSourceChartPointImported | undefined =
      vertex < nativeCount ? undefined : plan!.samples[vertex - nativeCount];
    const bary: number[] =
      sample === undefined
        ? [1]
        : [
            interpolateHumanBasisSourceTriangle([1, 0, 0], sample.coordinates),
            interpolateHumanBasisSourceTriangle([0, 1, 0], sample.coordinates),
            interpolateHumanBasisSourceTriangle([0, 0, 1], sample.coordinates),
          ];
    const support: Map<number, number> = new Map<number, number>();
    parents(vertex).forEach((corner: number, at: number): void => {
      if (bary[at] !== 0) support.set(corner, bary[at]);
    });
    return support;
  };
  const weights: (point: IHumanFaceLipMarginPoint) => Map<number, number> = (
    point: IHumanFaceLipMarginPoint,
  ): Map<number, number> => {
    const result: Map<number, number> = new Map<number, number>();
    point.vertices.forEach((vertex: number, at: number): void => {
      for (const [corner, bary] of nativeSupport(vertex))
        result.set(
          corner,
          (result.get(corner) ?? 0) + point.weights[at] * bary,
        );
    });
    return new Map(
      [...result].filter((entry: [number, number]): boolean => entry[1] !== 0),
    );
  };
  const support: Set<number> = new Set(
    [...initial.upper, ...initial.lower].flatMap(
      (point: IHumanFaceLipMarginPoint): number[] => [...weights(point).keys()],
    ),
  );
  for (const vertex of [contact.lips.upper, contact.lips.lower])
    for (const corner of nativeSupport(vertex).keys()) support.add(corner);
  const key: (vertex: number) => number = (vertex: number): number =>
    surface.sourcePartition?.samples[vertex] ?? vertex;
  const keys: number[] = [...new Set([...support].map(key))];
  const columns: Map<number, number> = new Map(
    keys.map((value: number, at: number): [number, number] => [value, at]),
  );
  const reach: number[] = Array.from(
    { length: count },
    (_: unknown, vertex: number): number =>
      Math.hypot(
        delta[3 * vertex],
        delta[3 * vertex + 1],
        delta[3 * vertex + 2],
      ),
  );
  const maximumReach: Map<number, number> = new Map<number, number>();
  for (let vertex: number = 0; vertex < nativeCount; vertex++)
    maximumReach.set(
      key(vertex),
      Math.max(maximumReach.get(key(vertex)) ?? 0, reach[vertex]),
    );
  const scale: number[] = keys.map((value: number): number => {
    const maximum: number = maximumReach.get(value) ?? 0;
    return maximum > 0 && budget > 0 ? budget / maximum : 0;
  });
  let lips: Float64Array = new Float64Array(count).fill(ratio);
  const p0: number[] = poseHumanFaceSurface(
    positions.map(
      (value: number, at: number): number => value + ratio * delta[at],
    ),
    surface.attachments ?? [],
    motions,
  );
  const p1: number[] = poseHumanFaceSurface(
    positions.map((value: number, at: number): number => {
      const column: number | undefined = columns.get(key(Math.floor(at / 3)));
      return (
        value + (ratio + (column === undefined ? 0 : scale[column])) * delta[at]
      );
    }),
    surface.attachments ?? [],
    motions,
  );
  const responses: { x: number; y: number; z: number }[] = Array.from(
    { length: count },
    (_: unknown, vertex: number): { x: number; y: number; z: number } => ({
      x: p1[3 * vertex] - p0[3 * vertex],
      y: p1[3 * vertex + 1] - p0[3 * vertex + 1],
      z: p1[3 * vertex + 2] - p0[3 * vertex + 2],
    }),
  );
  const dot: (
    point: IAutoMovieVector3Imported,
    direction: readonly number[],
  ) => number = (point: typeof up, direction: readonly number[]): number =>
    point.x * direction[0] + point.y * direction[1] + point.z * direction[2];
  const upArray: number[] = [up.x, up.y, up.z];
  // Refinement uses an affine native triangle; its closure response must follow
  // those original corners rather than a gain on an overwritten derived vertex.
  const coefficients: (
    point: IHumanFaceLipMarginPoint,
    slope: number,
  ) => Map<number, number> = (
    point: IHumanFaceLipMarginPoint,
    slope: number,
  ): Map<number, number> => {
    const result: Map<number, number> = new Map<number, number>();
    for (const [vertex, weight] of weights(point)) {
      const at: number | undefined = columns.get(key(vertex));
      if (at !== undefined)
        result.set(
          at,
          (result.get(at) ?? 0) +
            weight *
              (dot(responses[vertex], upArray) -
                slope * dot(responses[vertex], axis)),
        );
    }
    return result;
  };
  const projection: (
    point: IHumanFaceLipMarginPoint,
    direction: readonly number[],
  ) => Map<number, number> = (
    point: IHumanFaceLipMarginPoint,
    direction: readonly number[],
  ): Map<number, number> => {
    const result: Map<number, number> = new Map<number, number>();
    for (const [vertex, weight] of weights(point)) {
      const at: number = columns.get(key(vertex))!;
      result.set(
        at,
        (result.get(at) ?? 0) + weight * dot(responses[vertex], direction),
      );
    }
    return result;
  };
  const pose: (field?: Float64Array) => number[] = (
    field: Float64Array = lips,
  ): number[] =>
    poseHumanFaceSurface(
      positions.map(
        (value: number, at: number): number =>
          value + delta[at] * field[Math.floor(at / 3)],
      ),
      surface.attachments ?? [],
      motions,
    );
  const fieldOf: (variables: readonly number[]) => Float64Array | null = (
    variables: readonly number[],
  ): Float64Array | null => {
    const field: Float64Array<ArrayBuffer> = new Float64Array(count).fill(
      ratio,
    );
    for (let vertex: number = 0; vertex < count; vertex++) {
      const at: number | undefined = columns.get(key(vertex));
      field[vertex] =
        at === undefined ? ratio : ratio + scale[at] * variables[at];
      if (at === undefined && reach[vertex] > 0) {
        let nearest: number = Infinity,
          sum: number = 0,
          total: number = 0;
        for (const node of support) {
          const distance: number = Math.hypot(
            positions[3 * vertex] - positions[3 * node],
            positions[3 * vertex + 1] - positions[3 * node + 1],
            positions[3 * vertex + 2] - positions[3 * node + 2],
          );
          const column: number = columns.get(key(node))!;
          if (distance === 0) {
            nearest = 0;
            sum = scale[column] * variables[column];
            total = 1;
            break;
          }
          nearest = Math.min(nearest, distance);
          const weight: number = 1 / (distance * distance);
          sum += weight * scale[column] * variables[column];
          total += weight;
        }
        field[vertex] =
          ratio + (Math.max(0, 1 - nearest / budget) * sum) / total;
      }
      if (
        !Number.isFinite(field[vertex]) ||
        (vertex < nativeCount &&
          Math.abs(field[vertex] - ratio) * reach[vertex] > budget)
      )
        return null;
    }
    return field;
  };
  const centralValid: (posed: readonly number[]) => boolean = (
    posed: readonly number[],
  ): boolean => {
    const gap: number =
      up.x * (posed[3 * contact.lips.upper] - posed[3 * contact.lips.lower]) +
      up.y *
        (posed[3 * contact.lips.upper + 1] -
          posed[3 * contact.lips.lower + 1]) +
      up.z *
        (posed[3 * contact.lips.upper + 2] - posed[3 * contact.lips.lower + 2]);
    return Number.isFinite(gap) && Math.abs(gap) <= contact.toleranceMetres;
  };
  const merit: (gaps: readonly number[]) => number = (
    gaps: readonly number[],
  ): number =>
    gaps.reduce(
      (maximum: number, gap: number): number =>
        Math.max(maximum, Math.abs(gap) - contact.toleranceMetres),
      0,
    );
  let current: number[] = new Array<number>(keys.length).fill(0);
  // Restore graph feasibility first when the initial central field is outside
  // that domain. An invalid polyline supplies no arbitrary contact bracket.
  // Subsequent contact steps retain the same graph rows in the same field.
  let linearizationPoints: IHumanFaceLipMarginPoints | undefined;
  let linearization: number[] = [...current];
  const graphHistory: Map<number, IHumanFaceMarginGraphViolation[]> = new Map<
    number,
    IHumanFaceMarginGraphViolation[]
  >();
  const beforeGraphHistory: Map<number, IHumanFaceMarginGraphViolation[]> =
    new Map<number, IHumanFaceMarginGraphViolation[]>();
  for (let iteration: number = 0; iteration <= 32; iteration++) {
    if (!lips.every(Number.isFinite))
      throw new Error(
        "Native closure returned a nonfinite resident gain field.",
      );
    const beforeReplay: number[] = pose();
    const posed: number[] = replayHumanFaceSourceRefinements(
      plan,
      beforeReplay,
    );
    const points: IHumanFaceLipMarginPoints = readHumanFaceLipMarginPoints(
      surface,
      margin,
      posed,
    );
    const violations: IHumanFaceMarginGraphViolation[] =
      readHumanFaceMarginGraphViolations(points, axis, up);
    graphHistory.set(iteration, violations);
    const before: IHumanFaceLipMarginPoints = readHumanFaceLipMarginPoints(
      surface,
      margin,
      beforeReplay,
    );
    beforeGraphHistory.set(
      iteration,
      readHumanFaceMarginGraphViolations(before, axis, up),
    );
    const gaps: number[] | undefined =
      violations.length === 0
        ? measureHumanFaceMarginGaps(posed, margin, axis, up, surface)
        : undefined;
    if (iteration === 32 && violations.length !== 0) {
      const describe: (point: IHumanFaceLipMarginPoint) => {
        alongMetres: number;
        heightMetres: number;
        support: {
          vertex: number;
          source: number;
          weight: number;
          gain: number;
          scale: number;
          responseAlongMetres: number;
          responseHeightMetres: number;
          unitGainAlongMetres: number;
          unitGainHeightMetres: number;
        }[];
        point: IAutoMovieVector3Imported;
        vertices: readonly number[];
        weights: readonly number[];
        identity: string;
        nativeVertex: number | null;
      } = (
        point: IHumanFaceLipMarginPoint,
      ): {
        alongMetres: number;
        heightMetres: number;
        support: {
          vertex: number;
          source: number;
          weight: number;
          gain: number;
          scale: number;
          responseAlongMetres: number;
          responseHeightMetres: number;
          unitGainAlongMetres: number;
          unitGainHeightMetres: number;
        }[];
        point: IAutoMovieVector3Imported;
        vertices: readonly number[];
        weights: readonly number[];
        identity: string;
        nativeVertex: number | null;
      } => ({
        ...point,
        alongMetres: dot(point.point, axis),
        heightMetres: dot(point.point, upArray),
        support: [...weights(point)].map(
          ([vertex, weight]: [number, number]): {
            vertex: number;
            source: number;
            weight: number;
            gain: number;
            scale: number;
            responseAlongMetres: number;
            responseHeightMetres: number;
            unitGainAlongMetres: number;
            unitGainHeightMetres: number;
          } => ({
            vertex,
            source: key(vertex),
            weight,
            gain: lips[vertex],
            scale: scale[columns.get(key(vertex))!],
            responseAlongMetres: dot(responses[vertex], axis),
            responseHeightMetres: dot(responses[vertex], upArray),
            unitGainAlongMetres:
              scale[columns.get(key(vertex))!] === 0
                ? 0
                : dot(responses[vertex], axis) /
                  scale[columns.get(key(vertex))!],
            unitGainHeightMetres:
              scale[columns.get(key(vertex))!] === 0
                ? 0
                : dot(responses[vertex], upArray) /
                  scale[columns.get(key(vertex))!],
          }),
        ),
      });
      throw new Error(
        "Native closure graph refusal: " +
          JSON.stringify({
            iteration,
            phase: "coupled-field",
            ratio,
            axis,
            up,
            sourcePoseGeneration: plan?.generation ?? null,
            budgetMetres: budget,
            toleranceMetres: contact.toleranceMetres,
            actualViolation:
              "Lip aperture course is not a single-valued monotone height graph: " +
              JSON.stringify(violations),
            graphHistory: [...graphHistory],
            beforeGraphHistory: [...beforeGraphHistory],
            beforeReplay: {
              upper: before.upper.map(describe),
              lower: before.lower.map(describe),
            },
            afterReplay: {
              upper: points.upper.map(describe),
              lower: points.lower.map(describe),
            },
          }),
      );
    }
    if (
      gaps !== undefined &&
      gaps.every(
        (gap: number): boolean =>
          Number.isFinite(gap) && Math.abs(gap) <= contact.toleranceMetres,
      )
    ) {
      if (!centralValid(posed))
        throw new Error(
          "Native closure lost the actual central pair after source refinement.",
        );
      return lips;
    }
    if (iteration === 32)
      throw new Error(
        "Native lip closure failed actual posed contact after 32 affine relinearizations; maximum absolute gap " +
          gaps!.reduce(
            (maximum: number, gap: number): number =>
              Math.max(maximum, Math.abs(gap)),
            0,
          ) +
          " m.",
      );
    if (violations.length === 0) {
      linearizationPoints = points;
      linearization = [...current];
    }
    if (!(budget > 0))
      throw new Error(
        "Native lip closure needs movement outside its zero tissue budget.",
      );
    const rows: IAutoMovieQuadraticRow[] = keys.map(
      (
        _: number,
        at: number,
      ): {
        indices: number[];
        weights: number[];
        lower: number;
        upper: number;
      } => ({ indices: [at], weights: [1], lower: -1, upper: 1 }),
    );
    const centralStart: number = rows.length;
    for (const vertex of [contact.lips.upper, contact.lips.lower])
      for (const direction of [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]) {
        const row: Map<number, number> = new Map<number, number>();
        for (const [corner, weight] of nativeSupport(vertex)) {
          const at: number = columns.get(key(corner))!;
          row.set(
            at,
            (row.get(at) ?? 0) +
              (weight * dot(responses[corner], direction)) / budget,
          );
        }
        rows.push({
          indices: [...row.keys()],
          weights: [...row.values()],
          lower: 0,
          upper: 0,
        });
      }
    const graphStart: number = rows.length;
    const slackColumn: number = keys.length;
    [points.upper, points.lower].forEach(
      (course: IHumanFaceLipMarginPoint[], side: number): void => {
        const reference: IHumanFaceLipMarginPoint[] =
          side === 0 ? initial.upper : initial.lower;
        const span: number =
          dot(reference[reference.length - 1].point, axis) -
          dot(reference[0].point, axis);
        const direction: number = Math.sign(span);
        if (direction === 0)
          throw new Error(
            "Native closure source course has no directed axis span.",
          );
        const spacing: number = Math.abs(span) / (reference.length - 1);
        for (let at: number = 0; at + 1 < course.length; at++) {
          const first: IHumanFaceLipMarginPoint = course[at],
            second: IHumanFaceLipMarginPoint = course[at + 1];
          const row: Map<number, number> = projection(second, axis);
          for (const [column, value] of projection(first, axis))
            row.set(column, (row.get(column) ?? 0) - value);
          const difference: number =
            dot(second.point, axis) - dot(first.point, axis);
          const target: number =
            -difference +
            [...row].reduce(
              (sum: number, [column, value]: [number, number]): number =>
                sum + value * current[column],
              0,
            );
          const fixed: boolean = [...row.values()].every(
            (value: number): boolean => value === 0,
          );
          rows.push({
            indices: [...row.keys(), ...(fixed ? [] : [slackColumn])],
            weights: [...row.values()]
              .map((value: number): number => (direction * value) / budget)
              .concat(fixed ? [] : [-spacing / budget]),
            lower: (direction * target) / budget,
            upper: null,
          });
          if (fixed && difference === 0) {
            const heightRow: Map<number, number> = projection(second, upArray);
            for (const [column, value] of projection(first, upArray))
              heightRow.set(column, (heightRow.get(column) ?? 0) - value);
            const heightTarget: number =
              dot(first.point, upArray) -
              dot(second.point, upArray) +
              [...heightRow].reduce(
                (sum: number, [column, value]: [number, number]): number =>
                  sum + value * current[column],
                0,
              );
            rows.push({
              indices: [...heightRow.keys()],
              weights: [...heightRow.values()].map(
                (value: number): number => value / budget,
              ),
              lower: heightTarget / budget,
              upper: heightTarget / budget,
            });
          }
        }
      },
    );
    const contactStart: number = rows.length;
    const along: (point: IHumanFaceLipMarginPoint) => number = (
      point: IHumanFaceLipMarginPoint,
    ): number => dot(point.point, axis);
    const height: (point: IHumanFaceLipMarginPoint) => number = (
      point: IHumanFaceLipMarginPoint,
    ): number => dot(point.point, upArray);
    const equation: (
      point: IHumanFaceLipMarginPoint,
      opposite: readonly IHumanFaceLipMarginPoint[],
    ) => void = (
      point: IHumanFaceLipMarginPoint,
      opposite: readonly IHumanFaceLipMarginPoint[],
    ): void => {
      const position: number = along(point);
      const ascending: boolean =
        along(opposite[opposite.length - 1]) >= along(opposite[0]);
      const before: (a: number, b: number) => boolean = (
        a: number,
        b: number,
      ): boolean => (ascending ? a <= b : a >= b);
      let a: IHumanFaceLipMarginPoint = opposite[0],
        b: IHumanFaceLipMarginPoint = a;
      if (before(along(opposite[opposite.length - 1]), position)) {
        a = opposite[opposite.length - 1];
        b = a;
      } else if (!before(position, along(a)))
        for (let j: number = 0; j + 1 < opposite.length; j++)
          if (
            before(along(opposite[j]), position) &&
            before(position, along(opposite[j + 1]))
          ) {
            a = opposite[j];
            b = opposite[j + 1];
            break;
          }
      const span: number = along(b) - along(a);
      const t: number = span === 0 ? 0 : (position - along(a)) / span;
      const slope: number = span === 0 ? 0 : (height(b) - height(a)) / span;
      const row: Map<number, number> = coefficients(point, slope);
      for (const [node, coefficient] of coefficients(a, slope))
        row.set(node, (row.get(node) ?? 0) - (1 - t) * coefficient);
      for (const [node, coefficient] of coefficients(b, slope))
        row.set(node, (row.get(node) ?? 0) - t * coefficient);
      // A uniformly increased gain must move the material seat along opening;
      // use per-unit-gain response at the existing closure owner's threshold.
      let movable: number = 0;
      for (const [vertex, weight] of weights(point)) {
        const at: number = columns.get(key(vertex))!;
        if (scale[at] !== 0)
          movable += (weight * dot(responses[vertex], upArray)) / scale[at];
      }
      const gap: number = height(point) - ((1 - t) * height(a) + t * height(b));
      if (
        Math.abs(gap) > contact.toleranceMetres &&
        !(Math.abs(movable) > movableMetres)
      )
        throw new Error(
          "Closure does not move native lip point " +
            point.identity +
            " along the opening direction.",
        );
      const target: number =
        -gap +
        [...row].reduce(
          (sum: number, [at, value]: [number, number]): number =>
            sum + value * linearization[at],
          0,
        );
      rows.push({
        indices: [...row.keys()],
        weights: [...row.values()].map(
          (value: number): number => value / budget,
        ),
        lower: (target - contact.toleranceMetres) / budget,
        upper: (target + contact.toleranceMetres) / budget,
      });
    };
    if (linearizationPoints !== undefined) {
      linearizationPoints.upper.forEach(
        (point: IHumanFaceLipMarginPoint): void =>
          equation(point, linearizationPoints!.lower),
      );
      linearizationPoints.lower.forEach(
        (point: IHumanFaceLipMarginPoint): void =>
          equation(point, linearizationPoints!.upper),
      );
    }
    const contactEnd: number = rows.length;
    rows.push({ indices: [slackColumn], weights: [1], lower: 0, upper: 1 });
    const step: IHumanFaceNativeClosureStepImported =
      solveHumanFaceNativeClosureStep({
        rows,
        variables: keys.length,
        contactStart,
        contactEnd,
      });
    let fraction: number = 1;
    let accepted: boolean = false;
    const currentMerit: number = gaps === undefined ? Infinity : merit(gaps);
    while (fraction > 0) {
      const candidate: number[] = current.map(
        (value: number, at: number): number =>
          value + fraction * (step.field[at] - value),
      );
      if (
        candidate.every(
          (value: number, at: number): boolean => value === current[at],
        )
      )
        break;
      const field: Float64Array<ArrayBufferLike> | null = fieldOf(candidate);
      if (
        field !== null &&
        field.every((value: number, at: number): boolean => value === lips[at])
      )
        break;
      if (field !== null) {
        const candidatePosed: number[] = replayHumanFaceSourceRefinements(
          plan,
          pose(field),
        );
        const candidatePoints: IHumanFaceLipMarginPoints =
          readHumanFaceLipMarginPoints(surface, margin, candidatePosed);
        if (
          readHumanFaceMarginGraphViolations(candidatePoints, axis, up)
            .length === 0 &&
          centralValid(candidatePosed)
        ) {
          const candidateGaps: number[] = measureHumanFaceMarginGaps(
            candidatePosed,
            margin,
            axis,
            up,
            surface,
          );
          if (
            candidateGaps.every(Number.isFinite) &&
            merit(candidateGaps) < currentMerit
          ) {
            current = candidate;
            lips = field;
            accepted = true;
            break;
          }
        }
      }
      fraction /= 2;
    }
    if (!accepted)
      throw new Error(
        "Native closure step did not reduce actual aperture inside its original domain: " +
          JSON.stringify({
            iteration,
            apertureSlack: step.apertureSlack,
            spacingSlack: step.spacingSlack,
            currentMerit,
            ratio,
            budgetMetres: budget,
            toleranceMetres: contact.toleranceMetres,
            axis,
            up,
            variableSourceSamples: keys,
            gainScales: scale,
            current,
            linearization,
            currentPoints: points,
            currentGapsMetres: gaps ?? null,
            linearizationPoints,
            rowGroups: {
              budget: [0, centralStart],
              central: [centralStart, graphStart],
              graph: [graphStart, contactStart],
              contact: [contactStart, contactEnd],
              slack: [contactEnd, rows.length],
            },
            rows,
            graphHistory: [...graphHistory],
            beforeGraphHistory: [...beforeGraphHistory],
          }),
      );
  }
  throw new Error(
    "Native lip closure failed actual posed contact after 32 affine relinearizations.",
  );
}
