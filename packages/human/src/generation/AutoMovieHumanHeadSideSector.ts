import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";

/**
 * The head section's side sector: the skin between the face's lateral
 * boundary Z and the cranium's eurion line E, in one horizontal section,
 * as a radius along rays from the section's centre.
 *
 * In front of Z the face owns the section, behind E the cranium. Each guide
 * publishes the outer body's jet along the rays there, its radius and first
 * and second derivatives per radian, and the sector is the quintic Hermite
 * span between the two in the ray angle (`AutoMovieHumanSeam.quintic`). The
 * outline `o + r(theta) (cos theta, sin theta)` copies each owner's point,
 * tangent and curvature in that shared parameter, so it is G2 to both. The
 * temple, the cheek behind the zygion and the jaw's side behind the face's
 * widest place lie in this sector: where the face's back half crossed the
 * cranium there, a smooth maximum 6 mm wide had turned the skin within a few
 * millimetres and drawn a faceted ridge from the eye to the ear.
 */
export namespace AutoMovieHumanHeadSideSector {
  /** The sector of one section: its angles and its owners' jets there. */
  export interface IWindow {
    /** Ray angle of Z, radians from the forward axis. */
    from: number;

    /** Ray angle of E. */
    to: number;

    /** Z's jet `[r, r', r'']` per radian. */
    lo: number[];

    /** E's jet. */
    hi: number[];
  }

  /**
   * The sector between two guide angles, each guide's jet read on its owner's
   * radius along the rays; none when the guides stand closer than the step
   * that reads their jets.
   *
   * @param front Radius along a ray of the skin in front of the sector, Z's owner.
   * @param rear Radius of the skin behind it, the cranium, E's owner.
   * @param from Ray angle of the face's lateral boundary.
   * @param to Ray angle of the cranium's eurion line, or of the back midline.
   */
  export function window(
    front: (theta: number) => number,
    rear: (theta: number) => number,
    from: number,
    to: number,
  ): IWindow | null {
    if (!(to - from > 4 * STEP)) return null;

    // Each jet is read over a window that follows the span it feeds, a
    // sixteenth of it: an owner's corner finer than that (a fading face's
    // tip) is averaged at the span's own scale instead of read as an
    // unbounded curvature that swings the whole span.
    const step: number = (to - from) / JET_SHARE;
    const jet = (owner: (theta: number) => number, theta: number): number[] => {
      const a: number = owner(theta - step);
      const b: number = owner(theta);
      const c: number = owner(theta + step);
      return [b, (c - a) / (2 * step), (a - 2 * b + c) / (step * step)];
    };
    return { from, to, lo: jet(front, from), hi: jet(rear, to) };
  }

  /**
   * The sector's radius at a ray angle inside it.
   *
   * @param w The sector.
   * @param theta Ray angle in `[from, to]`.
   */
  export function radius(w: IWindow, theta: number): number {
    const h: number = w.to - w.from;
    return AutoMovieHumanSeam.quintic(
      [[w.lo[0]!], [w.lo[1]!], [w.lo[2]!]],
      [[w.hi[0]!], [w.hi[1]!], [w.hi[2]!]],
      h,
      (theta - w.from) / h,
    )[0]!;
  }

  /** Least span of a sector, in quarters of it, radians: narrower sectors are none. */
  export const STEP: number = 2e-3;

  /** Windows of the central differences that read a guide's jet per sector span. */
  export const JET_SHARE: number = 16;
}
