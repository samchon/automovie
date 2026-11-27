import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { ArchetypeMassPrimitive } from "./ArchetypeMassPrimitive";
import type { AutoMovieArchetypeConvexCell } from "../AutoMovieArchetypeConvexCell";

/*
 * Read primitive or explicitly declared convex-cell local mass data.
 * Parameter part: Current local part with unit scale.
 * Parameter cells: Producer-owned cell records, keyed by their part ids.
 * Returns: Local SI solid data, or null for a plane or unsupported geometry.
 * For invalid primitives or changed geometry under a declared
 * cell id.
 */
export function ArchetypeMassLocal(
  part: IAutoMovieModelPart,
  cells: AutoMovieArchetypeConvexCell.Table,
): Local | null {
  const cell: AutoMovieArchetypeConvexCell.ICell | undefined = cells.get(
    part.id,
  );
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

/*
 * A supported local solid, with an optional non-axis-aligned principal frame.
 */
type Local = NonNullable<ReturnType<typeof ArchetypeMassPrimitive>> & {
  /*
   * Principal-to-part unit rotation, absent for the existing axial primitives.
   */
  inertiaRotation?: IAutoMovieQuaternion;
};
