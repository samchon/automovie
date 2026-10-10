import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonHeadTransform } from "../structures/IAutoMovieHumanPersonHeadTransform";

/**
 * A copy of a mesh carried by a rigid transform: positions through `point`,
 * normals through `direction`, everything else (indices, UVs, colours, relief
 * weights, skin) as it was.
 *
 * The person builder uses it for the face parts that ride the head whole, so
 * one function owns how a part follows a bone: the transform is supplied by
 * `createHumanPersonHeadTransform`, which is exact for a vertex bound to one
 * bone with weight one. A mesh without normals stays without them. The input
 * is not modified.
 * Physical source identities retain their meaning through an owned copy;
 * the shared engine admission checks alias grid agreement before and after.
 */
export function moveHumanMeshRigidly(
  mesh: IAutoMovieMesh,
  transform: Pick<IAutoMovieHumanPersonHeadTransform, "point" | "direction">,
): IAutoMovieMesh {
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const apply = (
    values: readonly number[],
    move: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ): number[] => {
    const output = values.slice();
    for (let at = 0; at < output.length; at += 3) {
      const moved = move({
        x: output[at],
        y: output[at + 1],
        z: output[at + 2],
      });
      output[at] = moved.x;
      output[at + 1] = moved.y;
      output[at + 2] = moved.z;
    }
    return output;
  };
  const output: IAutoMovieMesh = {
    ...mesh,
    positions: apply(mesh.positions, transform.point),
    normals:
      mesh.normals === null ? null : apply(mesh.normals, transform.direction),
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map((source) => ({
              ...source,
            })),
            vertices: mesh.physicalVertices.vertices.slice(),
          },
        }),
  };
  if (output.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
