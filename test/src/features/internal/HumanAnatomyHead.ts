import { HumanInputs } from "./HumanInputs";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import type { HumanAnatomyHeadEar } from "./HumanAnatomyHeadEar";
import { HumanAnatomyHeadGeometry } from "./HumanAnatomyHeadGeometry";
import { HumanAnatomyHeadSites } from "./HumanAnatomyHeadSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
const SIDES: typeof HumanAnatomyShared.SIDES = HumanAnatomyShared.SIDES;
const HEAD: typeof HumanAnatomyShared.HEAD = HumanAnatomyShared.HEAD;
const ratio: typeof HumanAnatomyShared.ratio = HumanAnatomyShared.ratio;

/**
 * The head audit: the rows that compare the head, face and ears of a skin with
 * the public head inputs and with published population proportions. The sites
 * themselves are located by the `HumanAnatomyHead*` pieces.
 */
export namespace HumanAnatomyHead {
  /** The face's measures and the landmarks they are taken between. */
  export type ISites = HumanAnatomyHeadSites.ISites;

  /**
   * The head and face: head and face dimensions at their Farkas, FaceBase and
   * ISO 7250-1 landmarks, the ears, the closed mouth, and population
   * proportions and profile angles.
   */
  export function head(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = HumanInputs.stature(p);
    const f: ISites = faceSites(skin, S, subject.mouth);
    const h: IAutoMovieHumanParameters["head"] = p.head;
    const id: (site: string, value: number, input: number) => void = (site: string, value: number, input: number): void => {
      rows.push(HumanAnatomyShared.identity(name, site, value, input, HEAD));
    };

    id("head length, glabella to opisthocranion, mm", f.length, h.length);
    id("head breadth, eurion to eurion, mm", f.breadth, (h.length * h.cephalicIndex) / 100);
    id("head height, menton to vertex, mm", f.height, h.height);
    id("face height, nasion to gnathion, mm", f.faceHeight, h.faceHeight);
    id("face width, zygion to zygion, mm", f.faceWidth, h.faceWidth);
    id("mandibular width, gonion to gonion, mm", f.mandibular, h.mandibularWidth);
    rows.push(
      HumanAnatomyShared.identity(
        name,
        "head circumference over glabella and opisthocranion, mm",
        f.circumference,
        h.circumference,
        HumanAnatomyShared.SMALL,
      ),
    );
    id("intercanthal width, en to en, mm", f.intercanthal, h.face.intercanthalWidth);

    for (const side of SIDES) {
      id(`${side} palpebral fissure length, en to ex, mm`, f.fissure[side].length, h.face.eyePair[side].palpebralFissureLength);
      id(`${side} palpebral fissure height at the pupil, mm`, f.fissure[side].height, h.face.eyePair[side].palpebralFissureHeight);
    }

    id("nasal width, al to al, mm", f.noseWidth, h.face.nose.width);
    id("nasal height, n to sn, mm", f.noseHeight, h.face.nose.height);
    id("nasal protrusion, sn to prn, mm", f.noseProtrusion, h.face.nose.protrusion);
    id("mouth width, ch to ch, mm", f.mouthWidth, h.face.mouth.width);
    id("upper vermilion height, ls to sto, mm", f.upperVermilion, h.face.mouth.upperVermilionHeight);
    id("lower vermilion height, sto to li, mm", f.lowerVermilion, h.face.mouth.lowerVermilionHeight);

    for (const side of SIDES) {
      const ear: HumanAnatomyHeadEar.IEar = f.ears[side];

      id(`${side} ear length, sa to sba, mm`, ear.length, h.earPair[side].length);
      id(`${side} ear breadth, perpendicular to the long axis, mm`, ear.breadth, h.earPair[side].breadth);
      id(`${side} ear protrusion at the tragus' level, mm`, ear.protrusion, h.earPair[side].protrusion);
    }

    // The documented mouth is closed at rest: no gap, and no tooth in sight.
    rows.push({ person: name, site: "lips at rest: gap between the lips at the midline, mm", value: f.lipGap, low: 0, high: HEAD, unit: "mm" });
    rows.push({ person: name, site: "lips at rest: widest gap along the middle half of the mouth, mm", value: f.mouthGap, low: 0, high: HEAD, unit: "mm" });
    if (subject.mouth)
      rows.push({ person: name, site: "teeth at rest: tooth points seen from the front", value: f.teethSeen, low: 0, high: 0, unit: "points" });

    rows.push(ratio(name, "nasolabial angle, deg", f.nasolabial, 83.4, 120.6));
    rows.push(ratio(name, "lower face height sn-gn / n-gn", f.lowerFace, 0.441, 0.694));
    rows.push(ratio(name, "upper lip height sn-sto / n-gn", f.upperLip, 0.12, 0.232));
    rows.push(...proportions(name, f));
    return rows;
  }

  /**
   * Locate the face's landmarks by their Farkas and FaceBase definitions; the
   * entry the audit and the input-response test reach.
   */
  export function faceSites(skin: HumanAnatomy.ISkin, S: number, mouth: boolean): ISites {
    return HumanAnatomyHeadSites.sites(skin, S, mouth);
  }

  /**
   * Population proportions and profile angles of the located face. Each range
   * spans the cited adult samples, the lowest mean less 2.326 SD to the
   * highest mean plus 2.326 SD, a ratio's SD taken from its parts as
   * uncorrelated: fissure over intercanthal width and the nasal index from
   * Weinberg 2016, Gao 2025 and Virdi 2019 (European, Chinese and Kenyan
   * adults); canthal tilt from Gao 2025; facial convexity and upper lip
   * protrusion from Legan and Burstone's European-American norms and Celebi
   * 2013's Turkish adults.
   */
  export function proportions(name: string, f: ISites): IRow[] {
    const rows: IRow[] = [];
    const m: ISites["median"] = f.median;

    for (const side of SIDES)
      rows.push(
        ratio(name, `${side} palpebral fissure over intercanthal width, en-ex / en-en`, f.fissure[side].length / f.intercanthal, 0.598, 1.341),
      );

    for (const side of SIDES)
      rows.push(
        ratio(
          name,
          `${side} canthal tilt, exocanthion above endocanthion across the face, deg`,
          HumanAnatomyHeadGeometry.tilt(f.canthi[side].en, f.canthi[side].ex),
          -5.6,
          12.8,
        ),
      );

    rows.push(ratio(name, "nasal index al-al / n-sn", f.noseWidth / f.noseHeight, 0.457, 1.077));

    // The profile in the median plane (Legan and Burstone 1980).
    rows.push(
      ratio(name, "facial convexity angle g-sn-pg, deg", HumanAnatomyHeadGeometry.convexity(m.glabella, m.subnasale, m.pogonion), 2.7, 26.6),
    );
    rows.push(
      ratio(
        name,
        "upper lip protrusion, ls ahead of sn-pg, mm",
        HumanAnatomyHeadGeometry.ahead(m.labraleSuperius, m.subnasale, m.pogonion),
        -2.1,
        7.9,
      ),
    );
    return rows;
  }
}
