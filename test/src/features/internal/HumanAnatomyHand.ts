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
  /** The hands, straightened at the neutral pose: ANSUR II and ISO 7250-1 lengths, breadth and circumference. */
  export function hand(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.neutral();
    for (const side of SIDES) {
      const h: IHand = handSites(skin, side);
      const own = p.extremities?.hands?.[side];
      if (own !== undefined) {
        rows.push(identity(name, `${side} hand length, stylion to dactylion III, mm`, h.length, own.handLength, HAND));
        rows.push(identity(name, `${side} hand breadth across metacarpals II to V, mm`, h.breadth, own.handBreadth, HAND));
        rows.push(identity(name, `${side} palm length, stylion to the middle finger's base, mm`, h.palm, own.palmLength, HAND));
        rows.push(identity(name, `${side} thumb length, MCP crease to tip, mm`, h.thumb, own.thumbLength, HAND));
        rows.push(
          ratio(name, `${side} hand breadth / length`, h.breadth / h.length, 0.383, 0.506),
        );
      }
      const circumference: number | null = p.body.controls.handCircumference.value;
      if (circumference !== null)
        rows.push(identity(name, `${side} hand circumference over metacarpals II to V, mm`, h.circumference, circumference, SMALL));
    }
    return rows;
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
