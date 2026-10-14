import type { ConnectedBodyModel } from "@automovie/human/body/runtime/ConnectedBodyModel";
import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";
import type { ConnectedBodyMesh } from "@automovie/human/body/runtime/ConnectedBodyMesh";
import type { IConnectedBodyResident } from "./IConnectedBodyResident.js";

/**
 * Whether a resident body group's buffers can take a new frame in place.
 *
 * The finishes and every part's non-geometry fields must serialize equally, and each mesh must keep its position and normal counts and the exact same UVs, colours and indices. Coordinate and normal values may differ and are written into existing buffers. Physical correspondence is outside this reuse predicate and is admitted separately by the renderer.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Reuse requires equal serialized materials and non-geometry part records, identical part order/count, matching position/normal lengths and exact UV/color/index elements. Coordinate/normal values and physical correspondence are not compared here; the renderer independently admits current physical metadata before publication. Source part records must remain consistent with their native resident buffers, and JSON field order affects comparison.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns the body renderer's in-place buffer reuse boundary, with a private numeric-array comparator for retained static attributes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality uses actual configuration and topology rather than a fixture id or source/prose fingerprint. JSON property order can conservatively reject equivalent records, and unrepresented custom part state would require explicit inclusion before reuse is sound.
 * @evidence contracts/common.md#meaningful-documentation The comment lists mutable coordinates versus fixed finish/metadata/count/static-buffer premises; the return only permits GPU buffer reuse and is not anatomical or clinical equivalence.
 * @evidence contracts/performance.md#efficient-algorithms Work is linear in serialized material/part metadata plus static attribute lengths and stops at the first difference. Serialization allocates temporary strings; positions are compared by length because their values will be uploaded.
 * @evidence contracts/performance.md#reuse-equivalent-work A true result permits reuse of one resident group's geometry/materials while current coordinates are refreshed; it is not a result cache and does not skip physical correspondence checks in publish.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The predicate borrows both records and retains no new handle or cache. Temporary serialized strings become unreachable after comparison; the renderer remains the resident resource owner.
 */
export function sameConnectedBodyStructure(
  resident: Pick<IConnectedBodyResident, "parts" | "materials">,
  model: ConnectedBodyModel,
): boolean {
  if (resident.materials !== JSON.stringify(model.materials)) return false;
  if (resident.parts.length !== model.parts.length) return false;
  return model.parts.every((part: ConnectedBodyPart, index: number): boolean => {
    const previous: ConnectedBodyPart = resident.parts[index];
    if (
      JSON.stringify({ ...part, geometry: undefined }) !==
      JSON.stringify({ ...previous, geometry: undefined })
    )
      return false;
    const mesh: ConnectedBodyMesh = part.geometry.mesh;
    const old: ConnectedBodyMesh = previous.geometry.mesh;
    return (
      mesh.positions.length === old.positions.length &&
      (mesh.normals?.length ?? null) === (old.normals?.length ?? null) &&
      sameArray(mesh.uvs, old.uvs) &&
      sameArray(mesh.colors ?? null, old.colors ?? null) &&
      sameArray(mesh.indices, old.indices)
    );
  });
}

/** Element-wise strict equality of two numeric arrays; null equals only null. */
function sameArray(
  a: ArrayLike<number> | null,
  b: ArrayLike<number> | null,
): boolean {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  for (let index: number = 0; index < a.length; ++index)
    if (a[index] !== b[index]) return false;
  return true;
}
