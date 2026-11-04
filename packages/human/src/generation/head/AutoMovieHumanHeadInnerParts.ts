import { AutoMovieViewSection } from "@automovie/engine";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadEyeOpening } from "../IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";

/**
 * The parts inside the face's parts, each joined to its own parent part:
 *
 * | Part | Parent | Join | Size from |
 * | --- | --- | --- | --- |
 * | tip lobule | nose | merge | round, as wide as the tip ball's breadth (`face.tipBall[2]` half nose widths) about the pronasale |
 * | ala, each side | nose | merge | the alar lobule (`face.ala`) beside the subnasale at half `nose.width` |
 * | nostril, each side | nose | diff | the nostril's size and centre in the base (`face.nostrilSize`, `face.nostrilCentre`) |
 * | philtral groove | head mass | diff | the philtrum's depth and half width (`face.philtrum`), subnasale to labrale superius |
 * | mentolabial sulcus | head mass | diff | Legan and Burstone's sulcus depth (`profile.sulcus`) at the sublabiale |
 * | upper and lower lid, each side | head mass, in the orbit | merge | the fissure's length and height, the margin's lead over the globe (`face.marginForward`) |
 * | helix, antihelix, concha, each side | auricle | merge, diff | drawn in the ear's own frame (`AutoMovieHumanHeadEarParts`) |
 *
 * Sizes come from the head prior's rows as they stand; the prior's
 * replacement by published laws (#3045's worker) and each part's own laws
 * (#3053 to #3056) replace them. First pass: compile-only.
 */
export namespace AutoMovieHumanHeadInnerParts {
  /** Depth of an inner part's base inside its parent, mm. */
  export const INSET: number = 1.5;

  /**
   * Every inner part of a person.
   *
   * @param plan The landmark skeleton.
   * @returns The parts, each naming its parent.
   */
  export function of(plan: IAutoMovieHumanHeadLayout): AutoMovieHumanHeadFeatures.IFeature[] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const k: number = plan.scale;
    const prior: AutoMovieHumanHeadPrior.IPrior = AutoMovieHumanHeadPrior.PRIOR;
    const f: AutoMovieHumanHeadPrior.IFace = prior.face;
    const out: AutoMovieHumanHeadFeatures.IFeature[] = [];
    const NH: number = plan.nasion - plan.subnasale;

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
      const centre: [number, number, number] = [m.subnasale[0] + f.nostrilCentre[0]! * plan.noseLead, m.subnasale[1] + f.ala[2]! * (m.pronasale[1] - m.subnasale[1]), sign * plan.noseWidth * f.ala[1]!];
      const half: number = f.ala[5]! * plan.noseWidth;
      out.push(part(`nose.ala.${side}`, "nose", "merge", sub(centre, [0, 0, sign * INSET]), [0, 0, sign], up, [f.ala[3]! * NH, half, f.ala[4]! * NH, half], INSET + half, centre, plan.noseWidth));
      const nostril: [number, number, number] = [m.subnasale[0] + f.nostrilCentre[0]! * plan.noseLead, m.subnasale[1], sign * f.nostrilCentre[1]! * plan.noseWidth];
      out.push(
        part(`nose.nostril.${side}`, "nose", "diff", [nostril[0], nostril[1] - INSET, nostril[2]], [0, 1, 0], [1, 0, 0],
          [f.nostrilSize[0]! * plan.noseWidth, f.nostrilSize[1]! * plan.noseWidth, f.nostrilSize[0]! * plan.noseWidth, f.nostrilSize[1]! * plan.noseWidth], INSET + 8.8 * k, nostril, plan.noseWidth),
      );
    }

    // The philtral groove and the mentolabial sulcus, cut from the head mass.
    const ls: number = plan.stomion + plan.upperLip;
    const philtrumY: number = (plan.subnasale + ls) / 2;
    const philtrumX: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, philtrumY);
    out.push(
      part("philtrum", "head.mass", "diff", [philtrumX + INSET, philtrumY, 0], [-1, 0, 0], [0, 1, 0],
        [(plan.subnasale - ls) / 2, f.philtrum[1]! * k, (plan.subnasale - ls) / 2, f.philtrum[1]! * k], INSET + f.philtrum[0]! * k, [philtrumX, philtrumY, 0]),
    );
    const sl: number = (plan.stomion - plan.lowerLip + m.pogonion[1]) / 2;
    const slX: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, sl);
    const sulcus: number = prior.profile.sulcus * (plan.faceHeight / prior.profile.unit);
    out.push(
      part("sulcus.mentolabial", "head.mass", "diff", [slX + INSET, sl, 0], [-1, 0, 0], [0, 0, 1],
        [plan.mouthWidth, sulcus, plan.mouthWidth, sulcus], INSET + sulcus, [slX, sl, 0]),
    );
    // The lids over each globe, inside the orbit's recess: each margin stands
    // the prior's recess behind the nasion's skin (`face.eyeRecess`), or at
    // the head mass's skin in front of the eye where that lies further back;
    // the lid rises the margin's lead from its base behind the margin. The
    // landmark is the skin in front of the eye, so the lid keeps its place.
    const nasion: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion);
    const lid = (side: "left" | "right", sign: 1 | -1, eye: IAutoMovieHumanHeadEyeOpening): void => {
      const skin: number = AutoMovieHumanHeadMassPart.frontAt(plan, plan.eye, sign * eye.place);
      const margin: number = Math.min(skin, nasion - f.eyeRecess * k);
      const height: number = INSET + f.marginForward * k;
      for (const [name, dy] of [["upper", 1], ["lower", -1]] as const) {
        const y: number = plan.eye + (dy * eye.height) / 2;
        out.push(
          part(`lid.${name}.${side}`, "head.mass", "merge", [margin - height, y + (dy * eye.height) / 2, sign * eye.place], [1, 0, 0], [0, 0, sign],
            [eye.length / 2, eye.height / 2, eye.length / 2, eye.height / 2], height, [skin, y, sign * eye.place], AutoMovieHumanHeadMassPart.halfWidth(plan, plan.eye)),
        );
      }
    };
    lid("left", 1, plan.left);
    lid("right", -1, plan.right);

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
