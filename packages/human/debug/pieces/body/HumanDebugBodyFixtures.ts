import type { AutoMovieHumanDigitWalk } from "../../../src/generation/limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanWalkPart } from "../../../src/generation/limb/AutoMovieHumanWalkPart";
import type { IAutoMovieHumanTrunkViews } from "../../../src/generation/trunk/IAutoMovieHumanTrunkViews";
import { AutoMovieHumanViewSection } from "../../../src/lofting/AutoMovieHumanViewSection";

/**
 * Fixed inputs of the body lane's standalone parts, for the part view while
 * their laws are pending (#3047 to #3051): each part is seen alone in seconds
 * from these values, never from a person, so a view shows the construction's
 * own behaviour and no law's.
 *
 * The trunk's knots take ANSUR II's female means (`docs/sources/ansur-ii.md`:
 * heights; chest, waist and hip breadth; chest, waist and buttock depth), each
 * tape the Ramanujan perimeter of its box's ellipse; the forward places, the
 * untaped sites' sizes and the digit's and limb's dimensions are made and
 * stated here. None of these values is read by generation.
 */
export namespace HumanDebugBodyFixtures {
  /**
   * The ellipse's perimeter in a half breadth by a depth (Ramanujan's second
   * approximation).
   *
   * @param half Half breadth, mm.
   * @param depth Whole depth, mm.
   * @returns The perimeter, mm.
   */
  function ellipse(half: number, depth: number): number {
    const a: number = half;
    const b: number = depth / 2;
    const h: number = ((a - b) / (a + b)) ** 2;
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }

  /**
   * A trunk site from its height, half breadth, depth, mid-depth place and fullness.
   *
   * @param site Site name.
   * @param y Height, mm.
   * @param half Half breadth, mm.
   * @param depth Whole depth, mm.
   * @param centre Mid-depth forward place, mm (made).
   * @param fullness The site's owner.
   * @returns The site.
   */
  function site(site: string, y: number, half: number, depth: number, centre: number, fullness: IAutoMovieHumanTrunkViews.ISite["fullness"]): IAutoMovieHumanTrunkViews.ISite {
    return { site, y, half, front: centre + depth / 2, back: centre - depth / 2, fullness };
  }

  /** The trunk base at ANSUR II's female means. */
  export const TRUNK: IAutoMovieHumanTrunkViews = {
    perineum: { y: 782.3, x: -10 },
    sites: [
      site("buttock", 833.7, 176.9, 232.9, -20, { girth: ellipse(176.9, 232.9) }),
      site("waist", 980.1, 149.95, 213.0, 0, { girth: ellipse(149.95, 213.0) }),
      site("chest", 1171.6, 134.65, 247.4, 10, { girth: ellipse(134.65, 247.4) }),
      site("axilla", 1239.0, 134.65, 222.7, 5, { shoulder: AutoMovieHumanViewSection.ELLIPSE }),
      site("acromion", 1335.1, 187.65, 136.1, -10, { shoulder: 0.5 }),
      site("top", 1435.7, 55, 110, -5, { shoulder: AutoMovieHumanViewSection.ELLIPSE }),
    ],
  };

  /** A made index finger at the origin, pointing +X with its dorsum +Y: bones 40, 23 and 18 mm, joints turned 10 and 8 degrees down. */
  export function finger(): AutoMovieHumanDigitWalk.IInput {
    const turn = (deg: number): [number, number] => [Math.cos((deg * Math.PI) / 180), -Math.sin((deg * Math.PI) / 180)];
    const [c1, s1] = turn(10);
    const [c2, s2] = turn(18);
    const pip: [number, number, number] = [40, 0, 0];
    const dip: [number, number, number] = [pip[0] + 23 * c1, 23 * s1, 0];
    const end: [number, number, number] = [dip[0] + 18 * c2, dip[1] + 18 * s2, 0];
    const laws: Record<string, AutoMovieHumanDigitWalk.ISiteLaw> = {
      base: { breadth: 20, depth: 18, dorsal: 0.45, shoulder: 0.45 },
      "shaft 0": { breadth: 18, depth: 15, dorsal: 0.4, shoulder: 0.45 },
      "joint 1": { breadth: 18.5, depth: 16, dorsal: 0.45, shoulder: 0.45 },
      "shaft 1": { breadth: 16, depth: 13, dorsal: 0.4, shoulder: 0.45 },
      "joint 2": { breadth: 16, depth: 13, dorsal: 0.45, shoulder: 0.45 },
      "shaft 2": { breadth: 15, depth: 11.5, dorsal: 0.4, shoulder: 0.45 },
      end: { breadth: 14, depth: 10, dorsal: 0.4, shoulder: 0.45 },
    };
    return {
      name: "finger.fixture",
      centres: [[0, 0, 0], pip, dip, end],
      dorsal: [0, 1, 0],
      tip: 5,
      law: (s: string): AutoMovieHumanDigitWalk.ISiteLaw => {
        const law: AutoMovieHumanDigitWalk.ISiteLaw | undefined = laws[s];
        if (law === undefined) throw new Error(`The finger fixture has no law at ${s}`);
        return law;
      },
      order: 64,
      gap: 1,
    };
  }

  /** A made two-bone limb from (0, 900, 90) down to (0, 60, 70) with a knee 5 degrees off line, ellipses of made boxes at five sites. */
  export function limb(): AutoMovieHumanWalkPart.IInput {
    const shoulder = (r: number): AutoMovieHumanWalkPart.ISite["fullness"] => ({ shoulder: r });
    return {
      name: "limb.fixture",
      centres: [
        [0, 900, 90],
        [12, 480, 80],
        [0, 60, 70],
      ],
      joints: [{ half: 45 }],
      u: [1, 0, 0],
      sites: [
        { site: "top", bone: 0, share: 0, edges: [80, 85, -70, -75], fullness: shoulder(0.45) },
        { site: "thigh", bone: 0, share: 0.15, edges: [75, 80, -72, -70], fullness: shoulder(0.42) },
        { site: "knee", bone: 1, share: 0.05, edges: [48, 52, -50, -48], fullness: shoulder(0.48) },
        { site: "calf", bone: 1, share: 0.3, edges: [50, 50, -62, -52], fullness: shoulder(0.43) },
        { site: "ankle", bone: 1, share: 1, edges: [30, 32, -32, -30], fullness: shoulder(0.45) },
      ],
      order: 128,
      samples: 128,
      gap: 4,
    };
  }
}
