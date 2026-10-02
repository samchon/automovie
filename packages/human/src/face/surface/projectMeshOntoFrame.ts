import { Vector3 } from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A copy of a mesh with its positions expressed in a directional frame: each
 * position becomes its dot products with `across`, `up` and `forward`. The
 * copy sets `normals` to null. Refuses positions that are incomplete or not
 * finite. Shared by the directional contact and
 * intersection constructors.
 *
 * @evidence contracts/common.md#principled-implementation Expressing every position as its dot products with three orthonormal axes is the change of basis into that frame; the axes come from portraitDirectionalContactFrame, so the map is a rotation and preserves distances and triangle topology.
 * @evidence contracts/common.md#clear-and-simple-design A single loop that returns a copy with normals dropped, since normals no longer describe the new frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation States the copy semantics, that normals are nulled, and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions The named conversion step: world coordinates in, (across, up, forward) coordinates out, same unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping projectMeshOntoFrame is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels projectMeshOntoFrame defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry projectMeshOntoFrame decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries projectMeshOntoFrame constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation projectMeshOntoFrame owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source projectMeshOntoFrame carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range projectMeshOntoFrame admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority projectMeshOntoFrame defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export function projectMeshOntoFrame(
  mesh: IAutoMovieMesh,
  across: IAutoMovieVector3,
  up: IAutoMovieVector3,
  forward: IAutoMovieVector3,
): IAutoMovieMesh {
  if (mesh.positions.length % 3 !== 0 || !mesh.positions.every(Number.isFinite))
    throw new Error(
      "Directional contact needs complete finite mesh positions.",
    );
  const positions: number[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const point = Vector3.create(
      mesh.positions[i],
      mesh.positions[i + 1],
      mesh.positions[i + 2],
    );
    positions.push(
      Vector3.dot(point, across),
      Vector3.dot(point, up),
      Vector3.dot(point, forward),
    );
  }
  return { ...mesh, positions, normals: null };
}
