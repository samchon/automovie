/**
 * The palm's palmar sector: the thick skin over the palmar aponeurosis, from
 * the distal wrist crease to the webs' palmar crests, between the thenar and
 * hypothenar eminences, its own piece with the aponeurosis plane's axis.
 *
 * In a section square to the hand the palmar sector is the arc of a
 * superellipse-free ellipse below the bones: its centre on the hand's
 * midline, its half width the distance between the sector's two side guides
 * (the radial side line at the thenar crease and the ulnar side line), and
 * its depth the aponeurosis pad's thickness
 * ({@link PAD_SHARE} of the palm's half width). Palmar skin is thick and
 * tied to the aponeurosis (`docs/anatomy/hand.md`, Form), so the arc is flat
 * under the pad and turns up to the side guides, which own its tangent and
 * curvature at both ends (the sector meets the dorsal sector at the side
 * lines G1 and the eminences at the creases G1).
 *
 * `PAD_SHARE` is a CONVENTION: no palmar pad thickness is read in the
 * repository; the palm's palmar depth from the references' horizontal
 * hand sections is the quality phase's measurement.
 */
export namespace AutoMovieHumanPalmPalmarSector {
  /** Pad depth below the bones' palmar line over the palm's half width: a convention. */
  export const PAD_SHARE: number = 0.25;

  /** A sector's fixed inputs. */
  export interface IInput {
    /** The two side guides' places in the section, `[b, c]`, mm, the thumb side first. */
    sides: [[number, number], [number, number]];

    /** The palm's palmar bone line's `c` at the middle, mm. */
    bone: number;
  }

  /**
   * Points of the sector's arc from the first side guide to the second,
   * a half ellipse through the pad's deepest point.
   *
   * @param input The sector's inputs.
   * @param count Points, at least 2.
   */
  export function arc(input: IInput, count: number): [number, number][] {
    const [a, b] = input.sides;
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const half: number = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
    const depth: number = PAD_SHARE * half;
    const ex: number = (a[0] - mid[0]) / half;
    const ey: number = (a[1] - mid[1]) / half;

    // The ellipse's long axis is the chord between the guides; its short axis
    // is square to it, turned to the side that points toward the palm
    // (positive `c`), and the pad never rises above the bone's palmar line.
    const toward: number = ex >= 0 ? 1 : -1;
    return Array.from({ length: count }, (_: unknown, k: number): [number, number] => {
      const t: number = (Math.PI * k) / (count - 1);
      const along: number = half * Math.cos(t);
      const pad: number = toward * depth * Math.sin(t);
      return [mid[0] + along * ex - pad * ey, Math.max(input.bone, mid[1] + along * ey + pad * ex)];
    });
  }
}
