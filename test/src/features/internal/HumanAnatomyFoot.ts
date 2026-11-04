import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyFootProfile } from "./HumanAnatomyFootProfile";
import { HumanAnatomyMirror } from "./HumanAnatomyMirror";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type IFootInputs = NonNullable<NonNullable<IAutoMovieHumanParameters["extremities"]>["feet"]>["left"];
const A: typeof HumanAnatomy = HumanAnatomy;
const { SIDES, FOOT, identity, ratio, extentAlong }: typeof HumanAnatomyShared = HumanAnatomyShared;

/** The foot audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyFoot {
  /** A foot's sites at the neutral pose. */
  export interface IFoot {
    /** Foot length along the foot axis, mm. */
    length: number;

    /** Breadth across the metatarsal heads, perpendicular to the foot axis, mm. */
    breadth: number;

    /** Horizontal unit direction of the foot axis, heel to toes. */
    axis: V3;

    /** The rearmost skin point along the axis, where length is read from. */
    rear: V3;

    /** Lowest skin under the heel, the rear 0.02 to 0.25 of the foot length, mm. */
    heel: number;

    /** Lowest skin under the ball, 0.6 to 0.8 of the foot length, mm. */
    ball: number;

    /** Lowest skin of the whole foot, mm. */
    lowest: number;
  }

  /**
   * The forefoot window, as fractions of foot length from the heel, where the
   * first and fifth metatarsal heads are sought. ANSUR II's ball-of-foot
   * length puts the first head at 0.739 (women, SD 0.013) and 0.741 (men, SD
   * 0.015) of foot length (182.1 / 246.3 and 200.9 / 271.2); the upper bound
   * is 0.741 plus 7 of the men's SD, so no head is cut off while the toes
   * beyond stay out. The fifth head lies behind the first on the oblique
   * metatarsal line, a position ANSUR II did not measure: the lower bound, half
   * the foot, is a geometric bound behind it, not a published value.
   */
  export const FOREFOOT: readonly [number, number] = [0.5, 0.846];

  /** The feet, flat at the neutral pose: ISO 7250-1 length and breadth and the sole on the floor. */
  export function foot(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.neutral();

    for (const side of SIDES) {
      const own: IFootInputs | undefined = p.extremities?.feet?.[side];
      const f: IFoot = footSites(skin, side);
      if (own !== undefined) {
        rows.push(identity(name, `${side} foot length, heel to the longest toe along the foot axis, mm`, f.length, own.footLength, FOOT));
        rows.push(identity(name, `${side} foot breadth across the metatarsal heads, perpendicular to the foot axis, mm`, f.breadth, own.footBreadth, FOOT));
      }

      // ANSUR II means: breadth over length 92.7 / 246.3 = 0.3764 (women) and
      // 101.9 / 271.2 = 0.3757 (men). The women's spread is the wider: their
      // coefficients of variation of breadth (4.8 / 92.7 = 0.0518) and length
      // (12.4 / 246.3 = 0.0503) taken as uncorrelated give SD 0.0272, and 2.326
      // SD either side gives 0.3132 to 0.4396 (the men's give 0.3143 to 0.4372).
      rows.push(ratio(name, `${side} foot breadth / length`, f.breadth / f.length, 0.3132, 0.4396));

      // The body stands on the floor, y = 0: the heel and the ball, where a
      // standing foot bears its weight, reach it within ISO 20685-1's 2 mm for
      // foot dimensions, and no skin passes under it by more.
      rows.push(identity(name, `${side} heel on the floor: lowest skin under 0.02 to 0.25 of the foot, mm`, f.heel, 0, FOOT));
      rows.push(identity(name, `${side} ball on the floor: lowest skin under 0.6 to 0.8 of the foot, mm`, f.ball, 0, FOOT));
      rows.push({ person: name, site: `${side} foot: lowest skin under the floor, mm`, value: f.lowest, low: -FOOT, high: Infinity, unit: "mm" });

      // The sections across the foot: dorsum, arch and toes in order.
      rows.push(...HumanAnatomyFootProfile.rows(name, skin, side, f));
    }

    // Both feet come from one construction and a reflection, each side from
    // its own inputs; a real body's feet need not mirror.
    if (subject.construction) rows.push(...mirror(name, subject.bind(), p));
    return rows;
  }

  /**
   * Mirror symmetry of one construction whose sides take their own inputs:
   * each foot against the other foot reflected and rebuilt to this side's own
   * length and breadth by {@link HumanAnatomyMirror.foot}, every fourth vertex
   * read against the nearest skin within {@link HumanAnatomyMirror.MIRROR}.
   */
  export function mirror(name: string, skin: HumanAnatomy.ISkin, params: IAutoMovieHumanParameters): IRow[] {
    const rows: IRow[] = [];

    for (const side of SIDES) {
      const other: "left" | "right" = HumanAnatomyMirror.opposite(side);
      const o: IFoot = footSites(skin, other);
      const map: HumanAnatomyMirror.Rebuild = HumanAnatomyMirror.foot(params, side, o.rear, o.axis);
      rows.push({
        person: name,
        site: `${side} foot: the ${other} foot reflected and rebuilt to this side's length and breadth inputs, off this side's skin, mm`,
        value: HumanAnatomyMirror.offset(skin, new RegExp(`^(foot|forefoot|toe)\\.${other}`), (_: string, q: V3): V3 => map(q)),
        low: 0,
        high: HumanAnatomyMirror.MIRROR,
        unit: "mm",
      });
    }
    return rows;
  }

  /**
   * A foot's sites at the neutral pose. The foot axis is the IBV foot metrics
   * catalogue's: the line in the ground plane through the rearmost point of the
   * foot and the midpoint between the first and fifth metatarsal heads, taken
   * as the medial and lateral extremes of the {@link FOREFOOT} window; IBV
   * cites ISO 7250-1:2017 6.3.7 and ISO 8559-1:2017 5.5.5 for the foot length
   * read along it. Starting from the footprint's principal axis (the foot's
   * skin within 15 mm of its own lowest point, so a foot floating off the floor
   * still has a footprint and fails the floor rows by its height), the axis is
   * re-solved through its own heel and metatarsal heads until it holds still.
   * The body faces +X, so the toes point to +X: the principal axis is taken
   * with its x component positive, and the heel is its least end. Length is
   * the foot's extent along the axis; breadth, across the metatarsal heads, is
   * the extent across the axis of the forefoot window.
   *
   * @throws {Error} When the skin carries no foot of that side.
   */
  export function footSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): IFoot {
    const points: V3[] = A.vertices(skin, new RegExp(`^(foot|forefoot|toe)\\.${side}`));
    if (points.length === 0) throw new Error(`${skin.name} has no ${side} foot skin`);

    // The footprint: the skin near the foot's own lowest point, so a foot
    // floating above the floor still has one.
    const floor: number = points.reduce((m: number, p: V3): number => Math.min(m, p[1]), Infinity);
    const print: V3[] = points.filter((p: V3): boolean => p[1] < floor + 15);
    const mx: number = print.reduce((s: number, p: V3): number => s + p[0], 0) / print.length;
    const mz: number = print.reduce((s: number, p: V3): number => s + p[2], 0) / print.length;
    let xx: number = 0;
    let xz: number = 0;
    let zz: number = 0;
    for (const p of print) {
      xx += (p[0] - mx) ** 2;
      xz += (p[0] - mx) * (p[2] - mz);
      zz += (p[2] - mz) ** 2;
    }

    // Half the doubled angle lies within a quarter turn of +X, toward the toes.
    let angle: number = 0.5 * Math.atan2(2 * xz, xx - zz);

    // The foot's extent along a horizontal direction, as least and greatest
    // coordinates.
    const range: (d: V3) => [number, number] = (d: V3): [number, number] => {
      let lo: number = Infinity;
      let hi: number = -Infinity;
      for (const p of points) {
        const s: number = A.dot(p, d);
        lo = Math.min(lo, s);
        hi = Math.max(hi, s);
      }
      return [lo, hi];
    };

    // The skin whose place along the axis falls between two shares of the length.
    const between: (along: V3, from: number, to: number) => V3[] = (along: V3, from: number, to: number): V3[] => {
      const [lo, hi]: [number, number] = range(along);
      return points.filter((p: V3): boolean => {
        const f: number = (A.dot(p, along) - lo) / (hi - lo);
        return f >= from && f <= to;
      });
    };

    // Solve the axis through the heel and the midpoint of the forefoot's
    // medial and lateral extremes, which moves with the axis, until it rests.
    for (let k: number = 0; k < 8; k++) {
      const along: V3 = [Math.cos(angle), 0, Math.sin(angle)];
      const across: V3 = [-Math.sin(angle), 0, Math.cos(angle)];
      const rear: V3 = points.reduce((a: V3, b: V3): V3 => (A.dot(b, along) < A.dot(a, along) ? b : a));
      const fore: V3[] = between(along, FOREFOOT[0], FOREFOOT[1]);
      const a: V3 = fore.reduce((u: V3, v: V3): V3 => (A.dot(v, across) < A.dot(u, across) ? v : u));
      const b: V3 = fore.reduce((u: V3, v: V3): V3 => (A.dot(v, across) > A.dot(u, across) ? v : u));
      const mid: V3 = A.lerp(a, b, 0.5);
      const next: number = Math.atan2(mid[2] - rear[2], mid[0] - rear[0]);
      const moved: number = Math.abs(next - angle);
      angle = next;
      if (moved < 1e-6) break;
    }

    const along: V3 = [Math.cos(angle), 0, Math.sin(angle)];
    const across: V3 = [-Math.sin(angle), 0, Math.cos(angle)];
    const [lo, hi]: [number, number] = range(along);
    const lowest: (from: number, to: number) => number = (from: number, to: number): number =>
      between(along, from, to).reduce((y: number, p: V3): number => Math.min(y, p[1]), Infinity);
    return {
      length: hi - lo,
      breadth: extentAlong(between(along, FOREFOOT[0], FOREFOOT[1]), across),
      axis: along,
      rear: points.reduce((a: V3, b: V3): V3 => (A.dot(b, along) < A.dot(a, along) ? b : a)),
      heel: lowest(0.02, 0.25),
      ball: lowest(0.6, 0.8),
      lowest: lowest(0, 1),
    };
  }
}
