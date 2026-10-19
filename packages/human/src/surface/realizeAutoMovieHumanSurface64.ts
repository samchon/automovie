import { realizeAutoMovieBicubicAtlas64 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanSkinDomain } from "../junction/IAutoMovieHumanSkinDomain";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";

/**
 * Realize the common field once and transport its actual chart ownership.
 * The core's triangle-corner parameters supply UV packing and head addresses;
 * neither render-index text nor nearest-point estimation supplies a chart.
 * Texture seams split render vertices while preserving source physical identity
 * and analytic normal fans. Partial core geometry keeps its actual diagnostics,
 * patch ranges and triangle roles rather than inventing omitted surface.
 *
 * The call retains O(V+F) output and seam lookup records. Requested core parameter
 * buffers transfer to the returned result; temporary vertex maps expire here.
 * UV0 is a fixed profile packing, not a physical distance metric. Head addresses
 * describe the actual emitted triangle map, not an exact inverse of the field.
 */
export function realizeAutoMovieHumanSurface64(definition: D): {
  mesh: IAutoMovieMesh;
  domain: IAutoMovieHumanSkinDomain;
  trianglePatches: string[];
  triangleParameters: number[];
  headCoordinates: (number[] | null)[];
  complete: boolean;
  approximationQualified: boolean;
  diagnostics: string[];
} {
  const realized: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(definition.atlas, {
      retainTriangleParameters: true,
    });
  const source: IAutoMovieMesh = realized.mesh;
  const parameters: number[] | undefined = realized.triangleParameters;
  if (
    source.indices === null || source.normals === null ||
    source.physicalVertices === undefined || parameters === undefined ||
    parameters.length !== source.indices.length * 2
  )
    throw new Error("Generated Human field requires actual core corner parameters and physical ownership");
  const mesh: IAutoMovieMesh = {
    positions: [], normals: [], indices: [], uvs: [], skin: null,
    physicalVertices: { sources: source.physicalVertices.sources, vertices: [] },
  };
  const triangles: IAutoMovieHumanSkinDomain.Role[] = [];
  const trianglePatches: string[] = [];
  const headCoordinates: (number[] | null)[] = [];
  const seams: Map<number, Map<string, number>> = new Map();
  let written: number = 0;
  for (const range of realized.primitiveRanges) {
    if (range.firstTriangle !== written)
      throw new Error("Generated Human patch ranges must follow actual triangle ordinals");
    const owner: D.Patch | undefined = definition.patches.get(range.patch);
    if (owner === undefined)
      throw new Error(`Generated Human field lacks semantic owner ${range.patch}`);
    const rectangle: D.Patch["textureRectangle"] = owner.textureRectangle;
    for (let offset: number = 0; offset < range.triangleCount; ++offset) {
      const triangle: number = range.firstTriangle + offset;
      const head: number[] | null = owner.headChart === null ? null : [];
      for (let corner: number = 0; corner < 3; ++corner) {
        const at: number = triangle * 3 + corner;
        const original: number = source.indices[at]!;
        const u: number = parameters[2 * at]!;
        const v: number = parameters[2 * at + 1]!;
        const packedU: number = rectangle[0] + (rectangle[2] - rectangle[0]) * u;
        const packedV: number = rectangle[1] + (rectangle[3] - rectangle[1]) * v;
        if (![packedU, packedV].every(Number.isFinite))
          throw new Error(`Unresolved generated texture chart ${range.patch}`);
        // This key only reuses an existing render vertex at identical UV0.
        // Semantic ownership comes from range.patch and the core parameters.
        const key: string = JSON.stringify([packedU, packedV]);
        let variants: Map<string, number> | undefined = seams.get(original);
        if (variants === undefined) {
          variants = new Map();
          seams.set(original, variants);
        }
        let index: number | undefined = variants.get(key);
        if (index === undefined) {
          index = mesh.positions.length / 3;
          variants.set(key, index);
          for (let axis: number = 0; axis < 3; ++axis) {
            mesh.positions.push(source.positions[3 * original + axis]!);
            mesh.normals!.push(source.normals[3 * original + axis]!);
          }
          mesh.uvs!.push(packedU, packedV);
          mesh.physicalVertices!.vertices.push(
            source.physicalVertices.vertices[original]!,
          );
        }
        mesh.indices!.push(index);
        if (head !== null) {
          const chart: NonNullable<D.Patch["headChart"]> = owner.headChart!;
          for (let axis: number = 0; axis < 2; ++axis)
            head.push(
              (1-u)*(1-v)*chart[0][axis]! + u*(1-v)*chart[1][axis]! +
              u*v*chart[2][axis]! + (1-u)*v*chart[3][axis]!,
            );
        }
      }
      triangles.push(owner.skinRole);
      trianglePatches.push(range.patch);
      headCoordinates.push(head);
      ++written;
    }
  }
  if (written * 3 !== source.indices.length)
    throw new Error("Generated Human ownership does not cover actual emitted triangles");
  return {
    mesh, domain: { triangles }, trianglePatches,
    triangleParameters: parameters, headCoordinates,
    complete: realized.complete,
    approximationQualified: realized.approximationQualified,
    diagnostics: [...definition.qualifications, ...realized.diagnostics],
  };
}
