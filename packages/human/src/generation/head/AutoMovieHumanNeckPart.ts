import { AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieHumanHeadNeck } from "../IAutoMovieHumanHeadNeck";

/**
 * The neck as a part drawn from its views, the input of the view-to-section
 * operator (`AutoMovieViewLoft`).
 *
 * - Front view: the lateral outlines at the neck tape's ring radius
 *   (`IAutoMovieHumanHeadNeck.radius`, from the neck circumference).
 * - Side view: the front outline the radius ahead of the ring's centre, the
 *   back outline at the ring's back on the midline, carried down and up by
 *   the back's slope with height.
 * - Axis: straight up through the ring's centre.
 * - Fullness: the ellipse's shoulder, until the neck's breadth and depth at
 *   its tape site have a source and the tape itself owns the fullness.
 *
 * The part runs from below the neck base, inside the trunk it is merged
 * onto, up to the menton's height, inside the head mass merged onto it; both
 * ends are open. A neck read off the old neck chain took that chain's bottom
 * ring, the trapezius' flare, as its own breadth and lay as a flat disc under
 * the head. First pass: compile-only.
 */
export namespace AutoMovieHumanNeckPart {
  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 32;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 128;

  /** Largest station step between layers, mm. */
  export const SPACING: number = 3;

  /**
   * The neck as a view part.
   *
   * @param neck The neck tape's ring under the head.
   * @param bottom The station the neck starts at, inside the trunk, mm.
   * @param top The station it ends at, inside the head mass, mm.
   * @returns The part, chain name `neck`.
   */
  export function of(neck: IAutoMovieHumanHeadNeck, bottom: number, top: number): IAutoMovieViewPart {
    const n: number = Math.max(2, Math.ceil((top - bottom) / SPACING));
    const stations: number[] = Array.from({ length: n + 1 }, (_: unknown, k: number): number => bottom + ((top - bottom) * k) / n);
    const outline = (value: (s: number) => number): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((s: number, k: number): IAutoMovieViewPart.IKnot => ({
        site: k === 0 ? "neck.base" : k === n ? "neck.top" : `neck.${k}`,
        station: s,
        value: value(s),
      })),
    });

    // The back's place at a height, by its slope from the ring.
    const back = (s: number): number => Math.max(1, neck.x - (neck.back + neck.backSlope * (s - neck.level)));
    return {
      name: "neck",
      axis: AutoMovieViewAxis.straight([neck.x, 0, 0], [1, 0, 0], [0, 0, 1]),
      stations,
      front: { positive: outline((): number => neck.radius), negative: outline((s: number): number => -back(s)) },
      side: { positive: outline((): number => neck.radius), negative: outline((): number => -neck.radius) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: "neck.base", station: bottom, value: AutoMovieViewSection.ELLIPSE },
            { site: "neck.top", station: top, value: AutoMovieViewSection.ELLIPSE },
          ],
        },
      },
      order: ORDER,
      samples: SAMPLES,
    };
  }
}
