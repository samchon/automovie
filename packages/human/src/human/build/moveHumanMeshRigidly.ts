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
 *
 * @evidence contracts/common.md#principled-implementation A rigid transform moves positions by rotation and translation and normals by the rotation alone, which is what the two callbacks are; the mesh's other attributes do not depend on where it stands.
 * @evidence contracts/common.md#clear-and-simple-design Two loops over the flat arrays and a spread for the rest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is dropped, rounded or recomputed.
 * @evidence contracts/common.md#meaningful-documentation The comment states what moves how, what does not, and why the transform is supplied.
 * @evidence contracts/modeling.md#spatial-conventions Positions and normals stay in the caller's one frame; the change of frame is the supplied transform.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function moves a part's vertices and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive beyond the copy it returns.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
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
