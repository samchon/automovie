import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Rows of an additive piece's merge with its base: the piece's own radial
 * height over the base, read on a grid that holds its window. A piece that
 * merges by adding volume only (a nose, an ear, a lip, a breast, a deltoid on
 * its base envelope) satisfies three things at its seam with the base:
 *
 * - its height is never negative, so the merged surface never lies inside the
 *   base, and the sum of such heights never lies inside any one of them;
 * - its height vanishes at its support's edge with its slope (G1), and bends
 *   there no more than the crease radius, so the blend leaves no step or ring;
 * - its support lies inside its window, so the base outside the window is the
 *   base unchanged.
 *
 * Recesses (an orbit's socket, a crease, a groove) are declared subtractive
 * pieces and are not read here.
 */
export namespace HumanMergeRows {
  /** A grid over the piece's own coordinates, calibration mm. */
  export interface IGrid {
    /** First coordinate's range. */
    u: [number, number];

    /** Second coordinate's range. */
    v: [number, number];

    /** Spacing of both coordinates. */
    step: number;

    /** Whether the `v` lower edge is a symmetry line (the midline) rather than the window's border. */
    midline: boolean;
  }

  /** A piece's radial height at a grid point, calibration mm, positive outward. */
  export type Height = (u: number, v: number) => number;

  /** Height below which a sample counts as the base's own, calibration mm: far below float32 rendering of a head. */
  const ZERO: number = 1e-9;

  /**
   * The merge rows of one piece.
   *
   * @param person Name in findings.
   * @param piece The piece's name.
   * @param height The piece's own height.
   * @param grid The grid holding its window.
   * @param k Calibration mm per input mm.
   */
  export function rows(person: string, piece: string, height: Height, grid: IGrid, k: number): IRow[] {
    const nu: number = Math.round((grid.u[1] - grid.u[0]) / grid.step);
    const nv: number = Math.round((grid.v[1] - grid.v[0]) / grid.step);
    const h: number[][] = [];
    for (let i: number = 0; i <= nu; i++) {
      const row: number[] = [];
      for (let j: number = 0; j <= nv; j++) row.push(height(grid.u[0] + i * grid.step, grid.v[0] + j * grid.step));
      h.push(row);
    }
    const at: (i: number, j: number) => string = (i: number, j: number): string => `at [${((grid.u[0] + i * grid.step) / k).toFixed(1)}, ${((grid.v[0] + j * grid.step) / k).toFixed(1)}]`;

    // Never below the base.
    let least: [number, string] = [0, ""];
    for (let i: number = 0; i <= nu; i++) for (let j: number = 0; j <= nv; j++) if (h[i]![j]! < least[0]) least = [h[i]![j]!, at(i, j)];

    // The support stays inside the window: nothing on the grid's border.
    let border: [number, string] = [0, ""];
    for (let i: number = 0; i <= nu; i++)
      for (let j: number = 0; j <= nv; j++) {
        const edge: boolean = i === 0 || i === nu || j === nv || (j === 0 && !grid.midline);
        if (edge && Math.abs(h[i]![j]!) > Math.abs(border[0])) border = [h[i]![j]!, at(i, j)];
      }

    // G1 at the support's edge: beside a base sample, the piece rises no more
    // than a bend of the crease radius gives over one step, step^2 / (2 R).
    let rise: [number, string] = [0, ""];
    const pairs: [number, number][] = [
      [1, 0],
      [0, 1],
    ];
    for (let i: number = 0; i <= nu; i++)
      for (let j: number = 0; j <= nv; j++)
        for (const [di, dj] of pairs) {
          if (i + di > nu || j + dj > nv) continue;
          const a: number = Math.abs(h[i]![j]!);
          const b: number = Math.abs(h[i + di]![j + dj]!);
          if ((a <= ZERO) === (b <= ZERO)) continue;
          const jump: number = Math.max(a, b);
          if (jump > rise[0]) rise = [jump, at(i, j)];
        }
    const radius: number = 12.5 * k;
    const allowed: number = (grid.step * grid.step) / (2 * radius);
    return [
      { person, site: `merge ${piece}: least height over its base ${least[1]}, mm`, value: least[0] / k, low: -ZERO / k, high: Infinity, unit: "mm" },
      { person, site: `merge ${piece}: largest height on its window's border ${border[1]}, mm`, value: Math.abs(border[0]) / k, low: 0, high: ZERO / k, unit: "mm" },
      {
        person,
        site: `merge ${piece}: largest rise beside its support's edge over a ${(grid.step / k).toFixed(2)} mm step ${rise[1]} (a bend of the ${HumanAnatomyShared.CREASE} mm crease limit's 12.5 mm radius allows ${(allowed / k).toFixed(4)}), mm`,
        value: rise[0] / k,
        low: 0,
        high: allowed / k,
        unit: "mm",
      },
    ];
  }
}
