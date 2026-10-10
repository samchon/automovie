import type { IAutoMovieMesh } from "@automovie/interface";
import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";

/**
 * An acquired-source-attached material sheet in common atlas metres.
 * X points left, Y up and Z anterior. Station identities and original
 * triangles remain material addresses, not anatomical measurements.
 * The continuous origin path includes each authored attachment once.
 * No parameter here is a public personal sculpting channel.
 * @author Samchon
 */
export interface IHumanTrunkSourceChart {
  /** Original oriented two-layer boundary; rows vary along the origin. */
  mesh: IHumanTrunkSourceIndexedMesh;

  /** Number of original rows and columns in each boundary layer. */
  rows: number;
  columns: number;

  /** Original material row of each acquired attachment, in increasing order. */
  originStations: readonly number[];

  /** Actual acquired atlas attachment coordinates parallel to originStations. */
  origins: readonly (readonly number[])[];

  /** Named source bone for each actual origin attachment. */
  originBones: readonly AutoMovieHumanBodyBoneId[];

  /** Named humeral source bone carrying the actual terminal. */
  terminalBone: AutoMovieHumanBodyBoneId;
}

/**
 * Explicit original triangle ordinals of a source chart boundary.
 * An implicit nonindexed mesh has no stable original face addresses for
 * source quantity, chart lineage or downstream attachment registration.
 * @author Samchon
 */
interface IHumanTrunkSourceIndexedMesh extends IAutoMovieMesh {
  /** Three original vertex ordinals per triangle, preserved in source order. */
  indices: number[];
}
