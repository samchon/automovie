import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyLegFold } from "./HumanAnatomyLegFold";
import { HumanAnatomyLegPatella } from "./HumanAnatomyLegPatella";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type ILeg = HumanAnatomyShared.ILeg;
const A: typeof HumanAnatomy = HumanAnatomy;
const { band }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The leg's sites, located on a skin by their published definitions: the
 * levels they are sought from, the thigh, knee and calf tapes, the shank's
 * girth profile and the bone axis inside its own section of skin.
 */
export namespace HumanAnatomyLegSites {
  /** Fractions of the thigh and of the shank at which the bone axis must lie inside the skin's section. */
  export const STATIONS: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  /** The heights a leg's sites are sought from. */
  export interface ILevels {
    /** Crotch height: the lowest point of the midline between the legs, mm. */
    crotch: number;

    /** Stature as the skin's highest point, mm. */
    vertex: number;
  }

  /**
   * Crotch height: the lowest midline skin between the legs above 0.3 S and below the hip joint, mm.
   *
   * @throws {Error} When no midline skin lies in that band, so no thigh site can be sought from it.
   */
  export function crotchHeight(skin: HumanAnatomy.ISkin, S: number): number {
    const hip: V3 = A.joint(skin, "hips");
    let crotch: number = Infinity;

    for (const line of A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.3 * S, hip[1])))
      for (const p of line.points) if (p[1] > 0.3 * S && p[1] < hip[1]) crotch = Math.min(crotch, p[1]);

    // An infinite crotch height would make the thigh scan below it run forever.
    if (!Number.isFinite(crotch)) throw new Error(`${skin.name} has no midline skin between the legs from 0.3 S to the hip joint`);
    return crotch;
  }

  /** The skin's highest point, mm. */
  export function vertexHeight(skin: HumanAnatomy.ISkin): number {
    let vertex: number = -Infinity;
    for (let v: number = 1; v < skin.P.length; v += 3) vertex = Math.max(vertex, skin.P[v]!);
    return vertex;
  }

  /** Locate a leg's sites at the bind. */
  export function legSites(skin: HumanAnatomy.ISkin, side: "left" | "right", t: ILevels): ILeg {
    const hip: V3 = A.joint(skin, `${side}UpperLeg`);
    const knee: V3 = A.joint(skin, `${side}LowerLeg`);
    const ankle: V3 = A.joint(skin, `${side}Foot`);
    const thighAxis: V3 = A.unit(A.sub(knee, hip));
    const shankAxis: V3 = A.unit(A.sub(ankle, knee));

    // The bone axis through a height: the thigh's above the knee, the shank's below.
    const axisAt: (y: number) => V3 = (y: number): V3 =>
      y >= knee[1] ? A.lerp(hip, knee, (hip[1] - y) / (hip[1] - knee[1])) : A.lerp(knee, ankle, (knee[1] - y) / (knee[1] - ankle[1]));
    const horizontal: (y: number) => HumanAnatomy.ICut | null = (y: number): HumanAnatomy.ICut | null =>
      A.cut(skin, [0, y, 0], [0, 1, 0], axisAt(y), band(skin, y - 1, y + 1));

    // Thigh: ISO 8559-1 thigh girth, the maximum horizontal girth of the thigh
    // below the gluteal fold, read from 10 mm under the fold down 0.1 S. The
    // thighs part at the crotch, so a fold above it starts the scan there: a
    // section above the crotch holds both thighs.
    const fold: number = Math.min(HumanAnatomyLegFold.height(skin, side, t.crotch), t.crotch);
    let thigh: number = 0;
    for (let y: number = fold - 10; y >= fold - 0.1 * t.vertex; y -= 2) {
      const c: HumanAnatomy.ICut | null = horizontal(y);
      if (c !== null && c.girth > thigh) thigh = c.girth;
    }
    const kneeCut: HumanAnatomy.ICut | null = horizontal(HumanAnatomyLegPatella.patellaHeight(skin, knee));

    // Calf: ANSUR II maximum horizontal girth, sought over the gastrocnemius'
    // belly, 0.15 to 0.6 of the shank below the knee. The shank profile runs
    // from the knee to the least girth above the ankle.
    const shank: number = knee[1] - ankle[1];
    const shankProfile: number[] = [];
    let calf: number = 0;
    for (let y: number = knee[1]; y >= ankle[1] + 20; y -= 2) {
      const c: HumanAnatomy.ICut | null = horizontal(y);
      const g: number = c === null ? NaN : c.girth;
      shankProfile.push(g);
      if (y <= knee[1] - 0.15 * shank && y >= knee[1] - 0.6 * shank && g > calf) calf = g;
    }
    let lowest: number = shankProfile.length - 1;
    for (let i: number = 0; i < shankProfile.length; i++) if (shankProfile[i]! < shankProfile[lowest]!) lowest = i;

    // The bone axis must lie inside the skin's own section across it, read at
    // the knee and at every tenth of the thigh and of the shank.
    const near: Uint32Array = A.near(skin, hip, ankle, 150);
    const off: (o: V3, n: V3) => number = (o: V3, n: V3): number => A.cut(skin, o, n, o, near)?.outside ?? NaN;
    const outside: Record<string, number> = { knee: off(knee, A.unit(A.add(thighAxis, shankAxis))) };
    for (const f of STATIONS) {
      outside[`thigh's ${f.toFixed(1)}`] = off(A.lerp(hip, knee, f), thighAxis);
      outside[`shank's ${f.toFixed(1)}`] = off(A.lerp(knee, ankle, f), shankAxis);
    }
    return {
      thigh,
      knee: kneeCut === null ? NaN : kneeCut.girth,
      calf,
      shankProfile: shankProfile.slice(0, lowest + 1),
      outside,
    };
  }
}
