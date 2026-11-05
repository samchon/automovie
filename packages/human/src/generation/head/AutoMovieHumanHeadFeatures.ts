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
 * Each dome's stem extends twice the estimated host sagitta behind its cap
 * base (`AutoMovieHumanHeadDome.sagitta`). This local estimate does not prove
 * whole-footprint containment or a successful intersection. The brow ridge, forehead eminence, malar eminence, cheek and
 * chin pad have no part: P already passes their skin, or no law gives their
 * projection over the head mass. The original mass itself owns the supplied
 * zygion width; an outward dome cannot narrow an already wider flank. Each part's own
 * laws (#3053 to #3056) refine these.
 *
 * @evidence contracts/common.md#principled-implementation Places the nose, lips and own-side orbital cutters from their actual source landmarks and head-mass section reads. Sagitta and the nasion-profile eye seat remain construction estimates, with intersection and opening checks owned downstream.
 * @evidence contracts/common.md#clear-and-simple-design Returns one fixed feature list with parent, operator and search metadata; the part owners define the curves and HeadTree defines their joins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native reference fit or post-join relocation enters this assembly. The inset floor, recess and profile choices remain declared conventions rather than measured tissue thickness or containment proofs.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original features, orbital cutters, estimated embedding and unfinished openings from a completed skin.
 * @evidence contracts/performance.md#efficient-algorithms A fixed nose, two lips and two orbit sources use bounded section/radius reads and Dome's fixed station count; no body realization or reference scan occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Each feature is constructed once and its original source is returned for Composer; the paired orbits use their own input fields through the same builder.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned views and metadata. This namespace holds only scalar constants and functions, with no retained figure, cache or handle.
 */
export namespace AutoMovieHumanHeadFeatures {
  /**
   * One original part and the metadata its tree join consumes.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the actual source/declaration, parent/operator, world-mm seed, size and optional phase/share search together without changing geometry at the join boundary.
   * @evidence contracts/common.md#clear-and-simple-design One record serves Composer and HeadTree for both top-level and nested features.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A seed/search is an authored join request, not proof of a host crossing or successful blend.
   * @evidence contracts/common.md#meaningful-documentation Fields state units, borrowed original-view identity, defaults and the distinction between search metadata and geometry.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A data contract runs no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A data contract coordinates no execution.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A data contract acquires no runtime resources; the containing composition owns its records.
   */
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

  /**
   * Existing nominal inward embedding allowance, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Declares the retained 3 mm allowance separately from the host-sagitta estimate and actual intersection checks.
   * @evidence contracts/common.md#clear-and-simple-design One scalar serves this feature assembly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The allowance is not measured tissue thickness, a person branch or a response to a failed join.
   * @evidence contracts/common.md#meaningful-documentation States its nominal embedding role and calibration units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar constant chooses no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A scalar constant coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar constant retains no resources.
   */
  export const INSET: number = 3;

  /**
   * Every face part of a person.
   *
   * @param plan The landmark skeleton.
   * @param mass The identical head-mass source whose origin, outlines and fullness place its neighbours.
   * @returns The parts, both sides of a pair each built in its own frame.
   *
   * @evidence contracts/common.md#principled-implementation Reads the actual mass's nasal forward fall and each orbital front/radius, authors the same public nasal/lip sources, and retains each eye's own dimensions in an inward recess cutter.
   * @evidence contracts/common.md#clear-and-simple-design Builds one nose, two lips and two orbit records; each source owner and the tree's join owner retain their separate jobs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads no native mesh or join result. The 3 mm floor and profile/recess seat are explicit modelling choices, not certified containment or an eyelid opening.
   * @evidence contracts/common.md#meaningful-documentation Identifies actual mass ownership, calibration-mm placement and original-source output; join metadata does not certify realized skin.
   * @evidence contracts/performance.md#efficient-algorithms Fixed five-feature work uses bounded source-section/radius queries and fixed-size source construction; no complete body or reference is realized here.
   * @evidence contracts/performance.md#reuse-equivalent-work The supplied mass is borrowed for placement rather than rebuilt, and every source is returned once for Composer's retained declaration/loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned views and metadata belong to the caller; temporary arrays and the local orbit builder add no cache, background work or retained external handle.
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
