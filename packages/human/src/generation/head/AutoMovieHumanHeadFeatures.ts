import { type IAutoMovieViewPart, AutoMovieViewSection } from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadEyeOpening } from "../IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadNosePart } from "./AutoMovieHumanHeadNosePart";
import { AutoMovieHumanHeadLipPart } from "./AutoMovieHumanHeadLipPart";

/**
 * The face's parts that join the head mass, each drawn from its views in its
 * own frame, with the operator that joins it and the landmark it stands on.
 *
 * | Part | Views from | Join |
 * | --- | --- | --- |
 * | nose | own nasal-chord frame, flat-maximum prn fairing and retained dorsal widths (`AutoMovieHumanHeadNosePart`) | merge |
 * | upper and lower lip | own Euclidean vermilion chord, shared contact and source Cupid's bow (`AutoMovieHumanHeadLipPart`) | merge |
 * | orbit, each side | a dome cutter over the fissure's place on the head mass's own section (`AutoMovieHumanHeadMassPart.frontAt`): the fissure's length and height, back to the lid margin (`face.eyeRecess` behind the nasion's skin) | diff |
 *
 * Each dome's stem sinks twice the sagitta its host's radius leaves under
 * its footprint (`AutoMovieHumanHeadDome.sagitta`), so its base lies inside
 * the host. The brow ridge, forehead eminence, malar eminence, cheek and
 * chin pad have no part: P already passes their skin, or no law gives their
 * projection over the head mass. The original mass itself owns the supplied
 * zygion width; an outward dome cannot narrow an already wider flank. Each part's own
 * laws (#3053 to #3056) refine these.
 */
export namespace AutoMovieHumanHeadFeatures {
  /** A part, its join and its seed. */
  export interface IFeature {
    /** The part's views. */
    part: IAutoMovieViewPart;

    /** Already-authoritative declaration when a downstream course reads this actual part; Composer must preserve it without another conversion. */
    view?: IAutoMovieConstructionView;

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

    /**
     * Where the engine searches the part's station line for its meeting
     * with the parent (`IAutoMovieConstructionSearchSeed`): the phase and the
     * shares of the station range walked; absent, phase 0 from the base
     * (share 0) to the apex (share 1), which a dome crosses its parent on.
     */
    search?: { phase: number; from: number; to: number };
  }

  /** Depth of a part's base inside the head mass, mm. */
  export const INSET: number = 3;

  /**
   * Every face part of a person.
   *
   * @param plan The landmark skeleton.
   * @param mass The identical head-mass source whose origin, outlines and fullness place its neighbours.
   * @returns The parts, both sides of a pair each built in its own frame.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, mass: IAutoMovieViewPart): IFeature[] {
    const k: number = plan.scale;
    const out: IFeature[] = [];

    // The nose's body from its views (`AutoMovieHumanHeadNosePart`), its axis
    // the inset and twice the face's sagitta under its half width behind the
    // profile, so its sides lie inside the face where the face turns back.
    const middle: number = (plan.nasion + plan.tip) / 2;
    const fall: number = AutoMovieHumanHeadMassPart.frontAt(mass, middle, 0) - AutoMovieHumanHeadMassPart.frontAt(mass, middle, plan.noseWidth);
    const depth: number = INSET + 2 * fall;
    out.push({
      part: AutoMovieHumanHeadNosePart.of(plan, depth),
      join: "merge",
      seed: [AutoMovieHumanHeadMedianProfile.profileAt(plan, middle), middle, 0],
      contact: INSET,
      size: [plan.noseLead, plan.noseWidth],
      parent: "head.mass",
      elongated: true,
      search: { phase: 0, from: 0.5, to: 0 },
    });

    // Each lip owns its whole border and the same resting contact arch.
    // A parent-foot translation must not change their shared curve.
    for (const upper of [true, false]) out.push({
      part: AutoMovieHumanHeadLipPart.of(plan, upper, mass),
      join: "merge",
      seed: [plan.landmarks.stomion[0], plan.stomion, 0],
      contact: 0,
      size: [upper ? plan.upperLip : plan.lowerLip, plan.mouthWidth],
      parent: "head.mass",
      elongated: true,
      search: { phase: Math.PI / 2, from: 0, to: 1 },
    });

    // The orbits: cutters from in front of the skin back to the lid margin.
    const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
    const orbit = (side: "left" | "right", sign: 1 | -1, eye: IAutoMovieHumanHeadEyeOpening): void => {
      const z: number = sign * eye.place;
      const front: number = AutoMovieHumanHeadMassPart.frontAt(mass, plan.eye, z);

      // The cutter reaches the lid margin, the prior's recess behind the
      // nasion's skin (`face.eyeRecess`): the closed lids over the globe are
      // the floor it leaves, so the head has no lid parts of its own. Lids
      // standing inside the bare head mass met nothing to join, and a cut to
      // the bony socket left a pit the globe is not there to fill.
      const floor: number = AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) - face.eyeRecess * k;
      const depth: number = Math.max(INSET, front - floor);
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
          AutoMovieHumanHeadMassPart.frontRadiusAt(mass, plan.eye, z),
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
    host?: number,
  ): IFeature {
    const h: number = Math.max(INSET + 0.5, height);
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents, height: h, profile, shoulder: AutoMovieViewSection.ELLIPSE, ...(host === undefined ? {} : { host }) }),
      join,
      seed,
      contact: INSET,
      size: [h - INSET, Math.min(...extents)],
      parent: "head.mass",
      elongated: Math.max(...extents) > 2 * Math.min(...extents),
    };
  }
}
