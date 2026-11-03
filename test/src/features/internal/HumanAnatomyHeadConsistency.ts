import { HumanInputs } from "./HumanInputs";
import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import type { HumanAnatomyHeadEar } from "./HumanAnatomyHeadEar";
import type { HumanAnatomyHeadSites } from "./HumanAnatomyHeadSites";
import { HumanAnatomyProfile } from "./HumanAnatomyProfile";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanHeadSitesSingleton } from "./HumanHeadSitesSingleton";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISites = HumanAnatomyHeadSites.ISites;
type IMedian = ISites["median"];

/**
 * Logical consistency of a head: relations between its landmarks and
 * breadths that no human head breaks, whatever its inputs, so a violation is a
 * contradiction in the shape and not a miss of any one input. Every row is a
 * margin that must be zero or more, or a ratio inside the span of the cited
 * adult samples. No expectation is read from a reference body or from the
 * construction's constants.
 *
 * The rows are named by the piece or seam they test (landmark skeleton, face
 * breadths, auricle), so a failure says where to look.
 */
export namespace HumanAnatomyHeadConsistency {
  /**
   * The consistency rows of one subject's head.
   *
   * @param subject Skin and public inputs to audit.
   */
  export function rows(subject: HumanAnatomyAudit.ISubject): IRow[] {
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = HumanInputs.stature(subject.params);
    const f: ISites = HumanHeadSitesSingleton.get(skin, S, subject.mouth);

    return [
      ...landmarks(subject.name, f.median, f),
      ...nose(subject.name, f),
      ...breadths(subject.name, f),
      ...auricles(subject.name, f),
    ];
  }

  /**
   * Median profile (piece 3), read through the middle of the face: from
   * subnasale up to glabella the profile goes forward to the nose tip and back
   * to the nasal root and forward again to the brow, whatever the person's nose,
   * so its forward position has one maximum, the tip, and one minimum, the root,
   * each standing out by at least 0.8 mm (above the profile's 0.5 mm sampling
   * step, under the 1.1 to 2.6 mm the four reference noses show at their roots). A profile with no
   * nasal root, a second tip or a wobble fails the count.
   */
  function nose(name: string, f: ISites): IRow[] {
    const path: V3[] = f.profile.up.slice(f.profile.subnasale, f.profile.glabella + 1);
    const forward: number[] = path.map((p: V3): number => p[0]);
    const turns: HumanAnatomyProfile.ITurn[] = HumanAnatomyProfile.turns(forward, 0.8);
    const kinds: string = turns.map((t: HumanAnatomyProfile.ITurn): string => t.kind).join(",");

    return [
      {
        person: name,
        site: "median profile: turns between subnasale and glabella, tip then nasal root (0 when so, else 1)",
        value: kinds === "max,min" ? 0 : 1,
        low: 0,
        high: 0,
        unit: "",
      },
      {
        person: name,
        site: "median profile: number of turns between subnasale and glabella",
        value: turns.length,
        low: 2,
        high: 2,
        unit: "",
      },
    ];
  }

  /**
   * Landmark skeleton (piece 1): the landmarks stand in the order Farkas and
   * FaceBase define them. Down the face the vertex, glabella, nasion,
   * subnasale, the lips, the chin and menton follow one another; the nose tip
   * stands past the lips and the chin; the back of the vault is behind the
   * ear, and the ear is behind the eye.
   */
  function landmarks(name: string, m: IMedian, f: ISites): IRow[] {
    const rows: IRow[] = [];
    const down: [string, V3, V3][] = [
      ["vertex over glabella", m.vertex, m.glabella],
      ["glabella over nasion", m.glabella, m.nasion],
      ["nasion over pronasale", m.nasion, m.pronasale],
      ["pronasale over subnasale", m.pronasale, m.subnasale],
      ["subnasale over labrale superius", m.subnasale, m.labraleSuperius],
      ["labrale superius over stomion", m.labraleSuperius, m.stomion],
      ["stomion over labrale inferius", m.stomion, m.labraleInferius],
      ["labrale inferius over sublabiale", m.labraleInferius, m.sublabiale],
      ["sublabiale over pogonion", m.sublabiale, m.pogonion],
      ["pogonion over gnathion", m.pogonion, m.gnathion],
      ["gnathion over menton", m.gnathion, m.menton],
    ];

    for (const [label, upper, lower] of down) rows.push(margin(name, `landmark order, vertical: ${label}, mm`, upper[1] - lower[1]));

    // The eye corners lie between the brow and the nose tip.
    for (const side of HumanAnatomyShared.SIDES) {
      const en: V3 = f.canthi[side].en;

      rows.push(margin(name, `landmark order, vertical: glabella over ${side} endocanthion, mm`, m.glabella[1] - en[1]));
      rows.push(margin(name, `landmark order, vertical: ${side} endocanthion over pronasale, mm`, en[1] - m.pronasale[1]));
    }

    const past: [string, V3][] = [
      ["glabella", m.glabella],
      ["labrale superius", m.labraleSuperius],
      ["labrale inferius", m.labraleInferius],
      ["pogonion", m.pogonion],
      ["gnathion", m.gnathion],
    ];

    for (const [label, point] of past)
      rows.push(margin(name, `landmark order, anterior: pronasale ahead of ${label}, mm`, m.pronasale[0] - point[0]));

    // The nasal root lies behind the brow and the tip ahead of the base.
    rows.push(margin(name, "landmark order, anterior: glabella ahead of nasion, mm", m.glabella[0] - m.nasion[0]));
    rows.push(margin(name, "landmark order, anterior: pronasale ahead of subnasale, mm", m.pronasale[0] - m.subnasale[0]));

    // Back of the vault, ear, eye: front to back along the head.
    for (const side of HumanAnatomyShared.SIDES) {
      rows.push(margin(name, `landmark order, anterior: ${side} tragion ahead of opisthocranion, mm`, f.ears[side].tragion[0] - m.opisthocranion[0]));
      rows.push(margin(name, `landmark order, anterior: ${side} exocanthion ahead of tragion, mm`, f.canthi[side].ex[0] - f.ears[side].tragion[0]));
    }
    return rows;
  }

  /**
   * Face breadths (pieces 2, 10 and 24): the mouth lies inside the jaw's width
   * and the jaw inside the face's; the eye corners are in order and inside the
   * face; the face is not much wider than the cranium; the nose is narrower
   * than the mouth; the face's height is no longer than a path through
   * subnasale or stomion; and the head's circumference is no shorter than a
   * tape pulled straight along its length and back.
   */
  function breadths(name: string, f: ISites): IRow[] {
    const rows: IRow[] = [];
    const m: IMedian = f.median;
    const dist: (a: V3, b: V3) => number = (a: V3, b: V3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const outer: number = dist(f.canthi.left.ex, f.canthi.right.ex);

    rows.push(margin(name, "face breadths: mandibular width over mouth width, mm", f.mandibular - f.mouthWidth));
    rows.push(margin(name, "face breadths: face width over mandibular width, mm", f.faceWidth - f.mandibular));
    rows.push(margin(name, "face breadths: face width over outer canthal width, mm", f.faceWidth - outer));
    rows.push(margin(name, "face breadths: outer canthal width over intercanthal width, mm", outer - f.intercanthal));

    // Population span of face width over head breadth: the lowest sample mean
    // less 2.326 SD to the highest mean plus 2.326 SD (Weinberg 2016, Du 2008).
    rows.push(HumanAnatomyShared.ratio(name, "face breadths: face width over head breadth", f.faceWidth / f.breadth, 0.78, 1.04));

    // Population span of nasal width over mouth width (Weinberg 2016, Virdi 2019).
    rows.push(HumanAnatomyShared.ratio(name, "face breadths: nasal width over mouth width", f.noseWidth / f.mouthWidth, 0.46, 1.0));

    rows.push(margin(name, "face breadths: palpebral fissure length over its height, left, mm", f.fissure.left.length - f.fissure.left.height));
    rows.push(margin(name, "face breadths: palpebral fissure length over its height, right, mm", f.fissure.right.length - f.fissure.right.height));

    // Triangle inequality of the face's height through the landmarks between.
    rows.push(margin(name, "face breadths: nasal height plus sn-gn over n-gn, mm", dist(m.nasion, m.subnasale) + dist(m.subnasale, m.gnathion) - f.faceHeight));
    rows.push(margin(name, "face breadths: n-sto plus sto-gn over n-gn, mm", dist(m.nasion, m.stomion) + dist(m.stomion, m.gnathion) - f.faceHeight));

    // A closed curve through two points is at least twice as long as their distance.
    rows.push(margin(name, "face breadths: head circumference over twice the head length, mm", f.circumference - 2 * f.length));
    return rows;
  }

  /**
   * Auricle (pieces 27 to 31): the ear is longer than broad, and its long axis
   * leans back from the vertical, the top behind the lobe (Banks and Cheney).
   */
  function auricles(name: string, f: ISites): IRow[] {
    const rows: IRow[] = [];

    for (const side of HumanAnatomyShared.SIDES) {
      const ear: HumanAnatomyHeadEar.IEar = f.ears[side];

      rows.push(margin(name, `auricle: ${side} ear length over breadth, mm`, ear.length - ear.breadth));
      rows.push(margin(name, `auricle: ${side} ear top behind its lobe, mm`, ear.subaurale[0] - ear.superaurale[0]));
      rows.push(margin(name, `auricle: ${side} superaurale over exocanthion, mm`, ear.superaurale[1] - f.canthi[side].ex[1]));
      rows.push(margin(name, `auricle: ${side} exocanthion over subaurale, mm`, f.canthi[side].ex[1] - ear.subaurale[1]));
      rows.push(margin(name, `auricle: ${side} subaurale over menton, mm`, ear.subaurale[1] - f.median.menton[1]));
    }
    return rows;
  }

  /** A margin that must be zero or more. */
  function margin(person: string, site: string, value: number): IRow {
    return { person, site, value, low: 0, high: Infinity, unit: "mm" };
  }
}
