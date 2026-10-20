import { IAutoMovieSubdivisionParameter } from "./IAutoMovieSubdivisionParameter";

/**
 * A Catmull-Clark surface refined to a chosen level, with its limit positions
 * and normals.
 *
 * Every face is a quad wound like its cage face. Vertex order is deterministic:
 * first one vertex per cage vertex in cage order, so cage vertex `i` keeps index
 * `i` at every level, then one per edge, then one per face, applied level by
 * level. Edges are numbered by first appearance walking faces in order and
 * corners in order. Faces descend from their parent face in order, one per
 * parent corner, starting at that corner.
 *
 * Normals and UVs are face-varying: `normalFaces` and `uvFaces` give, per face
 * corner, an index into `normals` and `uvs`. A smooth vertex has one normal; a
 * vertex on an infinitely sharp crease, boundary corner or sharp corner has one
 * per sector of faces between its sharp edges. To render, split vertices where a
 * corner's position, normal and UV indices differ, and write `limitPositions`
 * and `normals` instead of recomputing normals from triangles, which would
 * split shading at UV seams.
 *
 * @evidence contracts/common.md#principled-implementation Packed glTF-style buffers with face-varying index arrays, the representation OpenSubdiv uses for refined surfaces, so attributes that are discontinuous only at seams or creases stay shared elsewhere.
 * @evidence contracts/common.md#clear-and-simple-design Refined control positions, limit positions, quads, face-varying normals and UVs and per-vertex parameters, each a distinct product a caller asks for; no mesh conversion is imposed because seam splitting depends on which attributes the caller keeps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sharp features get one normal per sector instead of one averaged normal that would be wrong on every side.
 * @evidence contracts/common.md#meaningful-documentation States the vertex, edge and face ordering, the face-varying layout of normals and UVs, when a vertex has several normals, and how to turn the result into a render mesh.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the refinement cost is answered on `subdivideAutoMovieSurface`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh result per call; nothing is cached on it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns its arrays, which grow by four times the face count per level: about `F * 4^L` quads for `F` cage faces at level `L`.
 */
export interface IAutoMovieSubdivisionSurface {
  /** Packed refined control positions `[x, y, z, ...]` in metres. */
  positions: number[];

  /**
   * Packed limit-surface positions in metres, one per vertex, where infinite
   * refinement would carry each vertex.
   */
  limitPositions: number[];

  /** Quads as four vertex indices each, in face order. */
  faces: number[];

  /** Packed unit limit normals `[x, y, z, ...]`. */
  normals: number[];

  /** Four indices into `normals` per quad, aligned with `faces`. */
  normalFaces: number[];

  /** Packed refined UV values `[u, v, ...]`, or `null` when the cage has none. */
  uvs: number[] | null;

  /** Four indices into `uvs` per quad, or `null` when the cage has no UVs. */
  uvFaces: number[] | null;

  /** Cage face and local coordinates of each vertex, in vertex order. */
  parameters: IAutoMovieSubdivisionParameter[];
}
