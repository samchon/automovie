import { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import { assertPortraitOralLining } from "./assertPortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";
import { tracePortraitOralBoundary } from "./tracePortraitOralBoundary";

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
 * @evidence contracts/common.md#principled-implementation The enclosure copies the traced rim exactly, then stacks twenty-three further rings that hold the opening's section until the wall fraction and taper by a cosine radius to a single posterior pole at 1.8 depths, with the optional chamber widening the rings by a smoothstep weight that is zero at the rim. Each ring keeps the rim's vertex order, so the strips join by index; the winding is the skin's reversed so the visible side faces inward, and the mesh returns the skin vertex that each rim vertex copied.
 * @evidence contracts/common.md#clear-and-simple-design One producer of geometry and skin correspondence for the component and the standalone builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the ring count and the 1.8 pole depth are documented dimensions of the enclosure.
 * @evidence contracts/common.md#meaningful-documentation The comment states the rings, the taper, the winding, the chamber's neutrality, that no gingiva is reconstructed and what the returned boundary names.
 * @evidence contracts/modeling.md#part-identity-and-grouping The declaration builds one part, the oral lining enclosure.
 * @evidence contracts/modeling.md#emitted-geometry The population is rows (23 rings plus the pole) times the rim's own vertex count, so it follows the refined rim's resolution and is independent of the depth, wall and chamber values; a card or a single cap could not join every actual rim vertex.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres in and out; depth and chamber values are millimetres and the wall a fraction.
 * @evidence contracts/modeling.md#shared-boundaries The rim vertices are the exact skin boundary vertices traced from the refined surface, and the returned boundary names the skin vertex behind each, so the lining and the lip band share one boundary and cannot open at the join for any admitted depth, wall or chamber. Its back is a free enclosure that other oral parts may cross.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are a named depth, a named wall fraction and a named chamber in millimetres; none addresses a vertex, curve or patch of the lining.
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
    normals: areaWeightedNormals(positions, indices),
    uvs: null,
    skin: null,
  };
  // Native vertices [0,count) are the exact copied skin cycle. Retain the
  // traversal's IDs alongside them instead of reconstructing that identity
  // after packing, where equal coordinates may belong to different tissues.
  return { mesh, boundary };
}
