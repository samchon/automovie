import type {
  AutoMovieTextureBinding,
  IAutoMovieMaterial,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSurfaceAttachment } from "../../structures/IAutoMovieHumanFaceSurfaceAttachment";
import type { IHumanFaceIrisGlobe } from "./structures/IHumanFaceIrisGlobe";
import type { IHumanFaceIrisGlobeTriangle } from "./structures/IHumanFaceIrisGlobeTriangle";

/**
 * The globe of one eye: the first textured, UV-bearing region whose triangles
 * are fully bound to that eye owner (weight one on all three vertices), with
 * the neutral positions of all weight-one bound vertices occurring anywhere
 * in that selected region. Mixed-owner triangles do not enter triangles but
 * their bound corners can still enter positions. Null when no surface has one.
 *
 * A region without UVs or with a non-string texture binding is skipped.
 * Preparation later admits the selected string as a base64 PNG data URI.
 * The basis is read only.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Complete weight-one eye attachment selects the first textured UV region and its actual neutral triangles/vertices.
 * @evidence contracts/common.md#clear-and-simple-design Source eye ownership is resolved from attachment incidence instead of asset names or painted pixels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External texture objects and absent UVs are skipped; embedded string decoding/admission remains the PNG preparation owner's responsibility.
 * @evidence contracts/common.md#meaningful-documentation The prose states first-match selection, neutral metre geometry, source immutability and null absence.
 * @evidence contracts/performance.md#efficient-algorithms Each visited surface scans attachments and their weight rows; each visited region searches M materials and scans T triangle corners. The first match also scans its indices for unique bound positions, retaining O(T+V) copied geometry for that region.
 * @evidence contracts/performance.md#reuse-equivalent-work A bound-vertex set serves all region triangle tests and a unique resident list supplies neutral globe fitting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned geometry arrays own their samples and retain the texture string; temporary membership sets expire without handles or caches.
 */
export function findHumanFaceIrisGlobe(
  basis: IAutoMovieHumanFaceBasis,
  eye: string,
): IHumanFaceIrisGlobe | null {
  for (const surface of basis.surfaces) {
    const rows: number[] =
      surface.attachments?.find(
        (one: IAutoMovieHumanFaceSurfaceAttachment): boolean =>
          one.owner === eye,
      )?.rows ?? [];
    const bound: Set<number> = new Set<number>();
    for (let i: number = 0; i < rows.length; i += 2)
      if (rows[i + 1] === 1) bound.add(rows[i]);
    const point: (vertex: number) => [number, number, number] = (
      vertex: number,
    ): [number, number, number] => [
      surface.positions[3 * vertex],
      surface.positions[3 * vertex + 1],
      surface.positions[3 * vertex + 2],
    ];
    for (const region of surface.regions) {
      const texture: AutoMovieTextureBinding | null | undefined =
        basis.materials.find(
          (one: IAutoMovieMaterial): boolean => one.id === region.material,
        )?.baseColorTexture;
      // Non-string texture references and untextured regions cannot supply
      // this reader's resident string binding; PNG admission belongs to preparation.
      if (region.uvs === null || typeof texture !== "string") continue;
      const uvs: number[] = region.uvs;
      const triangles: IHumanFaceIrisGlobeTriangle[] = [];
      for (let t: number = 0; t < region.indices.length; t += 3) {
        const corners: number[] = region.indices.slice(t, t + 3);
        if (corners.every((vertex: number): boolean => bound.has(vertex)))
          triangles.push({
            positions: corners.map(point),
            uvs: [0, 1, 2].map((k: number): [number, number] => [
              uvs[2 * (t + k)],
              uvs[2 * (t + k) + 1],
            ]),
          });
      }
      if (triangles.length === 0) continue;
      const vertices: number[] = [
        ...new Set(
          region.indices.filter((vertex: number): boolean => bound.has(vertex)),
        ),
      ];
      return {
        eye,
        material: region.material,
        texture,
        triangles,
        positions: vertices.map(point),
      };
    }
  }
  return null;
}
