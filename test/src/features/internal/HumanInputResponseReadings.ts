import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyArm } from "./HumanAnatomyArm";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyCourse } from "./HumanAnatomyCourse";
import { HumanAnatomyFoot } from "./HumanAnatomyFoot";
import { HumanAnatomyHand } from "./HumanAnatomyHand";
import { HumanAnatomyHead } from "./HumanAnatomyHead";
import { HumanAnatomyLeg } from "./HumanAnatomyLeg";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

const { SIDES } = HumanAnatomyShared;

/**
 * The readings an input response compares: every anatomy observer's own site
 * locators run on one subject and flattened into named numbers, so a
 * perturbed person and its base are read by exactly the same code.
 */
export namespace HumanInputResponseReadings {
  /** Named readings of one subject, mm; NaN where a site was not found. */
  export type IReadings = Record<string, number>;

  /** A group of readings that share their sites and their observer. */
  export type Group = "stature" | "trunk" | "course" | "arm" | "leg" | "hand" | "foot" | "head";

  /**
   * Every reading of the named groups on one subject.
   *
   * @param subject A generated person or a reference body.
   * @param groups The groups to read; a group that cannot be read gives one NaN entry naming why.
   */
  export function read(subject: HumanAnatomyAudit.ISubject, groups: readonly Group[]): IReadings {
    const out: IReadings = {};

    // Each group is read once per subject, so every test asking for the same
    // person reads its skin once.
    let taken: Map<Group, IReadings> | undefined = readings.get(subject);
    if (taken === undefined) {
      taken = new Map();
      readings.set(subject, taken);
    }

    for (const g of groups) {
      let found: IReadings | undefined = taken.get(g);
      if (found === undefined) {
        try {
          found = GROUPS[g](subject);
        } catch (error) {
          found = { [`${g} unreadable: ${(error as Error).message}`]: NaN };
        }
        taken.set(g, found);
      }
      Object.assign(out, found);
    }
    return out;
  }
}

/** The groups read so far from each subject. */
const readings: WeakMap<HumanAnatomyAudit.ISubject, Map<HumanInputResponseReadings.Group, HumanInputResponseReadings.IReadings>> = new WeakMap();

/** Readings of every group, taken by the region observers' own site locators. */
const GROUPS: Record<HumanInputResponseReadings.Group, (s: HumanAnatomyAudit.ISubject) => HumanInputResponseReadings.IReadings> = {
  stature: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => ({ stature: HumanAnatomyLeg.vertexHeight(s.bind()) }),

  trunk: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const S: number = s.params.body.controls.height.value!;
    const t: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(s.bind(), S);
    const n: HumanAnatomyShared.INeck = HumanAnatomyCourse.neckSites(s.bind(), S);
    return { chest: t.chest.girth, underbust: t.underbust.girth, waist: t.waist.girth, highHip: t.highHip.girth, hip: t.hip.girth, neck: n.neck, neckBase: n.base };
  },

  course: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const k: HumanAnatomyCourse.ICourse = HumanAnatomyCourse.courseSites(s.bind(), s.params.body.controls.height.value!);
    const out: HumanInputResponseReadings.IReadings = {
      bustSpan: k.bustPointWidth,
      acrossShoulder: k.acrossShoulder,
      neckToWaist: k.backNeckToWaist,
      inseam: k.crotch,
    };

    for (const side of SIDES) {
      out[`shoulderToApex ${side}`] = k.sideNeckToBust[side];
      out[`upperArmLength ${side}`] = k.acromionRadiale[side];
      out[`lowerArmLength ${side}`] = k.radialeStylion[side];
    }
    return out;
  },

  arm: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const out: HumanInputResponseReadings.IReadings = {};

    for (const side of SIDES) {
      const a: HumanAnatomyShared.IArm = HumanAnatomyArm.armSites(s.bind(), side);
      Object.assign(out, { [`bicep ${side}`]: a.bicep, [`elbow ${side}`]: a.elbow, [`forearm ${side}`]: a.forearm, [`wrist ${side}`]: a.wrist });
    }
    return out;
  },

  leg: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const skin: HumanAnatomy.ISkin = s.bind();
    const levels: HumanAnatomyLeg.ILevels = {
      crotch: HumanAnatomyLeg.crotchHeight(skin, s.params.body.controls.height.value!),
      vertex: HumanAnatomyLeg.vertexHeight(skin),
    };
    const out: HumanInputResponseReadings.IReadings = {};

    for (const side of SIDES) {
      const l: HumanAnatomyShared.ILeg = HumanAnatomyLeg.legSites(skin, side, levels);
      Object.assign(out, { [`thigh ${side}`]: l.thigh, [`knee ${side}`]: l.knee, [`calf ${side}`]: l.calf });
    }
    return out;
  },

  hand: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const out: HumanInputResponseReadings.IReadings = {};

    for (const side of SIDES) {
      const h: HumanAnatomyShared.IHand = HumanAnatomyHand.handSites(s.neutral(), side);
      Object.assign(out, {
        [`hand length ${side}`]: h.length,
        [`hand breadth ${side}`]: h.breadth,
        [`palm length ${side}`]: h.palm,
        [`thumb length ${side}`]: h.thumb,
        [`handCircumference ${side}`]: h.circumference,
      });
    }
    return out;
  },

  foot: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const out: HumanInputResponseReadings.IReadings = {};

    for (const side of SIDES) {
      const f: HumanAnatomyFoot.IFoot = HumanAnatomyFoot.footSites(s.neutral(), side);
      Object.assign(out, { [`foot length ${side}`]: f.length, [`foot breadth ${side}`]: f.breadth });
    }
    return out;
  },

  head: (s: HumanAnatomyAudit.ISubject): HumanInputResponseReadings.IReadings => {
    const f: HumanAnatomyHead.ISites = HumanAnatomyHead.faceSites(s.bind(), s.params.body.controls.height.value!, false);
    const out: HumanInputResponseReadings.IReadings = {
      "head length": f.length,
      "head breadth": f.breadth,
      "head height": f.height,
      "head circumference": f.circumference,
      "face height": f.faceHeight,
      "face width": f.faceWidth,
      "mandibular width": f.mandibular,
      "intercanthal width": f.intercanthal,
      "nose width": f.noseWidth,
      "nose height": f.noseHeight,
      "nose protrusion": f.noseProtrusion,
      "mouth width": f.mouthWidth,
      "upper vermilion": f.upperVermilion,
      "lower vermilion": f.lowerVermilion,
    };

    for (const side of SIDES) {
      out[`fissure length ${side}`] = f.fissure[side].length;
      out[`fissure height ${side}`] = f.fissure[side].height;
      out[`ear length ${side}`] = f.ears[side].length;
      out[`ear breadth ${side}`] = f.ears[side].breadth;
      out[`ear protrusion ${side}`] = f.ears[side].protrusion;
    }
    return out;
  },
};
