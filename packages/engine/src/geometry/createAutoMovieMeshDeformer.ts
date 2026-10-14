import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieJacobianCofactor } from "../math/IAutoMovieJacobianCofactor";
import { Vector3 } from "../math/Vector3";
import { cofactorAutoMovieJacobian } from "../math/cofactorAutoMovieJacobian";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMeshDeformationInfluence } from "./IAutoMovieMeshDeformationInfluence";
import { assertAutoMovieDeformedTriangles } from "./assertAutoMovieDeformedTriangles";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Compile compact deformation fields into an operation that deforms a mesh.
 *
 * Each field moves points inside its axis-aligned ellipsoid by its
 * displacement plus its stretch times the offset from its centre, weighted by
 * `(1 - r^2)^3` of the normalized radius `r` and zero outside. Every vertex
 * uses the same summed map, and normals are transported by its analytic
 * cofactor (inverse-transpose) matrix, so splitting one skin into material
 * regions cannot open a lighting seam. UVs, triangle identities and skin
 * bindings are kept; physical source correspondence is copied and checked
 * before and after, so a vertex-specific influence cannot separate declared
 * aliases, while a mesh without it keeps welding by current position. Fields
 * are copied at compile time; meshes and influences are only read, and each
 * call returns a new mesh.
 *
 * An optional influence supplies, per vertex, a mask weight `f` in [0, 1] and
 * its gradient in inverse metres. For displacement `d` the composed map is
 * `p + f d` with Jacobian `I + f (J - I) + outer(d, grad f)`. Apply an
 * attachment mask here, before the orientation checks, rather than scaling
 * the returned displacement afterwards and invalidating the checked geometry.
 * The caller owns the samples' provenance and their behaviour between
 * vertices.
 *
 * Compilation throws on a non-finite field vector or a nonpositive radius. A
 * call throws on a malformed index buffer, a non-finite position or normal, a
 * normal buffer not aligned to the positions, a wrong influence count or an
 * influence outside its domain, a Jacobian that reverses orientation at a
 * vertex, a non-finite result, and, through `assertAutoMovieDeformedTriangles`,
 * an emitted triangle that collapses or disagrees with its source orientation
 * transported by its three vertex Jacobians. That is a tessellation check, not
 * a global self-intersection test or a proof of the field between vertices.
 *
 * @param fields Deformation fields in the mesh's local metre frame.
 * @returns The deformation operation.
 *
 * @evidence contracts/common.md#principled-implementation The smooth compactly supported kernel `(1 - r^2)^3` has a continuous gradient, so the summed map has an analytic Jacobian whose cofactor matrix transports normals exactly; the masked map's Jacobian follows the product rule, and orientation is checked per vertex by a positive determinant and per triangle by `assertAutoMovieDeformedTriangles`.
 * @evidence contracts/common.md#clear-and-simple-design Fields are packed once into a closure and the returned operation does admission, evaluation and normal transport, delegating cofactors to `cofactorAutoMovieJacobian`, triangle orientation to `assertAutoMovieDeformedTriangles`, index admission to `triangleIndicesOf` and physical identity to `resolveAutoMovieMeshPhysicalVertices`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An orientation reversal or collapse throws instead of being clamped, the mask enters the Jacobian before checking rather than scaling the output afterwards, and the movement-over-radius ratio is formed in that order only so an underflowing radius square cannot zero a finite gradient term.
 * @evidence contracts/common.md#meaningful-documentation States the field kernel, normal transport, what survives, ownership, the influence formula and when to use it, every refusal at compile and call time, and what the triangle check does not prove.
 * @evidence contracts/performance.md#efficient-algorithms O(V F) for V vertices and F fields, each field rejected by its bounding box before any ellipsoid arithmetic, plus a linear triangle check; fields are few local features, so a spatial index over them would cost more than it saves.
 * @evidence contracts/performance.md#reuse-equivalent-work Field packing happens once per compiled deformer and is reused by every call; each call's result depends on its own mesh and influence, so nothing else is shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The deformer retains only the packed fields, four three-number arrays each; a call holds one nine-number cofactor matrix per vertex until the triangle check finishes and returns new position, normal and physical buffers.
 * @author Samchon
 */
export function createAutoMovieMeshDeformer(
  fields: readonly IAutoMovieMeshDeformationField[],
): (
  mesh: IAutoMovieMesh,
  influence?: readonly IAutoMovieMeshDeformationInfluence[],
) => IAutoMovieMesh {
  const packed: IPackedField[] = fields.map(
    (field: IAutoMovieMeshDeformationField): IPackedField => {
      const center: number[] = components(field.center);
      const radius: number[] = components(field.radius);
      const displacement: number[] = components(field.displacement);
      const stretch: number[] = components(field.stretch);
      if (
        ![...center, ...radius, ...displacement, ...stretch].every(
          Number.isFinite,
        ) ||
        radius.some((value: number): boolean => value <= 0)
      )
        throw new Error(
          "Mesh deformation fields need finite vectors and strictly positive radii.",
        );
      return { center, radius, displacement, stretch };
    },
  );
  return (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ): IAutoMovieMesh => {
    if (mesh.physicalVertices !== undefined)
      resolveAutoMovieMeshPhysicalVertices(mesh);
    const indices: number[] = triangleIndicesOf(mesh, "Mesh deformation");
    if (
      !mesh.positions.every(Number.isFinite) ||
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
          ({ weight, gradient }: IAutoMovieMeshDeformationInfluence): boolean =>
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
    for (let vertex: number = 0; vertex < mesh.positions.length; vertex += 3) {
      const point: number[] = mesh.positions.slice(vertex, vertex + 3);
      const target: number[] = [...point];
      const jacobian: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      for (const field of packed) {
        const dx: number = point[0]! - field.center[0]!;
        const dy: number = point[1]! - field.center[1]!;
        const dz: number = point[2]! - field.center[2]!;
        // A compact field and its derivative are zero outside its support.
        // Reject the bounding box before allocating vectors or evaluating the
        // ellipsoid, since local anatomy affects only a small part of a mesh.
        if (
          Math.abs(dx) >= field.radius[0]! ||
          Math.abs(dy) >= field.radius[1]! ||
          Math.abs(dz) >= field.radius[2]!
        )
          continue;
        const delta: number[] = [dx, dy, dz];
        const coordinates: number[] = delta.map(
          (value: number, axis: number): number => value / field.radius[axis]!,
        );
        const squared: number = coordinates.reduce(
          (sum: number, value: number): number => sum + value ** 2,
          0,
        );
        if (squared >= 1) continue;
        const remaining: number = 1 - squared;
        const weight: number = remaining ** 3;
        const derivative: number = -6 * remaining ** 2;
        for (let row: number = 0; row < 3; row++) {
          const movement: number =
            field.displacement[row]! + field.stretch[row]! * delta[row]!;
          target[row] += weight * movement;
          for (let column: number = 0; column < 3; column++)
            // Form movement*gradient(weight) as a dimensionless ratio. A
            // physical radius squared can underflow/overflow even when this
            // product is finite, including a neutral field's exact zero term.
            jacobian[row * 3 + column] +=
              derivative *
              ((movement * coordinates[column]!) / field.radius[column]!);
          jacobian[row * 3 + row] += weight * field.stretch[row]!;
        }
      }
      if (influence !== undefined) {
        const sample: IAutoMovieMeshDeformationInfluence =
          influence[vertex / 3]!;
        const gradient: number[] = components(sample.gradient);
        for (let row: number = 0; row < 3; row++) {
          const displacement: number = target[row]! - point[row]!;
          target[row] = point[row]! + sample.weight * displacement;
          for (let column: number = 0; column < 3; column++) {
            const identity: number = row === column ? 1 : 0;
            jacobian[3 * row + column] =
              identity +
              sample.weight * (jacobian[3 * row + column]! - identity) +
              displacement * gradient[column]!;
          }
        }
      }
      const { matrix }: IAutoMovieJacobianCofactor =
        cofactorAutoMovieJacobian(jacobian);
      if (!target.every(Number.isFinite))
        throw new Error(
          "Mesh deformation must remain finite and preserve local surface orientation.",
        );
      positions.push(target[0]!, target[1]!, target[2]!);
      cofactors.push(matrix);
      if (normals !== null) {
        const bc: IAutoMovieVector3 = Vector3.create(
          matrix[0]!,
          matrix[3]!,
          matrix[6]!,
        );
        const ca: IAutoMovieVector3 = Vector3.create(
          matrix[1]!,
          matrix[4]!,
          matrix[7]!,
        );
        const ab: IAutoMovieVector3 = Vector3.create(
          matrix[2]!,
          matrix[5]!,
          matrix[8]!,
        );
        const normal: IAutoMovieVector3 = Vector3.normalize(
          Vector3.add(
            Vector3.add(
              Vector3.scale(bc, mesh.normals![vertex]!),
              Vector3.scale(ca, mesh.normals![vertex + 1]!),
            ),
            Vector3.scale(ab, mesh.normals![vertex + 2]!),
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
    const result: IAutoMovieMesh = {
      ...mesh,
      positions,
      normals,
      ...(mesh.physicalVertices === undefined
        ? {}
        : {
            physicalVertices: {
              sources: mesh.physicalVertices.sources.map(
                (
                  source: IAutoMovieMeshPhysicalSource,
                ): IAutoMovieMeshPhysicalSource => ({ ...source }),
              ),
              vertices: mesh.physicalVertices.vertices.slice(),
            },
          }),
    };
    if (result.physicalVertices !== undefined)
      resolveAutoMovieMeshPhysicalVertices(result);
    return result;
  };
}

/** One field's vectors as XYZ arrays, read by index in the vertex loop. */
interface IPackedField {
  /** Ellipsoid centre in metres. */
  center: number[];

  /** Positive ellipsoid semi-axes in metres. */
  radius: number[];

  /** Translation at full weight, in metres. */
  displacement: number[];

  /** Dimensionless per-axis stretch of the offset from the centre. */
  stretch: number[];
}

/** A vector's three components in XYZ order. */
const components = (value: IAutoMovieVector3): number[] => [
  value.x,
  value.y,
  value.z,
];
