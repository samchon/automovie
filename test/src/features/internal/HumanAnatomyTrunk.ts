import { HumanInputs } from "./HumanInputs";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyMirror } from "./HumanAnatomyMirror";
import { HumanAnatomyNeckSites } from "./HumanAnatomyNeckSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomySpine } from "./HumanAnatomySpine";
import { HumanAnatomyTrunkBand } from "./HumanAnatomyTrunkBand";
import { HumanAnatomyTrunkSites } from "./HumanAnatomyTrunkSites";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type ITrunk = HumanAnatomyShared.ITrunk;
type INeck = HumanAnatomyShared.INeck;
const A: typeof HumanAnatomy = HumanAnatomy;
const { LARGE, SMALL, CREASE, identity, ratio, extent, extraTurns }: typeof HumanAnatomyShared = HumanAnatomyShared;
const { CHEST_HEIGHT, BUTTOCK_HEIGHT, CERVICALE_HEIGHT, NECK_BASE_RATIO }: typeof HumanAnatomyTrunkBand = HumanAnatomyTrunkBand;

/**
 * The trunk audit: its rows, and the entry to the sites they are read at. The
 * sites live in their own pieces: {@link HumanAnatomyTrunkSites} for the
 * tapes, {@link HumanAnatomyNeckSites} for the neck, {@link HumanAnatomySpine}
 * for the back's curves.
 */
export namespace HumanAnatomyTrunk {
  /** Where the neck's landmarks were found on one reading, to read an edited copy at the same places. */
  export type ILocators = HumanAnatomyNeckSites.ILocators;

  /** The back's sagittal curves on its median skin. */
  export type ISpine = HumanAnatomySpine.ISpine;

  /** The neck's base line of the last neck reading of each skin. */
  export const lines: typeof HumanAnatomyNeckSites.lines = HumanAnatomyNeckSites.lines;

  /** The neck locators of the last neck reading of each skin. */
  export const located: typeof HumanAnatomyNeckSites.located = HumanAnatomyNeckSites.located;

  /** Locate the trunk's sites by their ISO 8559-1 and ANSUR II definitions, once per skin. */
  export function trunkSites(skin: HumanAnatomy.ISkin, S: number): ITrunk {
    return HumanAnatomyTrunkSites.trunkSites(skin, S);
  }

  /**
   * Locate the neck's sites: ISO 8559-1 neck girth and neck base girth, and
   * suprasternale and cervicale; `known` reads them at the places found on
   * another reading of the same body.
   */
  export function neckSites(skin: HumanAnatomy.ISkin, S: number, known?: ILocators): INeck {
    return HumanAnatomyNeckSites.neckSites(skin, S, known);
  }

  /** The back's lumbar lordosis and thoracic kyphosis from the trunk's and neck's sites. */
  export function spine(skin: HumanAnatomy.ISkin, t: ITrunk, neck: INeck): ISpine {
    return HumanAnatomySpine.spine(skin, t.heights.hip, t.heights.waist, neck.cervicale);
  }

  /**
   * The trunk and neck: tapes at their ISO 8559-1 and ANSUR II sites, the
   * trunk's sections and landmark heights against ANSUR II, the neck's girth
   * profile, the back's sagittal curves and, for a constructed figure, its
   * mirror symmetry.
   *
   * @param subject Skin and public inputs to read.
   * @param known Neck locators found on another reading of the same body; a
   *   made defect on a copy is then read where the unedited body's landmarks
   *   lie.
   */
  export function trunk(subject: ISubject, known?: ILocators): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const params: IAutoMovieHumanParameters = subject.params;
    const controls: IAutoMovieHumanParameters["body"]["anatomy"] = params.body.anatomy;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = HumanInputs.stature(params);
    const t: ITrunk = trunkSites(skin, S);
    const neck: INeck = neckSites(skin, S, known);

    // Each tape against its input within ISO 20685-1:2018 Table 4's maximum
    // allowable error: 9 mm for the trunk's large girths, 4 mm for the neck's
    // small ones. A tape is the hull perimeter of its section, mm.
    const tape: (site: string, value: number, input: number | null, tol: number) => void = (
      site: string,
      value: number,
      input: number | null,
      tol: number,
    ): void => {
      if (input !== null) rows.push(identity(name, site, value, input, tol));
    };
    tape("chest girth at the bust point, mm", t.chest.girth, (controls.chestCircumference ?? null), LARGE);
    tape("underbust girth at the inframammary fold, mm", t.underbust.girth, (controls.underbustCircumference ?? null), LARGE);
    tape("waist girth, natural (least) waist, mm", t.waist.girth, (controls.waistCircumference ?? null), LARGE);
    tape("high hip girth, midway waist to hip, mm", t.highHip.girth, (controls.highHipCircumference ?? null), LARGE);
    tape("hip girth at the buttock prominence, mm", t.hip.girth, (controls.hipCircumference ?? null), LARGE);
    tape("neck girth, least girth across the neck axis, mm", neck.neck, (controls.neckCircumference ?? null), SMALL);
    tape("neck base girth along the neck's base, over the jugular notch, side neck points and nape, mm", neck.base, (controls.neckBaseCircumference ?? null), SMALL);

    // ANSUR II shape ratios and heights: each sex's mean plus and minus 2.326
    // SD (the 1st to 99th percentile of a normal), the union of both sexes
    // (`ansur-ii.md`, `ansur-ii-trunk-ratios.md`). Depths are x extents and
    // breadths z extents of the section, mm; heights are y over the stature
    // input.
    rows.push(ratio(name, "chest depth / breadth at the bust point", extent(t.chest.points, 0) / extent(t.chest.points, 2), 0.702, 1.095));
    rows.push(ratio(name, "waist depth / breadth", extent(t.waist.points, 0) / extent(t.waist.points, 2), 0.576, 0.853));
    rows.push(ratio(name, "buttock depth / hip breadth", extent(t.hip.points, 0) / extent(t.hip.points, 2), 0.548, 0.827));
    rows.push(ratio(name, "crotch height / stature", t.crotch / S, 0.445, 0.515));
    rows.push(ratio(name, "chest point height / stature", t.heights.chest / S, CHEST_HEIGHT[0], CHEST_HEIGHT[1]));
    rows.push(ratio(name, "buttock height / stature", t.heights.hip / S, BUTTOCK_HEIGHT[0], BUTTOCK_HEIGHT[1]));
    rows.push(ratio(name, "cervicale height / stature", neck.cervicale / S, CERVICALE_HEIGHT[0], CERVICALE_HEIGHT[1]));
    rows.push(ratio(name, "neck base girth / neck girth", neck.base / neck.neck, NECK_BASE_RATIO[0], NECK_BASE_RATIO[1]));

    // The neck's girth falls from its base to one least girth and rises to the
    // jaw: one turn, no step.
    rows.push({
      person: name,
      site: "neck girth profile, base to jaw: extra turns deeper than a small-girth error",
      value: extraTurns(neck.profile, SMALL),
      low: 0,
      high: 0,
      unit: "turns",
    });
    rows.push({
      person: name,
      site: "neck skin: deepest crease across the neck, sagitta over a 10 mm chord past a 12.5 mm radius, mm",
      value: neck.crease,
      low: 0,
      high: CREASE,
      unit: "mm",
    });

    // The vertebral column's lumbar curve is convex forward and its thoracic
    // curve concave forward (Gray 1918, `gray-1918-vertebral-curves.md`), and
    // the back's median skin follows the spinous processes. The text gives the
    // curves' directions, not their sizes, so the limit is the sign: a
    // sagitta must be positive, and it counts once it exceeds the profile's
    // 2 mm station step (`HumanAnatomySpine.FLOOR`): the four references read
    // 33.8 to 51.2 mm kyphosis and 39.6 to 45.6 mm lordosis, so the floor
    // stands far below any real back.
    const back: ISpine = spine(skin, t, neck);
    rows.push({
      person: name,
      site: "back median profile: lumbar apex in front of the chord from the sacrum to the thoracic apex (lordosis), mm",
      value: back.lordosis,
      low: HumanAnatomySpine.FLOOR,
      high: Infinity,
      unit: "mm",
    });
    rows.push({
      person: name,
      site: "back median profile: thoracic apex behind the chord from the lumbar apex to cervicale (kyphosis), mm",
      value: back.kyphosis,
      low: HumanAnatomySpine.FLOOR,
      high: Infinity,
      unit: "mm",
    });

    // Mirror symmetry holds by construction, not by anatomy: a real body's two
    // sides differ (the references read 1.2 to 1.95 mm). Each leg takes its
    // own lateral malleolus height, so its reflection is rebuilt to the other
    // side's before it is read.
    if (subject.construction)
      rows.push({
        person: name,
        site: "trunk, neck and legs: each side's reflection, the legs rebuilt to the other side's own ankle height, off the other side's skin, mm",
        value: HumanAnatomyMirror.offset(skin, /^(trunk|upper|head\.lower|leg)/, HumanAnatomyMirror.limbs(subject.params, (bone: string): V3 => A.joint(skin, bone))),
        low: 0,
        high: HumanAnatomyMirror.MIRROR,
        unit: "mm",
      });

    return rows;
  }
}
