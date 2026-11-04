import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import type { HumanAnatomyFoot } from "./HumanAnatomyFoot";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type IFoot = HumanAnatomyFoot.IFoot;
const A: typeof HumanAnatomy = HumanAnatomy;
const { FOOT, extraTurns }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The foot read by sections across its axis at fixed shares of its length: the
 * height of the dorsum, the clearance under the medial side (the arch) and the
 * order of the toes. Each rule asks where a profile runs down, where it rises
 * and where its extreme stands, with expectations from anatomy or a published
 * index, never from a body.
 */
export namespace HumanAnatomyFootProfile {
  /** Spacing of the sections along the foot, as a share of its length. */
  export const STEP: number = 0.025;

  /**
   * Share of foot length at which the first metatarsal head stands, the end of
   * ANSUR II's ball-of-foot length: 0.739 (women) and 0.741 (men) of foot
   * length. It stands for the truncated foot length of the arch height index.
   */
  export const BALL: number = 0.74;

  /**
   * The arch height index, dorsal height at half the foot over the truncated
   * foot length: the union of two published 2.326 SD bands. Williams and
   * McClay 2000 (`sources/williams-mcclay-2000-arch-height.md`, 102 feet) read
   * 0.292, SD 0.027 at 90 percent weight bearing, 0.229 to 0.355; Butler et
   * al. (`sources/butler-arch-height-index.md`, 100 recreational runners) read
   * 0.340, SD 0.030, 0.270 to 0.410. The generated foot stands, so the
   * weight-bearing band is the nearer one; the union keeps both measured
   * populations.
   */
  export const AHI: readonly [number, number] = [0.292 - 2.326 * 0.027, 0.34 + 2.326 * 0.03];

  /** One foot's profiles by section. */
  export interface IProfile {
    /** Shares of foot length the sections stand at. */
    share: number[];

    /** Highest skin of each section above the floor, mm; NaN where the section is empty. */
    top: number[];

    /** Lowest skin of each section's medial half above the floor, mm: the arch's clearance. */
    clearance: number[];
  }

  /** The profile rows of a foot and its toes. */
  export function rows(name: string, skin: HumanAnatomy.ISkin, side: "left" | "right", f: IFoot): IRow[] {
    const p: IProfile = profile(skin, side, f);
    const out: IRow[] = [];

    // The section height at a share of the length, a multiple of the step.
    const at: (share: number) => number = (share: number): number => p.top[Math.round(share / STEP) - 1]!;

    // The dorsum falls from its summit to the toes: past its maximum no
    // section stands higher than a lower one before it, within the foot
    // tolerance (Gray 1918: the dorsum is convex, highest over the talus and
    // navicular, falling toward the toes).
    const summit: number = p.top.reduce((best: number, v: number, i: number): number => (v > p.top[best]! ? i : best), 0);
    let rise: number = 0;
    let floor: number = p.top[summit]!;
    for (let i: number = summit + 1; i < p.top.length; i++) {
      rise = Math.max(rise, p.top[i]! - floor);
      floor = Math.min(floor, p.top[i]!);
    }
    out.push({ person: name, site: `${side} foot dorsum: largest rise of the section height past its summit toward the toes, mm`, value: rise, low: 0, high: FOOT, unit: "mm" });
    out.push({ person: name, site: `${side} foot dorsum: summit within the rear half, share of foot length`, value: p.share[summit]!, low: 0, high: 0.5, unit: "" });

    // The arch rises from the heel to one summit and falls to the ball: the
    // medial clearance, a profile read where the foot is still a single body
    // (heel to ball), has no second hump deeper than the foot tolerance.
    const lo: number = Math.round(0.05 / STEP) - 1;
    const hi: number = Math.round(BALL / STEP) - 1;
    const arch: number[] = p.clearance.slice(lo, hi + 1);
    out.push({
      person: name,
      site: `${side} foot arch: medial clearance from the heel to the ball has extra humps deeper than the foot tolerance`,
      value: arch.every((v: number): boolean => Number.isFinite(v)) ? extraTurns(arch.map((v: number): number => -v), FOOT) : NaN,
      low: 0,
      high: 0,
      unit: "humps",
    });

    // The arch spans from the calcaneus (about 0.08 of the length) to the first
    // metatarsal head (0.74), and a vault between two supports peaks near the
    // middle of its span, 0.41, within 0.15 either side. A foot with no
    // clearance past the tolerance has no apex to place.
    const apex: number = arch.reduce((best: number, v: number, i: number): number => (v > arch[best]! ? i : best), 0);
    if (arch[apex]! > FOOT)
      out.push({ person: name, site: `${side} foot arch: apex of the medial clearance, share of foot length`, value: p.share[lo + apex]!, low: 0.26, high: 0.56, unit: "" });

    // Butler et al.: dorsal height at half the foot over the truncated foot
    // length (heel to the first metatarsal head).
    out.push({
      person: name,
      site: `${side} foot arch height index: dorsal height at half the foot over heel to ball`,
      value: at(0.5) / (BALL * f.length),
      low: AHI[0],
      high: AHI[1],
      unit: "",
    });
    out.push(...toes(name, skin, side, f));
    return out;
  }

  /** Sections of the foot across its axis, every {@link STEP} of its length. */
  export function profile(skin: HumanAnatomy.ISkin, side: "left" | "right", f: IFoot): IProfile {
    const tris: Uint32Array = A.triangles(skin, new RegExp(`^(foot|forefoot|toe)\\.${side}`));
    const across: V3 = [-f.axis[2], 0, f.axis[0]];
    const medial: number = side === "left" ? -1 : 1;
    const out: IProfile = { share: [], top: [], clearance: [] };

    for (let s: number = STEP; s < 1 - 1e-9; s += STEP) {
      const origin: V3 = A.add(f.rear, A.scale(f.axis, s * f.length));
      const points: V3[] = A.polylines(skin, origin, f.axis, tris).flatMap((l: { points: V3[] }): V3[] => l.points);

      // The medial half of a section: the points on the medial side of the axis line.
      const inner: V3[] = points.filter((q: V3): boolean => medial * A.dot(A.sub(q, f.rear), across) >= 0);
      out.share.push(s);
      out.top.push(points.length === 0 ? NaN : Math.max(...points.map((q: V3): number => q[1])));
      out.clearance.push(inner.length === 0 ? NaN : Math.min(...inner.map((q: V3): number => q[1])));
    }
    return out;
  }

  /**
   * The toes' order along the foot: the third, fourth and fifth toes each end
   * behind the one medial to them, and the longest toe is the first or the
   * second (Gray 1918 form; which of the two leads varies between people).
   */
  export function toes(name: string, skin: HumanAnatomy.ISkin, side: "left" | "right", f: IFoot): IRow[] {
    const tip: number[] = [1, 2, 3, 4, 5].map((k: number): number => {
      const v: V3[] = A.vertices(skin, new RegExp(`^toe\\.${side}\\.${k}$`));
      return v.length === 0 ? NaN : Math.max(...v.map((q: V3): number => A.dot(q, f.axis)));
    });
    const rows: IRow[] = [];
    for (const k of [3, 4])
      rows.push({
        person: name,
        site: `${side} foot: toe ${k} ends ahead of toe ${k + 1}, mm`,
        value: tip[k - 1]! - tip[k]!,
        low: 0,
        high: Infinity,
        unit: "mm",
      });

    const longest: number = tip.reduce((best: number, v: number, i: number): number => (v > tip[best]! ? i : best), 0) + 1;
    rows.push({ person: name, site: `${side} foot: the longest toe is the first or the second, its number`, value: longest, low: 1, high: 2, unit: "" });
    return rows;
  }
}
