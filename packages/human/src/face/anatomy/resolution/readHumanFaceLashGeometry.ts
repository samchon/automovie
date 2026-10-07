import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Read generated shaft count or sampled centreline length from final geometry.
 *
 * Connectivity, not requested count or card area, counts the independent
 * tubes. The row producer's regular 8-column, 12-row shading lattice supplies
 * one ring centre from its eight distinct angular points; the duplicated seam
 * is excluded. The longest sum of the twelve straight centreline segments is
 * reported in millimetres. This is a lower approximation to the analytic arc
 * length and is not a photographic visible length or a biological follicle
 * count. An explicitly empty generated row measures zero; retained cards give
 * a named instrument gap.
 *
 * @evidence contracts/common.md#principled-implementation Counts graph components of actual index connectivity and measures segment lengths from output ring centroids, without reading requested population values.
 * @evidence contracts/common.md#clear-and-simple-design One generated-row instrument provides two explicit geometric quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alpha coverage, card vertex or requested count supplies a shaft measurement.
 * @evidence contracts/common.md#meaningful-documentation States connectivity, regular sampling, seam handling, approximation and empty-state meaning.
 * @evidence contracts/modeling.md#spatial-conventions Context Float32 head-frame metres convert to millimetres for sampled length; component count is dimensionless.
 * @evidence contracts/anatomy.md#anatomical-source These constructed-surface observations differ from Kikuchi et al. 2015, Global Dermatology 2, DOI 10.15761/GOD.1000123: 50 healthy Japanese adults, ages 22–38, right lids only, longest central-two-millimetre shaft measured with a 0.25 mm caliper and central counts from scaled photographs. That paper does not define the sampled 3D centreline arc measured here.
 * @evidenceExclude contracts/anatomy.md#permitted-range Reports a quantity without admitting clinical bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
 */
export function readHumanFaceLashGeometry(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  row: "upper" | "lower",
  quantity: "shaftCount" | "longestSampledCentrelineLength",
): number | IHumanFaceMeasurementGap {
  const mesh = context.lashMesh?.(side, row);
  const gap = (cause: string): IHumanFaceMeasurementGap => ({
    reason: `unread generated ${side} ${row} lashes: ${cause}`,
  });
  if (mesh === undefined || mesh === null)
    return gap("this build retains cards without individual shaft geometry");
  const vertices = mesh.positions.length / 3;
  if (vertices === 0 && mesh.indices?.length === 0) return 0;
  if (
    !Number.isSafeInteger(vertices) ||
    vertices % 117 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    mesh.indices === null
  )
    return gap("the row's complete finite tube lattice is not present");
  const parent = Array.from({ length: vertices }, (_, vertex) => vertex);
  const root = (vertex: number): number => {
    let current = vertex;
    while (parent[current] !== current) current = parent[current];
    while (parent[vertex] !== current) {
      const next = parent[vertex];
      parent[vertex] = current;
      vertex = next;
    }
    return current;
  };
  const used = new Set<number>();
  for (let at = 0; at < mesh.indices.length; at += 3) {
    const a = mesh.indices[at],
      b = mesh.indices[at + 1],
      c = mesh.indices[at + 2];
    if (
      [a, b, c].some(
        (vertex) =>
          !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= vertices,
      )
    )
      return gap("invalid triangle connectivity");
    used.add(a);
    used.add(b);
    used.add(c);
    parent[root(b)] = root(a);
    parent[root(c)] = root(a);
  }
  const count = new Set([...used].map(root)).size;
  if (quantity === "shaftCount") return count;
  let longest = 0;
  for (let shaft = 0; shaft * 117 < vertices; shaft++) {
    const points = Array.from({ length: 13 }, (_, ring) => {
      const sum = Vector3.create();
      for (let angular = 0; angular < 8; angular++) {
        const at = 3 * (shaft * 117 + ring * 9 + angular);
        sum.x += mesh.positions[at] / 8;
        sum.y += mesh.positions[at + 1] / 8;
        sum.z += mesh.positions[at + 2] / 8;
      }
      return sum;
    });
    const length = points
      .slice(1)
      .reduce(
        (sum, point, at) =>
          sum + Vector3.length(Vector3.subtract(point, points[at])),
        0,
      );
    longest = Math.max(longest, length * 1000);
  }
  return longest;
}
