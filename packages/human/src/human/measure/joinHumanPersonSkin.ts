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
 *
 * @evidence contracts/common.md#principled-implementation The halves are joined by their declared source identity, not by position, so the result is the one skin the generation defines.
 * @evidence contracts/common.md#clear-and-simple-design Find the domain, append each part of it, keep the anchor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parts of another domain (eyes, teeth, clothing) are left out instead of competing for a contour.
 * @evidence contracts/common.md#meaningful-documentation States what is joined, how identity survives, the precision and the null case.
 * @evidence contracts/modeling.md#spatial-conventions Float32 metres in the model frame.
 * @evidence contracts/modeling.md#shared-boundaries The head/body boundary samples stay one physical vertex.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads parts by source identity and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The joined buffer is read, never emitted.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
