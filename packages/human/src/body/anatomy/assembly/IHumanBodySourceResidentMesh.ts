import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Indexed resident geometry and its immutable source-ordinal correspondence.
 *
 * Source bookkeeping vertices remain in the original source payload. Every
 * emitted vertex names its original ordinal, including distinct shading aliases
 * at one physical point; this table never welds coordinates or normal islands.
 *
 * @author Samchon
 */
export interface IHumanBodySourceResidentMesh {
  /** Final aligned geometry containing exactly its referenced vertices. */
  mesh: IAutoMovieMesh;

  /** Resident vertex ordinal to the original acquired/authored source ordinal. */
  sourceVertices: readonly number[];

  /** Original source population, including unreferenced provenance vertices. */
  sourceVertexCount: number;
}
