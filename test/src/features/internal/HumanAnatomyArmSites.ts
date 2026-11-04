import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IArm = HumanAnatomyShared.IArm;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The arm's sites, located on a skin by their published definitions: the tapes
 * at ANSUR II and ISO sites, the forearm's girth profile down to the least
 * girth before the knuckles, the thumb side of the wrist and the bone axis
 * inside its own section of skin.
 */
export namespace HumanAnatomyArmSites {
  /**
   * Locate an arm's sites at the bind.
   *
   * The joint centres only locate the sections; every girth is read on the
   * skin. A section that does not enclose the bone it was cut across reads NaN
   * and fails every row that depends on it.
   */
  export function armSites(skin: HumanAnatomy.ISkin, side: "left" | "right"): IArm {
    const shoulder: V3 = A.joint(skin, `${side}UpperArm`);
    const elbow: V3 = A.joint(skin, `${side}LowerArm`);
    const wrist: V3 = A.joint(skin, `${side}Hand`);
    const mcp: V3 = A.joint(skin, `${side}MiddleProximal`);
    const thumb: V3 = A.joint(skin, `${side}ThumbMetacarpal`);
    const upper: V3 = A.unit(A.sub(elbow, shoulder));
    const fore: V3 = A.unit(A.sub(wrist, elbow));
    const palm: V3 = A.unit(A.sub(mcp, wrist));
    const lf: number = A.dist(elbow, wrist);
    const region: Uint32Array = limb(skin, [shoulder, elbow, wrist, mcp]);

    // A section that does not enclose the bone it was cut across is no girth of
    // this limb: it reads NaN, and every site that depends on it fails with it.
    const girth: (o: V3, n: V3) => number = (o: V3, n: V3): number => {
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, n, o, region);
      return c === null || !c.contained ? NaN : c.girth;
    };

    // de Leva 1996 Table 2: the shoulder centre 34 mm below the acromion, the
    // wrist centre 1.5 mm distal of stylion; the olecranon at the elbow centre.
    const acromion: V3 = A.sub(shoulder, A.scale(upper, 34));
    const bicep: number = girth(A.lerp(acromion, elbow, 0.5), upper);
    const elbowGirth: number = girth(elbow, A.unit(A.add(upper, fore)));
    const stylion: V3 = A.sub(wrist, A.scale(fore, 1.5));

    // The forearm's girth from the elbow to stylion every 2 mm, and its relaxed
    // maximum from 0.1 to 0.6 of its length, where the belly lies.
    const forearmProfile: number[] = [];
    let forearm: number = 0;
    let belly: number = 0.3 * lf;
    for (let s: number = 0; s <= lf - 1.5; s += 2) {
      const g: number = girth(A.add(elbow, A.scale(fore, s)), fore);
      forearmProfile.push(g);
      if (s >= 0.1 * lf && s <= 0.6 * lf && !Number.isFinite(g)) forearm = NaN;
      if (s >= 0.1 * lf && s <= 0.6 * lf && g > forearm) {
        forearm = g;
        belly = s;
      }
    }
    const wristGirth: number = girth(stylion, fore);

    // Least girth from the forearm's belly to the knuckles, on a 1 mm grid
    // through stylion itself, so the section over stylion is one of those
    // compared: along the forearm to stylion, then along the hand.
    let narrowest: number = 0;
    let least: number = Infinity;
    const toStylion: number = lf - 1.5;
    for (let t: number = Math.ceil(belly - toStylion); t <= A.dist(wrist, mcp) * 0.6; t += 1) {
      const o: V3 = t <= 0 ? A.add(stylion, A.scale(fore, t)) : A.add(stylion, A.scale(palm, t));
      const g: number = girth(o, t <= 0 ? fore : palm);
      if (!Number.isFinite(g)) {
        least = NaN;
        narrowest = NaN;
        break;
      }
      if (g < least) {
        least = g;
        narrowest = t;
      }
    }

    // The thumb side: the section's reach toward the thumb, stylion -40 to +10 mm,
    // and how far each station bulges over the chord of its neighbours 5 mm either side.
    const radial: V3 = A.unit(A.reject(A.sub(thumb, wrist), fore));
    const reach: number[] = [];
    for (let s: number = -45; s <= 15; s += 1) {
      const o: V3 = A.add(stylion, A.scale(fore, s));
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, fore, o, region);
      reach.push(c === null || !c.contained ? NaN : Math.max(...c.points.map((p: V3): number => A.dot(A.sub(p, o), radial))));
    }
    let radialBulge: number = 0;
    for (let i: number = 5; i + 5 < reach.length; i++) radialBulge = Math.max(radialBulge, reach[i]! - (reach[i - 5]! + reach[i + 5]!) / 2);

    // The bone axis through a joint or a limb's middle must lie inside its own section of skin.
    const off: (o: V3, n: V3) => number = (o: V3, n: V3): number => A.cut(skin, o, n, o, region)?.outside ?? NaN;
    return {
      bicep,
      elbow: elbowGirth,
      forearm,
      wrist: wristGirth,
      forearmProfile,
      narrowest,
      least,
      radialBulge,
      outside: {
        elbow: off(elbow, A.unit(A.add(upper, fore))),
        wrist: off(wrist, fore),
        "mid-forearm": off(A.lerp(elbow, wrist, 0.5), fore),
        "mid-upper-arm": off(A.lerp(shoulder, elbow, 0.5), upper),
      },
    };
  }

  /**
   * Triangles within reach of a limb's bone polyline. The limb bends at its
   * joints, so a radius about the straight line from its root to its end
   * leaves out the outer side of a bent elbow and cuts its sections open.
   */
  export function limb(skin: HumanAnatomy.ISkin, bones: V3[]): Uint32Array {
    const keep: Set<number> = new Set();
    for (let i: number = 0; i + 1 < bones.length; i++) for (const t of A.near(skin, bones[i]!, bones[i + 1]!, REACH)) keep.add(t);
    return Uint32Array.from([...keep].sort((a: number, b: number): number => a - b));
  }

  /**
   * Reach of a limb's skin from its bone, mm: the radius of the largest upper
   * arm circumference the identity admits (800 mm, so 127 mm) with margin. A
   * section picks the component enclosing its bone, so the trunk inside this
   * reach stays out of it.
   */
  export const REACH: number = 150;
}
