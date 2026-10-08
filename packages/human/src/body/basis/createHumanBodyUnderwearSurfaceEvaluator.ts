import { Quaternion, cofactorAutoMovieJacobian, rotationBetween } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";
import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";
import { readHumanBodyUnderwearLiftPath } from "./readHumanBodyUnderwearLiftPath";

/**
 * Evaluate one candidate through the exact normal operation the garment emits.
 *
 * Original material, fitted material and final lifted faces remain distinct.
 * Normal transport retains the supplied source direction through the existing
 * shortest rotation between original and fitted area-weighted normals. The
 * offset is the actual affine interpolation of returned unit vertex normals.
 * Its declared local thickness path is Q+s*N, over the complete requested
 * signed interval. Three corner quadratic minima determine that prism's local
 * orientation; neither this condition nor the field certifies global embedding.
 *
 * Every original field and local face condition is read for the actual candidate
 * before its forward result returns. No source normal is flipped, no triangle is removed and no
 * positive geometric margin changes the input. Failed candidates retain located
 * raw values rather than substituted geometry.
 * Existing optional construction observation reports actual normal, vertex-field,
 * batched face and full candidate completions. Face progress uses powers of two
 * and the final actual count; every face and original reading is still evaluated.
 *
 * @evidence contracts/common.md#principled-implementation One forward normal and lift calculation is shared by restoration and final emission; the local prism determinant is affine in barycentric normals and quadratic along the actual lift interval.
 * @evidence contracts/common.md#clear-and-simple-design One garment calculation returns its actual buffers and located failures to both consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source values, triangle incidence and signed offset remain unchanged; exact represented-input polynomial arithmetic introduces no geometry epsilon.
 * @evidence contracts/common.md#meaningful-documentation Separates field, base, lift and local prism conditions from global intersection and rendered acceptance.
 */
export function createHumanBodyUnderwearSurfaceEvaluator(
  input: IHumanBodyUnderwearSurfaceFitInput,
): (base: readonly number[]) => IHumanBodyUnderwearSurfaceEvaluation {
  const { points, normals, indices, envelope, rho, offsetMetres } = input;
  if (points.length === 0 || points.length % 3 !== 0 || normals.length !== points.length ||
      !points.every(Number.isFinite) || !normals.every(Number.isFinite) ||
      !Number.isFinite(offsetMetres) || !(rho > 0) || !Number.isFinite(rho) ||
      indices.length === 0 || indices.length % 3 !== 0 ||
      indices.some((v) => !Number.isSafeInteger(v) || v < 0 || v >= points.length / 3))
    throw new Error("Garment evaluation needs complete finite original material and the actual lift.");
  const original = areaWeightedNormals([...points], [...indices]);
  return (base) => {
    if (base.length !== points.length || !base.every(Number.isFinite))
      throw new Error("Garment evaluation needs the complete finite candidate material.");
    const violations: IHumanBodyUnderwearSurfaceViolation[] = [];
    const transported = new Array<number>(points.length).fill(NaN);
    const final = new Array<number>(points.length).fill(NaN);
    const fitted = areaWeightedNormals([...base], [...indices]);
    for (let v = 0; v < points.length / 3; v++) {
      const before = at(original, v), after = at(fitted, v);
      if (!(Math.hypot(...before) > 0) || !(Math.hypot(...after) > 0)) {
        violations.push({ condition: "normal", triangle: null, vertex: v, value: null, unit: null,
          reason: "Original or fitted material has no nonzero area-weighted normal." });
        continue;
      }
      const rotation = rotationBetween(vector(before), vector(after));
      const value = Quaternion.rotateVector(rotation, vector(at(normals, v)));
      const unit = [value.x, value.y, value.z], length = Math.hypot(...unit);
      if (!(length > 0) || !Number.isFinite(length)) {
        violations.push({ condition: "normal", triangle: null, vertex: v, value: length, unit: "dimensionless",
          reason: "Actual transported source direction is not finite and nonzero." });
        continue;
      }
      for (let k = 0; k < 3; k++) {
        transported[v * 3 + k] = unit[k] / length;
        final[v * 3 + k] = base[v * 3 + k] + offsetMetres * transported[v * 3 + k];
      }
    }
    input.observeFitting?.("garment-candidate-normals-evaluated", {
      completed: points.length / 3, total: points.length / 3,
      garmentGeometryFailures: violations.length,
    });
    let fieldResidualMetres = 0;
    for (let v = 0; v < points.length / 3; v++) {
      const distance = envelope.read(at(base, v)).distance;
      if (!Number.isFinite(distance))
        violations.push({ condition: "field", triangle: null, vertex: v, value: null, unit: "metres",
          reason: "The original nearest-centre field distance is not representable." });
      fieldResidualMetres = Math.max(fieldResidualMetres, distance - rho);
    }
    input.observeFitting?.("garment-candidate-vertices-evaluated", {
      completed: points.length / 3, total: points.length / 3,
      garmentFieldResidualMetres: fieldResidualMetres, garmentGeometryFailures: violations.length,
    });
    const total = indices.length / 3;
    const evaluateFace = (t: number): void => {
      const vertices = indices.slice(t, t + 3);
      const q = vertices.map((v) => at(base, v));
      const face = q.flat();
      const e1 = subtract(q[1], q[0]);
      const e2 = subtract(q[2], q[0]);
      const area = cross(e1, e2), size = Math.hypot(...area);
      if (!(size > 0) || !Number.isFinite(size)) {
        violations.push({ condition: "base-area", triangle: t / 3, vertex: null, value: size, unit: "square-metres",
          reason: "Actual candidate material triangle is nonfinite or collapsed." });
        return;
      }
      const exterior = envelope.readFace(face);
      if (exterior.unavailable !== null || exterior.minimumOrientation === null ||
          !(exterior.minimumOrientation > 0))
        violations.push({ condition: "exterior-direction", triangle: t / 3, vertex: null,
          value: exterior.minimumOrientation, unit: "metres", reason: exterior.unavailable ?? "An active exterior branch opposes the actual material face." });
      const n = vertices.map((v) => at(transported, v));
      if (n.some((value) => !value.every(Number.isFinite))) return;
      const finalArea = cross(subtract(at(final, vertices[1]), at(final, vertices[0])),
        subtract(at(final, vertices[2]), at(final, vertices[0])));
      const finalSize = Math.hypot(...finalArea);
      if (!(finalSize > 0) || !Number.isFinite(finalSize))
        violations.push({ condition: "final-area", triangle: t / 3, vertex: null, value: finalSize, unit: "square-metres",
          reason: "Actual emitted lifted triangle is nonfinite or collapsed." });
      if (offsetMetres === 0) return;
      const d1 = subtract(n[1], n[0]), d2 = subtract(n[2], n[0]);
      for (let corner = 0; corner < 3; corner++) {
        const outward = dot(area, n[corner]);
        if (!(outward > 0) || !Number.isFinite(outward)) {
          violations.push({ condition: "lift-direction", triangle: t / 3, vertex: vertices[corner], value: outward / size, unit: "dimensionless",
            reason: "Actual returned normal is not outward for this incident material face." });
          continue;
        }
        const actualFinalDirection = dot(finalArea, n[corner]);
        if (!(actualFinalDirection > 0) || !Number.isFinite(actualFinalDirection))
          violations.push({ condition: "offset-path", triangle: t / 3, vertex: vertices[corner],
            value: actualFinalDirection, unit: "square-metres",
            reason: "The actual rounded lifted face did not preserve the returned normal's local direction." });
        const path = readHumanBodyUnderwearLiftPath({ points: q, normals: n, corner, offsetMetres });
        const minimum = path.minimum, location = path.locations[0], positive = path.exactPositive;
        if (!positive || !Number.isFinite(minimum))
          violations.push({ condition: "offset-path", triangle: t / 3, vertex: vertices[corner], value: minimum, unit: "square-metres",
            reason: "Actual affine-normal lift has a nonpositive or unavailable local prism determinant." });
        const a = cross(e2, n[corner]).map((value) => value / outward);
        const b = cross(n[corner], e1).map((value) => value / outward);
        for (const s of [0, offsetMetres, location]) {
          const jacobian = Array.from({ length: 9 }, (_, index) => {
            const row = Math.floor(index / 3), column = index % 3;
            return (row === column ? 1 : 0) + s * (d1[row] * a[column] + d2[row] * b[column]);
          });
          try {
            const { matrix } = cofactorAutoMovieJacobian(jacobian);
            const carried = [0, 1, 2].map((row) =>
              matrix[row * 3] * area[0] + matrix[row * 3 + 1] * area[1] + matrix[row * 3 + 2] * area[2]);
            if (!matrix.every(Number.isFinite) || !carried.every(Number.isFinite) || !(Math.hypot(...carried) > 0))
              throw new Error("The actual offset cofactor or transported area is not representable.");
          } catch (error) {
            violations.push({ condition: "offset-path", triangle: t / 3, vertex: vertices[corner], value: s, unit: "metres",
              reason: error instanceof Error ? error.message : String(error) });
          }
        }
      }
    };
    for (let t = 0; t < indices.length; t += 3) {
      evaluateFace(t);
      const completed = t / 3 + 1;
      // Reporting cadence only: every face is still evaluated and retained.
      if (completed === total || (completed & (completed - 1)) === 0)
        input.observeFitting?.("garment-candidate-faces-evaluated", {
          completed, total, garmentGeometryFailures: violations.length,
        });
    }
    input.observeFitting?.("garment-candidate-evaluated", {
      completed: total, total, garmentFieldResidualMetres: fieldResidualMetres,
      garmentGeometryFailures: violations.length,
    });
    return { base: [...base], positions: final, normals: transported, fieldResidualMetres,
      violations, geometryAccepted: violations.length === 0 };
  };
}

function at(values: readonly number[], vertex: number): number[] {
  return values.slice(vertex * 3, vertex * 3 + 3);
}
function vector(values: readonly number[]): IAutoMovieVector3 {
  return { x: values[0], y: values[1], z: values[2] };
}
function subtract(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value, axis) => value - b[axis]);
}
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, value, axis) => sum + value * b[axis], 0);
}
