import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IHand = HumanAnatomyShared.IHand;
const A: typeof HumanAnatomy = HumanAnatomy;
const { extentAlong }: typeof HumanAnatomyShared = HumanAnatomyShared;

/** One component of a plane's section through the skin, as an ordered polyline. */
type ILine = ReturnType<typeof HumanAnatomy.polylines>[number];

/** The hand's sites, located on a skin by their published definitions: hand and thumb length, breadth, circumference and palm length. */
export namespace HumanAnatomyHandSites {
  /**
   * Locate a hand's sites at the neutral pose.
   *
   * Length and thumb length run along the extended digit, so they are read
   * only where the digits are straight; breadth, circumference and palm length
   * end at the knuckles. The rig's joints only orient the hand: stylion is the
   * wrist centre 1.5 mm proximal (de Leva 1996 Table 2), and the knuckle
   * section is the plane across the hand through the midpoint of the index and
   * little metacarpal heads, normal to the hand's axis, taken as the loop that
   * encloses the third metacarpal head with the thumb's chains left out.
   */
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
    const tip: (finger: string) => V3 = (finger: string): V3 => A.joint(skin, `${side}${finger}Distal`);
    const base: (finger: string) => V3 = (finger: string): V3 => A.joint(skin, `${side}${finger}Proximal`);
    const along: (finger: string, s: number) => V3 = (finger: string, s: number): V3 => {
      const a: V3 = base(finger);
      const b: V3 = tip(finger);
      const d: V3 = A.unit(A.sub(b, a));
      const k: number = (s - A.dot(A.sub(a, stylion), axis)) / A.dot(d, axis);
      return A.add(a, A.scale(d, k));
    };
    let palm: number = NaN;
    for (let s: number = A.dot(A.sub(mcp3, stylion), axis); s < length; s += 0.5) {
      const o: V3 = A.add(stylion, A.scale(axis, s));
      const parts: ILine[] = A.polylines(skin, o, axis, palmTris);
      const owner: (q: V3) => number = (q: V3): number => {
        let best: number = -1;
        let d: number = Infinity;
        parts.forEach((part: ILine, k: number): void => {
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

    // Thumb length: the thumb's MCP joint to the farthest skin of its tip along its own axis.
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
