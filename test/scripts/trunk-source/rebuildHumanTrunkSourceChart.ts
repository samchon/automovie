import { areaWeightedNormals } from "@automovie/human/common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanBodySourceVertexBinding } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodySourceVertexBinding";

import { readHumanBodyMaterialSignedIntegral } from "../human-source/body-anatomy/readHumanBodyMaterialSignedIntegral.ts";

import type { IHumanTrunkSourceChart } from "./IHumanTrunkSourceChart.ts";

/**
 * Same-source geometry and chart-owned authored kinematic carry.
 * @author Samchon
 */
interface IHumanTrunkSourceChartResult {
  /** Continuous atlas boundary preserving original signed source quantity. */
  mesh: IHumanTrunkSourceChart["mesh"];

  /** Four-slot source carry derived from the same origin interpolation. */
  binding: IAutoMovieHumanBodySourceVertexBinding;
}

/**
 * Reparameterize an attached two-layer material fan continuously.
 * The original within-row central material path and terminal remain unchanged;
 * only a discontinuous origin row schedule is replaced by interpolation
 * between its actual acquired attachments. Moving a row rigidly in its
 * origin direction, with displacement vanishing at the terminal, keeps
 * the old measured chart displacement rather than inventing new bows.
 *
 * Both layers use one central chart and its finite-difference normal.
 * Original station thicknesses are preserved up to one positive scale
 * determined by the original signed PL-chain integral. This conserves
 * that algebraic source quantity, not union volume or clinical tissue
 * mass. Every original triangle and station identity is retained.
 * Actual layer boundary coordinates can change with their new normals and
 * conserved-quantity thickness; this is not shell-point contact preservation.
 *
 * The same origin row interpolation owns both coordinates and source carry.
 * For origin fraction f and terminal progression v, the weights are
 * (1-v)(1-f), (1-v)f and v. They are nonnegative and sum to one; the
 * acquired origin rows and humeral terminal have exact single-bone carry.
 * Both layers share the material chart. This is authored coarse kinematics,
 * not clinical force, contraction or performed-motion qualification.
 *
 * Positive source volume does not establish embedding, clearance, or
 * target-frame placement. Those remain downstream admission and actual
 * hardware-render responsibilities. No source or caller input mutates.
 */
export function rebuildHumanTrunkSourceChart(
  input: IHumanTrunkSourceChart,
): IHumanTrunkSourceChartResult {
  const { mesh, rows, columns, origins, originStations, originBones, terminalBone } = input;
  const count = rows * columns;
  if (!Number.isSafeInteger(rows) || rows < 2 || !Number.isSafeInteger(columns) || columns < 2 ||
      mesh.positions.length !== 6 * count || origins.length !== originStations.length || origins.length < 2 ||
      originBones.length !== origins.length)
    throw new Error("An attached chart needs complete original two-layer stations.");
  if (originStations[0] !== 0 || originStations[originStations.length - 1] !== rows - 1 ||
      originStations.some((station, at) => !Number.isSafeInteger(station) ||
        (at > 0 && station <= originStations[at - 1])) ||
      origins.some((point) => point.length !== 3 || point.some((value) => !Number.isFinite(value))) ||
      mesh.positions.some((value) => !Number.isFinite(value)))
    throw new Error("Chart attachment rows need finite coordinates and an ordered complete path.");
  const centres = new Float64Array(3 * count);
  const bones = [...new Set([...originBones, terminalBone])];
  if (bones.length > 4) throw new Error("The source chart exceeds its original four-slot bone population.");
  const boneIndices = new Array<number>(8 * count).fill(0);
  const weights = new Array<number>(8 * count).fill(0);
  const thickness = new Float64Array(count);
  for (let station = 0; station < count; station++) {
    for (let axis = 0; axis < 3; axis++)
      centres[3 * station + axis] = (mesh.positions[3 * station + axis] + mesh.positions[3 * (count + station) + axis]) / 2;
    thickness[station] = Math.hypot(...[0, 1, 2].map((axis) =>
      mesh.positions[3 * station + axis] - mesh.positions[3 * (count + station) + axis]));
    if (!(thickness[station] > 0)) throw new Error("Original sheet thickness must be positive.");
  }
  for (let row = 0; row < rows; row++) {
    let segment = 0;
    while (segment < originStations.length - 2 && row > originStations[segment + 1]) segment++;
    const fraction = (row - originStations[segment]) / (originStations[segment + 1] - originStations[segment]);
    const origin = origins[segment].map((value, axis) =>
      value + fraction * (origins[segment + 1][axis] - value));
    const oldOrigin = Array.from(centres.subarray(3 * row * columns, 3 * row * columns + 3));
    for (let column = 0; column < columns; column++) {
      const v = column / (columns - 1);
      for (let layer = 0; layer < 2; layer++) {
        const at = 4 * (layer * count + row * columns + column);
        for (let slot = 0; slot < bones.length; slot++) boneIndices[at + slot] = slot;
        weights[at + bones.indexOf(originBones[segment])] += (1 - v) * (1 - fraction);
        weights[at + bones.indexOf(originBones[segment + 1])] += (1 - v) * fraction;
        weights[at + bones.indexOf(terminalBone)] += v;
      }
      for (let axis = 0; axis < 3; axis++)
        centres[3 * (row * columns + column) + axis] +=
          (1 - column / (columns - 1)) * (origin[axis] - oldOrigin[axis]);
    }
  }
  const directions = new Float64Array(3 * count);
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const beforeRow = Math.max(0, row - 1), afterRow = Math.min(rows - 1, row + 1);
      const beforeColumn = Math.max(0, column - 1), afterColumn = Math.min(columns - 1, column + 1);
      const du = [0, 1, 2].map((axis) => centres[3 * (afterRow * columns + column) + axis] - centres[3 * (beforeRow * columns + column) + axis]);
      const dv = [0, 1, 2].map((axis) => centres[3 * (row * columns + afterColumn) + axis] - centres[3 * (row * columns + beforeColumn) + axis]);
      const normal = cross(du, dv);
      const length = Math.hypot(...normal);
      if (!(length > 0) || !Number.isFinite(length)) throw new Error("Continuous chart has a degenerate station tangent.");
      const at = row * columns + column;
      for (let axis = 0; axis < 3; axis++) directions[3 * at + axis] = normal[axis] / length;
    }
  const emit = (scale: number): number[] => {
    const positions = new Array<number>(mesh.positions.length);
    for (let station = 0; station < count; station++)
      for (let layer = 0; layer < 2; layer++)
        for (let axis = 0; axis < 3; axis++)
          positions[3 * (layer * count + station) + axis] = centres[3 * station + axis] +
            (layer === 0 ? 1 : -1) * directions[3 * station + axis] * thickness[station] * scale / 2;
    return positions;
  };
  const integral = (positions: number[]): number => readHumanBodyMaterialSignedIntegral(positions, mesh.indices).value;
  const target = integral(mesh.positions);
  if (!(target > 0)) throw new Error("Original chart has no positive oriented source quantity.");
  let lower = 0, upper = 1;
  const zero = integral(emit(0));
  const first = integral(emit(1));
  const negative = integral(emit(-1));
  const second = integral(emit(2));
  const odd = (first - negative) / 2;
  const quadratic = (first + negative) / 2 - zero;
  const cubic = (second - zero - 2 * odd - 4 * quadratic) / 6;
  const linear = odd - cubic;
  if (![zero, first, negative, second, linear, quadratic, cubic].every(Number.isFinite))
    throw new Error("Chart quantity polynomial exceeds finite arithmetic.");
  if (!(linear > 0)) throw new Error("Chart quantity has no positive thin-sheet branch.");
  // Fixed rim triangulation can leave a quadratic term for symmetric layers.
  // Each vertex is affine in s, so V(s) is a general cubic. Bound its thin-sheet
  // branch by the first positive derivative root. Kahan (2004), Qdrtcs section
  // 1, motivates q/a and c/q instead of cancellation in the small root.
  // Coefficients/roots are binary64 candidates, not interval certificates;
  // the actual shared PL integral below decides the final source quantity.
  let limit = Infinity;
  if (cubic === 0) {
    if (quadratic < 0) limit = -linear / (2 * quadratic);
  } else {
    const normalization = Math.max(Math.abs(3 * cubic), Math.abs(2 * quadratic), Math.abs(linear));
    if (!Number.isFinite(normalization)) throw new Error("Chart derivative normalization exceeds finite arithmetic.");
    const a = 3 * cubic / normalization;
    const b = 2 * quadratic / normalization;
    const c = linear / normalization;
    if (a === 0 || c === 0) throw new Error("Chart derivative normalization loses a nonzero coefficient.");
    const discriminant = b * b - 4 * a * c;
    const separation = 8 * Number.EPSILON * (b * b + Math.abs(4 * a * c));
    if (Math.abs(discriminant) <= separation)
      throw new Error("Chart thickness turning points have unresolved separation.");
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      const q = -(b + (b >= 0 ? root : -root)) / 2;
      for (const candidate of [q / a, c / q])
        if (candidate > 0 && Number.isFinite(candidate)) limit = Math.min(limit, candidate);
    }
  }
  if (Number.isFinite(limit) && integral(emit(limit)) < target)
    throw new Error("No increasing thickness branch reaches the original source quantity.");
  upper = Math.min(upper, limit);
  let value = integral(emit(upper));
  while (value < target) {
    upper = Math.min(upper * 2, limit);
    if (!Number.isFinite(upper)) throw new Error("No finite positive chart thickness conserves source quantity.");
    const next = integral(emit(upper));
    if (!(next > value)) throw new Error("Chart quantity loses monotonicity before the source target.");
    value = next;
  }
  for (let iteration = 0; iteration < 80; iteration++) {
    const middle = (lower + upper) / 2;
    if (middle === lower || middle === upper) break;
    const quantity = integral(emit(middle));
    if (!(quantity > 0) || !Number.isFinite(quantity)) throw new Error("Chart thickness produced an invalid oriented quantity.");
    if (quantity < target) lower = middle;
    else upper = middle;
  }
  const positions = emit((lower + upper) / 2);
  const result = integral(positions);
  if (Math.abs(result - target) > 256 * Number.EPSILON * target)
    throw new Error("Chart thickness did not conserve the original signed quantity.");
  return { mesh: { ...mesh, positions, normals: areaWeightedNormals(positions, mesh.indices) },
    binding: { bones, boneIndices, weights,
      account: "Source chart-owned partition-of-unity over its actual named origin and terminal attachments. The same row interpolation carries the acquired-origin curve and both material layers; column progression converges on the humeral terminal. Authored kinematic carry, not clinical force, contraction, clearance or performed-motion validation." } };
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
