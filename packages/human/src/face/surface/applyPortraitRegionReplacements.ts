import { orderCutPatchBoundary } from "../mesh/orderCutPatchBoundary";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import { IPortraitRegionReplacement } from "./structures/IPortraitRegionReplacement";

/**
 * Resolve every reserved boundary before applying any component replacement.
 * Regions must be distinct and present with one oriented loop. Removal occurs
 * once on an owned mesh; appending one patch cannot change another's boundary
 * basis. Empty replacements preserve the input object exactly.
 *
 * @evidence contracts/common.md#principled-implementation Every replacement's boundary is read from the unmodified mesh before any face is removed, faces of all replaced groups are removed once on an owned copy, and only then are the patches appended, so one patch cannot change another's boundary basis.
 * @evidence contracts/common.md#clear-and-simple-design Plan, remove, append, verify attribute alignment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No replacement is ordered specially; duplicate or negative labels refuse.
 * @evidence contracts/common.md#meaningful-documentation States the phase order and the identity-preserving empty case.
 * @evidence contracts/modeling.md#shared-boundaries Each replacement receives the oriented boundary loop of its reserved region and its appender builds against those resident vertices, so the patch shares the host boundary exactly.
 * @evidence contracts/modeling.md#spatial-conventions Construction millimetres throughout; nothing is converted.
 * @evidenceExclude contracts/anatomy.md#anatomical-source applyPortraitRegionReplacements carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range applyPortraitRegionReplacements admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority applyPortraitRegionReplacements defines no input through which a caller shapes a human form.
 */
export function applyPortraitRegionReplacements(
  mesh: IControlMesh,
  replacements: readonly IPortraitRegionReplacement[],
): IControlMesh {
  if (replacements.length === 0) return mesh;
  const groups = new Set(replacements.map((r) => r.group));
  if (
    groups.size !== replacements.length ||
    replacements.some((r) => !Number.isInteger(r.group) || r.group < 0)
  )
    throw new Error(
      "Deferred portrait regions need distinct nonnegative labels.",
    );
  const plans = replacements.map((replacement) => ({
    replacement,
    boundary: orderCutPatchBoundary(
      mesh.groups.flatMap((group, face) =>
        group === replacement.group
          ? [mesh.indices.slice(face * 3, face * 3 + 3)]
          : [],
      ),
    ).map((edge) => edge.a),
  }));
  const cage: IControlMesh = {
    positions: mesh.positions.map((p) => [...p]),
    indices: [],
    groups: [],
    ...(mesh.reference === undefined
      ? {}
      : { reference: mesh.reference.map((p) => [...p]) }),
    ...(mesh.colors === undefined
      ? {}
      : { colors: mesh.colors.map((p) => [...p]) }),
  };
  for (let face = 0; face < mesh.groups.length; face++)
    if (!groups.has(mesh.groups[face])) {
      cage.indices.push(...mesh.indices.slice(face * 3, face * 3 + 3));
      cage.groups.push(mesh.groups[face]);
    }
  for (const { replacement, boundary } of plans)
    replacement.append(cage, boundary);
  if (
    (cage.reference !== undefined &&
      cage.reference.length !== cage.positions.length) ||
    (cage.colors !== undefined && cage.colors.length !== cage.positions.length)
  )
    throw new Error(
      "A replacement must preserve aligned reference and colour attributes.",
    );
  return cage;
}
