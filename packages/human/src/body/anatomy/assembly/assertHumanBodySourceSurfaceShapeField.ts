import type { IAutoMovieHumanBodySourceSurfaceShapeField } from "./IAutoMovieHumanBodySourceSurfaceShapeField";

/**
 * Admit a finite source displacement field and its exact held-vertex protocol.
 *
 * Both the source quantity solver and exterior retargeting call this owner. A carried field cannot conceal a malformed original field by collapsing an invalid held displacement to zero; original and derived fields must each address the same native vertex population with zero at every held vertex.
 *
 * @evidence contracts/common.md#principled-implementation Finite displacement triples exactly address native vertices; distinct valid held ordinals require exactly zero displacement.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner serves quantity solving and exterior endpoint retargeting, checking both original and derived fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Collapsed retargeted endpoints cannot conceal a nonzero original held attachment displacement.
 * @evidence contracts/common.md#meaningful-documentation The comment defines native alignment, held-zero protocol and independent original/derived admission.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and H held ordinals, scanning costs O(V+H) time with O(H) uniqueness storage and constant-sized slices.
 * @evidence contracts/performance.md#reuse-equivalent-work Both field phases share this admission function; changing displacement or ordinal arrays invalidates previous admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The held-ordinal set and slices die on completion/refusal; no field array or registration handle is retained.
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
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= vertices ||
        field.displacements
          .slice(3 * vertex, 3 * vertex + 3)
          .some((value: number): boolean => value !== 0),
    )
  )
    throw new Error(
      "Source shape field/member or held attachment is invalid: " +
        field.member,
    );
}
