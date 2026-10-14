import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonHeadTransform } from "../structures/IAutoMovieHumanPersonHeadTransform";

/**
 * Copy mesh positions through the supplied `point` transform and existing normals through `direction`; indices, UVs, colours, relief and skin remain borrowed unchanged. Positions use common source metres and directions are dimensionless. A null normal buffer remains null.
 *
 * Caller transforms must be finite rigid-frame readers and leave captured inputs unchanged. Source identity records/vertex references are copied and engine-admitted before and after movement. This validates represented aliases rather than proving anatomy, global embeddedness or current GPU appearance.
 *
 * @evidence contracts/common.md#principled-implementation Position and direction paths apply the same admitted rigid head carry, while copied physical identities retain engine grid agreement before/after placement.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-stride mapper handles vector buffers; the caller owns transform construction and the engine owns physical alias admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing normals remain absent and identity is never inferred from proximity; arbitrary callback rigidity/purity remains a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Prose states units, owned transformed buffers, borrowed untouched attributes and validation scope.
 * @evidence contracts/performance.md#efficient-algorithms Position/normal walks cost O(V) plus actual callback cost, and optional source-table copy/admission pays its actual identity population.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied transform serves all vertices/directions and unchanged connectivity/attributes are reused without cloning their mesh populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned mesh owns changed vectors and copied physical metadata while borrowing other buffers; local callbacks retain nothing after the call and no task is acquired.
 */
export function moveHumanMeshRigidly(
  mesh: IAutoMovieMesh,
  transform: Pick<IAutoMovieHumanPersonHeadTransform, "point" | "direction">,
): IAutoMovieMesh {
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const apply: (
    values: readonly number[],
    move: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ) => number[] = (
    values: readonly number[],
    move: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ): number[] => {
    const output: number[] = values.slice();
    for (let at: number = 0; at < output.length; at += 3) {
      const moved: IAutoMovieVector3 = move({
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
            sources: mesh.physicalVertices.sources.map(
              (
                source: NonNullable<
                  IAutoMovieMesh["physicalVertices"]
                >["sources"][number],
              ): NonNullable<
                IAutoMovieMesh["physicalVertices"]
              >["sources"][number] => ({
                ...source,
              }),
            ),
            vertices: mesh.physicalVertices.vertices.slice(),
          },
        }),
  };
  if (output.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(output);
  return output;
}
