import { buildAutoMoviePolyhedron } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { accountMeshes } from "../accountMeshes";
import type { MeshAccount } from "../MeshAccount";


/** Topology account of a polyhedron built from face corner lists. */
export const accountFaces = (id: string, faces: ReadonlyArray<{ corners: readonly IAutoMovieVector3[]; }>): MeshAccount => accountMeshes(id, [buildAutoMoviePolyhedron(faces.map((face) => face.corners))]);
