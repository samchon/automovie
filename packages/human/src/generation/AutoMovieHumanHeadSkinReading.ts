import { AutoMovieHumanHeadNeckBase } from "./AutoMovieHumanHeadNeckBase";
import { AutoMovieHumanHeadRadius } from "./AutoMovieHumanHeadRadius";
import { AutoMovieHumanHeadRelief } from "./AutoMovieHumanHeadRelief";
import { AutoMovieHumanHeadSection } from "./AutoMovieHumanHeadSection";
import { AutoMovieHumanHeadSkin } from "./AutoMovieHumanHeadSkin";
import type { IAutoMovieHumanHeadCompiled } from "./IAutoMovieHumanHeadCompiled";
import type { IAutoMovieHumanHeadLayout } from "./IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSection } from "./IAutoMovieHumanHeadSection";
import type { IAutoMovieHumanHeadSides } from "./IAutoMovieHumanHeadSides";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * Readings on the head's cut skin that other pieces take: the forward place of
 * the skin at a height and lateral place, the midline's front or back at a
 * station, a section's breadth at a forward place and the widest half width.
 */
export namespace AutoMovieHumanHeadSkinReading {
  /** Widest half-width of the section at a station, before its reliefs. */
  export function widest(
    compiled: IAutoMovieHumanHeadCompiled,
    plan: IAutoMovieHumanHeadLayout,
    s: number,
  ): number {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(
      compiled,
      plan,
      s,
    );
    const ox: number = (m.front + m.back) / 2;
    let out: number = 0;
    for (let j: number = 0; j <= AutoMovieHumanHeadSection.ANGLES / 4; j++) {
      const theta: number =
        (4 * Math.PI * j) / AutoMovieHumanHeadSection.ANGLES;
      out = Math.max(
        out,
        AutoMovieHumanHeadRadius.radius(m, ox, theta) * Math.sin(theta),
      );
    }
    return out;
  }

  /** Forward coordinate of the skin at a world height and lateral place. */
  export function frontAt(
    surface: IAutoMovieHumanHeadSurface,
    y: number,
    z: number,
  ): number {
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(
      surface.compiled,
      surface.plan,
      y,
    );
    const c: IAutoMovieHumanHeadSides = AutoMovieHumanHeadSkin.sides(
      surface,
      y - 100 * Math.sin(m.tilt),
      AutoMovieHumanHeadSection.ANGLES / 2,
    );
    const list: Vec3[] = z >= 0 ? c.left : c.right;
    let best: Vec3 = list[0]!;
    for (const p of list.slice(0, AutoMovieHumanHeadSection.ANGLES / 2))
      if (Math.abs(p[2] - z) < Math.abs(best[2] - z)) best = p;
    return best[0];
  }

  /** The skin's midline point of the section at station s, `[x, y]`: front, or back. */
  export function midline(
    surface: IAutoMovieHumanHeadSurface,
    s: number,
    back: boolean = false,
  ): P2 {
    const { compiled, plan } = surface;
    const m: IAutoMovieHumanHeadSection = AutoMovieHumanHeadSection.section(
      compiled,
      plan,
      s,
    );
    const ox: number = (m.front + m.back) / 2;
    const [fade, run, bend] = AutoMovieHumanHeadNeckBase.neckFade(plan, s);
    const cos: number = Math.cos(m.tilt);
    const sin: number = Math.sin(m.tilt);
    const j: number = back ? AutoMovieHumanHeadSection.ANGLES : 0;
    const sign: number = back ? -1 : 1;
    const r0: number =
      AutoMovieHumanHeadRadius.radius(m, ox, back ? Math.PI : 0) +
      fade * surface.neckLeft[j]! +
      run * surface.slopeLeft[j]! +
      bend * surface.curveLeft[j]!;
    const xi: number = ox + sign * r0;
    const xi1: number =
      ox +
      sign *
        AutoMovieHumanHeadRelief.merged(
          surface,
          r0,
          xi * cos,
          s + xi * sin,
          0,
          1,
        );
    return [xi1 * cos, s + xi1 * sin + fade * surface.riseLeft[j]!];
  }

  /**
   * The z of a section's left side where it first crosses a forward place,
   * from the front.
   */
  export function across(side: readonly Vec3[], x: number): number {
    for (let i: number = 1; i < side.length; i++) {
      const a: Vec3 = side[i - 1]!;
      const b: Vec3 = side[i]!;
      if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) {
        const f: number = (a[0] - x) / (a[0] - b[0]);
        return a[2] + f * (b[2] - a[2]);
      }
    }
    return NaN;
  }
}

/** A point. */
type Vec3 = [number, number, number];

/** A point of a section. */
type P2 = [number, number];
