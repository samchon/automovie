import type {
  IAutoMovieMeshPhysicalSource,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { meshOfHumanPart } from "../build/meshOfHumanPart";
import type { IAutoMovieHumanPersonJoinedSkin } from "../structures/IAutoMovieHumanPersonJoinedSkin";

/**
 * Join a person model's skin halves into one Float32 buffer around one source
 * sample, or null when no part holds that sample.
 *
 * The person model carries its head and body skin halves as separate parts
 * whose vertices name their samples of the one source tree
 * (`physicalVertices`). The part that holds the sample fixes the source
 * domain, and every part of that domain is joined with its correspondence
 * kept. The shared boundary samples are therefore one physical vertex of the
 * result, and a contour that crosses the head/body cut closes. Positions are
 * quantized to Float32, the precision the model is exported and drawn at.
 */
export function joinHumanPersonSkin(
  model: IAutoMovieModel,
  sample: number,
): IAutoMovieHumanPersonJoinedSkin | null {
  const meshes = model.parts
    .map(meshOfHumanPart)
    .filter((mesh) => mesh.physicalVertices !== undefined);
  const domain = meshes
    .flatMap((mesh) => mesh.physicalVertices!.sources)
    .find((source) => source.id === sample)?.domain;
  if (domain === undefined) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  const sources: IAutoMovieMeshPhysicalSource[] = [];
  const vertices: (number | null)[] = [];
  let anchor: IAutoMovieVector3 | undefined;
  for (const mesh of meshes) {
    const physical = mesh.physicalVertices!;
    if (!physical.sources.some((source) => source.domain === domain)) continue;
    const vertexOffset = positions.length / 3;
    const sourceOffset = sources.length;
    for (const value of mesh.positions) positions.push(Math.fround(value));
    // an unindexed mesh lists its triangles' vertices in order
    const order =
      mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_, vertex) => vertex);
    for (const index of order) indices.push(index + vertexOffset);
    sources.push(...physical.sources);
    physical.vertices.forEach((reference, vertex) => {
      vertices.push(reference === null ? null : reference + sourceOffset);
      const source =
        reference === null ? undefined : physical.sources[reference];
      if (
        anchor === undefined &&
        source?.domain === domain &&
        source.id === sample
      )
        anchor = {
          x: positions[(vertexOffset + vertex) * 3],
          y: positions[(vertexOffset + vertex) * 3 + 1],
          z: positions[(vertexOffset + vertex) * 3 + 2],
        };
    });
  }
  return anchor === undefined
    ? null
    : { positions, indices, physicalVertices: { sources, vertices }, anchor };
}
