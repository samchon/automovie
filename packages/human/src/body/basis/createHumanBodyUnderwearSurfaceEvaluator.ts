import {
  Quaternion,
  cofactorAutoMovieJacobian,
  rotationBetween,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";
import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";
import { readHumanBodyUnderwearLiftPath } from "./readHumanBodyUnderwearLiftPath";

/**
 * Evaluate one candidate through the exact normal operation the garment emits.
 *
 * Original material, fitted material and final lifted faces remain distinct. Normal transport retains the supplied source direction through the existing shortest rotation between original and fitted area-weighted normals. The offset is the actual affine interpolation of returned unit vertex normals. Its declared local thickness path is Q+s*N, over the complete requested signed interval. Three corner quadratic minima determine that prism's local orientation; neither this condition nor the field certifies global embedding.
 *
 * Every original field and local face condition is read for the actual candidate before its forward result returns. No source normal is flipped, no triangle is removed and no positive geometric margin changes the input. Failed candidates retain located raw values rather than substituted geometry. Existing optional construction observation reports actual normal, vertex-field, batched face and full candidate completions. Face progress uses powers of two and the final actual count; every face and original reading is still evaluated.
 *
 * @evidence contracts/common.md#principled-implementation Actual source-normal transport and requested signed affine lift feed every original vertex field and native face orientation reading, preserving located raw failures instead of replacing geometry.
 * @evidence contracts/common.md#clear-and-simple-design Fixed source admission and original normals compile once; a candidate pass transports directions, reads vertex fields, then evaluates every face and returns geometry plus observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid inputs refuse and failed local readings remain explicit violations; geometryAccepted describes these implemented local conditions only and does not certify global embedding, cloth dynamics, anatomy or rendered acceptance.
 * @evidence contracts/common.md#meaningful-documentation The comment separates original, candidate and emitted surfaces, signed metre lift paths, raw failure observations and progress reporting from geometric acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Each candidate traverses vertices and faces, with field and face-branch search costs delegated to the envelope owner; powers-of-two progress reports reduce callback traffic without skipping any face reading.
 * @evidence contracts/performance.md#reuse-equivalent-work Original normals are reused across candidates; each candidate's transported directions and face edges serve all local lift witnesses, while changed candidate geometry is measured afresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned owned base/final/normal arrays and violation records remain with the caller; candidate face/Jacobian temporaries expire and the closure retains fixed inputs until unreachable, without external handles or pending work.
 */
export function createHumanBodyUnderwearSurfaceEvaluator(
  input: IHumanBodyUnderwearSurfaceFitInput,
): (base: readonly number[]) => IHumanBodyUnderwearSurfaceEvaluation {
  const {
    points,
    normals,
    indices,
    envelope,
    rho,
    offsetMetres,
  }: typeof input = input;
  if (
    points.length === 0 ||
    points.length % 3 !== 0 ||
    normals.length !== points.length ||
    !points.every(Number.isFinite) ||
    !normals.every(Number.isFinite) ||
    !Number.isFinite(offsetMetres) ||
    !(rho > 0) ||
    !Number.isFinite(rho) ||
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    indices.some(
      (v: number): boolean =>
        !Number.isSafeInteger(v) || v < 0 || v >= points.length / 3,
    )
  )
    throw new Error(
      "Garment evaluation needs complete finite original material and the actual lift.",
    );
  const original: number[] = areaWeightedNormals([...points], [...indices]);
  return (base: readonly number[]): IHumanBodyUnderwearSurfaceEvaluation => {
    if (base.length !== points.length || !base.every(Number.isFinite))
      throw new Error(
        "Garment evaluation needs the complete finite candidate material.",
      );
    const violations: IHumanBodyUnderwearSurfaceViolation[] = [];
    const transported: number[] = new Array<number>(points.length).fill(NaN);
    const final: number[] = new Array<number>(points.length).fill(NaN);
    const fitted: number[] = areaWeightedNormals([...base], [...indices]);
    for (let v: number = 0; v < points.length / 3; v++) {
      const before: number[] = at(original, v),
        after: number[] = at(fitted, v);
      if (!(Math.hypot(...before) > 0) || !(Math.hypot(...after) > 0)) {
        violations.push({
          condition: "normal",
          triangle: null,
          vertex: v,
          value: null,
          unit: null,
          reason:
            "Original or fitted material has no nonzero area-weighted normal.",
        });
        continue;
      }
      const rotation: ReturnType<typeof rotationBetween> = rotationBetween(
        vector(before),
        vector(after),
      );
      const value: IAutoMovieVector3 = Quaternion.rotateVector(
        rotation,
        vector(at(normals, v)),
      );
      const unit: number[] = [value.x, value.y, value.z],
        length: number = Math.hypot(...unit);
      if (!(length > 0) || !Number.isFinite(length)) {
        violations.push({
          condition: "normal",
          triangle: null,
          vertex: v,
          value: length,
          unit: "dimensionless",
          reason:
            "Actual transported source direction is not finite and nonzero.",
        });
        continue;
      }
      for (let k: number = 0; k < 3; k++) {
        transported[v * 3 + k] = unit[k] / length;
        final[v * 3 + k] =
          base[v * 3 + k] + offsetMetres * transported[v * 3 + k];
      }
    }
    input.observeFitting?.("garment-candidate-normals-evaluated", {
      completed: points.length / 3,
      total: points.length / 3,
      garmentGeometryFailures: violations.length,
    });
    let fieldResidualMetres: number = 0;
    for (let v: number = 0; v < points.length / 3; v++) {
      const distance: number = envelope.read(at(base, v)).distance;
      if (!Number.isFinite(distance))
        violations.push({
          condition: "field",
          triangle: null,
          vertex: v,
          value: null,
          unit: "metres",
          reason:
            "The original nearest-centre field distance is not representable.",
        });
      fieldResidualMetres = Math.max(fieldResidualMetres, distance - rho);
    }
    input.observeFitting?.("garment-candidate-vertices-evaluated", {
      completed: points.length / 3,
      total: points.length / 3,
      garmentFieldResidualMetres: fieldResidualMetres,
      garmentGeometryFailures: violations.length,
    });
    const total: number = indices.length / 3;
    const evaluateFace: (t: number) => void = (t: number): void => {
      const vertices: number[] = indices.slice(t, t + 3);
      const q: number[][] = vertices.map((v: number): number[] => at(base, v));
      const face: number[] = q.flat();
      const e1: number[] = subtract(q[1], q[0]);
      const e2: number[] = subtract(q[2], q[0]);
      const area: number[] = cross(e1, e2),
        size: number = Math.hypot(...area);
      if (!(size > 0) || !Number.isFinite(size)) {
        violations.push({
          condition: "base-area",
          triangle: t / 3,
          vertex: null,
          value: size,
          unit: "square-metres",
          reason:
            "Actual candidate material triangle is nonfinite or collapsed.",
        });
        return;
      }
      const exterior: ReturnType<typeof envelope.readFace> =
        envelope.readFace(face);
      if (
        exterior.unavailable !== null ||
        exterior.minimumOrientation === null ||
        !(exterior.minimumOrientation > 0)
      )
        violations.push({
          condition: "exterior-direction",
          triangle: t / 3,
          vertex: null,
          value: exterior.minimumOrientation,
          unit: "metres",
          reason:
            exterior.unavailable ??
            "An active exterior branch opposes the actual material face.",
        });
      const n: number[][] = vertices.map((v: number): number[] =>
        at(transported, v),
      );
      if (n.some((value: number[]): boolean => !value.every(Number.isFinite)))
        return;
      const finalArea: number[] = cross(
        subtract(at(final, vertices[1]), at(final, vertices[0])),
        subtract(at(final, vertices[2]), at(final, vertices[0])),
      );
      const finalSize: number = Math.hypot(...finalArea);
      if (!(finalSize > 0) || !Number.isFinite(finalSize))
        violations.push({
          condition: "final-area",
          triangle: t / 3,
          vertex: null,
          value: finalSize,
          unit: "square-metres",
          reason: "Actual emitted lifted triangle is nonfinite or collapsed.",
        });
      if (offsetMetres === 0) return;
      const d1: number[] = subtract(n[1], n[0]),
        d2: number[] = subtract(n[2], n[0]);
      for (let corner: number = 0; corner < 3; corner++) {
        const outward: number = dot(area, n[corner]);
        if (!(outward > 0) || !Number.isFinite(outward)) {
          violations.push({
            condition: "lift-direction",
            triangle: t / 3,
            vertex: vertices[corner],
            value: outward / size,
            unit: "dimensionless",
            reason:
              "Actual returned normal is not outward for this incident material face.",
          });
          continue;
        }
        const actualFinalDirection: number = dot(finalArea, n[corner]);
        if (
          !(actualFinalDirection > 0) ||
          !Number.isFinite(actualFinalDirection)
        )
          violations.push({
            condition: "offset-path",
            triangle: t / 3,
            vertex: vertices[corner],
            value: actualFinalDirection,
            unit: "square-metres",
            reason:
              "The actual rounded lifted face did not preserve the returned normal's local direction.",
          });
        const path: ReturnType<typeof readHumanBodyUnderwearLiftPath> =
          readHumanBodyUnderwearLiftPath({
            points: q,
            normals: n,
            corner,
            offsetMetres,
          });
        const minimum: number = path.minimum,
          location: number = path.locations[0],
          positive: boolean = path.exactPositive;
        if (!positive || !Number.isFinite(minimum))
          violations.push({
            condition: "offset-path",
            triangle: t / 3,
            vertex: vertices[corner],
            value: minimum,
            unit: "square-metres",
            reason:
              "Actual affine-normal lift has a nonpositive or unavailable local prism determinant.",
          });
        const a: number[] = cross(e2, n[corner]).map(
          (value: number): number => value / outward,
        );
        const b: number[] = cross(n[corner], e1).map(
          (value: number): number => value / outward,
        );
        for (const s of [0, offsetMetres, location]) {
          const jacobian: number[] = Array.from(
            { length: 9 },
            (_: unknown, index: number): number => {
              const row: number = Math.floor(index / 3),
                column: number = index % 3;
              return (
                (row === column ? 1 : 0) +
                s * (d1[row] * a[column] + d2[row] * b[column])
              );
            },
          );
          try {
            const { matrix }: ReturnType<typeof cofactorAutoMovieJacobian> =
              cofactorAutoMovieJacobian(jacobian);
            const carried: number[] = [0, 1, 2].map(
              (row: number): number =>
                matrix[row * 3] * area[0] +
                matrix[row * 3 + 1] * area[1] +
                matrix[row * 3 + 2] * area[2],
            );
            if (
              !matrix.every(Number.isFinite) ||
              !carried.every(Number.isFinite) ||
              !(Math.hypot(...carried) > 0)
            )
              throw new Error(
                "The actual offset cofactor or transported area is not representable.",
              );
          } catch (error: unknown) {
            violations.push({
              condition: "offset-path",
              triangle: t / 3,
              vertex: vertices[corner],
              value: s,
              unit: "metres",
              reason: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    };
    for (let t: number = 0; t < indices.length; t += 3) {
      evaluateFace(t);
      const completed: number = t / 3 + 1;
      // Reporting cadence only: every face is still evaluated and retained.
      if (completed === total || (completed & (completed - 1)) === 0)
        input.observeFitting?.("garment-candidate-faces-evaluated", {
          completed,
          total,
          garmentGeometryFailures: violations.length,
        });
    }
    input.observeFitting?.("garment-candidate-evaluated", {
      completed: total,
      total,
      garmentFieldResidualMetres: fieldResidualMetres,
      garmentGeometryFailures: violations.length,
    });
    return {
      base: [...base],
      positions: final,
      normals: transported,
      fieldResidualMetres,
      violations,
      geometryAccepted: violations.length === 0,
    };
  };
}

function at(values: readonly number[], vertex: number): number[] {
  return values.slice(vertex * 3, vertex * 3 + 3);
}
function vector(values: readonly number[]): IAutoMovieVector3 {
  return { x: values[0], y: values[1], z: values[2] };
}
function subtract(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value: number, axis: number): number => value - b[axis]);
}
function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce(
    (sum: number, value: number, axis: number): number => sum + value * b[axis],
    0,
  );
}
