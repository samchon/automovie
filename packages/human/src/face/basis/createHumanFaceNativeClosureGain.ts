import type { IAutoMovieQuadraticRow } from "@automovie/engine";
import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IHumanFaceNativeClosureGainInput } from "./IHumanFaceNativeClosureGainInput";
import type { IHumanFaceLipMarginPoint } from "./IHumanFaceLipMarginPoint";
import { readHumanFaceLipMarginPoints } from "./readHumanFaceLipMarginPoints";
import { measureHumanFaceMarginGaps } from "./measureHumanFaceMarginGaps";
import { poseHumanFaceSurface } from "./poseHumanFaceSurface";
import { replayHumanFaceSourceRefinements } from "./replayHumanFaceSourceRefinements";
import { readHumanFaceMarginGraphViolations } from "./readHumanFaceMarginGraphViolations";
import type { IHumanFaceMarginGraphViolation } from "./IHumanFaceMarginGraphViolation";
import type { IHumanFaceLipMarginPoints } from "./IHumanFaceLipMarginPoints";
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
 * @evidence contracts/common.md#principled-implementation Sparse affine contact and directed along rows couple every native support gain with one source-sample variable. Graph restoration precedes contact linearization; contact elasticity stays inside the original hard domain and actual graph, aperture merit, central pair and budget predicates verify every backtracked candidate independently of QP status.
 * @evidence contracts/common.md#clear-and-simple-design One native solver owns field variables, contact rows and final verification; the existing engine owns the sparse quadratic solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source anchor, request, tolerance or tissue extent is changed; unsolved original geometry refuses.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes coupled affine rows, sequential linearization and actual-output acceptance, including the finite iteration limit.
 * @evidence contracts/modeling.md#parameter-channels Returns the per-vertex scaling of the original closure endpoint with the original central gain.
 * @evidence contracts/modeling.md#spatial-conventions Physical heights use canonical head-frame metres; QP variables and rows are divided by the existing tissue budget.
 * @evidence contracts/modeling.md#shared-boundaries Both native source courses constrain the same vertex field and source aliases share one gain.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Changes no topology or primitive count.
 * @evidenceExclude contracts/modeling.md#rendered-observation The final face assembly observes the returned field.
 * @evidenceExclude contracts/anatomy.md#anatomical-source These geometric constraints introduce no measured tissue mechanics or clinical claim.
 * @evidence contracts/anatomy.md#permitted-range Each vertex's departure from central closure remains inside the original tissue budget and the final gap retains the original contact tolerance.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived fields add no personal sculpt input.
 * @author Samchon
 */
export function createHumanFaceNativeClosureGain(input: IHumanFaceNativeClosureGainInput): Float64Array {
  const { surface, contact, positions, motions, axis, up, ratio, budget, delta, movableMetres } = input;
  const margin = contact.margin;
  if (margin?.kind !== "material" || delta.length !== positions.length ||
      !delta.every(Number.isFinite) || !Number.isFinite(ratio) ||
      !Number.isFinite(budget) || budget < 0 || !Number.isFinite(movableMetres) || movableMetres <= 0)
    throw new Error("Native closure needs material courses, matching finite deltas, a finite ratio and the original nonnegative budget.");
  const count = positions.length / 3;
  const initial = readHumanFaceLipMarginPoints(surface, margin, positions);
  const plan = surface.sourcePosePlan;
  const nativeCount = plan?.nativeVertices ?? count;
  const parents = (vertex: number): number[] => vertex < nativeCount ? [vertex] :
    plan!.nativeTriangles.slice(3 * plan!.samples[vertex - nativeCount].parent,
      3 * plan!.samples[vertex - nativeCount].parent + 3);
  const nativeSupport = (vertex: number): Map<number, number> => {
    const sample = vertex < nativeCount ? undefined : plan!.samples[vertex - nativeCount];
    const bary = sample === undefined ? [1] : [
      interpolateHumanBasisSourceTriangle([1, 0, 0], sample.coordinates),
      interpolateHumanBasisSourceTriangle([0, 1, 0], sample.coordinates),
      interpolateHumanBasisSourceTriangle([0, 0, 1], sample.coordinates),
    ];
    const support = new Map<number, number>();
    parents(vertex).forEach((corner, at) => {
      if (bary[at] !== 0) support.set(corner, bary[at]);
    });
    return support;
  };
  const weights = (point: IHumanFaceLipMarginPoint): Map<number, number> => {
    const result = new Map<number, number>();
    point.vertices.forEach((vertex, at) => {
      for (const [corner, bary] of nativeSupport(vertex))
        result.set(corner, (result.get(corner) ?? 0) + point.weights[at] * bary);
    });
    return new Map([...result].filter((entry) => entry[1] !== 0));
  };
  const support = new Set([...initial.upper, ...initial.lower].flatMap((point) => [...weights(point).keys()]));
  for (const vertex of [contact.lips.upper, contact.lips.lower])
    for (const corner of nativeSupport(vertex).keys()) support.add(corner);
  const key = (vertex: number) => surface.sourcePartition?.samples[vertex] ?? vertex;
  const keys = [...new Set([...support].map(key))];
  const columns = new Map(keys.map((value, at) => [value, at]));
  const reach = Array.from({ length: count }, (_, vertex) =>
    Math.hypot(delta[3 * vertex], delta[3 * vertex + 1], delta[3 * vertex + 2]));
  const maximumReach = new Map<number, number>();
  for (let vertex = 0; vertex < nativeCount; vertex++)
    maximumReach.set(key(vertex), Math.max(maximumReach.get(key(vertex)) ?? 0, reach[vertex]));
  const scale = keys.map((value) => {
    const maximum = maximumReach.get(value) ?? 0;
    return maximum > 0 && budget > 0 ? budget / maximum : 0;
  });
  let lips: Float64Array = new Float64Array(count).fill(ratio);
  const p0 = poseHumanFaceSurface(positions.map((value, at) => value + ratio * delta[at]),
    surface.attachments ?? [], motions);
  const p1 = poseHumanFaceSurface(positions.map((value, at) => {
    const column = columns.get(key(Math.floor(at / 3)));
    return value + (ratio + (column === undefined ? 0 : scale[column])) * delta[at];
  }), surface.attachments ?? [], motions);
  const responses = Array.from({ length: count }, (_, vertex) => ({
    x: p1[3 * vertex] - p0[3 * vertex],
    y: p1[3 * vertex + 1] - p0[3 * vertex + 1],
    z: p1[3 * vertex + 2] - p0[3 * vertex + 2],
  }));
  const dot = (point: typeof up, direction: readonly number[]) =>
    point.x * direction[0] + point.y * direction[1] + point.z * direction[2];
  const upArray = [up.x, up.y, up.z];
  // Refinement uses an affine native triangle; its closure response must follow
  // those original corners rather than a gain on an overwritten derived vertex.
  const coefficients = (point: IHumanFaceLipMarginPoint, slope: number): Map<number, number> => {
    const result = new Map<number, number>();
    for (const [vertex, weight] of weights(point)) {
      const at = columns.get(key(vertex));
      if (at !== undefined) result.set(at, (result.get(at) ?? 0) + weight *
        (dot(responses[vertex], upArray) - slope * dot(responses[vertex], axis)));
    }
    return result;
  };
  const projection = (point: IHumanFaceLipMarginPoint, direction: readonly number[]): Map<number, number> => {
    const result = new Map<number, number>();
    for (const [vertex, weight] of weights(point)) {
      const at = columns.get(key(vertex))!;
      result.set(at, (result.get(at) ?? 0) + weight * dot(responses[vertex], direction));
    }
    return result;
  };
  const pose = (field: Float64Array = lips): number[] => poseHumanFaceSurface(
    positions.map((value, at) => value + delta[at] * field[Math.floor(at / 3)]),
    surface.attachments ?? [], motions);
  const fieldOf = (variables: readonly number[]): Float64Array | null => {
    const field = new Float64Array(count).fill(ratio);
    for (let vertex = 0; vertex < count; vertex++) {
      const at = columns.get(key(vertex));
      field[vertex] = at === undefined ? ratio : ratio + scale[at] * variables[at];
      if (at === undefined && reach[vertex] > 0) {
        let nearest = Infinity, sum = 0, total = 0;
        for (const node of support) {
          const distance = Math.hypot(positions[3 * vertex] - positions[3 * node],
            positions[3 * vertex + 1] - positions[3 * node + 1],
            positions[3 * vertex + 2] - positions[3 * node + 2]);
          const column = columns.get(key(node))!;
          if (distance === 0) {
            nearest = 0; sum = scale[column] * variables[column]; total = 1; break;
          }
          nearest = Math.min(nearest, distance);
          const weight = 1 / (distance * distance);
          sum += weight * scale[column] * variables[column]; total += weight;
        }
        field[vertex] = ratio + Math.max(0, 1 - nearest / budget) * sum / total;
      }
      if (!Number.isFinite(field[vertex]) ||
          (vertex < nativeCount && Math.abs(field[vertex] - ratio) * reach[vertex] > budget)) return null;
    }
    return field;
  };
  const centralValid = (posed: readonly number[]): boolean => {
    const gap = up.x * (posed[3 * contact.lips.upper] - posed[3 * contact.lips.lower]) +
      up.y * (posed[3 * contact.lips.upper + 1] - posed[3 * contact.lips.lower + 1]) +
      up.z * (posed[3 * contact.lips.upper + 2] - posed[3 * contact.lips.lower + 2]);
    return Number.isFinite(gap) && Math.abs(gap) <= contact.toleranceMetres;
  };
  const merit = (gaps: readonly number[]): number => gaps.reduce((maximum, gap) =>
    Math.max(maximum, Math.abs(gap) - contact.toleranceMetres), 0);
  let current = new Array<number>(keys.length).fill(0);
  // Restore graph feasibility first when the initial central field is outside
  // that domain. An invalid polyline supplies no arbitrary contact bracket.
  // Subsequent contact steps retain the same graph rows in the same field.
  let linearizationPoints: IHumanFaceLipMarginPoints | undefined;
  let linearization = [...current];
  const graphHistory = new Map<number, IHumanFaceMarginGraphViolation[]>();
  const beforeGraphHistory = new Map<number, IHumanFaceMarginGraphViolation[]>();
  for (let iteration = 0; iteration <= 32; iteration++) {
    if (!lips.every(Number.isFinite))
      throw new Error("Native closure returned a nonfinite resident gain field.");
    const beforeReplay = pose();
    const posed = replayHumanFaceSourceRefinements(plan, beforeReplay);
    const points = readHumanFaceLipMarginPoints(surface, margin, posed);
    const violations = readHumanFaceMarginGraphViolations(points, axis, up);
    graphHistory.set(iteration, violations);
    const before = readHumanFaceLipMarginPoints(surface, margin, beforeReplay);
    beforeGraphHistory.set(iteration, readHumanFaceMarginGraphViolations(before, axis, up));
    const gaps = violations.length === 0
      ? measureHumanFaceMarginGaps(posed, margin, axis, up, surface) : undefined;
    if (iteration === 32 && violations.length !== 0) {
      const describe = (point: IHumanFaceLipMarginPoint) => ({
        ...point, alongMetres: dot(point.point, axis), heightMetres: dot(point.point, upArray),
        support: [...weights(point)].map(([vertex, weight]) => ({
          vertex, source: key(vertex), weight, gain: lips[vertex],
          scale: scale[columns.get(key(vertex))!],
          responseAlongMetres: dot(responses[vertex], axis),
          responseHeightMetres: dot(responses[vertex], upArray),
          unitGainAlongMetres: scale[columns.get(key(vertex))!] === 0 ? 0 :
            dot(responses[vertex], axis) / scale[columns.get(key(vertex))!],
          unitGainHeightMetres: scale[columns.get(key(vertex))!] === 0 ? 0 :
            dot(responses[vertex], upArray) / scale[columns.get(key(vertex))!],
        })),
      });
      throw new Error("Native closure graph refusal: " + JSON.stringify({
        iteration, phase: "coupled-field", ratio,
        axis, up, sourcePoseGeneration: plan?.generation ?? null,
        budgetMetres: budget, toleranceMetres: contact.toleranceMetres,
        actualViolation: "Lip aperture course is not a single-valued monotone height graph: " + JSON.stringify(violations),
        graphHistory: [...graphHistory], beforeGraphHistory: [...beforeGraphHistory],
        beforeReplay: { upper: before.upper.map(describe), lower: before.lower.map(describe) },
        afterReplay: { upper: points.upper.map(describe), lower: points.lower.map(describe) },
      }));
    }
    if (gaps !== undefined && gaps.every((gap) => Number.isFinite(gap) && Math.abs(gap) <= contact.toleranceMetres)) {
      if (!centralValid(posed))
        throw new Error("Native closure lost the actual central pair after source refinement.");
      return lips;
    }
    if (iteration === 32)
      throw new Error("Native lip closure failed actual posed contact after 32 affine relinearizations; maximum absolute gap " + gaps!.reduce((maximum, gap) => Math.max(maximum, Math.abs(gap)), 0) + " m.");
    if (violations.length === 0) {
      linearizationPoints = points;
      linearization = [...current];
    }
    if (!(budget > 0)) throw new Error("Native lip closure needs movement outside its zero tissue budget.");
    const rows: IAutoMovieQuadraticRow[] = keys.map((_, at) => ({ indices: [at], weights: [1], lower: -1, upper: 1 }));
    const centralStart = rows.length;
    for (const vertex of [contact.lips.upper, contact.lips.lower])
      for (const direction of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
        const row = new Map<number, number>();
        for (const [corner, weight] of nativeSupport(vertex)) {
          const at = columns.get(key(corner))!;
          row.set(at, (row.get(at) ?? 0) + weight * dot(responses[corner], direction) / budget);
        }
        rows.push({ indices: [...row.keys()], weights: [...row.values()], lower: 0, upper: 0 });
      }
    const graphStart = rows.length;
    const slackColumn = keys.length;
    [points.upper, points.lower].forEach((course, side) => {
      const reference = side === 0 ? initial.upper : initial.lower;
      const span = dot(reference[reference.length - 1].point, axis) - dot(reference[0].point, axis);
      const direction = Math.sign(span);
      if (direction === 0) throw new Error("Native closure source course has no directed axis span.");
      const spacing = Math.abs(span) / (reference.length - 1);
      for (let at = 0; at + 1 < course.length; at++) {
        const first = course[at], second = course[at + 1];
        const row = projection(second, axis);
        for (const [column, value] of projection(first, axis)) row.set(column, (row.get(column) ?? 0) - value);
        const difference = dot(second.point, axis) - dot(first.point, axis);
        const target = -difference + [...row].reduce((sum, [column, value]) => sum + value * current[column], 0);
        const fixed = [...row.values()].every((value) => value === 0);
        rows.push({ indices: [...row.keys(), ...(fixed ? [] : [slackColumn])],
          weights: [...row.values()].map((value) => direction * value / budget).concat(fixed ? [] : [-spacing / budget]),
          lower: direction * target / budget, upper: null });
        if (fixed && difference === 0) {
          const heightRow = projection(second, upArray);
          for (const [column, value] of projection(first, upArray)) heightRow.set(column, (heightRow.get(column) ?? 0) - value);
          const heightTarget = dot(first.point, upArray) - dot(second.point, upArray) +
            [...heightRow].reduce((sum, [column, value]) => sum + value * current[column], 0);
          rows.push({ indices: [...heightRow.keys()], weights: [...heightRow.values()].map((value) => value / budget),
            lower: heightTarget / budget, upper: heightTarget / budget });
        }
      }
    });
    const contactStart = rows.length;
    const along = (point: IHumanFaceLipMarginPoint) => dot(point.point, axis);
    const height = (point: IHumanFaceLipMarginPoint) => dot(point.point, upArray);
    const equation = (point: IHumanFaceLipMarginPoint, opposite: readonly IHumanFaceLipMarginPoint[]) => {
      const position = along(point);
      const ascending = along(opposite[opposite.length - 1]) >= along(opposite[0]);
      const before = (a: number, b: number) => ascending ? a <= b : a >= b;
      let a = opposite[0], b = a;
      if (before(along(opposite[opposite.length - 1]), position)) {
        a = opposite[opposite.length - 1];
        b = a;
      }
      else if (!before(position, along(a)))
        for (let j = 0; j + 1 < opposite.length; j++)
          if (before(along(opposite[j]), position) && before(position, along(opposite[j + 1]))) {
            a = opposite[j]; b = opposite[j + 1]; break;
          }
      const span = along(b) - along(a);
      const t = span === 0 ? 0 : (position - along(a)) / span;
      const slope = span === 0 ? 0 : (height(b) - height(a)) / span;
      const row = coefficients(point, slope);
      for (const [node, coefficient] of coefficients(a, slope)) row.set(node, (row.get(node) ?? 0) - (1 - t) * coefficient);
      for (const [node, coefficient] of coefficients(b, slope)) row.set(node, (row.get(node) ?? 0) - t * coefficient);
      // A uniformly increased gain must move the material seat along opening;
      // use per-unit-gain response at the existing closure owner's threshold.
      let movable = 0;
      for (const [vertex, weight] of weights(point)) {
        const at = columns.get(key(vertex))!;
        if (scale[at] !== 0) movable += weight * dot(responses[vertex], upArray) / scale[at];
      }
      const gap = height(point) - ((1 - t) * height(a) + t * height(b));
      if (Math.abs(gap) > contact.toleranceMetres && !(Math.abs(movable) > movableMetres))
        throw new Error("Closure does not move native lip point " + point.identity + " along the opening direction.");
      const target = -gap + [...row].reduce((sum, [at, value]) => sum + value * linearization[at], 0);
      rows.push({ indices: [...row.keys()], weights: [...row.values()].map((value) => value / budget),
        lower: (target - contact.toleranceMetres) / budget,
        upper: (target + contact.toleranceMetres) / budget });
    };
    if (linearizationPoints !== undefined) {
      linearizationPoints.upper.forEach((point) => equation(point, linearizationPoints!.lower));
      linearizationPoints.lower.forEach((point) => equation(point, linearizationPoints!.upper));
    }
    const contactEnd = rows.length;
    rows.push({ indices: [slackColumn], weights: [1], lower: 0, upper: 1 });
    const step = solveHumanFaceNativeClosureStep({ rows, variables: keys.length, contactStart, contactEnd });
    let fraction = 1;
    let accepted = false;
    const currentMerit = gaps === undefined ? Infinity : merit(gaps);
    while (fraction > 0) {
      const candidate = current.map((value, at) => value + fraction * (step.field[at] - value));
      if (candidate.every((value, at) => value === current[at])) break;
      const field = fieldOf(candidate);
      if (field !== null && field.every((value, at) => value === lips[at])) break;
      if (field !== null) {
        const candidatePosed = replayHumanFaceSourceRefinements(plan, pose(field));
        const candidatePoints = readHumanFaceLipMarginPoints(surface, margin, candidatePosed);
        if (readHumanFaceMarginGraphViolations(candidatePoints, axis, up).length === 0 && centralValid(candidatePosed)) {
          const candidateGaps = measureHumanFaceMarginGaps(candidatePosed, margin, axis, up, surface);
          if (candidateGaps.every(Number.isFinite) && merit(candidateGaps) < currentMerit) {
            current = candidate; lips = field; accepted = true; break;
          }
        }
      }
      fraction /= 2;
    }
    if (!accepted) throw new Error("Native closure step did not reduce actual aperture inside its original domain: " + JSON.stringify({
      iteration, apertureSlack: step.apertureSlack, spacingSlack: step.spacingSlack, currentMerit,
      ratio, budgetMetres: budget, toleranceMetres: contact.toleranceMetres, axis, up,
      variableSourceSamples: keys, gainScales: scale, current, linearization,
      currentPoints: points, currentGapsMetres: gaps ?? null, linearizationPoints,
      rowGroups: { budget: [0, centralStart], central: [centralStart, graphStart],
        graph: [graphStart, contactStart], contact: [contactStart, contactEnd], slack: [contactEnd, rows.length] },
      rows, graphHistory: [...graphHistory], beforeGraphHistory: [...beforeGraphHistory],
    }));
  }
  throw new Error("Native lip closure failed actual posed contact after 32 affine relinearizations.");
}
