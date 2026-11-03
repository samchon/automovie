import { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The gluteal fold, the crease under the buttock that ISO 8559-1 and ANSUR II
 * start the thigh girth from: the posterior profile's notch in the sagittal
 * plane through the hip joint, where the buttock's curve meets the thigh's.
 */
export namespace HumanAnatomyLegFold {
  /** Height the fold is sought over above and below the crotch, mm. */
  export const REACH: number = 60;

  /** Half the chord the notch is read over, mm. */
  export const CHORD: number = 6;

  /**
   * Notch below which the profile has no fold to find, mm: twice the sagitta a
   * smooth curve of 12.5 mm radius (the crease rule's own) has over the chord,
   * since the notch is twice a point's offset from the chord's middle.
   */
  export const SMOOTH: number = (CHORD * CHORD) / 12.5;

  /**
   * Height of the gluteal fold, mm: where the rearmost skin of the leg's
   * sagittal section stands furthest in front of the straight line between
   * the skin a chord above and below it. A profile with no notch deeper than
   * {@link SMOOTH} has none, and the crotch's height stands for the fold.
   *
   * @param crotch The crotch height, mm.
   */
  export function height(skin: HumanAnatomy.ISkin, side: "left" | "right", crotch: number): number {
    const hip: V3 = A.joint(skin, `${side}UpperLeg`);
    const lines: { points: V3[]; closed: boolean }[] = A.polylines(
      skin,
      [0, 0, hip[2]],
      [0, 0, 1],
      A.near(skin, [hip[0], crotch + REACH + 2 * CHORD, hip[2]], [hip[0], crotch - REACH - 2 * CHORD, hip[2]], 150),
    );

    // The rearmost skin of the section at a height, behind the hip joint's x.
    const rear: (y: number) => number = (y: number): number => {
      let x: number = Infinity;
      for (const l of lines)
        for (let i: number = 0; i + 1 < l.points.length; i++) {
          const a: V3 = l.points[i]!;
          const b: V3 = l.points[i + 1]!;
          if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;

          const at: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
          if (at < hip[0]) x = Math.min(x, at);
        }
      return x;
    };

    // The deepest notch: the profile stands in front of its chord.
    let fold: number = crotch;
    let deepest: number = SMOOTH;
    for (let y: number = crotch + REACH; y >= crotch - REACH; y -= 2) {
      const notch: number = 2 * rear(y) - rear(y + CHORD) - rear(y - CHORD);
      if (Number.isFinite(notch) && notch > deepest) {
        deepest = notch;
        fold = y;
      }
    }
    return fold;
  }
}
