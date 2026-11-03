import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyProfile } from "./HumanAnatomyProfile";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The trunk's silhouette read through its middle: the breadth of the trunk
 * section at every height from the crotch to the armpit, and where that profile
 * goes out and where it goes in.
 *
 * Anatomy fixes the order along the height: the breadth swells to the hips,
 * narrows to the waist, and swells again toward the chest. Whether the waist
 * narrows at all is the person's own: it does when the waist girth input is
 * clearly less than the hip and the chest girth inputs, and a straight trunk
 * has no waist to find, so a row is asked only where the inputs ask for it.
 */
export namespace HumanAnatomyTrunkSilhouette {
  /**
   * Twice ISO 20685-1:2018 Table 4's allowable error for large circumferences,
   * mm: a waist girth input this much under the hip and the chest girth inputs
   * is a waist the tape must find.
   */
  export const CLEAR: number = 2 * HumanAnatomyShared.LARGE;

  /** Least dip, mm of breadth, that counts as a waist and not as noise. */
  export const DIP: number = 1;

  /**
   * The silhouette rows of one subject.
   *
   * @param subject Skin and public inputs to audit.
   */
  export function rows(subject: HumanAnatomyAudit.ISubject): IRow[] {
    const name: string = subject.name;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const controls: IAutoMovieHumanParameters["body"]["controls"] = subject.params.body.controls;
    const hip: number | null = controls.hip.value;
    const waist: number | null = controls.waist.value;
    const chest: number | null = controls.chest.value;

    // A trunk with no waist input to hold the profile against asks nothing.
    if (hip === null || waist === null || chest === null) return [];
    if (Math.min(hip, chest) - waist <= CLEAR) return [];

    const S: number = controls.height.value!;
    const sites: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    const breadth: number[] = [];
    const heights: number[] = [];

    // The trunk section's lateral extent every S / 300 from just over the
    // crotch to just under the armpit, where the arm root joins the section.
    for (let y: number = sites.crotch + 0.02 * S; y < sites.heights.axilla - 0.005 * S; y += S / 300) {
      const cut: HumanAnatomy.ICut | null = HumanAnatomyShared.trunkCut(skin, y);
      if (cut === null || cut.points.length === 0) continue;

      let low: number = Infinity;
      let high: number = -Infinity;

      for (const p of cut.points) {
        low = Math.min(low, p[2]);
        high = Math.max(high, p[2]);
      }
      breadth.push(high - low);
      heights.push(y);
    }

    const turns: HumanAnatomyProfile.ITurn[] = HumanAnatomyProfile.turns(breadth, DIP);
    const kinds: string = turns.map((t: HumanAnatomyProfile.ITurn): string => t.kind).join(",");
    const waistTurn: HumanAnatomyProfile.ITurn | undefined = turns.find((t: HumanAnatomyProfile.ITurn): boolean => t.kind === "min");

    return [
      {
        person: name,
        site: "trunk silhouette: breadth profile from the crotch to the armpit turns out at the hips then in at the waist (0 when it does, else 1)",
        value: kinds.startsWith("max,min") ? 0 : 1,
        low: 0,
        high: 0,
        unit: "",
      },
      {
        person: name,
        site: "trunk silhouette: waist dip under the hips and the chest, mm of breadth",
        value: waistTurn === undefined ? 0 : waistTurn.prominence,
        low: DIP,
        high: Infinity,
        unit: "mm",
      },
      {
        person: name,
        site: "trunk silhouette: waist dip lies under the armpit and over the crotch, mm",
        value: waistTurn === undefined ? NaN : Math.min(sites.heights.axilla - heights[waistTurn.index]!, heights[waistTurn.index]! - sites.crotch),
        low: 0,
        high: Infinity,
        unit: "mm",
      },
    ];
  }
}
