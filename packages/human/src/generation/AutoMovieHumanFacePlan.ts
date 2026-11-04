import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanHeadArcs } from "./AutoMovieHumanHeadArcs";

/**
 * The face's plan: the exponent of the super-ellipse `|x / a|^n + |z / b|^n
 * = 1` the face's front quarter follows in the top view at the subnasale's
 * level, from the tragion (a, the half bitragion breadth, across) to the
 * subnasale (b, its depth ahead of the tragions' line), replacing the head
 * prior's observed `frame.plan`.
 *
 * Derivation: the bitragion subnasale arc, the tape from tragion to tragion
 * under the nose (ANSUR 1988, the person's by `AutoMovieHumanHeadArcs`), is
 * twice the quarter's arc length; the quarter's ends are the 3D Facial Norms'
 * (Weinberg et al. 2016, `docs/sources/weinberg-2016-3d-facial-norms.md`)
 * cranial base width (t-t, 139.0 and 147.9 mm) and middle facial depth (t-sn,
 * 123.5 and 132.8 mm, a 3D distance, so the depth is `sqrt(t-sn^2 - (t-t /
 * 2)^2)`), women and men, scaled by the person's face width over those norms'
 * maximum facial width (zy-zy, 129.8 and 137.6 mm). The exponent is the one
 * whose quarter arc equals half the arc, found by bisection; the arc runs from
 * the chord (n of about 1) to the box's two sides (n large), so a plan exists
 * for every arc between them and is held at the nearer end otherwise. At the
 * norms' means, with the arc at the mean face width, the quarter stands within
 * two millimetres of an ellipse's (n near 2), beside the old prior's 2.5 read on the
 * references at the zygomatic level.
 *
 * Limits: two surveys of different people meet in one quarter (an Army tape
 * and a 3D facial scan); the tape crosses under the nose and over the cheeks'
 * skin, so the plan is the skin's; the head modeler converts the exponent to
 * its conic shoulder.
 */
export namespace AutoMovieHumanFacePlan {
  /** 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width. */
  export const NORMS: readonly [{ readonly tt: number; readonly tsn: number; readonly zy: number }, { readonly tt: number; readonly tsn: number; readonly zy: number }] = [
    { tt: 139.0, tsn: 123.5, zy: 129.8 },
    { tt: 147.9, tsn: 132.8, zy: 137.6 },
  ];

  /**
   * The face plan's exponent for a person.
   *
   * @param head The person's resolved head measures.
   * @param sex The person's sex.
   * @returns The super-ellipse exponent, 1.05 to 12.
   */
  export function exponent(head: IAutoMovieHumanHeadIdentity, sex: AutoMovieHumanSex): number {
    const norm: { readonly tt: number; readonly tsn: number; readonly zy: number } = NORMS[sex === AutoMovieHumanSex.Female ? 0 : 1];
    const scale: number = head.faceWidth / norm.zy;
    const a: number = (scale * norm.tt) / 2;
    const b: number = scale * Math.sqrt(norm.tsn * norm.tsn - (norm.tt / 2) ** 2);
    const target: number = AutoMovieHumanHeadArcs.of(head, sex).subnasale / 2;

    // The quarter's arc grows with the exponent; bisect on it.
    let lo: number = 1.05;
    let hi: number = 12;
    if (target <= quarter(a, b, lo)) return lo;
    if (target >= quarter(a, b, hi)) return hi;
    for (let i: number = 0; i < 60; i++) {
      const mid: number = (lo + hi) / 2;
      if (quarter(a, b, mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * A super-ellipse quarter's arc length, by its polyline at 512 parameter
   * steps of `x = a cos(t)^(2/n), z = b sin(t)^(2/n)`.
   */
  function quarter(a: number, b: number, n: number): number {
    const steps: number = 512;
    let length: number = 0;
    let px: number = a;
    let pz: number = 0;
    for (let i: number = 1; i <= steps; i++) {
      const t: number = (i / steps) * (Math.PI / 2);
      const x: number = a * Math.cos(t) ** (2 / n);
      const z: number = b * Math.sin(t) ** (2 / n);
      length += Math.hypot(x - px, z - pz);
      px = x;
      pz = z;
    }
    return length;
  }
}
