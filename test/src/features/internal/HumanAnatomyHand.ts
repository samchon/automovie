import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type IHand = HumanAnatomyShared.IHand;
const A = HumanAnatomy;
const { SIDES, SMALL, HAND, identity, ratio, extentAlong } = HumanAnatomyShared;

/** The hand audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyHand {
  /**
   * The hands at the neutral pose: ANSUR II and ISO 7250-1 lengths, breadth and
   * circumference, and the order of the fingers' lengths along their own paths.
   *
   * Hand length and thumb length run from stylion or the thumb's crease to a
   * fingertip with the digit extended, so a subject whose neutral does not
   * straighten its digits cannot be read by their definitions and gives no
   * such row; breadth over length goes with the length. Palm length,
   * breadth and circumference end at the knuckles, which flexion of the
   * fingers beyond them leaves in place, and the finger order follows each
   * finger's own centreline, which flexion bends but does not shorten.
   */
  export function hand(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.neutral();
    for (const side of SIDES) {
      const h: IHand = handSites(skin, side);
      const own = p.extremities?.hands?.[side];
      if (own !== undefined) {
        if (subject.straightened)
          rows.push(identity(name, `${side} hand length, stylion to dactylion III, mm`, h.length, own.handLength, HAND));
        rows.push(identity(name, `${side} hand breadth across metacarpals II to V, mm`, h.breadth, own.handBreadth, HAND));
        rows.push(identity(name, `${side} palm length, stylion to the middle finger's base, mm`, h.palm, own.palmLength, HAND));
        if (subject.straightened) {
          rows.push(identity(name, `${side} thumb length, MCP crease to tip, mm`, h.thumb, own.thumbLength, HAND));
          // ANSUR II means: breadth over length 78.2 / 181.1 = 0.4318 (women) and
          // 88.3 / 193.3 = 0.4568 (men). Coefficients of variation of breadth
          // (3.8 / 78.2 = 0.0486; 4.4 / 88.3 = 0.0498) and length (10.1 / 181.1 =
          // 0.0558; 9.9 / 193.3 = 0.0512) taken as uncorrelated give SD 0.0319
          // and 0.0326, and 2.326 SD below the women's and above the men's mean
          // give 0.3575 to 0.5327.
          rows.push(ratio(name, `${side} hand breadth / length`, h.breadth / h.length, 0.3575, 0.5327));
        }
      }
      const circumference: number | null = p.body.controls.handCircumference.value;
      if (circumference !== null)
        rows.push(identity(name, `${side} hand circumference over metacarpals II to V, mm`, h.circumference, circumference, SMALL));
      rows.push(...fingerOrder(name, side, digits(skin, side)));
    }
    return rows;
  }

  /**
   * The order of the fingers' lengths: the middle finger the longest and the
   * little finger the shortest of the four. Bridgman 1920 states the order as
   * anatomy ("The middle finger is the longest and largest"; "The little finger
   * is the smallest and shortest"), and in the 1987-1988 Army hand survey
   * (Greiner 1991) the middle finger exceeds the ring finger, the longer of
   * its neighbours, by 5.0 mm in women and 4.6 mm in men on average, and the
   * index finger, the shortest of the other three, exceeds the little finger
   * by 11.3 and 10.6 mm; the order of the index and ring fingers (2D:4D)
   * varies between people and is not read.
   */
  export function fingerOrder(name: string, side: "left" | "right", d: Record<Finger, IDigit>): IRow[] {
    const len = (f: Finger): number => d[f].length;
    return [
      {
        person: name,
        site: `${side} middle finger's length along its own path past the longest other finger's, mm`,
        value: len("Middle") - Math.max(len("Index"), len("Ring"), len("Little")),
        low: 0,
        high: Infinity,
        unit: "mm",
      },
      {
        person: name,
        site: `${side} little finger's length along its own path short of the shortest other finger's, mm`,
        value: Math.min(len("Index"), len("Middle"), len("Ring")) - len("Little"),
        low: 0,
        high: Infinity,
        unit: "mm",
      },
    ];
  }

  /** The four fingers, radial to ulnar. */
  export const FINGERS = ["Index", "Middle", "Ring", "Little"] as const;

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

  /**
   * Follow each finger along its own sections, so a finger flexed at the
   * neutral of a captured body reads the length it has, not its projection on
   * the hand's axis.
   *
   * Sections across the hand's axis (wrist centre to third knuckle), from the
   * third knuckle outward, are cut through the hand and fingers with the
   * thumb's chains left out; the first station holding four separate loops, ordered radial to
   * ulnar, gives each finger its loop. From there each finger is walked back
   * to the station where its loop merges with a neighbour's (its web), and
   * forward 1 mm at a time by sections normal to the chord over its last four
   * area centroids, until no loop encloses the next point of the path or the
   * loop swells past a quarter over the finger's widest (it has run into the
   * palm or a neighbour); the tip's farthest skin along the last chord ends
   * it. The rig's joints only orient the hand.
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
    const station = (s: number): V3 => A.add(wrist, A.scale(axis, s));
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

  /** Step between a finger's sections, mm. */
  export const STEP: number = 1;

  /** Sections over which a finger's path takes its direction, so one section's noise cannot turn it. */
  export const CHORD: number = 4;

  /** One closed loop of a plane's section. */
  interface ISection {
    /** Area centroid of the loop. */
    centre: V3;

    /** Taut girth, mm. */
    girth: number;

    /** Loop points. */
    points: V3[];

    /** Whether the loop encloses a point of its plane. */
    encloses: (p: V3) => boolean;
  }

  /** The closed loops of a plane's section through some triangles. */
  function sections(skin: HumanAnatomy.ISkin, origin: V3, normal: V3, tris: Uint32Array): ISection[] {
    const [u, w] = A.basis(normal);
    const flat = (p: V3): [number, number] => [A.dot(A.sub(p, origin), u), A.dot(A.sub(p, origin), w)];
    return A.polylines(skin, origin, normal, tris)
      .filter((l: { points: V3[]; closed: boolean }): boolean => l.closed && l.points.length >= 8)
      .map((l: { points: V3[]; closed: boolean }): ISection => {
        const q: [number, number][] = l.points.map(flat);
        let area: number = 0;
        let cx: number = 0;
        let cy: number = 0;
        for (let i: number = 0; i < q.length; i++) {
          const [x0, y0] = q[i]!;
          const [x1, y1] = q[(i + 1) % q.length]!;
          const cr: number = x0 * y1 - x1 * y0;
          area += cr / 2;
          cx += ((x0 + x1) * cr) / 6;
          cy += ((y0 + y1) * cr) / 6;
        }
        const centre: V3 = A.add(origin, A.add(A.scale(u, cx / area), A.scale(w, cy / area)));
        return {
          centre,
          girth: A.hull(q),
          points: l.points,
          encloses: (p: V3): boolean => {
            const [px, py] = flat(p);
            let inside: boolean = false;
            for (let i: number = 0, j: number = q.length - 1; i < q.length; j = i++) {
              const [xi, yi] = q[i]!;
              const [xj, yj] = q[j]!;
              if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
            }
            return inside;
          },
        };
      });
  }

  /** Locate a hand's sites at the neutral pose. */
  export function handSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): IHand {
    const wrist: V3 = A.joint(skin, `${side}Hand`);
    const mcp3: V3 = A.joint(skin, `${side}MiddleProximal`);
    const mcp2: V3 = A.joint(skin, `${side}IndexProximal`);
    const mcp5: V3 = A.joint(skin, `${side}LittleProximal`);
    const thumbMcp: V3 = A.joint(skin, `${side}ThumbProximal`);
    const thumbIp: V3 = A.joint(skin, `${side}ThumbDistal`);
    const axis: V3 = A.unit(A.sub(mcp3, wrist));
    const stylion: V3 = A.sub(wrist, A.scale(axis, 1.5));
    const middle: V3[] = A.vertices(skin, new RegExp(`^finger\\.${side}\\.middle`));
    const length: number = Math.max(...middle.map((p: V3): number => A.dot(A.sub(p, stylion), axis)));
    const across: V3 = A.unit(A.sub(mcp5, mcp2));
    const normal: V3 = A.unit(A.reject(axis, across));
    const palmTris: Uint32Array = A.triangles(skin, new RegExp(`^(hand|finger)\\.${side}`));
    const knuckles: HumanAnatomy.ICut | null = A.cut(skin, A.lerp(mcp2, mcp5, 0.5), normal, mcp3, palmTris);
    // Palm length: stylion to the station where the middle finger parts from both
    // neighbours, the web level its base crease lies on.
    const tip = (finger: string): V3 => A.joint(skin, `${side}${finger}Distal`);
    const base = (finger: string): V3 => A.joint(skin, `${side}${finger}Proximal`);
    const along = (finger: string, s: number): V3 => {
      const a: V3 = base(finger);
      const b: V3 = tip(finger);
      const d: V3 = A.unit(A.sub(b, a));
      const k: number = (s - A.dot(A.sub(a, stylion), axis)) / A.dot(d, axis);
      return A.add(a, A.scale(d, k));
    };
    let palm: number = NaN;
    for (let s: number = A.dot(A.sub(mcp3, stylion), axis); s < length; s += 0.5) {
      const o: V3 = A.add(stylion, A.scale(axis, s));
      const parts = A.polylines(skin, o, axis, palmTris);
      const owner = (q: V3): number => {
        let best: number = -1;
        let d: number = Infinity;
        parts.forEach((part, k: number): void => {
          for (const p of part.points) {
            const e: number = A.dist(p, q);
            if (e < d) {
              d = e;
              best = k;
            }
          }
        });
        return best;
      };
      const m: number = owner(along("Middle", s));
      if (m !== owner(along("Index", s)) && m !== owner(along("Ring", s))) {
        palm = s;
        break;
      }
    }
    const thumbAxis: V3 = A.unit(A.sub(thumbIp, thumbMcp));
    const thumbs: V3[] = A.vertices(skin, new RegExp(`^thumb\\.${side}`));
    const thumb: number = Math.max(...thumbs.map((p: V3): number => A.dot(A.sub(p, thumbMcp), thumbAxis)));
    return {
      length,
      breadth: knuckles === null ? NaN : extentAlong(knuckles.points, across),
      circumference: knuckles === null ? NaN : knuckles.girth,
      palm,
      thumb,
    };
  }

}
