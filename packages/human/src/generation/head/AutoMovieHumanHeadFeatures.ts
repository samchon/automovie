import { type IAutoMovieViewPart, AutoMovieViewSection } from "@automovie/engine";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadEyeOpening } from "../IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";

/**
 * The face's parts that join the head mass, each drawn from its views in its
 * own frame (`AutoMovieHumanHeadDome`), with the operator that joins it and
 * the landmark that seeds the join.
 *
 * | Part | Views from | Join |
 * | --- | --- | --- |
 * | nose | nasion to subnasale, half `nose.width`, protrusion to pronasale | merge |
 * | upper and lower lip | half `mouth.width`, each vermilion height, the lips' leads | merge |
 * | orbit, each side | the fissure's length and height about its place, the lid margin's recess and the socket | diff |
 *
 * The brow ridge, forehead eminence, malar eminence, cheek and chin pad are
 * declared with amplitude 0 today (`AutoMovieHumanHeadBrow.AMPLITUDE` and
 * kin), so they contribute no part until their laws give them a projection.
 * First pass: crude frames from the landmark skeleton; each part's own laws
 * (#3053 to #3056) replace them.
 */
export namespace AutoMovieHumanHeadFeatures {
  /** A part, its join and its seed. */
  export interface IFeature {
    /** The part's views. */
    part: IAutoMovieViewPart;

    /** Added to the head mass, or cut from it. */
    join: "merge" | "diff";

    /** The landmark the join is seeded at, world mm, on or near the head mass. */
    seed: [number, number, number];

    /** The part's station where its base meets the head mass, mm. */
    contact: number;

    /** The part's own size the blend width follows: its height and its least half extent, mm. */
    size: [number, number];

    /** The part it joins: `head.mass`, or another part's chain name. */
    parent: string;

    /**
     * Whether the part lies along its parent, long and thin (a lip, a lid, a
     * groove), so its curve with the parent crosses the half planes about one
     * centre twice and is traced by its own arclength.
     */
    elongated?: boolean;
  }

  /** Depth of a part's base inside the head mass, mm. */
  export const INSET: number = 3;

  /**
   * Every face part of a person.
   *
   * @param plan The landmark skeleton.
   * @returns The parts, both sides of a pair each built in its own frame.
   */
  export function of(plan: IAutoMovieHumanHeadLayout): IFeature[] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const k: number = plan.scale;
    const out: IFeature[] = [];

    // The nose: from nasion to subnasale on the skull's profile.
    const up: [number, number] = unit2([m.nasion[0] - m.subnasale[0], m.nasion[1] - m.subnasale[1]]);
    const forward: [number, number, number] = [up[1], -up[0], 0];
    const half: number = Math.hypot(m.nasion[0] - m.subnasale[0], m.nasion[1] - m.subnasale[1]) / 2;
    const middle: [number, number] = [(m.nasion[0] + m.subnasale[0]) / 2, (m.nasion[1] + m.subnasale[1]) / 2];
    const noseBase: [number, number, number] = [middle[0] - INSET * forward[0], middle[1] - INSET * forward[1], 0];
    const tip: number = (m.pronasale[0] - noseBase[0]) * forward[0] + (m.pronasale[1] - noseBase[1]) * forward[1];
    out.push(dome("nose", "merge", noseBase, forward, [up[0], up[1], 0], [half, plan.noseWidth, half, plan.noseWidth], tip, 2, [middle[0], middle[1], 0]));

    // The lips, each over its own vermilion on the skull's profile.
    const lip = (name: string, y: number, height: number, lead: number): void => {
      const x: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, y);
      out.push(dome(name, "merge", [x - INSET, y, 0], [1, 0, 0], [0, 0, 1], [plan.mouthWidth, height / 2, plan.mouthWidth, height / 2], lead + INSET, 2, [x, y, 0]));
    };
    lip("lip.upper", plan.stomion + plan.upperLip / 2, plan.upperLip, plan.lips[0]);
    lip("lip.lower", plan.stomion - plan.lowerLip / 2, plan.lowerLip, plan.lips[1]);

    // The orbits: cutters from in front of the lid margin back to the socket.
    const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
    const orbit = (side: "left" | "right", sign: 1 | -1, eye: IAutoMovieHumanHeadEyeOpening): void => {
      const front: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion);
      const z: number = sign * eye.place;
      const depth: number = (face.eyeRecess + face.socket) * k;
      out.push(
        dome(
          `orbit.${side}`,
          "diff",
          [front + INSET, plan.eye, z],
          [-1, 0, 0],
          [0, 0, sign],
          [eye.length / 2, eye.height, eye.length / 2, eye.height],
          depth + INSET,
          2,
          [front, plan.eye, z],
        ),
      );
    };
    orbit("left", 1, plan.left);
    orbit("right", -1, plan.right);

    return out;
  }

  /** One dome feature. */
  function dome(
    name: string,
    join: "merge" | "diff",
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    height: number,
    profile: number,
    seed: [number, number, number],
  ): IFeature {
    const h: number = Math.max(INSET + 0.5, height);
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents, height: h, profile, shoulder: AutoMovieViewSection.ELLIPSE }),
      join,
      seed,
      contact: INSET,
      size: [h - INSET, Math.min(...extents)],
      parent: "head.mass",
      elongated: Math.max(...extents) > 2 * Math.min(...extents),
    };
  }

  /** A plane vector scaled to length 1. */
  function unit2(a: [number, number]): [number, number] {
    const l: number = Math.hypot(a[0], a[1]) || 1;
    return [a[0] / l, a[1] / l];
  }
}
