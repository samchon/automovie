import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { ArchetypeConvexCell } from "./ArchetypeConvexCell";
import { ArchetypeMassPrimitive } from "./ArchetypeMassPrimitive";

/** A supported local solid, with an optional non-axis-aligned principal frame. */
type Local = NonNullable<ReturnType<typeof ArchetypeMassPrimitive>> & {
  /** Principal-to-part unit rotation, absent for the existing axial primitives. */
  inertiaRotation?: IAutoMovieQuaternion;
};

/**
 * Read actual primitive or explicitly declared convex-cell local mass data.
 * @param part Current local part with unit scale.
 * @param cells Producer-owned actual cell records, keyed by their part ids.
 * @returns Local SI solid data, or null for a plane or unsupported geometry.
 * @throws {Error} For invalid primitives or changed geometry under a declared cell id.
 * @evidence contracts/development/common.md#meaningful-documentation Defines local volume/centroid/principal mass data, explicit declaration and mismatch refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Primitives retain their existing closed forms. Explicit cells reuse their exact hull integration and principal frame; geometry identity proves that the mass belongs to the part actually drawn.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the optional declared cell correspondence, otherwise dispatch the unchanged primitive owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never hulls an arbitrary mesh, fills a cavity or silently applies old physical data to a replacement geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms One keyed lookup and constant primitive work or a prepared-cell record read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both aggregate mass and per-part allocation read this same local owner; convex integration occurs once when its source cell is built.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns an owned source record or an ephemeral primitive result; retains no state or external resource.
 */
export function ArchetypeMassLocal(
  part: IAutoMovieModelPart,
  cells: ArchetypeConvexCell.Table,
): Local | null {
  const cell: ArchetypeConvexCell.ICell | undefined = cells.get(part.id);
  if (cell !== undefined) {
    if (part.geometry !== cell.geometry)
      throw new Error(
        `Convex cell ${part.id} no longer matches its visible geometry`,
      );
    return cell;
  }
  return part.geometry.type === "primitive"
    ? ArchetypeMassPrimitive(part.geometry.shape)
    : null;
}
