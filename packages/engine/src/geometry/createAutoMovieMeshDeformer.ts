import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { cofactorAutoMovieJacobian } from "../math/cofactorAutoMovieJacobian";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMeshDeformationInfluence } from "./IAutoMovieMeshDeformationInfluence";
import { assertAutoMovieDeformedTriangles } from "./assertAutoMovieDeformedTriangles";

/**
 * Compile immutable compact deformation fields into a mesh operation. Every
 * position uses the same summed field, and normals use its analytic inverse
 * transpose. Physical source lineage is copied and admitted before and after
 * deformation: vertex-specific influence may not separate declared aliases.
 * Legacy correspondence still follows current positions. Splitting one skin
 * into material regions therefore cannot create a new lighting seam. UVs,
 * triangle identities and skin bindings are retained.
 *
 * Influence is (1-r²)^3 inside the normalized ellipsoid and zero outside.
 * Nonfinite fields, nonpositive radii and local orientation reversal are refused.
 * A positive Jacobian at each vertex does not guarantee that the straight
 * triangles joining those samples remain valid. Each emitted triangle must
 * retain nonzero area and agree with its original face orientation transported
 * by the three vertex Jacobians. This is a tessellation check, not a global
 * self-intersection test or proof of the field between its sampled vertices.
 *
 * An optional influence sample supplies a scalar mask and its spatial gradient
 * at each resident vertex. For displacement d and mask f, the composed map is
 * p + f*d and its Jacobian is I + f*(J-I) + outer(d, gradient(f)). Gradients
 * use inverse metres in the same local frame. Apply an attachment mask here,
 * before orientation checks, rather than multiplying returned displacement
 * afterwards and silently invalidating the checked geometry. Mask samples are
 * caller-owned differential observations; the operation validates their shape
 * and finite domain, not their provenance or unsampled interpolation.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Applies composable spatial displacement and stretch fields to resident geometry without changing its triangle population.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Preserves connectivity and shared normals through one analytic deformation, rejecting local folds instead of emitting inverted surface patches.
 * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Refuses malformed resident triangles and deformation output whose area collapses or opposes its transported face orientation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Checks the actual emitted triangle population as well as vertex derivatives, naming a triangle that cannot preserve an oriented surface.
 * @author Samchon
 */
export function createAutoMovieMeshDeformer(
  fields: readonly IAutoMovieMeshDeformationField[],
): (
  mesh: IAutoMovieMesh,
  influence?: readonly IAutoMovieMeshDeformationInfluence[],
) => IAutoMovieMesh {
  const packed = fields.map((field) => {
    const vector = (value: IAutoMovieVector3): number[] => [
      value.x,
      value.y,
      value.z,
    ];
    const center = vector(field.center),
      radius = vector(field.radius),
      displacement = vector(field.displacement),
      stretch = vector(field.stretch);
    if (
      ![...center, ...radius, ...displacement, ...stretch].every(
        Number.isFinite,
      ) ||
      radius.some((value) => value <= 0)
    )
      throw new Error(
        "Mesh deformation fields need finite vectors and strictly positive radii.",
      );
    return { center, radius, displacement, stretch };
  });
  return (mesh, influence) => {
    if (mesh.physicalVertices !== undefined)
      resolveAutoMovieMeshPhysicalVertices(mesh);
    const indices =
      mesh.indices ??
      Array.from({ length: mesh.positions.length / 3 }, (_v, i) => i);
    if (
      mesh.positions.length % 3 !== 0 ||
      !mesh.positions.every(Number.isFinite) ||
      indices.length % 3 !== 0 ||
      indices.some(
        (index) =>
          !Number.isInteger(index) ||
          index < 0 ||
          index >= mesh.positions.length / 3,
      ) ||
      (mesh.normals !== null &&
        (mesh.normals.length !== mesh.positions.length ||
          !mesh.normals.every(Number.isFinite)))
    )
      throw new Error(
        "Mesh deformation needs finite complete positions, aligned normals and resident triangle indices.",
      );
    if (
      influence !== undefined &&
      (influence.length !== mesh.positions.length / 3 ||
        influence.some(
          ({ weight, gradient }) =>
            ![weight, gradient.x, gradient.y, gradient.z].every(
              Number.isFinite,
            ) ||
            weight < 0 ||
            weight > 1,
        ))
    )
      throw new Error(
        "Mesh influence needs one bounded weight and finite inverse-metre gradient per vertex.",
      );
    const positions: number[] = [];
    const normals: number[] | null = mesh.normals === null ? null : [];
    // Store the analytic cofactor matrix even when shading normals are absent.
    // Topological orientation belongs to each source face's winding, not to
    // smooth normals supplied by a caller or reconstructed from the result.
    const cofactors: number[][] = [];
    for (let vertex = 0; vertex < mesh.positions.length; vertex += 3) {
      const point = mesh.positions.slice(vertex, vertex + 3);
      const target = [...point];
      const jacobian = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      for (const field of packed) {
        const dx = point[0] - field.center[0],
          dy = point[1] - field.center[1],
          dz = point[2] - field.center[2];
        // A compact field and its derivative are zero outside its support.
        // Reject the bounding box before allocating vectors or evaluating the
        // ellipsoid, since local anatomy affects only a small part of a mesh.
        if (
          Math.abs(dx) >= field.radius[0] ||
          Math.abs(dy) >= field.radius[1] ||
          Math.abs(dz) >= field.radius[2]
        )
          continue;
        const delta = [dx, dy, dz];
        const coordinates = delta.map(
          (value, axis) => value / field.radius[axis],
        );
        const squared = coordinates.reduce((sum, value) => sum + value ** 2, 0);
        if (squared >= 1) continue;
        const remaining = 1 - squared,
          weight = remaining ** 3;
        const derivative = -6 * remaining ** 2;
        for (let row = 0; row < 3; row++) {
          const movement =
            field.displacement[row] + field.stretch[row] * delta[row];
          target[row] += weight * movement;
          for (let column = 0; column < 3; column++)
            // Form movement*gradient(weight) as a dimensionless ratio. A
            // physical radius squared can underflow/overflow even when this
            // product is finite, including a neutral field's exact zero term.
            jacobian[row * 3 + column] +=
              derivative *
              ((movement * coordinates[column]) / field.radius[column]);
          jacobian[row * 3 + row] += weight * field.stretch[row];
        }
      }
      if (influence !== undefined) {
        const sample = influence[vertex / 3];
        const gradient = [
          sample.gradient.x,
          sample.gradient.y,
          sample.gradient.z,
        ];
        for (let row = 0; row < 3; row++) {
          const displacement = target[row] - point[row];
          target[row] = point[row] + sample.weight * displacement;
          for (let column = 0; column < 3; column++) {
            const identity = row === column ? 1 : 0;
            jacobian[3 * row + column] =
              identity +
              sample.weight * (jacobian[3 * row + column] - identity) +
              displacement * gradient[column];
          }
        }
      }
      const { matrix } = cofactorAutoMovieJacobian(jacobian);
      if (!target.every(Number.isFinite))
        throw new Error(
          "Mesh deformation must remain finite and preserve local surface orientation.",
        );
      positions.push(...target);
      cofactors.push(matrix);
      if (normals !== null) {
        const bc = Vector3.create(matrix[0], matrix[3], matrix[6]);
        const ca = Vector3.create(matrix[1], matrix[4], matrix[7]);
        const ab = Vector3.create(matrix[2], matrix[5], matrix[8]);
        const normal = Vector3.normalize(
          Vector3.add(
            Vector3.add(
              Vector3.scale(bc, mesh.normals![vertex]),
              Vector3.scale(ca, mesh.normals![vertex + 1]),
            ),
            Vector3.scale(ab, mesh.normals![vertex + 2]),
          ),
        );
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    assertAutoMovieDeformedTriangles(
      mesh.positions,
      positions,
      indices,
      cofactors,
    );
    const result = {
      ...mesh,
      positions,
      normals,
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
    if (result.physicalVertices !== undefined)
      resolveAutoMovieMeshPhysicalVertices(result);
    return result;
  };
}
