import {
  type IAutoMovieMeshQueryHierarchy,
  buildAutoMovieMeshQueryHierarchy,
} from "@automovie/engine";

import { readHumanBodyUnderwearFaceField } from "./readHumanBodyUnderwearFaceField";
import type { IHumanBodyUnderwearEnvelopeCentre } from "./IHumanBodyUnderwearEnvelopeCentre";

import type { IHumanBodyUnderwearEnvelope } from "./IHumanBodyUnderwearEnvelope";
import type { IHumanBodyUnderwearEnvelopeInput } from "./IHumanBodyUnderwearEnvelopeInput";

type CentreNode = IAutoMovieMeshQueryHierarchy<IHumanBodyUnderwearEnvelopeCentre>;

/**
 * Compile one continuous distance to the qualified exterior ball centres.
 *
 * The native triangle owner admits grid centres using exterior-side, open-rim and clearance conditions. An own-ball centre is the represented source point plus rho times its supplied direction; its separate predicate requires triangle clearance at least rho and represented own-point distance at most rho. That predicate does not repeat the grid's signed-side or open-rim checks, and the latter inequality does not assert exact tangency. The fitter pins each admitted own-ball source point to its original coordinates. Adding those centres removes pressure caused solely by missing grid tangency. No centre is snapped or moved after qualification. The envelope is the union of these balls; its ideal nearest-centre distance is continuous and its active gradient is piecewise smooth, subject to the implemented binary64 arithmetic. The coupled surface owner resolves the mesh, rather than independently projecting vertices across those branch changes. All coordinates are posed-frame metres and no skin/source topology changes.
 *
 * @evidence contracts/common.md#principled-implementation Qualified voxel and own-normal ball centres define nearest-centre distance, an active radial gradient and the shared face-field reader; hierarchy bounds preserve the actual centre selection with deterministic ID ties.
 * @evidence contracts/common.md#clear-and-simple-design Centre qualification happens once, while a bounded nearest search and delegated face reader expose the same union-of-balls field to fitting consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty qualified set refuses; own anchors require clearance and represented distance admission, and a piecewise gradient or envelope proximity does not prove a connected emitted garment is valid.
 * @evidence contracts/common.md#meaningful-documentation The prose states posed metre units, distinct grid/own-ball qualification, exact coordinate pinning versus represented tangency, unchanged centres and the connected fitter's separate responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Qualification traverses grid mask and source points with voxel-owner clearance queries; hierarchy pruning accelerates nearest reads but worst-case traversal still visits all C centres, and face-field cost belongs to its complete reader.
 * @evidence contracts/performance.md#reuse-equivalent-work One hierarchy serves point and face queries, and the last nearest centre seeds the next bound without skipping the full required search or changing lower-ID tie resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned envelope retains centres, hierarchy and one recent centre until unreachable; returned readings copy coordinates, qualification mask is temporary except the free flags, and no external handle or task is acquired.
 */
export function createHumanBodyUnderwearEnvelope(
  input: IHumanBodyUnderwearEnvelopeInput,
): IHumanBodyUnderwearEnvelope {
  const { voxels, points, normals, rho }: typeof input = input;
  const mask: ReturnType<typeof voxels.centres> = voxels.centres(rho);
  const centres: IHumanBodyUnderwearEnvelopeCentre[] = [];
  const add: (point: number[]) => void = (point: number[]): void => {
    centres.push({ id: centres.length, low: point, high: point, centre: point });
  };
  for (let i: number = 0; i < mask.length; i++) if (mask[i] !== 0) add(voxels.centre(i));
  const free: Uint8Array = new Uint8Array(points.length / 3);
  for (let vertex: number = 0; vertex < free.length; vertex++) {
    const point: number[] = [0, 1, 2].map((axis: number): number => points[vertex * 3 + axis] + rho * normals[vertex * 3 + axis]);
    const ownDistance: number = Math.sqrt([0, 1, 2].reduce((sum: number, axis: number): number => sum +
      (point[axis] - points[vertex * 3 + axis]) ** 2, 0));
    if (voxels.clearance(point) >= rho && ownDistance <= rho) {
      free[vertex] = 1;
      add(point);
    }
  }
  if (centres.length === 0) throw new Error("Garment fitting has no qualified exterior ball centres.");
  const root: CentreNode = buildAutoMovieMeshQueryHierarchy(centres);
  let recent: IHumanBodyUnderwearEnvelopeCentre = centres[0];
  const read: IHumanBodyUnderwearEnvelope["read"] = (point: Parameters<IHumanBodyUnderwearEnvelope["read"]>[0]): ReturnType<IHumanBodyUnderwearEnvelope["read"]> => {
      let best: IHumanBodyUnderwearEnvelopeCentre = recent;
      const squared: (at: readonly number[]) => number = (at: readonly number[]): number =>
        (point[0] - at[0]) ** 2 + (point[1] - at[1]) ** 2 + (point[2] - at[2]) ** 2;
      let bestSquared: number = squared(best.centre);
      const bound: (node: CentreNode) => number = (node: CentreNode): number => {
        let result: number = 0;
        for (let k: number = 0; k < 3; k++) result += Math.max(0, node.low[k] - point[k], point[k] - node.high[k]) ** 2;
        return result;
      };
      const visit: (node: CentreNode) => void = (node: CentreNode): void => {
        if (bound(node) > bestSquared) return;
        if ("triangles" in node) {
          for (const centre of node.triangles) {
            const value: number = squared(centre.centre);
            if (value < bestSquared || (value === bestSquared && centre.id < best.id)) {
              best = centre; bestSquared = value;
            }
          }
        } else {
          const left: number = bound(node.left), right: number = bound(node.right);
          if (left <= right) { visit(node.left); visit(node.right); }
          else { visit(node.right); visit(node.left); }
        }
      };
      visit(root);
      recent = best;
      const distance: number = Math.sqrt(bestSquared);
      return { distance, centre: [...best.centre], gradient: point.map((value: number, axis: number): number =>
        distance === 0 ? 0 : (value - best.centre[axis]) / distance) };
  };
  return {
    free,
    centres: centres.length,
    read,
    readFace: (face: Parameters<IHumanBodyUnderwearEnvelope["readFace"]>[0]): ReturnType<IHumanBodyUnderwearEnvelope["readFace"]> => readHumanBodyUnderwearFaceField({
      face, centres, root, seed: read(face.slice(0, 3)).centre,
    }),
  };
}
