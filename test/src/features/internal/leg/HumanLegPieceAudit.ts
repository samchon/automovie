import { AutoMovieHumanLegGirth } from "../../../../../packages/human/src/generation/leg/AutoMovieHumanLegGirth";
import { AutoMovieHumanRelief } from "../../../../../packages/human/src/network/AutoMovieHumanRelief";
import type { IAutoMovieHumanRelief } from "../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import { HumanCurveProfile } from "../curves/HumanCurveProfile";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanLimbUnion } from "../limbs/HumanLimbUnion";
import type { HumanLegPieces } from "./HumanLegPieces";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The leg's pieces read alone from one person's inputs: the girth law's
 * profile against the person's tapes and the leg's anatomy (consistency.md
 * section 3.1), the joint centres' order and alignment, and each relief
 * window as a piece joined by volume only.
 */
export namespace HumanLegPieceAudit {
  /** Station step of the girth profile, mm: the catalog's 2 mm. */
  export const STEP: number = 2;

  /** Least ankle over calf maximum, ANSUR II's ratio 0.578 women and 0.585 men, 2.326 SD (consistency.md section 2). */
  export const ANKLE_OVER_CALF: readonly [number, number] = [0.439, 0.719];

  /** Calf maximum's place, share of the shank below the knee centre (consistency.md L5). */
  export const CALF: readonly [number, number] = [0.15, 0.6];

  /** Least ankle's place, share of the shank below the knee centre (consistency.md L6). */
  export const ANKLE: readonly [number, number] = [0.75, 0.97];

  /**
   * The hip-knee-ankle angle at neutral, degrees, varus positive: Tang 2000
   * (`sources/tang-2000-lower-limb-alignment.md`, 50 healthy young adults,
   * weight-bearing long radiographs) reads the mechanical axis 2.2 degrees
   * varus, SD 2.5 (women) and 2.7 (men); the 2.326 SD band of the wider SD.
   */
  export const ALIGNMENT: readonly [number, number] = [2.2 - 2.326 * 2.7, 2.2 + 2.326 * 2.7];

  /**
   * The girth law's profile rows: the thigh, knee and calf tapes at their
   * sites, each span's shape between the sites, the calf maximum and the least
   * ankle at their places, and the tapes' order as the inputs order them.
   */
  export function girth(p: HumanLegPieces.IPieces, law: (s: number) => number = p.girth): IRow[] {
    const { SMALL, LARGE }: typeof HumanAnatomyShared = HumanAnatomyShared;
    const knee: number = p.heights.knee;
    const ankle: number = p.heights.ankle;
    const shank: number = knee - ankle;
    const site: number = knee - AutoMovieHumanLegGirth.MID_PATELLA;

    // Profiles read downward, from the crotch to the knee site and from the
    // knee site to the malleoli.
    const run: (top: number, bottom: number) => { s: number[]; g: number[] } = (top: number, bottom: number): { s: number[]; g: number[] } => {
      const s: number[] = [];
      for (let y: number = top; y >= bottom - 1e-9; y -= STEP) s.push(y);
      return { s, g: s.map(law) };
    };
    const thigh: { s: number[]; g: number[] } = run(p.crotch, site);
    const leg: { s: number[]; g: number[] } = run(site, ankle);
    const top: number = HumanCurveProfile.argmax(thigh.g, 0, thigh.g.length - 1);
    const share: (s: number) => number = (s: number): number => (knee - s) / shank;
    const at: (x: number) => number = (x: number): number => Math.max(0, leg.s.findIndex((s: number): boolean => share(s) >= x));

    // The thigh falls from its maximum to the suprapatellar least girth (L1
    // to L2, `down`); from there to the knee the patella and condyles may
    // stand proud (L2 to L4, `V` or `down`), so that span is not read here.
    const supra: number = HumanCurveProfile.argmin(thigh.g, top, thigh.g.length - 1);

    // The infrapatellar least girth stands at 0.05 to 0.2 of the shank (L4),
    // and the calf belly below it, before the least ankle's window (L5); the
    // knee's own girth may exceed the calf's (calf over knee 0.966, SD 0.041).
    const infra: number = HumanCurveProfile.argmin(leg.g, at(0.05), at(0.2));
    const calf: number = HumanCurveProfile.argmax(leg.g, infra, at(ANKLE[0]));
    const least: number = HumanCurveProfile.argmin(leg.g, calf, leg.g.length - 1);
    const row: (what: string, value: number, low: number, high: number, unit: string) => IRow = (what: string, value: number, low: number, high: number, unit: string): IRow => ({
      person: p.person,
      site: `leg girth law: ${what}`,
      value,
      low,
      high,
      unit,
    });
    const order: number = Math.sign(p.tapes.calf - p.tapes.knee);
    return [
      row("thigh maximum under the crotch less the thigh tape, mm", thigh.g[top]! - p.tapes.thigh, -LARGE, LARGE, "mm"),
      row("girth at mid-patella less the knee tape, mm", law(site) - p.tapes.knee, -SMALL, SMALL, "mm"),
      row("shank maximum less the calf tape, mm", leg.g[calf]! - p.tapes.calf, -SMALL, SMALL, "mm"),
      row("excess variation from the thigh maximum down to the suprapatellar least girth (down), mm", HumanCurveProfile.excess(thigh.g.slice(top, supra + 1)), 0, SMALL, "mm"),
      row("excess variation from the infrapatellar least girth down to the calf maximum (up), mm", HumanCurveProfile.excess(leg.g.slice(infra, calf + 1)), 0, SMALL, "mm"),
      row("excess variation from the calf maximum down to the least ankle (down), mm", HumanCurveProfile.excess(leg.g.slice(calf, least + 1)), 0, SMALL, "mm"),
      row("calf maximum, share of the shank below the knee centre", share(leg.s[calf]!), CALF[0], CALF[1], ""),
      row("least ankle, share of the shank below the knee centre", share(leg.s[least]!), ANKLE[0], ANKLE[1], ""),
      row("least ankle over the calf maximum", leg.g[least]! / leg.g[calf]!, ANKLE_OVER_CALF[0], ANKLE_OVER_CALF[1], ""),
      row("thigh maximum less the girth at mid-patella, mm", thigh.g[top]! - law(site), 0, Infinity, "mm"),

      // Knee against calf follows the inputs wherever they differ by more
      // than both tapes' errors; closer inputs may read either way.
      row(
        "calf maximum less mid-patella girth, signed as the inputs order them, mm",
        Math.abs(p.tapes.calf - p.tapes.knee) > 2 * SMALL ? order * (leg.g[calf]! - law(site)) : 0,
        0,
        Infinity,
        "mm",
      ),
    ];
  }

  /** The joint centres: stacked hip over knee over ankle, and the knee on the hip-ankle line at neutral. */
  export function bones(p: HumanLegPieces.IPieces, b: HumanLegPieces.IPieces["bones"] = p.bones): IRow[] {
    const thigh: number[] = [b.knee[0] - b.hip[0], b.knee[1] - b.hip[1], b.knee[2] - b.hip[2]];
    const shank: number[] = [b.ankle[0] - b.knee[0], b.ankle[1] - b.knee[1], b.ankle[2] - b.knee[2]];
    const cos: number = (thigh[0]! * shank[0]! + thigh[1]! * shank[1]! + thigh[2]! * shank[2]!) / (Math.hypot(...thigh) * Math.hypot(...shank));

    // Varus when the knee stands lateral (+Z on the left leg) of the
    // hip-ankle line at its height, valgus when medial.
    const share: number = (b.hip[1] - b.knee[1]) / (b.hip[1] - b.ankle[1]);
    const line: number = b.hip[2] + share * (b.ankle[2] - b.hip[2]);
    const sense: number = b.knee[2] >= line ? 1 : -1;

    // The Neutral-0 position's knee is the extended knee every flexion is
    // measured from, so in the sagittal plane the knee centre stands on the
    // hip-ankle chord; an offset past the crease sagitta reads as a bent or
    // hyperextended knee.
    const sagittal: number = b.knee[0] - (b.hip[0] + share * (b.ankle[0] - b.hip[0]));
    return [
      { person: p.person, site: "leg bones: hip centre above the knee centre, mm", value: b.hip[1] - b.knee[1], low: 0, high: Infinity, unit: "mm" },
      { person: p.person, site: "leg bones: knee centre above the ankle centre, mm", value: b.knee[1] - b.ankle[1], low: 0, high: Infinity, unit: "mm" },
      { person: p.person, site: "leg bones: hip above the crotch, mm", value: b.hip[1] - p.crotch, low: 0, high: Infinity, unit: "mm" },
      { person: p.person, site: "leg bones: crotch above the knee centre, mm", value: p.crotch - b.knee[1], low: 0, high: Infinity, unit: "mm" },
      {
        person: p.person,
        site: "leg bones: hip-knee-ankle angle from straight at neutral, varus positive, degrees",
        value: (sense * Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI,
        low: ALIGNMENT[0],
        high: ALIGNMENT[1],
        unit: "deg",
      },
      {
        person: p.person,
        site: "leg bones: knee centre ahead of the hip-ankle chord at Neutral-0, mm",
        value: sagittal,
        low: -HumanAnatomyShared.CREASE,
        high: HumanAnatomyShared.CREASE,
        unit: "mm",
      },
    ];
  }

  /**
   * Each relief window as a piece joined by volume only: its displacement
   * points out of the leg at its centre, it is zero at its window's edge, it
   * leaves the edge with the base's tangent plane, and it rises no steeper than
   * 45 degrees anywhere.
   */
  export function reliefs(p: HumanLegPieces.IPieces, list: readonly IAutoMovieHumanRelief[] = p.reliefs): IRow[] {
    return list.flatMap((r: IAutoMovieHumanRelief): IRow[] => {
      const centre: [number, number] = [(r.stations[0] + r.stations[1]) / 2, (r.phases[0] + r.phases[1]) / 2];
      const radius: number = p.girth(centre[0]) / (2 * Math.PI);
      const h: (s: number, t: number) => number = (s: number, t: number): number => AutoMovieHumanRelief.height(r, s, t)[0];

      // The section frame is [forward, along the bone, lateral] with the
      // angle 0 forward and rising toward lateral, so the outward direction at
      // the centre's angle is (cos, 0, sin).
      const outward: number = r.axis[0] * Math.cos(centre[1]) + r.axis[2] * Math.sin(centre[1]);
      let edge: number = 0;
      let rise: number = 0;
      let steepest: number = 0;
      const n: number = 40;
      const delta: number = 0.01;
      for (let k: number = 0; k <= n; k++) {
        const s: number = r.stations[0] + ((r.stations[1] - r.stations[0]) * k) / n;
        const t: number = r.phases[0] + ((r.phases[1] - r.phases[0]) * k) / n;
        for (const [a, b] of [
          [r.stations[0], t],
          [r.stations[1], t],
          [s, r.phases[0]],
          [s, r.phases[1]],
        ] as [number, number][])
          edge = Math.max(edge, Math.abs(h(a, b)));
        rise = Math.max(rise, Math.abs(h(r.stations[0] + delta, t) - h(r.stations[0], t)) / delta, Math.abs(h(r.stations[1], t) - h(r.stations[1] - delta, t)) / delta);
        for (let j: number = 0; j < n; j++) {
          const u: number = r.phases[0] + ((r.phases[1] - r.phases[0]) * j) / n;
          const ds: number = (h(s + delta, u) - h(s - delta, u)) / (2 * delta);
          const dt: number = (h(s, u + delta / radius) - h(s, u - delta / radius)) / (2 * delta);
          steepest = Math.max(steepest, Math.abs(ds), Math.abs(dt));
        }
      }
      const peak: number = h(centre[0], centre[1]);
      const name: string = `leg relief ${r.name}`;
      return [
        { person: p.person, site: `${name}: outward height at its centre (axis along the outward normal), mm`, value: peak * outward, low: 0, high: Infinity, unit: "mm" },
        { person: p.person, site: `${name}: height at its window's edge, mm`, value: edge, low: 0, high: HumanLimbUnion.ROUNDING, unit: "mm" },
        { person: p.person, site: `${name}: rise across its window's edge, per mm`, value: rise, low: 0, high: HumanLimbUnion.EDGE, unit: "" },
        { person: p.person, site: `${name}: steepest rise over the base, per mm`, value: steepest, low: 0, high: HumanLimbUnion.STEEPEST, unit: "" },
      ];
    });
  }
}
