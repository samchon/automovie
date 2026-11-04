import { AutoMovieHumanSeamKnot } from "../lofting/AutoMovieHumanSeamKnot";
import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";

/**
 * One ring from the left side's guides and sectors: the right side is the
 * left reflected (rule J6), and the whole is written into the 256 controls of
 * one periodic cubic B-spline section by the shared knot rule (J2), so every
 * guide owns its point, tangent and curvature and every consumer reads an
 * ordinary chain section.
 *
 * The left side runs from the front midline (the first guide) to the back
 * midline (the last); the right side's guides stand at `256 - knot` and its
 * sectors are the left's evaluated at `2 pi - t`, mirrored. The two midline
 * guides are their own mirror and appear once.
 */
export namespace AutoMovieHumanTrunkAssembly {
  /** A guide of the left side. */
  export interface IGuide {
    /** Knot of the 256-control section. */
    knot: number;

    /** The guide's jet in the section plane `[x, z]`, by arclength. */
    jet: IAutoMovieHumanSeam.IArcJet;

    /** Parameter speed at the guide, mm per radian of phase. */
    speed: number;
  }

  /** A sector's jet at a phase: point, first and second derivatives per radian. */
  export type Sector = (t: number) => [number[], number[], number[]];

  /**
   * The ring's controls, `[x_0 .. x_255, z_0 .. z_255]`.
   *
   * @param guides The left side's guides in rising knot order, midline to midline.
   * @param sectors The left side's sectors: sector j lies between guide j and guide j + 1.
   * @returns The section's coefficients in the chain's spline layout.
   */
  export function controls(guides: readonly IGuide[], sectors: readonly Sector[]): number[] {
    const order: number = AutoMovieHumanTrunkQuadrant.ORDER;
    const n: number = guides.length;
    if (sectors.length !== n - 1) throw new Error(`A ring of ${n} left guides needs ${n - 1} sectors, not ${sectors.length}`);

    const all: AutoMovieHumanSeamKnot.IGuide[] = [];
    const between: AutoMovieHumanSeamKnot.ISector[] = [];

    // The left side, front midline to back midline.
    guides.forEach((g: IGuide, j: number): void => {
      all.push({ knot: g.knot, jet: g.jet, speed: g.speed });
      if (j < n - 1) between.push({ name: `left sector ${j}`, jet: sectors[j]! });
    });

    // The right side runs back to front: the last left sector mirrored, then
    // each interior guide mirrored followed by the next left sector mirrored.
    between.push({ name: `right sector ${n - 2}`, jet: mirror(sectors[n - 2]!) });
    for (let j: number = n - 2; j >= 1; j--) {
      all.push({
        knot: order - guides[j]!.knot,
        jet: AutoMovieHumanTrunkQuadrant.reflect(guides[j]!.jet),
        speed: guides[j]!.speed,
      });
      between.push({ name: `right sector ${j - 1}`, jet: mirror(sectors[j - 1]!) });
    }
    return AutoMovieHumanSeamKnot.assemble(order, all, between);
  }

  /**
   * A left sector as the right side's: evaluated at `2 pi - t` and mirrored.
   *
   * @param left The left sector.
   * @returns The right sector.
   */
  function mirror(left: Sector): Sector {
    return (t: number): [number[], number[], number[]] => {
      const [p, d1, d2]: [number[], number[], number[]] = left(2 * Math.PI - t);

      return [
        [p[0]!, -p[1]!],
        [-d1[0]!, d1[1]!],
        [d2[0]!, -d2[1]!],
      ];
    };
  }
}
