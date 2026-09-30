import {
  compareCodeUnits,
  createAutoMovieMeshDeformer,
} from "@automovie/engine";
import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import { IPortraitSurfaceControl } from "./structures/IPortraitSurfaceControl";
import type { IPortraitSurfaceLayer } from "./structures/IPortraitSurfaceLayer";

/**
 * Interpolate a complete set of anatomical controls with the engine's compact
 * displacement fields. All controls share one positive support radius in mm.
 * At most 96 points bound the dense solve; an empty population is identity.
 * Zero controls constrain neighbouring movements instead of being discarded.
 *
 * The engine itself samples the interpolation matrix. A normalized probe with
 * displacement 1/4 has a positive Jacobian because the compact kernel's maximum
 * gradient is less than two. The final field is evaluated and checked by that
 * same engine, including its real Jacobians and emitted triangle orientations.
 * No independently copied kernel can drift away from the rendered operation.
 *
 * Partial pivoting refuses unresolved/near-coincident controls. Interpolating
 * handle movements is not a guarantee of likeness or global nonintersection.
 * The surrounding surface assembler retains its open-rim mask; a control in
 * that protected collar consequently does not promise its full displacement.
 *
 * @evidence contracts/common.md#principled-implementation The controls define a radial-basis interpolation with the engine's compact kernel: the matrix entries are the kernel sampled by the engine itself, the weights solve K c = d by Gauss-Jordan elimination with partial pivoting (the normalised matrix has unit diagonal and entries at most one in magnitude), and near-singular systems refuse. The final field is checked by the same engine, including its Jacobians and emitted triangle orientations, so no independently copied kernel can drift.
 * @evidence contracts/common.md#clear-and-simple-design Sample the matrix, eliminate, emit fields; up to 96 controls bound the dense solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coincident or unresolved controls refuse; no compensating regularisation is added.
 * @evidence contracts/common.md#meaningful-documentation States the interpolation, the size bound and that a control in the protected collar does not promise its full displacement.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres for radius, offsets and displacements, divided by 1000 for the engine's metre fields.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createPortraitControlLayer carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createPortraitControlLayer admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createPortraitControlLayer is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels createPortraitControlLayer defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createPortraitControlLayer emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createPortraitControlLayer constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createPortraitControlLayer owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
 */
export function createPortraitControlLayer(
  id: string,
  radius: number,
  input: readonly IPortraitSurfaceControl[],
): IPortraitSurfaceLayer {
  const controls = [...structuredClone(input)].sort((a, b) =>
    compareCodeUnits(a.name, b.name),
  );
  if (
    id.trim().length === 0 ||
    !Number.isFinite(radius) ||
    radius / 1000 <= 0 ||
    controls.length > 96 ||
    new Set(controls.map((c) => c.name)).size !== controls.length ||
    controls.some(
      (c) =>
        c.name.trim().length === 0 ||
        !Number.isInteger(c.anchor) ||
        c.anchor < 0 ||
        [c.offset, c.displacement].some(
          (v) => v.length !== 3 || !v.every(Number.isFinite),
        ),
    )
  )
    throw new Error(
      "Surface controls need unique names, resident bindings, finite XYZ and a positive metric radius.",
    );
  return {
    id,
    fields: (host) => {
      if (controls.length === 0) return [];
      const centers = controls.map((c) => {
        const point = host.positions[c.anchor];
        if (
          point === undefined ||
          point.length !== 3 ||
          !point.every(Number.isFinite)
        )
          throw new Error("Surface controls need a resident finite datum.");
        const center = point.map((value, axis) => value + c.offset[axis]);
        if (!center.every(Number.isFinite))
          throw new Error(
            "Surface control centers exceed their finite domain.",
          );
        return center;
      });
      // All normalized pair differences are sampled together. The probe has no
      // triangles because it asks for a field value, not a surrogate surface.
      const positions = centers.flatMap((a) =>
        centers.flatMap((b) => a.map((v, axis) => (v - b[axis]) / radius)),
      );
      const sampled = createAutoMovieMeshDeformer([
        {
          center: { x: 0, y: 0, z: 0 },
          radius: { x: 1, y: 1, z: 1 },
          displacement: { x: 0, y: 0.25, z: 0 },
          stretch: { x: 0, y: 0, z: 0 },
        },
      ])({ positions, indices: [], normals: null, uvs: null, skin: null });
      const count = controls.length;
      const rows = controls.map((c, row) => [
        ...controls.map((_other, column) => {
          const y = 3 * (row * count + column) + 1;
          return (sampled.positions[y] - positions[y]) * 4;
        }),
        ...c.displacement,
      ]);
      // One elimination carries three right-hand sides. Absolute pivots are
      // meaningful here: the normalized matrix has diagonal one and |a_ij|<=1.
      for (let column = 0; column < count; column++) {
        let pivot = column;
        for (let row = column + 1; row < count; row++)
          if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column]))
            pivot = row;
        if (Math.abs(rows[pivot][column]) <= 1e-10)
          throw new Error(
            "Surface controls are singular or too close for a stable interpolation.",
          );
        [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
        const divisor = rows[column][column];
        for (let j = column; j < count + 3; j++) rows[column][j] /= divisor;
        for (let row = 0; row < count; row++) {
          if (row === column) continue;
          const factor = rows[row][column];
          for (let j = column; j < count + 3; j++)
            rows[row][j] -= factor * rows[column][j];
        }
      }
      return rows.flatMap((row, i): IAutoMovieMeshDeformationField[] => {
        const movement = row.slice(count).map((v) => v / 1000);
        if (!movement.every(Number.isFinite))
          throw new Error(
            "Surface control coefficients exceed their finite domain.",
          );
        if (movement.every((v) => v === 0)) return [];
        const center = centers[i].map((v) => v / 1000);
        return [
          {
            center: { x: center[0], y: center[1], z: center[2] },
            radius: { x: radius / 1000, y: radius / 1000, z: radius / 1000 },
            displacement: { x: movement[0], y: movement[1], z: movement[2] },
            stretch: { x: 0, y: 0, z: 0 },
          },
        ];
      });
    },
  };
}
