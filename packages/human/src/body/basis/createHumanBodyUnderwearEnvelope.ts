import { buildAutoMovieMeshQueryHierarchy } from "@automovie/engine";

import { readHumanBodyUnderwearFaceField } from "./readHumanBodyUnderwearFaceField";
import type { IHumanBodyUnderwearEnvelopeCentre } from "./IHumanBodyUnderwearEnvelopeCentre";

import type { IHumanBodyUnderwearEnvelope } from "./IHumanBodyUnderwearEnvelope";
import type { IHumanBodyUnderwearEnvelopeInput } from "./IHumanBodyUnderwearEnvelopeInput";

type CentreNode = ReturnType<typeof buildAutoMovieMeshQueryHierarchy<IHumanBodyUnderwearEnvelopeCentre>>;

/**
 * Compile one continuous distance to the qualified exterior ball centres.
 *
 * The native triangle owner admits the voxel centres and every own-ball centre.
 * A free own ball is a radius from its original source point and contains no
 * other source triangle, so that material point is an exact fitting anchor.
 * Adding those centres removes pressure caused solely by missing grid tangency.
 * No centre is snapped or moved after qualification. The envelope is the union
 * of these balls; nearest-centre distance is continuous, while its active
 * gradient is piecewise smooth. The coupled surface owner resolves the mesh,
 * rather than independently projecting vertices across those branch changes.
 * All coordinates are posed-frame metres and no skin/source topology changes.
 */
export function createHumanBodyUnderwearEnvelope(
  input: IHumanBodyUnderwearEnvelopeInput,
): IHumanBodyUnderwearEnvelope {
  const { voxels, points, normals, rho } = input;
  const mask = voxels.centres(rho);
  const centres: IHumanBodyUnderwearEnvelopeCentre[] = [];
  const add = (point: number[]): void => {
    centres.push({ id: centres.length, low: point, high: point, centre: point });
  };
  for (let i = 0; i < mask.length; i++) if (mask[i] !== 0) add(voxels.centre(i));
  const free = new Uint8Array(points.length / 3);
  for (let vertex = 0; vertex < free.length; vertex++) {
    const point = [0, 1, 2].map((axis) => points[vertex * 3 + axis] + rho * normals[vertex * 3 + axis]);
    const ownDistance = Math.sqrt([0, 1, 2].reduce((sum, axis) => sum +
      (point[axis] - points[vertex * 3 + axis]) ** 2, 0));
    if (voxels.clearance(point) >= rho && ownDistance <= rho) {
      free[vertex] = 1;
      add(point);
    }
  }
  if (centres.length === 0) throw new Error("Garment fitting has no qualified exterior ball centres.");
  const root = buildAutoMovieMeshQueryHierarchy(centres);
  let recent = centres[0];
  const read: IHumanBodyUnderwearEnvelope["read"] = (point) => {
      let best = recent;
      const squared = (at: readonly number[]): number =>
        (point[0] - at[0]) ** 2 + (point[1] - at[1]) ** 2 + (point[2] - at[2]) ** 2;
      let bestSquared = squared(best.centre);
      const bound = (node: CentreNode): number => {
        let result = 0;
        for (let k = 0; k < 3; k++) result += Math.max(0, node.low[k] - point[k], point[k] - node.high[k]) ** 2;
        return result;
      };
      const visit = (node: CentreNode): void => {
        if (bound(node) > bestSquared) return;
        if ("triangles" in node) {
          for (const centre of node.triangles) {
            const value = squared(centre.centre);
            if (value < bestSquared || (value === bestSquared && centre.id < best.id)) {
              best = centre; bestSquared = value;
            }
          }
        } else {
          const left = bound(node.left), right = bound(node.right);
          if (left <= right) { visit(node.left); visit(node.right); }
          else { visit(node.right); visit(node.left); }
        }
      };
      visit(root);
      recent = best;
      const distance = Math.sqrt(bestSquared);
      return { distance, centre: [...best.centre], gradient: point.map((value, axis) =>
        distance === 0 ? 0 : (value - best.centre[axis]) / distance) };
  };
  return {
    free,
    centres: centres.length,
    read,
    readFace: (face) => readHumanBodyUnderwearFaceField({
      face, centres, root, seed: read(face.slice(0, 3)).centre,
    }),
  };
}
