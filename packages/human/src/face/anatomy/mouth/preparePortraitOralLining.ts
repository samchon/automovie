
import { portraitNormals } from "../../mesh/portraitNormals";
import { assertPortraitOralLining } from "./assertPortraitOralLining";
import { tracePortraitOralBoundary } from "./tracePortraitOralBoundary";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";
import { IAutoMovieMesh } from "@automovie/interface";
/**
 * Close the interior behind one actual refined lip boundary. The seed chooses
 * its oriented free cycle from a lip band that may also have an outer boundary.
 * Rim coordinates are copied exactly; no second lip spline estimates them.
 * Twenty-four depth rings keep the opening section until the authored fraction,
 * then taper to one posterior pole at 1.8 nominal depths behind the rim centre.
 * The lining reverses each skin boundary edge so its visible side faces inward.
 * Optional chamber dimensions expand X/Y behind the vestibule without moving
 * the rim or cap. Omission and two zero expansions preserve the original mesh.
 * This enclosure does not reconstruct gingiva or certify tissue clearance.
 * The returned boundary names the source skin vertex for each initial mesh
 * vertex, in order. Both boundary and mesh arrays are newly owned.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs an explicit oral enclosure separately from teeth and tongue.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples a declared straight-wall fraction and posterior cosine taper in head millimetres.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Uses the final skin's actual attachment boundary after refinement and performance.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Traces the seeded free cycle, copies every refined rim point and opposes its skin-edge winding.
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
) {
  assertPortraitOralLining(depth, wall, chamber);
  const boundary = tracePortraitOralBoundary(surface, seed);
  const rim = boundary.map((id) => surface.positions[id]);
  const count = rim.length,
    rows = 24;
  const center = [0, 1, 2].map((axis) =>
    rim.reduce((sum, p) => sum + p[axis] / count, 0),
  );
  const positions = rim.flatMap((p) => [...p]),
    indices: number[] = [];
  const expanded =
    chamber !== undefined &&
    (chamber.horizontalExpansion !== 0 || chamber.verticalExpansion !== 0);
  const extents = expanded
    ? [0, 1].map((axis) =>
        Math.max(...rim.map((p) => Math.abs(p[axis] - center[axis]))),
      )
    : undefined;
  if (
    extents !== undefined &&
    extents.some((v) => !Number.isFinite(v) || v <= 0)
  )
    throw new Error(
      "Oral chamber needs positive finite projected rim extents.",
    );
  for (let row = 1; row < rows; row++) {
    const v = row / rows;
    const radius = Math.cos(
      (Math.PI * Math.max(0, (v - wall) / (1 - wall))) / 2,
    );
    for (const p of rim) {
      positions.push(
        (1 - radius) * center[0] + radius * p[0],
        (1 - radius) * center[1] + radius * p[1],
        (1 - radius) * center[2] + radius * p[2] - 1.8 * depth * v,
      );
      if (expanded) {
        const t = Math.min(1, (1.8 * depth * v) / chamber.transitionDepth),
          weight = radius * t * t * (3 - 2 * t),
          at = positions.length - 3;
        positions[at] +=
          weight *
          ((p[0] - center[0]) / extents![0]) *
          chamber.horizontalExpansion;
        positions[at + 1] +=
          weight *
          ((p[1] - center[1]) / extents![1]) *
          chamber.verticalExpansion;
      }
    }
  }
  const pole = positions.length / 3;
  positions.push(center[0], center[1], center[2] - 1.8 * depth);
  if (!positions.every(Number.isFinite))
    throw new Error("Oral lining exceeds representable coordinates.");
  for (let col = 0; col < count; col++) {
    const after = (col + 1) % count;
    for (let row = 0; row < rows - 1; row++) {
      const a = row * count + col,
        b = a + count;
      const c = row * count + after,
        d = c + count;
      indices.push(a, b, c, c, b, d);
    }
    indices.push((rows - 1) * count + col, pole, (rows - 1) * count + after);
  }
  const mesh: IAutoMovieMesh = {
    positions,
    indices,
    normals: portraitNormals(positions, indices),
    uvs: null,
    skin: null,
  };
  // Native vertices [0,count) are the exact copied skin cycle. Retain the
  // traversal's IDs alongside them instead of reconstructing that identity
  // after packing, where equal coordinates may belong to different tissues.
  return { mesh, boundary };
}