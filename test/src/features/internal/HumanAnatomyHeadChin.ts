import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";

type V3 = HumanAnatomy.V3;
const ahead: typeof HumanAnatomyHeadGeometry.ahead = HumanAnatomyHeadGeometry.ahead;

/**
 * The landmarks of the lower lip and chin on the median profile below the
 * labial fissure: labrale inferius, sublabiale, pogonion, gnathion and menton.
 */
export namespace HumanAnatomyHeadChin {
  /** Turn over 4 mm of arc below which the profile under the chin reads as straight, degrees. */
  export const STRAIGHT: number = 3;

  /** Indices of the lower profile's landmarks. */
  export interface IChin {
    /** Labrale inferius, the lower lip's most prominent point. */
    li: number;

    /** Gnathion, the chin's support point toward the front and down. */
    gn: number;

    /** Menton, the lowest point of the chin's own outline. */
    me: number;

    /** Sublabiale, the mentolabial sulcus. */
    sl: number;

    /** Pogonion, the chin's most anterior point. */
    pg: number;
  }

  /**
   * Locate the chin's landmarks on the lower profile. Labrale inferius is the
   * lip's most prominent point in its first 12 mm; gnathion the chin's support
   * point toward the front and down within 60 mm; menton the lowest point of
   * the chin's own outline, the convex arc that carries the profile from
   * gnathion round under the chin and ends where the outline runs straight
   * onto the submental line (turning less than {@link STRAIGHT} degrees over
   * 4 mm of arc), so a submental line sloping down to the neck cannot lend it
   * height. Sublabiale, the mentolabial sulcus, is the deepest point behind
   * the chord from labrale inferius to gnathion, read on the profile's own
   * shape; pogonion is the chin's most anterior point between sublabiale and
   * gnathion.
   *
   * @param lo Lower median profile from the lip's end down, every 0.5 mm.
   */
  export function chin(lo: V3[]): IChin {
    let li: number = 0;
    for (let i: number = 0; i < Math.min(lo.length, 24); i++) if (lo[i]![0] > lo[li]![0]) li = i;

    let gn: number = li;
    for (let i: number = li; i < Math.min(lo.length, li + 120); i++)
      if (lo[i]![0] - lo[i]![1] > lo[gn]![0] - lo[gn]![1]) gn = i;

    // Walking down the chin the body lies on the walker's right, so the chin's
    // convex arc turns right: a negative turn.
    let me: number = gn;

    for (let i: number = gn; i < Math.min(lo.length - 4, gn + 120); i++) {
      if (lo[i]![1] < lo[me]![1]) me = i;

      // The first 2 mm past gnathion (4 samples) are the chin's own front, and
      // the turn needs 4 samples either side; the outline is judged straight
      // only beyond them.
      if (i < gn + 4) continue;

      const turn: number = (HumanAnatomyHeadGeometry.turn(lo[i - 4]!, lo[i]!, lo[i + 4]!) * 180) / Math.PI;
      if (turn > -STRAIGHT) break;
    }

    let sl: number = li;
    for (let i: number = li; i <= gn; i++) if (ahead(lo[i]!, lo[li]!, lo[gn]!) < ahead(lo[sl]!, lo[li]!, lo[gn]!)) sl = i;

    let pg: number = sl;
    for (let i: number = sl; i <= gn; i++) if (lo[i]![0] > lo[pg]![0]) pg = i;
    return { li, gn, me, sl, pg };
  }
}
