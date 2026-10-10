import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "./IAutoMovieHumanPersonSeam";

/**
 * What subdividing one posed skin region onto the common face/body neck
 * polyline reads: the region's posed mesh and its skin source vertices, which
 * side it is, the seam, the posed face skin with its normals, and optional
 * failure provenance and physical registration. Positions are metres, Y up,
 * +Z forward.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundaryStitchProps {
  /** The region's posed mesh. */
  mesh: IAutoMovieMesh;

  /** Skin source vertex per mesh vertex. */
  sources: readonly number[];

  /** Which skin the region belongs to. */
  side: "face" | "body";

  /** The face/body neck seam. */
  seam: IAutoMovieHumanPersonSeam;

  /** Posed face skin positions, metres. */
  face: readonly number[];

  /** Posed skin normals, flat triples indexed by face skin vertex; read at face-loop vertices. */
  faceNormals: readonly number[];

  /** Body source positions after rig posing, before collar alignment; failure provenance only. */
  bodyBeforeCollar?: readonly number[];

  /** Canonical physical pairs aligned with the registered face loop. */
  physicalBoundary?: readonly IAutoMovieMeshPhysicalSource[];

  /** Carry an internal source scalar through each actual appended stencil. */
  appendSourceScalar?: (vertex: number, parents: readonly number[], weights: readonly number[]) => void;
}
