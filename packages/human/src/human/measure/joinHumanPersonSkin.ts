import type {
  IAutoMovieMeshPhysicalSource,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { meshOfHumanPart } from "../build/meshOfHumanPart";
import type { IAutoMovieHumanPersonJoinedSkin } from "../structures/IAutoMovieHumanPersonJoinedSkin";

/**
 * Concatenate actual meshes carrying the first source-table domain that names the requested sample. Physical source references keep domain/ID correspondence with adjusted table offsets; render vertices are not welded. The contour consumer can resolve seam aliases through those identities under the already-admitted model contract. Return null if no actual referenced vertex supplies the anchor. Every part must be a supported static mesh and its source metadata must remain resident/consistent.
 *
 * Positions are rounded to Float32. This reader does not revalidate alias agreement, source-table uniqueness, manifoldness or clinical girth qualification, and choosing a domain from a table row alone does not prove that row is drawn.
 *
 * @evidence contracts/common.md#principled-implementation Actual source domain/ID records select the geometry and anchor, and index/source offsets preserve correspondence across separate head/body parts.
 * @evidence contracts/common.md#clear-and-simple-design Concatenation keeps render topology separate from physical alias resolution by the contour consumer, with null for an unavailable anchor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates or material names do not invent source identity, and no geometric weld, closed-contour guarantee or clinical measurement is claimed here.
 * @evidence contracts/common.md#meaningful-documentation Prose states first-domain selection, actual anchor presence, static mesh/source premises and Float32 precision.
 * @evidence contracts/performance.md#efficient-algorithms Mesh/source scans select a domain, then admitted matching parts append positions, triangle order and references linearly in their actual populations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call reads its supplied performed model and creates fresh joined buffers; no cached geometry or source-domain result is owned here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output buffers scale with included meshes and replace no global state; intermediate arrays are call-local and no asset reader or render resource is acquired.
 */
export function joinHumanPersonSkin(
  model: IAutoMovieModel,
  sample: number,
): IAutoMovieHumanPersonJoinedSkin | null {
  const meshes: IAutoMovieMesh[] = model.parts
    .map(meshOfHumanPart)
    .filter((mesh: IAutoMovieMesh): boolean => mesh.physicalVertices !== undefined);
  const domain: string | undefined = meshes
    .flatMap((mesh: IAutoMovieMesh): IAutoMovieMeshPhysicalSource[] => mesh.physicalVertices!.sources)
    .find((source: IAutoMovieMeshPhysicalSource): boolean => source.id === sample)?.domain;
  if (domain === undefined) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  const sources: IAutoMovieMeshPhysicalSource[] = [];
  const vertices: (number | null)[] = [];
  let anchor: IAutoMovieVector3 | undefined;
  for (const mesh of meshes) {
    const physical: NonNullable<IAutoMovieMesh["physicalVertices"]> = mesh.physicalVertices!;
    if (!physical.sources.some((source: IAutoMovieMeshPhysicalSource): boolean => source.domain === domain)) continue;
    const vertexOffset: number = positions.length / 3;
    const sourceOffset: number = sources.length;
    for (const value of mesh.positions) positions.push(Math.fround(value));
    // an unindexed mesh lists its triangles' vertices in order
    const order: number[] =
      mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_: unknown, vertex: number): number => vertex);
    for (const index of order) indices.push(index + vertexOffset);
    sources.push(...physical.sources);
    physical.vertices.forEach((reference: number | null, vertex: number): void => {
      vertices.push(reference === null ? null : reference + sourceOffset);
      const source: IAutoMovieMeshPhysicalSource | undefined =
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
