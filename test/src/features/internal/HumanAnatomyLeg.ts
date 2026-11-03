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
  /** The legs: tapes at ANSUR II and ISO sites and the shank's girth profile. */
  export function leg(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const c = subject.params.body.controls;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = c.height.value!;
    const t: ITrunk = trunkSites(skin, S);
    for (const side of SIDES) {
      const l: ILeg = legSites(skin, side, t);
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
    // Bideltoid over hip breadth, standing with the arms hanging.
    const neutral: HumanAnatomy.ISkin = subject.neutral();
    const nt: ITrunk = trunkSites(neutral, S);
    const shoulder: number = (A.joint(neutral, "leftUpperArm")[1] + A.joint(neutral, "rightUpperArm")[1]) / 2;
    const bideltoid: number = breadth(neutral, shoulder - 0.08 * S, shoulder + 0.02 * S);
    rows.push(ratio(name, "bideltoid / hip breadth, arms hanging", bideltoid / extent(nt.hip.points, 2), 1.111, 1.647));
    return rows;
  }

  /** Locate a leg's sites at the bind. */
  export function legSites(skin: HumanAnatomy.ISkin, side: "left" | "right", t: ITrunk): ILeg {
    const hip: V3 = A.joint(skin, `${side}UpperLeg`);
    const knee: V3 = A.joint(skin, `${side}LowerLeg`);
    const ankle: V3 = A.joint(skin, `${side}Foot`);
    const thighAxis: V3 = A.unit(A.sub(knee, hip));
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
    // Mid-patella: the knee front's local prominence over the leg's axis nearest
    // the joint within 40 mm; a knee without one is read at the joint centre.
    const fronts: { y: number; x: number }[] = [];
    for (let y: number = knee[1] - 45; y <= knee[1] + 45; y += 1) {
      const c: HumanAnatomy.ICut | null = horizontal(y);
      if (c !== null) fronts.push({ y, x: Math.max(...c.points.map((p: V3): number => p[0])) - axisAt(y)[0] });
    }
    let patella: number = knee[1];
    let nearest: number = Infinity;
    for (let i: number = 5; i + 5 < fronts.length; i++) {
      const f = fronts[i]!;
      if (f.x > fronts[i - 5]!.x && f.x > fronts[i + 5]!.x && Math.abs(f.y - knee[1]) < nearest) {
        nearest = Math.abs(f.y - knee[1]);
        patella = f.y;
      }
    }
    const kneeCut: HumanAnatomy.ICut | null = horizontal(patella);
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
    const off = (o: V3, n: V3): number => A.cut(skin, o, n, o, A.near(skin, hip, ankle, 150))?.outside ?? NaN;
    return {
      thigh,
      knee: kneeCut === null ? NaN : kneeCut.girth,
      calf,
      shankProfile: shankProfile.slice(0, lowest + 1),
      outside: {
        knee: off(knee, A.unit(A.add(thighAxis, A.unit(A.sub(ankle, knee))))),
        "mid-thigh": off(A.lerp(hip, knee, 0.5), thighAxis),
        "mid-shank": off(A.lerp(knee, ankle, 0.5), A.unit(A.sub(ankle, knee))),
      },
    };
  }

}
