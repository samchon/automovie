import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";

/**
 * Admit a finite source displacement field and its exact held-vertex protocol.
 *
 * Both the source quantity solver and exterior retargeting call this owner.
 * A carried field cannot conceal a malformed original field by collapsing an
 * invalid held displacement to zero; original and derived fields must each
 * address the same native vertex population with zero at every held vertex.
 *
 * @evidence contracts/common.md#principled-implementation Cardinality, finite metre displacements and unique in-range zero-displacement held vertices are checked before a field can be carried or solved.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner is shared by source solving and exterior field retargeting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A later map cannot turn an invalid raw attachment into an apparently admitted derived attachment.
 * @evidence contracts/common.md#meaningful-documentation States why both original and derived fields must be checked.
 * @evidence contracts/modeling.md#spatial-conventions Three metre displacements address each native vertex ordinal.
 * @evidence contracts/modeling.md#shared-boundaries Held vertex ordinals preserve their exact zero displacement under the field coefficient.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The field's source owner names the member.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source recipe owns field identity and coefficient support.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The validator emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembly consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The validator adds no anatomical measurement or population assumption.
 * @evidenceExclude contracts/anatomy.md#permitted-range The recipe and quantity solver own supported coefficients and reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Fields are source-owned, never personal vertices.
 */
export function assertHumanBodySourceSurfaceShapeField(
  field: IAutoMovieHumanBodySourceSurfaceShapeField,
  vertices: number,
): void {
  if (
    !Number.isSafeInteger(vertices) ||
    vertices < 1 ||
    field.displacements.length !== vertices * 3 ||
    !field.displacements.every(Number.isFinite) ||
    new Set(field.heldVertices).size !== field.heldVertices.length ||
    field.heldVertices.some(
      (vertex) =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= vertices ||
        field.displacements
          .slice(3 * vertex, 3 * vertex + 3)
          .some((value) => value !== 0),
    )
  )
    throw new Error(
      "Source shape field/member or held attachment is invalid: " +
        field.member,
    );
}
