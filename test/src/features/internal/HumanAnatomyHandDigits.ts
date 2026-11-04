import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHandSection } from "./HumanAnatomyHandSection";

type V3 = HumanAnatomy.V3;
type ISection = HumanAnatomyHandSection.ISection;
const A: typeof HumanAnatomy = HumanAnatomy;
const { sections }: typeof HumanAnatomyHandSection = HumanAnatomyHandSection;

/** The four fingers read along their own paths, so a finger bent at its joints keeps the length it has. */
export namespace HumanAnatomyHandDigits {
  /** The four fingers, radial to ulnar. */
  export const FINGERS: readonly ["Index", "Middle", "Ring", "Little"] = ["Index", "Middle", "Ring", "Little"] as const;

  /** A finger by its rig name. */
  export type Finger = (typeof FINGERS)[number];

  /** One finger's own path on a skin. */
  export interface IDigit {
    /**
     * Length from the station where the finger parts from its neighbours, the
     * web its base crease lies on, to the farthest skin of its tip, along the
     * centroids of its own sections, mm; NaN when the finger never parts.
     */
    length: number;

    /** Section centroids from the parting station to the last section that encloses the path. */
    path: V3[];

    /** Taut girth of each section on the path, mm. */
    girths: number[];
  }

  /** Step between a finger's sections, mm. */
  export const STEP: number = 1;

  /** Sections over which a finger's path takes its direction, so one section's noise cannot turn it. */
  export const CHORD: number = 4;

  /**
   * Follow each finger along its own sections, so a finger flexed at the
   * neutral of a captured body reads the length it has, not its projection on
   * the hand's axis.
   *
   * Sections across the hand's axis (wrist centre to third knuckle), from the
   * third knuckle outward, are cut through the hand and fingers with the
   * thumb's chains left out; the first station holding four separate loops,
   * ordered radial to ulnar, gives each finger its loop. From there each
   * finger is walked back to the station where its loop merges with a
   * neighbour's (its web), and forward 1 mm at a time by sections normal to
   * the chord over its last four area centroids, until no loop encloses the
   * next point of the path or the loop swells past a quarter over the finger's
   * widest (it has run into the palm or a neighbour); the tip's farthest skin
   * along the last chord ends it. The rig's joints only orient the hand.
   */
  export function digits(skin: HumanAnatomy.ISkin, side: "left" | "right"): Record<Finger, IDigit> {
    const out: Record<Finger, IDigit> = Object.fromEntries(
      FINGERS.map((f: Finger): [Finger, IDigit] => [f, { length: NaN, path: [], girths: [] }]),
    ) as Record<Finger, IDigit>;
    const wrist: V3 = A.joint(skin, `${side}Hand`);
    const mcp3: V3 = A.joint(skin, `${side}MiddleProximal`);
    const axis: V3 = A.unit(A.sub(mcp3, wrist));
    const across: V3 = A.unit(A.reject(A.sub(A.joint(skin, `${side}LittleProximal`), A.joint(skin, `${side}IndexProximal`)), axis));
    const reach: number = A.dist(wrist, mcp3);
    const tris: Uint32Array = A.triangles(skin, new RegExp(`^(hand|finger)\\.${side}`));
    const station: (s: number) => V3 = (s: number): V3 => A.add(wrist, A.scale(axis, s));

    // The first station past the third knuckle where all four fingers stand apart.
    let s0: number = NaN;
    let four: ISection[] = [];
    for (let s: number = A.dot(A.sub(mcp3, wrist), axis); s <= 2.5 * reach; s += STEP) {
      const found: ISection[] = sections(skin, station(s), axis, tris);
      if (found.length === 4) {
        s0 = s;
        four = found.sort((x: ISection, y: ISection): number => A.dot(x.centre, across) - A.dot(y.centre, across));
        break;
      }
    }
    if (!Number.isFinite(s0)) return out;

    FINGERS.forEach((f: Finger, k: number): void => {
      const own: ISection = four[k]!;
      const neighbours: number[] = [four[k - 1], four[k + 1]]
        .filter((n: ISection | undefined): n is ISection => n !== undefined)
        .map((n: ISection): number => A.dot(n.centre, across));

      // Back to the web: the last station whose loop round the finger holds no neighbour's centre.
      let back: number = 0;
      let at: V3 = own.centre;
      for (let s: number = s0 - STEP; s > s0 - reach; s -= STEP) {
        const pick: V3 = A.add(at, A.scale(axis, -STEP));
        const c: ISection | undefined = sections(skin, station(s), axis, tris).find((x: ISection): boolean => x.encloses(pick));
        if (c === undefined) break;
        const a: number[] = c.points.map((q: V3): number => A.dot(q, across));
        if (neighbours.some((n: number): boolean => n >= Math.min(...a) && n <= Math.max(...a))) break;
        back += A.dist(c.centre, at);
        at = c.centre;
      }

      // Forward along the finger's own sections, each normal to the path's last chord.
      const path: V3[] = [own.centre];
      const girths: number[] = [own.girth];
      let d: V3 = axis;
      let widest: number = own.girth;
      for (let i: number = 0; i < (2.5 * reach) / STEP; i++) {
        const last: V3 = path[path.length - 1]!;
        const o: V3 = A.add(last, A.scale(d, STEP));
        const c: ISection | undefined = sections(skin, o, d, tris).find((x: ISection): boolean => x.encloses(o));
        if (c === undefined || c.girth > 1.25 * widest) break;
        path.push(c.centre);
        girths.push(c.girth);
        widest = Math.max(widest, c.girth);
        const from: V3 = path[Math.max(0, path.length - 1 - CHORD)]!;
        if (path.length > CHORD) d = A.unit(A.sub(c.centre, from));
      }
      let ahead: number = 0;
      for (let i: number = 1; i < path.length; i++) ahead += A.dist(path[i]!, path[i - 1]!);

      // The tip: the farthest skin beyond the last section, along the path's last
      // chord. Past its last enclosing section a digit only narrows to its end,
      // so its own tip lies within the last section's radius r = girth / (2 pi)
      // of the path's line, and no more than r plus one step beyond the section
      // (a cap no taller than a hemisphere, the step it outran). A neighbour's
      // skin beside the tip lies farther from the line than r, so it is left out.
      const end: V3 = path[path.length - 1]!;
      const radius: number = girths[girths.length - 1]! / (2 * Math.PI);
      let cap: number = 0;
      for (const t of tris)
        for (let j: number = 0; j < 3; j++) {
          const q: V3 = A.sub(A.point(skin, skin.I[3 * t + j]!), end);
          const beyond: number = A.dot(q, d);
          if (beyond > 0 && beyond <= radius + STEP && A.dist(q, A.scale(d, beyond)) <= radius) cap = Math.max(cap, beyond);
        }
      out[f] = { length: back + ahead + cap, path, girths };
    });
    return out;
  }
}
