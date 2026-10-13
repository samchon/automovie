import { orderCutPatchBoundary } from "../mesh/orderCutPatchBoundary";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import type { IPortraitRegionReplacement } from "./structures/IPortraitRegionReplacement";

/**
 * Resolve every reserved boundary before applying any component replacement.
 * Regions must be distinct and present with one oriented loop. Removal occurs
 * once on an owned mesh; appending one patch cannot change another's boundary
 * basis. Empty replacements preserve the input object exactly.
 * Positions, reference rows and callback additions share portrait millimetres.
 * Callbacks mutate only the owned cage and must preserve resident boundary
 * identities; the final check covers reference/colour row alignment, not full
 * patch manifoldness or clinical fit. Failures never return a partial cage.
 *
 * @evidence contracts/common.md#principled-implementation Distinct admitted labels resolve their complete oriented boundaries on the original mesh before one removal pass and ordered patch appends, preserving each callback's original boundary basis.
 * @evidence contracts/common.md#clear-and-simple-design Region selection and cloned-cage composition live here; directed boundary ordering and each replacement's geometry remain with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or non-simple boundaries refuse without synthetic closure, and mismatched reference/colour row counts refuse; callback topology validity beyond these checks remains a producer premise.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies millimetres, callback mutation ownership, unchanged empty input, boundary identity and the limited final admission.
 * @evidence contracts/performance.md#efficient-algorithms Resolving R replacement boundaries scans T labels R times and their selected edges; one O(V+T) clone/removal precedes callback-dependent append work.
 * @evidence contracts/performance.md#reuse-equivalent-work All boundary plans use the same unchanged mesh and removal happens once; changed geometry cannot reuse those boundaries across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local plans retain replacement callbacks and boundary IDs; the returned cage owns copied/appended geometry and aligned attributes, with no independent retained state.
 */
export function applyPortraitRegionReplacements(
  mesh: IControlMesh,
  replacements: readonly IPortraitRegionReplacement[],
): IControlMesh {
  if (replacements.length === 0) return mesh;
  const groups: Set<number> = new Set(replacements.map((r: IPortraitRegionReplacement): number => r.group));
  if (
    groups.size !== replacements.length ||
    replacements.some((r: IPortraitRegionReplacement): boolean => !Number.isInteger(r.group) || r.group < 0)
  )
    throw new Error(
      "Deferred portrait regions need distinct nonnegative labels.",
    );
  const plans: { replacement: IPortraitRegionReplacement; boundary: number[] }[] = replacements.map((replacement: IPortraitRegionReplacement): { replacement: IPortraitRegionReplacement; boundary: number[] } => ({
    replacement,
    boundary: orderCutPatchBoundary(
      mesh.groups.flatMap((group: number, face: number): number[][] =>
        group === replacement.group
          ? [mesh.indices.slice(face * 3, face * 3 + 3)]
          : [],
      ),
    ).map((edge: { a: number; b: number }): number => edge.a),
  }));
  const cage: IControlMesh = {
    positions: mesh.positions.map((p: number[]): number[] => [...p]),
    indices: [],
    groups: [],
    ...(mesh.reference === undefined
      ? {}
      : { reference: mesh.reference.map((p: number[]): number[] => [...p]) }),
    ...(mesh.colors === undefined
      ? {}
      : { colors: mesh.colors.map((p: number[]): number[] => [...p]) }),
  };
  for (let face: number = 0; face < mesh.groups.length; face++)
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
