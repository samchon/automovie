import { AutoMovieViewSection } from "@automovie/engine";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadLipPart } from "./AutoMovieHumanHeadLipPart";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";

/**
 * The parts inside the face's parts, each joined to its own parent part:
 *
 * | Part | Parent | Join | Size from |
 * | --- | --- | --- | --- |
 * | tip lobule | nose | merge | elliptical cap, as wide as the tip ball's breadth (`face.tipBall[2]` half nose widths), closing at pronasale |
 * | ala, each side | nose | merge | the alar lobule (`face.ala`) beside the subnasale at half `nose.width` |
 * | nostril, each side | nose | diff | the nostril's size and centre in the base (`face.nostrilSize`, `face.nostrilCentre`) |
 * | philtral groove | head mass | diff | the philtrum's depth and half width (`face.philtrum`), subnasale to labrale superius |
 * | mentolabial sulcus | head mass | diff | Legan and Burstone's sulcus depth (`profile.sulcus`) at the sublabiale |
 * | helix, antihelix, concha, each side | auricle | merge, diff | drawn in the ear's own frame (`AutoMovieHumanHeadEarParts`) |
 *
 * Nasal sizes retain declared prior ratios of the supplied nasal triangle.
 * Alar centre and upper/lower heights use the prior's vertical n-prn span;
 * projected long supports preserve those heights in the tilted nasal frame.
 * Philtrum uses the actual source Sn-ls chord. The labiomental depth is
 * perpendicular to the actual source Li-Pg line (Legan/Burstone 1980),
 * with its midpoint and footprint still geometric placement conventions.
 * These raw cutters establish neither a through opening nor a lining.
 *
 * @evidence contracts/common.md#principled-implementation Uses the supplied nasal triangle, retained ratio units and actual lip landmarks. Alar height ratios keep their vertical n-prn denominator when mapped into the tilted footprint; these ratios and cutter axes remain geometric conventions.
 * @evidence contracts/common.md#clear-and-simple-design Places a fixed set of inner views and returns their explicit parent/join metadata; Dome owns the shared cap source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native-mesh fit, parent relocation or kernel-grazing profile change determines these sources. Existing positive-size floors and embedding allowances remain declared construction conventions.
 * @evidence contracts/common.md#meaningful-documentation States source units, prior denominators, tilted-frame projection, raw-cutter scope and unfinished openings/lining.
 * @evidence contracts/performance.md#efficient-algorithms A fixed seven-feature assembly uses constant vector arithmetic and Dome's fixed station count, without realizing the body.
 * @evidence contracts/performance.md#reuse-equivalent-work One nasal frame and shared source lip sites serve the related parts; each returned view is authored once per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned feature arrays. Temporary vectors and constants are call-local, with no retained figure cache or handles.
 */
export namespace AutoMovieHumanHeadInnerParts {
  /**
   * Depth of an inner part's base inside its parent, mm.
   *
   * @evidence contracts/common.md#principled-implementation Declares the existing 1.5 mm embedding allowance, not measured tissue thickness.
   * @evidence contracts/common.md#clear-and-simple-design One allowance serves the inner-part constructors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The allowance is independent of person, mesh and join outcome.
   * @evidence contracts/common.md#meaningful-documentation Names its embedding role and calibration millimetres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar constant selects no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar constant coordinates no computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar constant owns no retained population or handles.
   */
  export const INSET: number = 1.5;

  /**
   * Every inner part of a person.
   *
   * @param plan The landmark skeleton.
   * @returns The parts, each naming its parent.
   *
   * @evidence contracts/common.md#principled-implementation Preserves Euclidean source landmarks, al-al apices and the retained alar vertical n-prn ratios; dividing by the nasal unit direction's Y component converts height to local long support.
   * @evidence contracts/common.md#clear-and-simple-design Shares one nasal frame and returns the explicit inner-part list for Composer, leaving joins to the tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not fit a reference or shift a part after placement. The retained ratios, floors, embedding allowance and cutter axes are conventions rather than anatomical measurements.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes alar ratio units, cap placement and the still-unrealized openings and lining.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-count vector arithmetic and seven fixed-size Dome sources dominate; no parent search, body realization or reference scan occurs.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses nasal directions and the original lip sites within this assembly; each view is produced once and borrowed by Composer.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned views and metadata, with call-local vectors and no cache, task or handle ownership.
   */
  export function of(plan: IAutoMovieHumanHeadLayout): AutoMovieHumanHeadFeatures.IFeature[] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const k: number = plan.scale;
    const prior: AutoMovieHumanHeadPrior.IPrior = AutoMovieHumanHeadPrior.PRIOR;
    const f: AutoMovieHumanHeadPrior.IFace = prior.face;
    const out: AutoMovieHumanHeadFeatures.IFeature[] = [];
    const alarSpan: number = plan.nasion - plan.tip;
    const nasalForward: number = m.pronasale[0] - m.subnasale[0];

    // The nose's frame: up along the dorsum's chord, forward square to it.
    const up: [number, number, number] = unit([m.nasion[0] - m.subnasale[0], m.nasion[1] - m.subnasale[1], 0]);
    const forward: [number, number, number] = [up[1], -up[0], 0];
    const tip: [number, number, number] = [m.pronasale[0], m.pronasale[1], 0];
    out.push(
      part("nose.lobule", "nose", "merge", sub(tip, scale(forward, INSET + f.tipBall[2]! * plan.noseWidth / 2)), forward, up,
        [f.tipBall[2]! * plan.noseWidth, f.tipBall[2]! * plan.noseWidth, f.tipBall[2]! * plan.noseWidth, f.tipBall[2]! * plan.noseWidth], INSET + f.tipBall[2]! * plan.noseWidth / 2, tip, plan.noseWidth),
    );
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      const half: number = f.ala[5]! * plan.noseWidth;

      // The lateral apex is alare. Both sides share x/y, so these two
      // apices are exactly the supplied Euclidean al-al width apart.
      const centre: [number, number, number] = [m.subnasale[0] + f.nostrilCentre[0]! * nasalForward, m.subnasale[1] + f.ala[2]! * alarSpan, sign * (plan.noseWidth - half)];

      // Prior.ala's half-heights are vertical n-prn ratios. A tilted local
      // support contributes only up.y of its length to that vertical span.
      out.push(part(`nose.ala.${side}`, "nose", "merge", sub(centre, [0, 0, sign * INSET]), [0, 0, sign], up, [f.ala[3]! * alarSpan / up[1], half, f.ala[4]! * alarSpan / up[1], half], INSET + half, centre, plan.noseWidth));
      const nostril: [number, number, number] = [m.subnasale[0] + f.nostrilCentre[0]! * nasalForward, m.subnasale[1], sign * f.nostrilCentre[1]! * plan.noseWidth];
      out.push(
        part(`nose.nostril.${side}`, "nose", "diff", [nostril[0], nostril[1] - INSET, nostril[2]], [0, 1, 0], [1, 0, 0],
          [f.nostrilSize[0]! * plan.noseWidth, f.nostrilSize[1]! * plan.noseWidth, f.nostrilSize[0]! * plan.noseWidth, f.nostrilSize[1]! * plan.noseWidth], INSET + 8.8 * k, nostril, plan.noseWidth),
      );
    }

    // The philtral groove and the mentolabial sulcus, cut from the head mass.
    const ls: [number, number, number] = AutoMovieHumanHeadLipPart.midline(plan, true);
    const philtral: [number, number, number] = unit([m.subnasale[0] - ls[0], m.subnasale[1] - ls[1], 0]);
    const philtralInward: [number, number, number] = [-philtral[1], philtral[0], 0];
    const philtralCentre: [number, number, number] = [(m.subnasale[0] + ls[0]) / 2, (m.subnasale[1] + ls[1]) / 2, 0];
    const philtralHalf: number = Math.hypot(m.subnasale[0] - ls[0], m.subnasale[1] - ls[1]) / 2;
    out.push(
      part("philtrum", "head.mass", "diff", sub(philtralCentre, scale(philtralInward, INSET)), philtralInward, philtral,
        [philtralHalf, f.philtrum[1]! * k, philtralHalf, f.philtrum[1]! * k], INSET + f.philtrum[0]! * k, philtralCentre),
    );
    const li: [number, number, number] = AutoMovieHumanHeadLipPart.midline(plan, false);
    const lowerChord: [number, number, number] = unit([li[0] - m.pogonion[0], li[1] - m.pogonion[1], 0]);
    const sulcusInward: [number, number, number] = [-lowerChord[1], lowerChord[0], 0];
    const sulcusCentre: [number, number, number] = [(li[0] + m.pogonion[0]) / 2, (li[1] + m.pogonion[1]) / 2, 0];
    const sulcus: number = prior.profile.sulcus * (plan.faceHeight / prior.profile.unit);
    out.push(
      part("sulcus.mentolabial", "head.mass", "diff", sub(sulcusCentre, scale(sulcusInward, INSET)), sulcusInward, [0, 0, 1],
        [plan.mouthWidth, sulcus, plan.mouthWidth, sulcus], INSET + sulcus, sulcusCentre),
    );

    return out;
  }

  /** One inner part. */
  function part(
    name: string,
    parent: string,
    join: "merge" | "diff",
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    height: number,
    seed: [number, number, number],
    host?: number,
  ): AutoMovieHumanHeadFeatures.IFeature {
    const h: number = Math.max(INSET + 0.5, height);
    const e: [number, number, number, number] = extents.map((x: number): number => Math.max(0.5, Math.abs(x))) as [number, number, number, number];
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents: e, height: h, profile: 2, shoulder: AutoMovieViewSection.ELLIPSE, ...(host === undefined ? {} : { host }) }),
      join,
      seed,
      contact: INSET,
      size: [h - INSET, Math.min(...e)],
      parent,
      elongated: Math.max(...e) > 2 * Math.min(...e),
    };
  }

  /** A vector scaled to length 1. */
  function unit(a: [number, number, number]): [number, number, number] {
    const l: number = Math.hypot(...a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Difference. */
  function sub(a: readonly number[], b: readonly number[]): [number, number, number] {
    return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  }

  /** Scaled vector. */
  function scale(a: readonly number[], s: number): [number, number, number] {
    return [a[0]! * s, a[1]! * s, a[2]! * s];
  }
}
