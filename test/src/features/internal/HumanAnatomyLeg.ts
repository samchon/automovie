import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type ITrunk = HumanAnatomyShared.ITrunk;
type ILeg = HumanAnatomyShared.ILeg;
const A = HumanAnatomy;
const { SIDES, LARGE, SMALL, identity, ratio, extent, extraTurns, band, breadth } = HumanAnatomyShared;
const { trunkSites } = HumanAnatomyTrunk;

/** The leg audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyLeg {
  /** Fractions of the thigh and of the shank at which the bone axis must lie inside the skin's section. */
  export const STATIONS: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  /** The legs: tapes at ANSUR II and ISO sites, the shank's girth profile and the bone inside the skin. */
  export function leg(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const c = subject.params.body.controls;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = c.height.value!;
    const levels: ILevels = { crotch: crotchHeight(skin, S), vertex: vertexHeight(skin) };
    for (const side of SIDES) {
      const l: ILeg = legSites(skin, side, levels);
      if (c.thigh.value !== null)
        rows.push(identity(name, `${side} thigh girth, horizontal maximum just below the crotch, mm`, l.thigh, c.thigh.value, LARGE));
      if (c.knee.value !== null)
        rows.push(identity(name, `${side} knee girth at mid-patella, mm`, l.knee, c.knee.value, SMALL));
      if (c.calf.value !== null)
        rows.push(identity(name, `${side} calf girth, horizontal maximum, mm`, l.calf, c.calf.value, SMALL));
      rows.push({
        person: name,
        site: `${side} shank girth, knee to ankle: maxima past the first deeper than a small-girth error`,
        value: extraTurns(l.shankProfile.map((g: number): number => -g), SMALL),
        low: 0,
        high: 0,
        unit: "turns",
      });
      // ANSUR II means (women, men): ankle 215.7, 229.3; calf 373.3, 392.3;
      // thigh at the gluteal furrow 616.1, 625.1, which the thigh's top just
      // below the crotch stands for. Each ratio's spread is bounded from the
      // two girths' coefficients of variation taken as uncorrelated, 2.326 SD
      // either side of each sex's ratio of means, the wider sex's end on each
      // side: 0.578 and 0.585, 0.606 and 0.628.
      const ankle: number = l.shankProfile[l.shankProfile.length - 1]!;
      rows.push(ratio(name, `${side} least ankle girth / calf girth`, ankle / l.calf, 0.439, 0.719));
      rows.push(ratio(name, `${side} calf girth / thigh girth`, l.calf / l.thigh, 0.439, 0.803));
      for (const [where, off] of Object.entries(l.outside))
        rows.push({
          person: name,
          site: `${side} leg's bone axis at the ${where} outside its own section of skin, mm`,
          value: off,
          low: 0,
          high: 0,
          unit: "mm",
        });
    }
    // Bideltoid over hip breadth, standing with the arms hanging: a captured
    // body stands in its own pose, its arms not hanging, so it is read only on
    // a subject straightened to the anatomical neutral.
    if (subject.straightened) {
      const neutral: HumanAnatomy.ISkin = subject.neutral();
      const site: string = "bideltoid / hip breadth, arms hanging";
      try {
        const nt: ITrunk = trunkSites(neutral, S);
        const shoulder: number = (A.joint(neutral, "leftUpperArm")[1] + A.joint(neutral, "rightUpperArm")[1]) / 2;
        const bideltoid: number = breadth(neutral, shoulder - 0.08 * S, shoulder + 0.02 * S);
        rows.push(ratio(name, site, bideltoid / extent(nt.hip.points, 2), 1.111, 1.647));
      } catch (error) {
        rows.push(ratio(name, `${site}: trunk sites not found, ${(error as Error).message}`, NaN, 1.111, 1.647));
      }
    }
    return rows;
  }

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
    const axisAt = (y: number): V3 =>
      y >= knee[1] ? A.lerp(hip, knee, (hip[1] - y) / (hip[1] - knee[1])) : A.lerp(knee, ankle, (knee[1] - y) / (knee[1] - ankle[1]));
    const horizontal = (y: number): HumanAnatomy.ICut | null => A.cut(skin, [0, y, 0], [0, 1, 0], axisAt(y), band(skin, y - 1, y + 1));
    // Thigh: ISO 8559-1 thigh girth, the maximum horizontal girth of the thigh
    // just below the crotch, read from 10 mm under it down 0.1 S.
    let thigh: number = 0;
    for (let y: number = t.crotch - 10; y >= t.crotch - 0.1 * t.vertex; y -= 2) {
      const c: HumanAnatomy.ICut | null = horizontal(y);
      if (c !== null && c.girth > thigh) thigh = c.girth;
    }
    const kneeCut: HumanAnatomy.ICut | null = horizontal(patellaHeight(skin, knee));
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
    const near: Uint32Array = A.near(skin, hip, ankle, 150);
    const off = (o: V3, n: V3): number => A.cut(skin, o, n, o, near)?.outside ?? NaN;
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

  /**
   * Mid-patella height: the most forward-convex point of the knee's anterior
   * profile in the sagittal plane through the knee joint, the patella standing
   * proud between the quadriceps tendon above and the patellar tendon below.
   * Sought from 20 mm above the joint centre, which stands at the femoral
   * epicondyles, to 60 mm below it: ANSUR II puts mid-patella 16.9 mm (women)
   * and 3.3 mm (men) below the lateral femoral epicondyle and 11.2 and 20.2 mm
   * above tibiale on average. Convexity is the profile's sagitta over a 12 mm
   * chord, read every 2 mm.
   */
  export function patellaHeight(skin: HumanAnatomy.ISkin, knee: V3): number {
    const lines = A.polylines(skin, knee, [0, 0, 1], A.near(skin, A.add(knee, [0, 100, 0]), A.add(knee, [0, -100, 0]), 120));
    const front = (y: number): number => {
      let x: number = -Infinity;
      for (const l of lines)
        for (let i: number = 0; i + 1 < l.points.length; i++) {
          const a: V3 = l.points[i]!;
          const b: V3 = l.points[i + 1]!;
          if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
          const at: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
          if (at > knee[0]) x = Math.max(x, at);
        }
      return x;
    };
    let best: number = knee[1];
    let sharpest: number = Infinity;
    for (let y: number = knee[1] + 20; y >= knee[1] - 60; y -= 2) {
      const bend: number = front(y + 6) + front(y - 6) - 2 * front(y);
      if (Number.isFinite(bend) && bend < sharpest) {
        sharpest = bend;
        best = y;
      }
    }
    return best;
  }
}
