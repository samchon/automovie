import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type ArchetypeBuilder, ArchetypeFrame, ArchetypeUnits } from "../core";
import type { createHolster } from "./createHolster";

/**
 * The soldier's cartridge box among the holsters: the 1841 Ordnance Manual's infantry box, its two tins and its flap, and the builder that lays them, kept apart from `createHolster` so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation The tins' read parts and the flap's estimates as named members, and one builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `TINS`, `FLAP` and `lay`, which `createHolster` calls for `pouch`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every unread size is a named estimate with its search.
 */
export namespace CartridgeBox {
  /**
   * A cartridge box's tins' upper parts, read at the 1841 Ordnance Manual: each tin has two, 2.7 in deep, one 2 x 1.35 in for 6 cartridges and one 1.35 in square for 4, and the box holds two tins. `cells` gives each part's cartridges as rows along the box's length by columns across it, the arrangement that fills each part's read size with its read count.
   */
  export const TINS: Readonly<{
    count: number;
    parts: readonly Readonly<{
      length: number;
      across: number;
      rows: number;
      columns: number;
    }>[];
  }> = {
    count: 2,
    parts: [
      {
        length: 2 * ArchetypeUnits.INCH,
        across: 1.35 * ArchetypeUnits.INCH,
        rows: 3,
        columns: 2,
      },
      {
        length: 1.35 * ArchetypeUnits.INCH,
        across: 1.35 * ArchetypeUnits.INCH,
        rows: 2,
        columns: 2,
      },
    ],
  };

  /** A cartridge box's flap's opening, degrees, and its thickness, metres: estimates, the manual giving the flap's width only (searched: the 1841 and 1850 Ordnance Manuals; records-cartridge-pouch.md). */
  export const FLAP: Readonly<{ open: number; thickness: number }> = {
    open: 150,
    thickness: 0.004,
  };

  /**
   * Lay the cartridge box: the box on its bottom, its back to the wearer, the flap on a hinge along its back top edge, a slot per loose cartridge, and the strap and belt loops at its back.
   *
   * @param builder The holster under construction.
   * @param d The drawn dimensions: the box's length, depth, thickness and the flap's width.
   * @param slots How many cartridge slots to declare.
   * @param hang The frame facing the wearer at a point, which the strap and belt loops take.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it lays and where.
   * @evidence contracts/development/implementation.md#principled-implementation The box of the read size, the flap of the read width on its hinge, and each tin's upper parts side by side along the box with the spare length shared at both ends, each part's cells in rows along the box and columns across it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The box, the flap, the slots, the loops.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tins are not drawn, only their cartridges' places; the flap's thickness and opening are named estimates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two parts and one contact per slot.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one box.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay(
    builder: ArchetypeBuilder<createHolster.Affordance, createHolster.Dimension>,
    d: Readonly<Partial<Record<createHolster.Dimension, number>>>,
    slots: number,
    hang: (at: IAutoMovieVector3) => IAutoMovieTransform,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    // A cartridge box: the box on its bottom, its back to the wearer, the flap on a hinge along its back top edge.
    const length: number = d.length!;
    const deep: number = d.depth!;
    const thick: number = d.thickness!;
    builder.box("box", v(thick, deep, length), v(thick / 2, deep / 2, 0), {
      color: "#1f1a17",
    });
    builder.box(
      "lid",
      v(thick, FLAP.thickness, d.width!),
      v(thick / 2, deep + FLAP.thickness / 2, 0),
      { color: "#1f1a17" },
    );
    builder.affordance({
      id: "lid",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, deep, 0), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      travel: FLAP.open,
      parts: ["lid"],
    });
    // The cartridges' places: each tin's upper parts side by side along the box, the two tins with the box's spare length shared at both ends, each part's cells filled in rows along the box and columns across it.
    const tin: number = TINS.parts.reduce(
      (sum: number, part: { length: number }): number => sum + part.length,
      0,
    );
    const spare: number = (length - TINS.count * tin) / 2;
    const places: IAutoMovieVector3[] = [];
    for (let t: number = 0; t < TINS.count; t++) {
      let start: number = -length / 2 + spare + t * tin;
      for (const part of TINS.parts) {
        for (let row: number = 0; row < part.rows; row++)
          for (let column: number = 0; column < part.columns; column++)
            places.push(
              v(
                (thick - part.across) / 2 +
                  ((column + 0.5) * part.across) / part.columns,
                deep,
                start + ((row + 0.5) * part.length) / part.rows,
              ),
            );
        start += part.length;
      }
    }
    places.slice(0, slots).forEach((at: IAutoMovieVector3, k: number): void => {
      builder.affordance({
        id: `slot${k + 1}`,
        kind: "socket",
        frame: ArchetypeFrame.upright(at),
        extent: null,
      });
    });
    builder.affordance({
      id: "strap",
      kind: "hook",
      frame: hang(v(0, deep / 2, 0)),
      extent: null,
    });
    builder.affordance({
      id: "belt",
      kind: "hook",
      frame: hang(v(0, deep / 2, 0)),
      extent: null,
    });
  }
}
