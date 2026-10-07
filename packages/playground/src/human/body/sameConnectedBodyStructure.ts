import type { ConnectedBodyModel } from "./ConnectedBodyModel";
import type { IConnectedBodyResident } from "./IConnectedBodyResident";

/**
 * Whether a resident body group's buffers can take a new frame in place.
 *
 * The finishes and every part's non-geometry fields must serialize equally,
 * and each mesh must keep its position and normal counts and the exact same
 * UVs, colours and indices. Only coordinates may differ, which the renderer
 * then writes into the existing buffers.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reuses the displayed buffers when an edit moves the body without changing its topology or finish.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Decides buffer reuse from exact topology, attribute and finish identity rather than coordinate tolerance.
 * @author Samchon
 */
export function sameConnectedBodyStructure(
  resident: Pick<IConnectedBodyResident, "parts" | "materials">,
  model: ConnectedBodyModel,
): boolean {
  if (resident.materials !== JSON.stringify(model.materials)) return false;
  if (resident.parts.length !== model.parts.length) return false;
  return model.parts.every((part, index) => {
    const previous = resident.parts[index];
    if (
      JSON.stringify({ ...part, geometry: undefined }) !==
      JSON.stringify({ ...previous, geometry: undefined })
    )
      return false;
    const mesh = part.geometry.mesh;
    const old = previous.geometry.mesh;
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
  for (let index = 0; index < a.length; ++index)
    if (a[index] !== b[index]) return false;
  return true;
}
