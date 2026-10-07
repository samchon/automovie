import type { IAutoMovieHumanFaceAttachmentChart } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentChart";

import { parameterizeHumanSourceAttachmentDisk } from "./parameterizeHumanSourceAttachmentDisk.ts";

/** Parameterize an actual host triangle population with exact source correspondence. */
export function compileHumanSourceAttachmentTriangles(
  generation: string,
  surface: string,
  hostIndices: readonly number[],
  samples: readonly number[],
  population: readonly number[],
): IAutoMovieHumanFaceAttachmentChart {
  const sourceTriangles = [...new Set(population)].sort((a, b) => a - b);
  const vertices = [
    ...new Set(
      sourceTriangles.flatMap((triangle) =>
        hostIndices.slice(3 * triangle, 3 * triangle + 3),
      ),
    ),
  ].sort((a, b) => a - b);
  const ordinal = new Map(vertices.map((vertex, at) => [vertex, at]));
  const indices = sourceTriangles.flatMap((triangle) =>
    hostIndices
      .slice(3 * triangle, 3 * triangle + 3)
      .map((vertex) => ordinal.get(vertex)!),
  );
  return {
    generation,
    surface,
    vertices,
    sourceVertices: vertices.map((vertex) => samples[vertex]),
    indices,
    sourceTriangles,
    coordinates: parameterizeHumanSourceAttachmentDisk(
      indices,
      vertices.length,
    ),
    method: "uniform-barycentric-convex-disk",
    qualification: "authoredConvention",
  };
}
