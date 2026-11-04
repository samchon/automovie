import type { IAutoMovieHumanBodyAnatomy } from "../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyLegPatella } from "./HumanAnatomyLegPatella";
import { HumanAnatomyLegProfile } from "./HumanAnatomyLegProfile";
import { HumanAnatomyLegSites } from "./HumanAnatomyLegSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type ITrunk = HumanAnatomyShared.ITrunk;
type ILeg = HumanAnatomyShared.ILeg;
const A: typeof HumanAnatomy = HumanAnatomy;
const { SIDES, LARGE, SMALL, identity, ratio, extent, extraTurns, breadth }: typeof HumanAnatomyShared = HumanAnatomyShared;
const { trunkSites }: typeof HumanAnatomyTrunk = HumanAnatomyTrunk;

/**
 * The leg audit: its rows, and the entry to the sites they are read at. The
 * sites live in their own pieces: {@link HumanAnatomyLegSites} for the tapes
 * and the bone inside the skin, {@link HumanAnatomyLegPatella} for the level
 * of the knee girth.
 */
export namespace HumanAnatomyLeg {
  /** Fractions of the thigh and of the shank at which the bone axis must lie inside the skin's section. */
  export const STATIONS: readonly number[] = HumanAnatomyLegSites.STATIONS;

  /** The heights a leg's sites are sought from. */
  export type ILevels = HumanAnatomyLegSites.ILevels;

  /** Crotch height: the lowest midline skin between the legs above 0.3 S and below the hip joint, mm. */
  export const crotchHeight: typeof HumanAnatomyLegSites.crotchHeight = HumanAnatomyLegSites.crotchHeight;

  /** The skin's highest point, mm. */
  export const vertexHeight: typeof HumanAnatomyLegSites.vertexHeight = HumanAnatomyLegSites.vertexHeight;

  /** Locate a leg's sites at the bind. */
  export const legSites: typeof HumanAnatomyLegSites.legSites = HumanAnatomyLegSites.legSites;

  /** Mid-patella height: the most forward-convex point of the knee's anterior profile, mm. */
  export const patellaHeight: typeof HumanAnatomyLegPatella.patellaHeight = HumanAnatomyLegPatella.patellaHeight;

  /** The legs: tapes at ANSUR II and ISO sites, the shank's girth profile and the bone inside the skin. */
  export function leg(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const c: IAutoMovieHumanBodyAnatomy = subject.params.body.anatomy;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = c.stature!;
    const levels: ILevels = { crotch: crotchHeight(skin, S), vertex: vertexHeight(skin) };

    for (const side of SIDES) {
      const l: ILeg = legSites(skin, side, levels);

      if (c.thighCircumference !== undefined)
        rows.push(identity(name, `${side} thigh girth, horizontal maximum just below the crotch, mm`, l.thigh, c.thighCircumference, LARGE));
      if (c.kneeCircumference !== undefined)
        rows.push(identity(name, `${side} knee girth at mid-patella, mm`, l.knee, c.kneeCircumference, SMALL));
      if (c.calfCircumference !== undefined)
        rows.push(identity(name, `${side} calf girth, horizontal maximum, mm`, l.calf, c.calfCircumference, SMALL));
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

      // The sections down the leg: its girth run, heights, order and ankle.
      rows.push(
        ...HumanAnatomyLegProfile.rows(name, skin, side, levels, l, {
          ankleHeight: subject.params.extremities?.feet?.[side]?.ankleHeight,
          knee: (c.kneeCircumference ?? null),
          calf: (c.calfCircumference ?? null),
        }),
      );

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

      // The trunk's sites fail on a skin whose front never rises to a bust
      // point; that failure is this row's NaN, not the whole leg audit's.
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
}
