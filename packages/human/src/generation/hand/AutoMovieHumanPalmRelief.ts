import { AutoMovieHumanSeamCarve } from "../../lofting/AutoMovieHumanSeamCarve";
import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanHandWindow } from "./AutoMovieHumanHandWindow";
import { AutoMovieHumanInterosseousValley } from "./AutoMovieHumanInterosseousValley";
import { AutoMovieHumanMetacarpalArch } from "./AutoMovieHumanMetacarpalArch";
import { AutoMovieHumanPalmPalmarSector } from "./AutoMovieHumanPalmPalmarSector";
import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandDigit } from "./IAutoMovieHumanHandDigit";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The palm's reliefs on its own sections, in the hand form's axes (`a` along
 * the hand toward the fingers, `b` across toward the thumb, `c` through
 * toward the palm), each its own piece on its own axis:
 *
 * - the interosseous valleys ({@link AutoMovieHumanInterosseousValley})
 *   between neighbouring finger metacarpals on the back of the hand, each as
 *   deep as its share of the metacarpal arches' radius
 *   ({@link AutoMovieHumanMetacarpalArch}), growing from the palm's first
 *   section to the knuckles;
 * - the hypothenar eminence ({@link AutoMovieHumanHandWindow.HYPOTHENAR}) along the fifth
 *   metacarpal on the palm's ulnar side, its window between the palm's first
 *   section and the fifth finger's root.
 *
 * - the palmar sector's pad ({@link AutoMovieHumanPalmPalmarSector}), the
 *   aponeurosis pad's half ellipse between the section's side points, joined
 *   to the palmar face by the smooth union (`AutoMovieHumanSeamUnion.body`),
 *   growing from its chord at the palm's first section to its full depth at
 *   the knuckles.
 *
 * All three vanish at the palm's first section, the seam the palm shares with
 * the heel, so that seam is unchanged.
 *
 * A metacarpal's place across the hand is its finger root's, its length in
 * the palm the way from the palm's first section to that root. A relief moves
 * a point through the hand, toward the palm for a valley and away from the
 * bones for the eminence, weighed by how far the point lies on its face of the
 * section (dorsal for a valley, palmar for the eminence), so the reliefs fade
 * to nothing at the side lines, where the faces meet. Every window vanishes
 * with its slope and curvature at its edge.
 */
export namespace AutoMovieHumanPalmRelief {
  /**
   * A palm section with its reliefs.
   *
   * @param digits The hand form's digits, thumb first.
   * @param ring The section's points, form axes, mm of the form.
   * @param start The palm's first section's place along the hand, `a`.
   */
  export function ring(digits: readonly IAutoMovieHumanHandDigit[], ring: readonly Vec3[], start: number): Vec3[] {
    const fingers: readonly IAutoMovieHumanHandDigit[] = digits.slice(1);
    const cs: number[] = ring.map((q: Vec3): number => q[2]);
    const bs: number[] = ring.map((q: Vec3): number => q[1]);
    const middle: number = (Math.max(...cs) + Math.min(...cs)) / 2;
    const half: number = Math.max(1e-6, (Math.max(...cs) - Math.min(...cs)) / 2);
    const palm: number = (Math.max(...bs) - Math.min(...bs)) / 2;

    // The valleys between neighbouring metacarpals, thumb side first.
    const valleys: { input: AutoMovieHumanInterosseousValley.IInput; head: number }[] = fingers.slice(0, -1).map(
      (d: IAutoMovieHumanHandDigit, i: number): { input: AutoMovieHumanInterosseousValley.IInput; head: number } => {
        const e: IAutoMovieHumanHandDigit = fingers[i + 1]!;
        const radius: number =
          (AutoMovieHumanMetacarpalArch.radius({ centre: [d.centre[1], d.centre[2]], root: d.width[0]![1] }) +
            AutoMovieHumanMetacarpalArch.radius({ centre: [e.centre[1], e.centre[2]], root: e.width[0]![1] })) /
          2;

        return { input: { between: [d.centre[1], e.centre[1]], radius }, head: (d.centre[0] + e.centre[0]) / 2 };
      },
    );

    // The hypothenar's share of the palm along the fifth metacarpal: its
    // window spans the palm from its first section, the seam with the heel,
    // where it vanishes, to the fifth finger's root, so its half length
    // (LENGTH_SHARE of the metacarpal) is half that run.
    const little: IAutoMovieHumanHandDigit = fingers[fingers.length - 1]!;
    const run: number = Math.max(1, little.centre[0] - start);
    const hypothenar: AutoMovieHumanHandWindow.IMassSize = { length: run / (2 * AutoMovieHumanHandWindow.HYPOTHENAR.length), width: palm, depth: palm };
    const belly: number = start + run / 2;

    // The palmar sector's pad: the half ellipse between the section's radial
    // and ulnar side points (its extremes across the hand), sampled and read
    // at each point's place across; it joins the palmar face by the smooth
    // union, its blend width from its own depth and half width.
    const radial: Vec3 = ring.reduce((m: Vec3, q: Vec3): Vec3 => (q[1] > m[1] ? q : m), ring[0]!);
    const ulnar: Vec3 = ring.reduce((m: Vec3, q: Vec3): Vec3 => (q[1] < m[1] ? q : m), ring[0]!);
    const pad: [number, number][] = AutoMovieHumanPalmPalmarSector.arc(
      { sides: [[radial[1], radial[2]], [ulnar[1], ulnar[2]]], bone: middle },
      PAD_SAMPLES,
    ).sort((x: [number, number], y: [number, number]): number => x[0] - y[0]);
    const padHalf: number = Math.hypot(radial[1] - ulnar[1], radial[2] - ulnar[2]) / 2;
    const padWidth: number = AutoMovieHumanSeamUnion.width(AutoMovieHumanPalmPalmarSector.PAD_SHARE * padHalf, padHalf);

    // The pad grows from its chord at the palm's first section (the seam with
    // the heel) to its full depth at the knuckles, by the smooth step of the
    // way along, as the valleys do.
    const head: number = fingers.reduce((s: number, d: IAutoMovieHumanHandDigit): number => s + d.centre[0], 0) / fingers.length;
    const along: number = Math.min(1, Math.max(0, (ring.reduce((s: number, q: Vec3): number => s + q[0], 0) / ring.length - start) / Math.max(1e-6, head - start)));
    const grow: number = along * along * (3 - 2 * along);
    const chord = (b: number): number => radial[2] + ((b - radial[1]) * (ulnar[2] - radial[2])) / (ulnar[1] - radial[1] || 1);
    const padAt = (b: number): number => {
      if (b <= pad[0]![0] || b >= pad[pad.length - 1]![0]) return -Infinity;
      const j: number = pad.findIndex((p: [number, number]): boolean => p[0] >= b);
      const lo: [number, number] = pad[j - 1]!;
      const hi: [number, number] = pad[j]!;
      const c: number = lo[1] + ((b - lo[0]) / (hi[0] - lo[0] || 1)) * (hi[1] - lo[1]);

      // One blend width inside its arc, so the pad's border, where the arc
      // meets the side points, lies buried in the face by that width and the
      // union leaves the face there untouched.
      return chord(b) - padWidth + grow * (c - chord(b));
    };

    return ring.map((q: Vec3): Vec3 => {
      const dorsal: number = Math.min(1, Math.max(0, (middle - q[2]) / half));
      const palmar: number = Math.min(1, Math.max(0, (q[2] - middle) / half));
      const sink: number = valleys.reduce(
        (sum: number, v: { input: AutoMovieHumanInterosseousValley.IInput; head: number }): number =>
          sum + AutoMovieHumanInterosseousValley.depth(v.input, q[1], (q[0] - start) / Math.max(1e-6, v.head - start)),
        0,
      );
      const rise: number = AutoMovieHumanHandWindow.mass(AutoMovieHumanHandWindow.HYPOTHENAR, hypothenar, q[0] - belly, q[1] - little.centre[1]);

      // A dorsal point's distance from the section's middle only shrinks by
      // the declared recess, a palmar point's only grows by the eminence.
      if (dorsal > 0) return [q[0], q[1], middle - AutoMovieHumanSeamCarve.dent(middle - q[2], -dorsal * sink)];

      const face: number = AutoMovieHumanSeamUnion.body(q[2] - middle, padAt(q[1]) - middle, padWidth);

      return [q[0], q[1], middle + AutoMovieHumanSeamUnion.bump(face, palmar * rise)];
    });
  }
}

/** Points of the palmar pad's arc read across the hand. */
const PAD_SAMPLES: number = 65;
