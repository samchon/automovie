import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import { createHumanFaceHairRootBoundary } from "@automovie/human/face/anatomy/hair/createHumanFaceHairRootBoundary";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Same-snapshot source/Float32 mesh readers for independently arranged pure rows.
 * A scenario supplies original triangle/unit weights and explicit budgets;
 * this helper never infers a root from a nearest feature or resets a walked one.
 */
export function createNumericalHairMeshContext(
  mesh: IAutoMovieMesh,
  roots: readonly { triangle: number; weights: readonly number[] }[],
  budgets: readonly { remaining: number }[],
) {
  const boundary = createHumanFaceHairRootBoundary({
    positions: mesh.positions,
    indices: mesh.indices!,
  });
  return {
    separation: {
      source: createAutoMovieMeshSeparationQuery(mesh),
      represented: createAutoMovieMeshSeparationQuery(mesh, "float32"),
    },
    budgets,
    attachments: roots.map((root) => ({
      ...root,
      supports: boundary.resolve(root),
    })),
  };
}
