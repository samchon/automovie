import {
  createAutoMovieMeshRayCaster,
  createAutoMovieMeshSeparationQuery,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import { createHumanFaceHairRootBoundary } from "@automovie/human/face/anatomy/hair/createHumanFaceHairRootBoundary";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Compile a pure hair fixture's same-snapshot distance, ray and root readers.
 * The scenario supplies its independently known source triangle/support rather
 * than letting a nearest-point lookup invent the root's feature authority.
 * Inputs are read only and all reader snapshots own their buffers.
 */
export function createNumericalHairCollider(
  mesh: IAutoMovieMesh,
  root: { triangle: number; weights: readonly number[] },
) {
  const boundary = createHumanFaceHairRootBoundary({
    positions: mesh.positions,
    indices: mesh.indices!,
  });
  const budget = { remaining: 1_000_000 };
  // Root incidence accepts positive rescaling. Mesh seating instead carries
  // canonical unit coefficients; normalization belongs to fixture arrangement.
  const sum = root.weights.reduce((total, weight) => total + weight, 0);
  const weights = root.weights.map((weight) => weight / sum);
  return {
    budget,
    meshContext: {
      separation: {
        source: createAutoMovieMeshSeparationQuery(mesh),
        represented: createAutoMovieMeshSeparationQuery(mesh, "float32"),
      },
      budgets: [budget],
      attachments: [
        { triangle: root.triangle, weights, supports: boundary.resolve(root) },
      ],
    },
    query: createAutoMovieSignedMeshQuery(mesh),
    raycaster: createAutoMovieMeshRayCaster(mesh),
    rootBoundary: {
      triangles: boundary.resolve(root),
      distance: boundary.distance,
    },
  };
}
