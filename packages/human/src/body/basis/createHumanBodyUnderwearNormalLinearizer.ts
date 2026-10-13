import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanBodyUnderwearLiftLinearizerInput } from "./IHumanBodyUnderwearLiftLinearizerInput";
import type { IHumanBodyUnderwearNormalLinearization } from "./IHumanBodyUnderwearNormalLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";

/**
 * Differentiate the same area-normal, shortest-arc and unit-normal operations used by the actual garment evaluator, with respect to candidate base XYZ.
 *
 * Triangle area derivatives assemble each vertex's actual one-ring dependence. Area-normal projection removes its radial derivative. The engine's explicit sin < 1e-12 branches are constant in the fitted direction, including its deterministic antiparallel turn; their derivative is zero in the branch interior. The exact switching boundary has no shared derivative.
 *
 * The regular branch differentiates its quaternion and rotateVector expression, including the final returned-normal normalization. This is an analytic local real-arithmetic model of that forward branch, not the derivative of binary64 rounding. Nonzero finite normal and representable derivative requirements are reported explicitly. The evaluator alone accepts an actual candidate.
 *
 * @evidence contracts/common.md#principled-implementation Indexed face area derivatives assemble actual one-ring dependence, then analytic normalization, shortest-arc quaternion transport and returned-normal normalization follow the same forward branch.
 * @evidence contracts/common.md#clear-and-simple-design A compiled original normal array serves a candidate reader with per-vertex sparse derivatives and located unavailability; vector operations remain local to this analytic transport model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonzero finite frames, represented derivatives and exact forward-normal agreement are required; switching boundaries remain unavailable and branch-interior derivatives are not derivatives of binary64 rounding or proof of accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies candidate XYZ coordinates, one-ring support, the engine's 1e-12 branch policy, analytic real-arithmetic scope and separate forward acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Face assembly costs linear face work; per-vertex normalization and transport walk actual sparse one-ring entries, retaining O(V plus sparse dependency entries) candidate storage rather than a dense all-vertex Jacobian.
 * @evidence contracts/performance.md#reuse-equivalent-work Original area normals compile once, and accumulated candidate area derivatives are reused through each vertex's normal/rotation chain before the owning lift reader reuses the result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains input and original normals; candidate maps and unavailable records escape only in the returned result, scratch vectors expire, and no external handle or asynchronous work is acquired.
 */
export function createHumanBodyUnderwearNormalLinearizer(
  input: IHumanBodyUnderwearLiftLinearizerInput,
): (evaluation: IHumanBodyUnderwearSurfaceEvaluation) => IHumanBodyUnderwearNormalLinearization {
  const original: number[] = areaWeightedNormals([...input.points], [...input.indices]);
  return (evaluation: IHumanBodyUnderwearSurfaceEvaluation): IHumanBodyUnderwearNormalLinearization => {
    const count: number = input.points.length / 3;
    const sums: number[][] = Array.from({ length: count }, (): number[] => [0, 0, 0]);
    const areaDerivatives: Map<number, number[]>[] = Array.from({ length: count }, (): Map<number, number[]> => new Map<number, number[]>());
    const derivatives: Map<number, number[]>[] = Array.from({ length: count }, (): Map<number, number[]> => new Map<number, number[]>());
    const result: IHumanBodyUnderwearNormalLinearization = { derivatives, unavailable: [] };
    const fitted: number[] = areaWeightedNormals([...evaluation.base], [...input.indices]);
    for (let t: number = 0; t < input.indices.length; t += 3) {
      const ids: number[] = input.indices.slice(t, t + 3);
      const e1: number[] = subtract(at(evaluation.base, ids[1]), at(evaluation.base, ids[0]));
      const e2: number[] = subtract(at(evaluation.base, ids[2]), at(evaluation.base, ids[0]));
      const area: number[] = cross(e1, e2);
      for (const vertex of ids) {
        add(sums[vertex], area);
        for (let corner: number = 0; corner < 3; corner++)
          for (let axis: number = 0; axis < 3; axis++) {
            const direction: number[] = [0, 0, 0]; direction[axis] = 1;
            const change: number[] = corner === 0 ? cross(subtract(e2, e1), direction)
              : corner === 1 ? cross(direction, e2) : cross(e1, direction);
            const index: number = ids[corner] * 3 + axis;
            const accumulated: number[] = areaDerivatives[vertex].get(index) ?? [0, 0, 0];
            add(accumulated, change);
            areaDerivatives[vertex].set(index, accumulated);
          }
      }
    }
    for (let vertex: number = 0; vertex < count; vertex++) {
      const fail: (reason: string) => void = (reason: string): void => {
        derivatives[vertex].clear();
        result.unavailable.push({ triangle: null, vertex, sourceVertex: input.sourceVertices[vertex], reason });
      };
      const a: number[] = at(original, vertex), b: number[] = at(fitted, vertex);
      const scale: number = Math.max(...sums[vertex].map(Math.abs));
      const scaled: number[] = sums[vertex].map((value: number): number => value / scale);
      const areaLength: number = Math.hypot(...scaled);
      if (!(scale > 0) || !Number.isFinite(scale) || !(areaLength > 0) ||
          !Number.isFinite(areaLength) || !(Math.hypot(...a) > 0) || !(Math.hypot(...b) > 0)) {
        fail("Actual original or fitted area normal has no finite nonzero analytic normalization.");
        continue;
      }
      const axis: number[] = cross(a, b);
      const sin: number = Vector3.length(vector(axis)), cos: number = dot(a, b);
      if (!Number.isFinite(sin) || !Number.isFinite(cos) || sin === 1e-12) {
        fail("Actual shortest-arc branch is nonfinite or exactly at its derivative switching boundary.");
        continue;
      }
      const quaternion: ReturnType<typeof rotationBetween> = rotationBetween(vector(a), vector(b));
      const source: number[] = at(input.normals, vertex);
      const rotated: IAutoMovieVector3 = Quaternion.rotateVector(quaternion, vector(source));
      const raw: number[] = [rotated.x, rotated.y, rotated.z], rawLength: number = Math.hypot(...raw);
      const returned: number[] = at(evaluation.normals, vertex);
      if (!(rawLength > 0) || !Number.isFinite(rawLength) ||
          !returned.every(Number.isFinite) ||
          returned.some((value: number, coordinate: number): boolean => value !== raw[coordinate] / rawLength)) {
        fail("Actual returned normal is nonfinite, zero, or belongs to a different forward evaluation.");
        continue;
      }
      if (sin < 1e-12) continue;
      const axisLength: number = Math.sqrt(dot(axis, axis));
      const theta: number = Math.atan2(sin, cos);
      const angleDegrees: number = (theta * 180) / Math.PI;
      const half: number = (angleDegrees * (Math.PI / 180)) / 2;
      const factor: number = Math.sin(half) / axisLength;
      const axisUnit: number[] = axis.map((value: number): number => value / axisLength);
      const qxyz: number[] = [quaternion.x, quaternion.y, quaternion.z];
      const turn: number[] = cross(qxyz, source).map((value: number): number => 2 * value);
      let unavailable: boolean = false;
      for (const [index, dm] of areaDerivatives[vertex]) {
        const reduced: number[] = dm.map((value: number): number => value / scale);
        const db: number[] = reduced.map((value: number, coordinate: number): number =>
          (value - b[coordinate] * dot(b, reduced)) / areaLength);
        const daxis: number[] = cross(a, db);
        const dsin: number = dot(axis, daxis) / sin;
        const dcos: number = dot(a, db);
        const dtheta: number = (cos * dsin - sin * dcos) / (sin * sin + cos * cos);
        const dhalf: number = ((dtheta * 180) / Math.PI * (Math.PI / 180)) / 2;
        const dAxisLength: number = dot(axis, daxis) / axisLength;
        // Differentiate axis * sin(half)/length in projected form. This is the
        // same chain, avoiding subtraction of two large radial scalar terms
        // near the existing parallel branch boundary.
        const dqxyz: number[] = daxis.map((value: number, coordinate: number): number =>
          (value - axisUnit[coordinate] * dAxisLength) * factor
          + axisUnit[coordinate] * Math.cos(half) * dhalf);
        const dqw: number = -Math.sin(half) * dhalf;
        const dturn: number[] = cross(dqxyz, source).map((value: number): number => 2 * value);
        const firstCross: number[] = cross(dqxyz, turn), secondCross: number[] = cross(qxyz, dturn);
        const dr: number[] = dturn.map((value: number, coordinate: number): number =>
          dqw * turn[coordinate] + quaternion.w * value + firstCross[coordinate] + secondCross[coordinate]);
        const change: number[] = dr.map((value: number, coordinate: number): number =>
          (value - returned[coordinate] * dot(returned, dr)) / rawLength);
        if (!change.every(Number.isFinite)) { unavailable = true; break; }
        if (change.some((value: number): boolean => value !== 0)) derivatives[vertex].set(index, change);
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
  return a.map((value: number, coordinate: number): number => value - b[coordinate]);
}
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum: number, value: number, coordinate: number): number => sum + value * b[coordinate], 0);
}
function add(target: number[], value: readonly number[]): void {
  for (let coordinate: number = 0; coordinate < 3; coordinate++) target[coordinate] += value[coordinate];
}
