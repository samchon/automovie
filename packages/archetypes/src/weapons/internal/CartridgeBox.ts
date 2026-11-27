import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeHolster } from "../AutoMovieArchetypeHolster";

/*
 * The soldier's cartridge box among the holsters: the 1841 Ordnance Manual's
 * infantry box, its two tins and its flap, and the builder that lays them, kept
 * apart from `createHolster` so each file stays within its size.
 */
export namespace CartridgeBox {
  /*
   * A cartridge box's tins' upper parts, read at the 1841 Ordnance Manual: each
   * tin has two, 2.7 in deep, one 2 x 1.35 in for 6 cartridges and one 1.35 in
   * square for 4, and the box holds two tins. `cells` gives each part's
   * cartridges as rows along the box's length by columns across it, the
   * arrangement that fills each part's read size with its read count.
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
        length: 2 * AutoMovieArchetypeUnits.INCH,
        across: 1.35 * AutoMovieArchetypeUnits.INCH,
        rows: 3,
        columns: 2,
      },
      {
        length: 1.35 * AutoMovieArchetypeUnits.INCH,
        across: 1.35 * AutoMovieArchetypeUnits.INCH,
        rows: 2,
        columns: 2,
      },
    ],
  };

  /*
   * A cartridge box's flap's opening, degrees, and its thickness, metres:
   * estimates, the manual giving the flap's width only (searched: the 1841 and
   * 1850 Ordnance Manuals; records-cartridge-pouch.md).
   */
  export const FLAP: Readonly<{ open: number; thickness: number }> = {
    open: 150,
    thickness: 0.004,
  };

  /*
   * Lay the cartridge box: the box on its bottom, its back to the wearer, the
   * flap on a hinge along its back top edge, a slot per loose cartridge, and
   * the strap and belt loops at its back.
   * Parameter builder: The holster under construction.
   * Parameter d: The drawn dimensions: the box's length, depth, thickness and the
   * flap's width.
   * Parameter slots: How many cartridge slots to declare.
   * Parameter hang: The frame facing the wearer at a point, which the strap and
   * belt loops take.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeHolster.Affordance,
      AutoMovieArchetypeHolster.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeHolster.Dimension, number>>>,
    slots: number,
    hang: (at: IAutoMovieVector3) => IAutoMovieTransform,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
      frame: AutoMovieArchetypeFrame.facing(
        v(0, deep, 0),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
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
        frame: AutoMovieArchetypeFrame.upright(at),
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
