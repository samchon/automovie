import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyCourseLandmarks } from "../HumanAnatomyCourseLandmarks";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type Side = "left" | "right";
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The outline a viewer sees of the shoulders from the front and of the
 * buttocks from the side, read from every skin vertex of one half of the
 * body in 2 mm bins, so a plate or a lump the frames show is a number.
 *
 * Shoulder (PLT-SH-1, PLT-SH-2, on the anatomical neutral, arms hanging): the
 * shoulder point (`HumanAnatomyCourseLandmarks.shoulderPoint`, the skin over
 * the shoulder joint) is the top of the shoulder's lateral run, and lateral
 * of it the deltoid only falls (Gray 1918), so no skin lateral of it stands
 * above it; and from the deltoid's widest level, at or below the joint centre,
 * the frontal half width only narrows up to the neck, because the deltoid
 * cap and the trapezius round in above it, so the half width never widens
 * again going up.
 *
 * Buttock (LUMP-BT-3, LUMP-BT-4, on the bind): the side view's rearmost outline
 * of one half body has one buttock maximum between 0.04 S below and 0.08 S
 * above the hip joint, falling to the lumbar hollow above it and toward the gluteal
 * fold below it; any rise of the outline away from that maximum is a lump.
 *
 * Every bound is the crease sagitta (`HumanAnatomyShared.CREASE`), the
 * smallest relief that reads on skin.
 */
export namespace HumanCurveSilhouette {
  /** Bin height of the outlines, mm. */
  export const BIN: number = 2;

  /**
   * Both rows of one shoulder.
   *
   * @param person Name in findings.
   * @param skin The skin at the anatomical neutral.
   * @param S Stature, mm.
   * @param side The shoulder.
   */
  export function shoulder(person: string, skin: HumanAnatomy.ISkin, S: number, side: Side): IRow[] {
    const s: number = side === "left" ? 1 : -1;
    const joint: V3 = A.joint(skin, `${side}UpperArm`);
    const neck: V3 = A.joint(skin, "neck");
    const point: V3 | null = HumanAnatomyCourseLandmarks.shoulderPoint(skin, side);
    const box: (p: V3) => boolean = (p: V3): boolean => Math.abs(p[0] - joint[0]) < 0.08 * S && p[1] > joint[1] - 0.1 * S && p[1] < neck[1] && s * p[2] > 0;
    const points: V3[] = vertices(skin).filter(box);

    // The highest skin lateral of the shoulder point, 2 mm clear of it.
    let above: number = NaN;
    if (point !== null) {
      above = -Infinity;
      for (const p of points) if (s * (p[2] - point[2]) >= BIN && p[1] - point[1] > above) above = p[1] - point[1];
    }

    // The frontal half width by height, and its widening going up from the
    // deltoid's widest level at or below the joint centre.
    const width: Map<number, number> = new Map();
    for (const p of points) {
      const k: number = Math.floor(p[1] / BIN);
      width.set(k, Math.max(width.get(k) ?? -Infinity, s * p[2]));
    }
    const low: number = Math.floor((joint[1] - 0.08 * S) / BIN);
    const top: number = Math.floor(neck[1] / BIN);
    let widest: number = low;
    for (let k: number = low; k <= Math.floor(joint[1] / BIN); k++) if ((width.get(k) ?? -Infinity) > (width.get(widest) ?? -Infinity)) widest = k;
    let least: number = width.get(widest) ?? NaN;
    let widening: number = 0;
    let at: number = NaN;
    for (let k: number = widest + 1; k <= top; k++) {
      const w: number | undefined = width.get(k);
      if (w === undefined) continue;
      if (w - least > widening) [widening, at] = [w - least, k * BIN];
      least = Math.min(least, w);
    }
    return [
      { person, site: `${side} shoulder (${side === "left" ? "PLT-SH-1" : "PLT-SH-2"}): highest skin lateral of the shoulder point, above it, at the neutral, mm`, value: above, low: -Infinity, high: HumanAnatomyShared.CREASE, unit: "mm" },
      { person, site: `${side} shoulder (${side === "left" ? "PLT-SH-1" : "PLT-SH-2"}): frontal half width widening above the deltoid's widest level ${(widest * BIN).toFixed(0)}, at height ${at.toFixed(0)}, at the neutral, mm`, value: widening, low: -Infinity, high: HumanAnatomyShared.CREASE, unit: "mm" },
    ];
  }

  /**
   * The side outline row of one buttock.
   *
   * @param person Name in findings.
   * @param skin The bind skin.
   * @param S Stature, mm.
   * @param side The buttock.
   */
  export function buttock(person: string, skin: HumanAnatomy.ISkin, S: number, side: Side): IRow {
    const s: number = side === "left" ? 1 : -1;
    const hip: V3 = A.joint(skin, `${side}UpperLeg`);
    const chains: RegExp = new RegExp(`^(trunk|leg\\.${side})$`);

    // The rearmost reach behind the hip joint by height, trunk and own leg only.
    const rear: Map<number, number> = new Map();
    for (let t: number = 0; t < skin.I.length / 3; t++) {
      if (!chains.test(skin.chains[skin.tri[t]!]!)) continue;
      for (let j: number = 0; j < 3; j++) {
        const p: V3 = A.point(skin, skin.I[3 * t + j]!);
        if (s * p[2] <= 0 || p[1] - hip[1] < -0.04 * S || p[1] - hip[1] > 0.08 * S) continue;
        const k: number = Math.floor(p[1] / BIN);
        rear.set(k, Math.max(rear.get(k) ?? -Infinity, hip[0] - p[0]));
      }
    }
    const keys: number[] = [...rear.keys()].sort((a: number, b: number): number => a - b);
    if (keys.length === 0) return { person, site: `${side} buttock side outline: no skin behind the hip joint`, value: NaN, low: -Infinity, high: HumanAnatomyShared.CREASE, unit: "mm" };
    const apex: number = keys.reduce((m: number, k: number): number => (rear.get(k)! > rear.get(m)! ? k : m), keys[0]!);

    // From the apex outward each way the outline only comes forward.
    let rise: number = 0;
    let at: number = NaN;
    for (const run of [keys.filter((k: number): boolean => k > apex), keys.filter((k: number): boolean => k < apex).reverse()]) {
      let least: number = rear.get(apex)!;
      for (const k of run) {
        const r: number = rear.get(k)!;
        if (r - least > rise) [rise, at] = [r - least, k * BIN];
        least = Math.min(least, r);
      }
    }
    return {
      person,
      site: `${side} buttock (${side === "left" ? "LUMP-BT-3" : "LUMP-BT-4"}): side outline's rise behind its forward run from the rearmost point at ${(apex * BIN - hip[1]).toFixed(0)} mm from the hip joint, at height ${at.toFixed(0)}, mm`,
      value: rise,
      low: -Infinity,
      high: HumanAnatomyShared.CREASE,
      unit: "mm",
    };
  }

  /** Every vertex of a skin. */
  function vertices(skin: HumanAnatomy.ISkin): V3[] {
    const out: V3[] = [];
    for (let v: number = 0; v < skin.P.length / 3; v++) out.push(A.point(skin, v));
    return out;
  }
}
