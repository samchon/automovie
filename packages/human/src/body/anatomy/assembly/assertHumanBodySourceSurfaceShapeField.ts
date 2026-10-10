import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";

/**
 * Admit a finite source displacement field and its exact held-vertex protocol.
 *
 * Both the source quantity solver and exterior retargeting call this owner.
 * A carried field cannot conceal a malformed original field by collapsing an
 * invalid held displacement to zero; original and derived fields must each
 * address the same native vertex population with zero at every held vertex.
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
