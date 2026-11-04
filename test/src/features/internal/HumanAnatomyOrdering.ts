import { AutoMovieHumanSex } from "../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArm } from "./HumanAnatomyArm";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyCourse } from "./HumanAnatomyCourse";
import { HumanAnatomyLeg } from "./HumanAnatomyLeg";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
const A: typeof HumanAnatomy = HumanAnatomy;
const { ratio } = HumanAnatomyShared;

/**
 * The order of a body's landmarks and sections: relations that hold in every
 * adult whatever the inputs, so a construction that moves one input must keep
 * them true across the whole parameter domain. Heights stand above or below
 * each other, girths are ordered along a limb, and a limb's two segments keep
 * the proportion people have. Every landmark is located on the skin by the
 * same observers the region audits use.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanAnatomyOrdering {
  /**
   * ANSUR II (cervicale height less suprasternale height) over stature, each
   * sex's mean plus and minus 2.326 SD and the union of both sexes
   * (`ansur-ii-trunk-ratios.md`).
   */
  export const NAPE_ABOVE_NOTCH: readonly [number, number] = [0.024, 0.0601];

  /**
   * ANSUR II (axilla height less chest height) over stature, union of both
   * sexes (`ansur-ii-trunk-ratios.md`): the chest point sits at most 0.001
   * stature above the axilla and at most 0.0724 below it.
   */
  export const AXILLA_ABOVE_CHEST: readonly [number, number] = [-0.001, 0.0724];

  /**
   * ANSUR II radiale-stylion over acromion-radiale length, per subject, each
   * sex's mean plus and minus 2.326 SD and the union of both sexes: women
   * 0.776 (SD 0.0367), men 0.7995 (0.0331) (`ansur-ii-course-measures.md`).
   */
  export const FOREARM_OVER_UPPER_ARM: readonly [number, number] = [0.6907, 0.8765];

  /**
   * The ordering rows of a subject's standing skin.
   *
   * @param subject A generated person or a reference body.
   * @returns Every row, passing or not; a landmark not found reads NaN and fails its rows.
   */
  export function ordering(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const c: ISubject["params"]["body"]["anatomy"] = subject.params.body.anatomy;
    const S: number = c.stature!;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const t: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    const neck: HumanAnatomyShared.INeck = HumanAnatomyCourse.neckSites(skin, S);
    const k: HumanAnatomyCourse.ICourse = HumanAnatomyCourse.courseSites(skin, S);
    const rows: IRow[] = [];

    // Strictly above: a height difference that must be positive, mm.
    const above: (site: string, upper: number, lower: number) => void = (site: string, upper: number, lower: number): void => {
      rows.push({ person: name, site, value: upper - lower, low: Number.MIN_VALUE, high: Infinity, unit: "mm" });
    };

    // The vertical order of the trunk's landmarks, from the nape to the
    // crotch: the back neck point, the shoulder's top, the armpit, the bust,
    // the fold under it, the waist, the buttocks' prominence and the crotch
    // (Gray 1918; the ANSUR II height means order them the same way, by
    // margins of 0.03 stature or more).
    const shoulder: number = ((k.shoulder.left?.[1] ?? NaN) + (k.shoulder.right?.[1] ?? NaN)) / 2;
    above("cervicale above the shoulder points, mm", neck.cervicale, shoulder);
    above("shoulder points above the axilla, mm", shoulder, t.heights.axilla);
    above("waist above the buttocks' prominence, mm", t.heights.waist, t.heights.hip);
    above("buttocks' prominence above the crotch, mm", t.heights.hip, t.crotch);
    rows.push(ratio(name, "(cervicale - suprasternale height) / stature", (neck.cervicale - neck.notch) / S, NAPE_ABOVE_NOTCH[0], NAPE_ABOVE_NOTCH[1]));
    rows.push(ratio(name, "(axilla - chest point height) / stature", (t.heights.axilla - t.heights.chest) / S, AXILLA_ABOVE_CHEST[0], AXILLA_ABOVE_CHEST[1]));

    // A woman's bust stands over the fold under it, which stands over the
    // waist. A man's chest point is the nipple, which the modelled skin
    // leaves out, so his bust and fold are not located.
    if ((c.sex ?? AutoMovieHumanSex.Female) === AutoMovieHumanSex.Female) {
      above("bust point above the inframammary fold, mm", t.heights.chest, t.heights.underbust);
      above("inframammary fold above the waist, mm", t.heights.underbust, t.heights.waist);
    }

    // The arm: the segments keep ANSUR II's proportion, and girths run
    // wrist < forearm and wrist < elbow (the wrist is the arm's narrowest
    // section, ANSUR II wrist 155 and 176 mm against forearm 264 and 310).
    for (const side of HumanAnatomyShared.SIDES) {
      const arm: HumanAnatomyShared.IArm = HumanAnatomyArm.armSites(skin, side);
      rows.push(
        ratio(name, `${side} radiale-stylion over acromion-radiale length`, k.radialeStylion[side] / k.acromionRadiale[side], FOREARM_OVER_UPPER_ARM[0], FOREARM_OVER_UPPER_ARM[1]),
      );
      rows.push({ person: name, site: `${side} forearm girth over wrist girth, mm`, value: arm.forearm - arm.wrist, low: Number.MIN_VALUE, high: Infinity, unit: "mm" });
      rows.push({ person: name, site: `${side} elbow girth over wrist girth, mm`, value: arm.elbow - arm.wrist, low: Number.MIN_VALUE, high: Infinity, unit: "mm" });
    }

    // The leg, top to bottom: the crotch, the knee's patella, the calf's
    // belly, the ankle (Gray 1918). The calf's belly is the height of the
    // shank's greatest girth, every 2 mm from the knee joint down, as the leg
    // audit reads it.
    const levels: HumanAnatomyLeg.ILevels = { crotch: t.crotch, vertex: HumanAnatomyLeg.vertexHeight(skin) };
    for (const side of HumanAnatomyShared.SIDES) {
      const knee: V3 = A.joint(skin, `${side}LowerLeg`);
      const ankle: V3 = A.joint(skin, `${side}Foot`);
      const leg: HumanAnatomyShared.ILeg = HumanAnatomyLeg.legSites(skin, side, levels);
      const shank: number = knee[1] - ankle[1];
      let belly: number = NaN;
      let girth: number = 0;
      leg.shankProfile.forEach((g: number, i: number): void => {
        const y: number = knee[1] - 2 * i;
        if (y <= knee[1] - 0.15 * shank && y >= knee[1] - 0.6 * shank && g > girth) {
          girth = g;
          belly = y;
        }
      });
      above(`${side} crotch above the patella, mm`, t.crotch, HumanAnatomyLeg.patellaHeight(skin, knee));
      above(`${side} patella above the calf's belly, mm`, HumanAnatomyLeg.patellaHeight(skin, knee), belly);
      above(`${side} calf's belly above the ankle joint, mm`, belly, ankle[1]);
    }
    return rows;
  }
}
