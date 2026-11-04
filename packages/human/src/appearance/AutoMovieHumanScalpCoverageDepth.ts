import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairCard } from "./AutoMovieHumanHairCard";
import { AutoMovieHumanHairFeather } from "./AutoMovieHumanHairFeather";
import type { AutoMovieHumanHairGuide } from "./AutoMovieHumanHairGuide";
import { AutoMovieHumanHairOcclusion } from "./AutoMovieHumanHairOcclusion";
import { AutoMovieHumanHairRootCount } from "./AutoMovieHumanHairRootCount";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * The optical depth of hair over the scalp, per texel of the chart's
 * azimuth-by-elevation grid: every guide stands for the hairs of its root's
 * share of scalp, N = rho * A * s, A the chart sphere's area per root at the
 * root's radius and s the transition zone's share of the bundle there
 * (`AutoMovieHumanHairFeather.share`). Spread evenly across its card's width
 * 2h (`AutoMovieHumanHairCard.half`), the bundle's projected fibre area per
 * footprint area is N d / (2h); each millimetre-square sample of a card's
 * footprint that lies within {@link NEAR} mm of the skin deposits that depth,
 * times its area over the texel's, into the texel it falls in. A strand that
 * stands over the scalp (`AutoMovieHumanHairGuide.IGuide.stand`) counts at
 * its standing height as well, since the hair mass over the scalp reaches
 * that far above the skin. Hair hanging further from the head is drawn by its
 * cards alone.
 */
export namespace AutoMovieHumanScalpCoverageDepth {
  /** Coverage image columns (azimuth). */
  export const WIDTH: number = 256;

  /** Coverage image rows (elevation). */
  export const HEIGHT: number = 128;

  /** Distance from the skin within which hair lies on the scalp, mm (convention). */
  export const NEAR: number = 20;

  /**
   * The depth per texel.
   *
   * @param field Head chart
   * @param hair Scalp hair input
   * @param guides Solved guides
   * @returns Row-major depth by elevation then azimuth
   */
  export function depth(
    field: AutoMovieHumanHeadField.IField,
    hair: IAutoMovieHumanScalpHair,
    guides: AutoMovieHumanHairGuide.IGuide[],
  ): Float64Array {
    const out: Float64Array = new Float64Array(WIDTH * HEIGHT);
    const da: number = (2 * Math.PI) / WIDTH;
    const db: number = Math.PI / HEIGHT;

    // Chart sphere's solid angle per root: the lattice's for this width.
    const solid: number =
      (4 * Math.PI) /
      AutoMovieHumanHairRootCount.count(
        AutoMovieHumanHairCard.width(hair.style),
      );

    for (const guide of guides) {
      const p0: [number, number, number] = guide.points[0]!;
      const r0: number = Math.hypot(p0[0], p0[1], p0[2]);
      const hairs: number =
        AutoMovieHumanHairOcclusion.DENSITY *
        solid *
        r0 *
        r0 *
        AutoMovieHumanHairFeather.share(guide.feather);

      // Walk the guide in steps of at most a millimetre.
      let s: number = 0;
      for (let i: number = 1; i < guide.points.length; ++i) {
        const a: [number, number, number] = guide.points[i - 1]!;
        const b: [number, number, number] = guide.points[i]!;
        const step: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const pieces: number = Math.max(1, Math.ceil(step));
        const ds: number = step / pieces;
        const heading: [number, number, number] = [
          (b[0] - a[0]) / (step || 1),
          (b[1] - a[1]) / (step || 1),
          (b[2] - a[2]) / (step || 1),
        ];
        const n: [number, number, number] = guide.normals[i]!;
        const side: [number, number, number] = unit([
          heading[1] * n[2] - heading[2] * n[1],
          heading[2] * n[0] - heading[0] * n[2],
          heading[0] * n[1] - heading[1] * n[0],
        ]);
        for (let k: number = 0; k < pieces; ++k) {
          s += ds;
          const t: number = (k + 0.5) / pieces;
          const p: [number, number, number] = [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t,
          ];
          const h: number = AutoMovieHumanHairCard.half(hair.style, guide, s);
          if (!(h > 0)) continue;

          const across: number = Math.max(1, Math.round(2 * h));
          const per: number =
            ((hairs * AutoMovieHumanHairOcclusion.DIAMETER) / (2 * h)) *
            ds *
            ((2 * h) / across);
          for (let j: number = 0; j < across; ++j) {
            const o: number = -h + ((j + 0.5) * 2 * h) / across;
            const q: [number, number, number] = [
              p[0] + side[0] * o,
              p[1] + side[1] * o,
              p[2] + side[2] * o,
            ];
            const r: number = Math.hypot(q[0], q[1], q[2]);
            const skin: number = AutoMovieHumanHeadField.radius(field, q);
            if (!(skin > 0) || r - skin > NEAR + guide.stand) continue;

            const az: number =
              (Math.atan2(q[2], q[0]) + 2 * Math.PI) % (2 * Math.PI);
            const el: number = Math.asin(Math.max(-1, Math.min(1, q[1] / r)));
            const col: number = Math.min(WIDTH - 1, Math.floor(az / da));
            const row: number = Math.min(
              HEIGHT - 1,
              Math.floor((el + Math.PI / 2) / db),
            );
            const area: number =
              skin * skin * Math.max(Math.cos(el), 1e-3) * da * db;
            out[row * WIDTH + col]! += per / area;
          }
        }
      }
    }
    return out;
  }
}

/**
 * Unit vector, dividing by the length (the zero vector stays zero).
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: [number, number, number]): [number, number, number] {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
