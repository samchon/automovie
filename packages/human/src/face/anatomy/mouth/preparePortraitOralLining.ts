import { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { assertPortraitOralLining } from "./assertPortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";
import { tracePortraitOralBoundary } from "./tracePortraitOralBoundary";

/**
 * Close the interior behind one actual refined lip boundary. The seed chooses its oriented free cycle from a lip band that may also have an outer boundary. Rim coordinates are copied exactly; no second lip spline estimates them. Twenty-four depth rings keep the opening section until the authored fraction, then taper to one posterior pole at 1.8 nominal depths behind the rim centre. The lining reverses each skin boundary edge so its visible side faces inward. Optional chamber dimensions expand X/Y behind the vestibule without moving the rim or cap. Omission and two zero expansions preserve the original mesh. This enclosure does not reconstruct gingiva or certify tissue clearance. The returned boundary names the source skin vertex for each initial mesh vertex, in order. Both boundary and mesh arrays are newly owned.
 *
 * @evidence contracts/common.md#principled-implementation A seeded actual free skin cycle is copied exactly before fixed depth rings and posterior pole form the enclosure.
 * @evidence contracts/common.md#clear-and-simple-design The returned boundary retains exact source ids for connected lining attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Twenty-four rings, cosine taper and 1.8-depth cap are authored construction profiles, not reconstructed gingiva or proven tissue clearance.
 * @evidence contracts/common.md#meaningful-documentation Native portrait distances remain in their input millimetre frame; chamber expansion never moves the rim or posterior pole.
 * @evidence contracts/performance.md#efficient-algorithms Boundary tracing follows skin topology and twenty-four times rim count determines mesh/normal work.
 * @evidence contracts/performance.md#reuse-equivalent-work The traced boundary and shared centre/extents are reused across depth rings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned boundary and mesh arrays are newly owned and no caller positions/incidence arrays mutate.
 */
export function preparePortraitOralLining(
  surface: {
    positions: readonly (readonly number[])[];
    indices: readonly number[];
  },
  seed: number,
  depth: number,
  wall: number,
  chamber?: IPortraitOralChamber,
): { mesh: IAutoMovieMesh; boundary: number[]; } {
  assertPortraitOralLining(depth, wall, chamber);
  const boundary: number[] = tracePortraitOralBoundary(surface, seed);
  const rim: (readonly number[])[] = boundary.map((id: number): readonly number[] => surface.positions[id]);
  const count: number = rim.length,
    rows: number = 24;
  const center: number[] = [0, 1, 2].map((axis: number): number =>
    rim.reduce((sum: number, p: readonly number[]): number => sum + p[axis] / count, 0),
  );
  const positions: number[] = rim.flatMap((p: readonly number[]): number[] => [...p]),
    indices: number[] = [];
  const expanded: boolean =
    chamber !== undefined &&
    (chamber.horizontalExpansion !== 0 || chamber.verticalExpansion !== 0);
  const extents: number[] | undefined = expanded
    ? [0, 1].map((axis: number): number =>
        Math.max(...rim.map((p: readonly number[]): number => Math.abs(p[axis] - center[axis]))),
      )
    : undefined;
  if (
    extents !== undefined &&
    extents.some((v: number): boolean => !Number.isFinite(v) || v <= 0)
  )
    throw new Error(
      "Oral chamber needs positive finite projected rim extents.",
    );
  for (let row: number = 1; row < rows; row++) {
    const v: number = row / rows;
    const radius: number = Math.cos(
      (Math.PI * Math.max(0, (v - wall) / (1 - wall))) / 2,
    );
    for (const p of rim) {
      positions.push(
        (1 - radius) * center[0] + radius * p[0],
        (1 - radius) * center[1] + radius * p[1],
        (1 - radius) * center[2] + radius * p[2] - 1.8 * depth * v,
      );
      if (expanded) {
        const t: number = Math.min(1, (1.8 * depth * v) / chamber!.transitionDepth),
          weight: number = radius * t * t * (3 - 2 * t),
          at: number = positions.length - 3;
        positions[at] +=
          weight *
          ((p[0] - center[0]) / extents![0]) *
          chamber!.horizontalExpansion;
        positions[at + 1] +=
          weight *
          ((p[1] - center[1]) / extents![1]) *
          chamber!.verticalExpansion;
      }
    }
  }
  const pole: number = positions.length / 3;
  positions.push(center[0], center[1], center[2] - 1.8 * depth);
  if (!positions.every(Number.isFinite))
    throw new Error("Oral lining exceeds representable coordinates.");
  for (let col: number = 0; col < count; col++) {
    const after: number = (col + 1) % count;
    for (let row: number = 0; row < rows - 1; row++) {
      const a: number = row * count + col,
        b: number = a + count;
      const c: number = row * count + after,
        d: number = c + count;
      indices.push(a, b, c, c, b, d);
    }
    indices.push((rows - 1) * count + col, pole, (rows - 1) * count + after);
  }
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
  // Native vertices [0,count) are the exact copied skin cycle. Retain the
  // traversal's IDs alongside them instead of reconstructing that identity
  // after packing, where equal coordinates may belong to different tissues.
  return { mesh, boundary };
}
