import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanBodyUnderwearLiftLinearizerInput } from "./IHumanBodyUnderwearLiftLinearizerInput";
import type { IHumanBodyUnderwearNormalLinearization } from "./IHumanBodyUnderwearNormalLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";

/**
 * Differentiate the same area-normal, shortest-arc and unit-normal operations
 * used by the actual garment evaluator, with respect to candidate base XYZ.
 *
 * Triangle area derivatives assemble each vertex's actual one-ring dependence.
 * Area-normal projection removes its radial derivative. The engine's explicit
 * sin < 1e-12 branches are constant in the fitted direction, including its
 * deterministic antiparallel turn; their derivative is zero in the branch
 * interior. The exact switching boundary has no shared derivative.
 *
 * The regular branch differentiates its quaternion and rotateVector expression,
 * including the final returned-normal normalization. This is an analytic local
 * real-arithmetic model of that forward branch, not the derivative of binary64
 * rounding. Nonzero finite normal and representable derivative requirements are
 * reported explicitly. The evaluator alone accepts an actual candidate.
 *
 * @evidence contracts/common.md#principled-implementation Analytic triangle-area and unit-vector derivatives propagate through the actual shortest-arc quaternion branch and returned-normal normalization; one-ring sparse maps include every incident face dependency.
 * @evidence contracts/common.md#clear-and-simple-design Owns one numerical result consumed by the connected garment fit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves supplied material, signed offset and strict final acceptance; no numerical differencing or geometry tolerance is introduced.
 * @evidence contracts/common.md#meaningful-documentation States units, derivative meaning, numerical domain and final-acceptance limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical garment data defines no independent part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries existing material values without adding an authoring trait.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Computes no new render primitive.
 * @evidence contracts/modeling.md#spatial-conventions Candidate coordinates and signed offsets use the existing posed skin frame in metres; derivative and raw-area units are documented at their fields.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Retains caller-owned incidence and defines no new geometric join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual garment emitter owns rendered verification; local derivatives establish no appearance.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical quantity or measured range.
 * @evidenceExclude contracts/anatomy.md#permitted-range The anatomical and field owners retain admission; this operation measures only local orientation.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal candidate coordinates are not a public sculpting channel.
 */
export function createHumanBodyUnderwearNormalLinearizer(
  input: IHumanBodyUnderwearLiftLinearizerInput,
): (evaluation: IHumanBodyUnderwearSurfaceEvaluation) => IHumanBodyUnderwearNormalLinearization {
  const original = areaWeightedNormals([...input.points], [...input.indices]);
  return (evaluation) => {
    const count = input.points.length / 3;
    const sums = Array.from({ length: count }, () => [0, 0, 0]);
    const areaDerivatives = Array.from({ length: count }, () => new Map<number, number[]>());
    const derivatives = Array.from({ length: count }, () => new Map<number, number[]>());
    const result: IHumanBodyUnderwearNormalLinearization = { derivatives, unavailable: [] };
    const fitted = areaWeightedNormals([...evaluation.base], [...input.indices]);
    for (let t = 0; t < input.indices.length; t += 3) {
      const ids = input.indices.slice(t, t + 3);
      const e1 = subtract(at(evaluation.base, ids[1]), at(evaluation.base, ids[0]));
      const e2 = subtract(at(evaluation.base, ids[2]), at(evaluation.base, ids[0]));
      const area = cross(e1, e2);
      for (const vertex of ids) {
        add(sums[vertex], area);
        for (let corner = 0; corner < 3; corner++)
          for (let axis = 0; axis < 3; axis++) {
            const direction = [0, 0, 0]; direction[axis] = 1;
            const change = corner === 0 ? cross(subtract(e2, e1), direction)
              : corner === 1 ? cross(direction, e2) : cross(e1, direction);
            const index = ids[corner] * 3 + axis;
            const accumulated = areaDerivatives[vertex].get(index) ?? [0, 0, 0];
            add(accumulated, change);
            areaDerivatives[vertex].set(index, accumulated);
          }
      }
    }
    for (let vertex = 0; vertex < count; vertex++) {
      const fail = (reason: string): void => {
        derivatives[vertex].clear();
        result.unavailable.push({ triangle: null, vertex, sourceVertex: input.sourceVertices[vertex], reason });
      };
      const a = at(original, vertex), b = at(fitted, vertex);
      const scale = Math.max(...sums[vertex].map(Math.abs));
      const scaled = sums[vertex].map((value) => value / scale);
      const areaLength = Math.hypot(...scaled);
      if (!(scale > 0) || !Number.isFinite(scale) || !(areaLength > 0) ||
          !Number.isFinite(areaLength) || !(Math.hypot(...a) > 0) || !(Math.hypot(...b) > 0)) {
        fail("Actual original or fitted area normal has no finite nonzero analytic normalization.");
        continue;
      }
      const axis = cross(a, b);
      const sin = Vector3.length(vector(axis)), cos = dot(a, b);
      if (!Number.isFinite(sin) || !Number.isFinite(cos) || sin === 1e-12) {
        fail("Actual shortest-arc branch is nonfinite or exactly at its derivative switching boundary.");
        continue;
      }
      const quaternion = rotationBetween(vector(a), vector(b));
      const source = at(input.normals, vertex);
      const rotated = Quaternion.rotateVector(quaternion, vector(source));
      const raw = [rotated.x, rotated.y, rotated.z], rawLength = Math.hypot(...raw);
      const returned = at(evaluation.normals, vertex);
      if (!(rawLength > 0) || !Number.isFinite(rawLength) ||
          !returned.every(Number.isFinite) ||
          returned.some((value, coordinate) => value !== raw[coordinate] / rawLength)) {
        fail("Actual returned normal is nonfinite, zero, or belongs to a different forward evaluation.");
        continue;
      }
      if (sin < 1e-12) continue;
      const axisLength = Math.sqrt(dot(axis, axis));
      const theta = Math.atan2(sin, cos);
      const angleDegrees = (theta * 180) / Math.PI;
      const half = (angleDegrees * (Math.PI / 180)) / 2;
      const factor = Math.sin(half) / axisLength;
      const axisUnit = axis.map((value) => value / axisLength);
      const qxyz = [quaternion.x, quaternion.y, quaternion.z];
      const turn = cross(qxyz, source).map((value) => 2 * value);
      let unavailable = false;
      for (const [index, dm] of areaDerivatives[vertex]) {
        const reduced = dm.map((value) => value / scale);
        const db = reduced.map((value, coordinate) =>
          (value - b[coordinate] * dot(b, reduced)) / areaLength);
        const daxis = cross(a, db);
        const dsin = dot(axis, daxis) / sin;
        const dcos = dot(a, db);
        const dtheta = (cos * dsin - sin * dcos) / (sin * sin + cos * cos);
        const dhalf = ((dtheta * 180) / Math.PI * (Math.PI / 180)) / 2;
        const dAxisLength = dot(axis, daxis) / axisLength;
        // Differentiate axis * sin(half)/length in projected form. This is the
        // same chain, avoiding subtraction of two large radial scalar terms
        // near the existing parallel branch boundary.
        const dqxyz = daxis.map((value, coordinate) =>
          (value - axisUnit[coordinate] * dAxisLength) * factor
          + axisUnit[coordinate] * Math.cos(half) * dhalf);
        const dqw = -Math.sin(half) * dhalf;
        const dturn = cross(dqxyz, source).map((value) => 2 * value);
        const firstCross = cross(dqxyz, turn), secondCross = cross(qxyz, dturn);
        const dr = dturn.map((value, coordinate) =>
          dqw * turn[coordinate] + quaternion.w * value + firstCross[coordinate] + secondCross[coordinate]);
        const change = dr.map((value, coordinate) =>
          (value - returned[coordinate] * dot(returned, dr)) / rawLength);
        if (!change.every(Number.isFinite)) { unavailable = true; break; }
        if (change.some((value) => value !== 0)) derivatives[vertex].set(index, change);
      }
      if (unavailable) fail("Actual transported unit-normal derivative is not representable.");
    }
    return result;
  };
}
function at(values: readonly number[], vertex: number): number[] {
  return values.slice(vertex * 3, vertex * 3 + 3);
}
function vector(values: readonly number[]): IAutoMovieVector3 {
  return { x: values[0], y: values[1], z: values[2] };
}
function subtract(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value, coordinate) => value - b[coordinate]);
}
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, value, coordinate) => sum + value * b[coordinate], 0);
}
function add(target: number[], value: readonly number[]): void {
  for (let coordinate = 0; coordinate < 3; coordinate++) target[coordinate] += value[coordinate];
}
