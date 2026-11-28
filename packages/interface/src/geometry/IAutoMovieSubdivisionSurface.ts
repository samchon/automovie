import type { IAutoMovieSubdivisionParameter } from "./IAutoMovieSubdivisionParameter";

/**
 * One evaluated Catmull-Clark level with indexed limit positions, sector
 * normals and face-varying UVs.
 *
 * Every face is a quad wound like its cage face. Vertex order is deterministic:
 * first one vertex per cage vertex in cage order, so cage vertex `i` keeps
 * index `i` at every level, then one per edge, then one per face, applied level
 * by level. Edges are numbered by first appearance walking faces in order and
 * corners in order. Faces descend from their parent face in order, one per
 * parent corner, starting at that corner.
 *
 * Each corner has an independent normal index and, when present, a UV index.
 * Use limit positions and the supplied sector normals for rendering. Split
 * vertices where position, normal or UV indices differ.
 *
 * Direct evaluation requires a quad level. It shares the level's control, face
 * and UV buffers and creates the limit arrays and each vertex's chart address.
 * Refine a nonquad source cage before direct evaluation.
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
