import { AutoMovieHumanHeadJawJoin } from "./AutoMovieHumanHeadJawJoin";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadSideSector } from "./AutoMovieHumanHeadSideSector";
import { AutoMovieHumanHeadVault } from "./AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";

/**
 * The outline of one head section along rays from its centre: the face's
 * super-ellipse in front of its widest place, the cranium's behind the
 * eurion line, and between them the side sector G2 to both owners
 * (`AutoMovieHumanHeadSideSector`), then the jaw's volume joined by a smooth
 * minimum (`AutoMovieHumanHeadJaw`).
 */
export namespace AutoMovieHumanHeadRadius {
  /** Radius of the section's outline along a ray from `(ox, 0)`, the jaw joined. */
  export function radius(
    section: IAutoMovieHumanHeadSection,
    ox: number,
    theta: number,
    _guess: number = 0,
  ): number {
    return AutoMovieHumanHeadJawJoin.jawed(section, ox, theta, bodies(section, ox, theta));
  }

  /**
   * Radius of the cranium and the face joined along a ray, front to back:
   * the face's front half and the cranium in front of the face's lateral
   * boundary Z, its widest place, joined where they meet flush (over the
   * forehead and the brow) by a C2 smooth maximum that swells the skin a sixth
   * of its width at most; the side sector from Z to the cranium's eurion line
   * E, G2 to both (`AutoMovieHumanHeadSideSector`); the cranium alone behind
   * E. Where E does not stand behind Z the sector runs on to the back midline,
   * the cranium's back apex. The face owns no skin behind its widest place:
   * the back half of its super-ellipse, reaching as far behind the widest
   * place as the lips stand in front of it, stood out of the nape under the
   * ears as a ring round the back of the head.
   */
  function bodies(section: IAutoMovieHumanHeadSection, ox: number, theta: number): number {
    const w: AutoMovieHumanHeadSideSector.IWindow | null = sideWindow(section, ox);
    if (w === null) return AutoMovieHumanHeadVault.cranial(section, ox, theta);
    if (theta <= w.from) return union(section, ox, theta);
    if (theta < w.to) return AutoMovieHumanHeadSideSector.radius(w, theta);
    return AutoMovieHumanHeadVault.cranial(section, ox, theta);
  }

  /** The side sector of a section seen from a ray origin, cut once. */
  function sideWindow(
    section: IAutoMovieHumanHeadSection,
    ox: number,
  ): AutoMovieHumanHeadSideSector.IWindow | null {
    const known = WINDOWS.get(section);
    if (known !== undefined && known.ox === ox) return known.window;
    const from: number = Math.max(0, Math.atan2(section.face, section.waist - ox));
    const eurion: number = Math.atan2(section.width, section.axis - ox);
    const to: number =
      eurion > from + 4 * AutoMovieHumanHeadSideSector.STEP ? eurion : Math.PI;
    const window: AutoMovieHumanHeadSideSector.IWindow | null =
      section.face > 0
        ? AutoMovieHumanHeadSideSector.window(
            (t: number): number => union(section, ox, t),
            (t: number): number => AutoMovieHumanHeadVault.cranial(section, ox, t),
            from,
            to,
          )
        : null;
    WINDOWS.set(section, { ox, window });
    return window;
  }

  /** The cranium and the face's super-ellipse joined by a smooth maximum along a ray. */
  function union(section: IAutoMovieHumanHeadSection, ox: number, theta: number): number {
    const c: number = Math.cos(theta);
    const n: number = Math.sin(theta);
    const reach: number =
      2 * (Math.max(section.crown, section.front) - section.back) +
      2 * Math.max(section.width, section.face);
    const face: number = AutoMovieHumanHeadMath.outermost(
      (r: number): number =>
        AutoMovieHumanHeadMath.lame(
          (ox + r * c - section.waist) / Math.max(1e-6, section.front - section.waist),
          (r * n) / Math.max(1e-6, section.face),
          section.powerFace,
        ),
      reach,
    );

    // In front of Z the cranium owns only the forehead: its share is whole
    // over the glabella and gone by the nasion (`brow`), so under the brow the
    // face alone is the skin there and the temple sector the skin behind it.
    if (!(section.brow > 0)) return face;
    const cranium: number = AutoMovieHumanHeadMath.outermost(
      (r: number): number => AutoMovieHumanHeadVault.gauge(section, ox + r * c, r * n),
      reach,
    );
    return face + section.brow * (AutoMovieHumanHeadMath.softMax(cranium, face, section.union) - face);
  }
}

/** Side sectors already cut, by section. */
const WINDOWS: WeakMap<
  IAutoMovieHumanHeadSection,
  { ox: number; window: AutoMovieHumanHeadSideSector.IWindow | null }
> = new WeakMap();
