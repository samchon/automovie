import {
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadEyeOpening } from "../IAutoMovieHumanHeadEyeOpening";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadLipPart } from "./AutoMovieHumanHeadLipPart";
import { AutoMovieHumanHeadMassPart } from "./AutoMovieHumanHeadMassPart";
import { AutoMovieHumanHeadNosePart } from "./AutoMovieHumanHeadNosePart";

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
 * @evidence contracts/performance.md#efficient-algorithms A fixed feature set uses original parent scalar preparations, source-site ordering and bounded native contact inverses at their owners' costs. The lips share one prepared native contact; each cap has a fixed station count.
 * @evidence contracts/performance.md#reuse-equivalent-work Each feature is constructed once and its original source is returned for Composer; the paired orbits use their own input fields through the same builder.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned views and metadata. This namespace holds only scalar constants and functions, with no retained figure, cache or handle.
 */
export namespace AutoMovieHumanHeadFeatures {
  /**
   * One original part and the metadata its tree join consumes.
   *
   * @evidence contracts/common.md#principled-implementation Keeps actual geometry, cumulative tree parent, original material owner/contact and independent world-mm placement seed with the authored join search.
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

    /** Original anatomical or conventional placement anchor, world mm, independent of a derived material contact. */
    seed: [number, number, number];

    /** Actual cap contact station, mm; other feature families retain their declared station convention. */
    contact: number;

    /** The part's own size the blend width follows: its height and its least half extent, mm. */
    size: [number, number];

    /** The part it joins: `head.mass`, or another part's chain name. */
    parent: string;

    /** Actual original material source, independently of the cumulative tree parent. */
    material?: IAutoMovieViewPart;

    /** Same complete native contact used by a cap's embedding; its placement seed remains separate. */
    attachment?: AutoMovieHumanHeadDome.IHost;

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
   * @evidence contracts/performance.md#efficient-algorithms Five feature sources retain their original scalar-admission and bounded section-inversion costs; one shared lip contact serves both lips, while orbital contacts sort original sites and search bounded native/plane brackets before curvature and fixed-size cap work.
   * @evidence contracts/performance.md#reuse-equivalent-work The supplied mass is borrowed for placement rather than rebuilt, and every source is returned once for Composer's retained declaration/loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned views and metadata belong to the caller; temporary arrays and the local orbit builder add no cache, background work or retained external handle.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    attempts?: AutoMovieHumanHeadDome.IAttempt[],
  ): IFeature[] {
    return prepare(plan, mass, attempts).read();
  }

  /** Explicit top-level regional requests share their actual numeric contact owner. */
  export interface IPrepared {
    /** Actual constructor keys in original production order, without building geometry. */
    readonly names: readonly string[];

    /** Request only these top-level originals; absence requests the complete top-level set. */
    read(names?: readonly string[]): IFeature[];
  }

  /** One factory's actual return or original thrown value, owned by this preparation. */
  type IAttempt =
    | { kind: "returned"; parts: IFeature[] }
    | { kind: "threw"; error: unknown };

  /** Names of these same five factory slots; no parent input or geometry is required. */
  export function names(): string[] {
    return ["nose", "lip.upper", "lip.lower", "orbit.left", "orbit.right"];
  }

  /** Prepare the five original factories; no host read or regional constructor runs here. */
  export function prepare(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    attempts?: AutoMovieHumanHeadDome.IAttempt[],
  ): IPrepared {
    const k: number = plan.scale;
    let contact: AutoMovieHumanHeadLipPart.IContact | undefined;

    /** The paired lips borrow this same actual original contact at explicit demand. */
    const lipContact: () => AutoMovieHumanHeadLipPart.IContact =
      (): AutoMovieHumanHeadLipPart.IContact => {
        contact ??= AutoMovieHumanHeadLipPart.contact(mass, plan.stomion);
        return contact;
      };

    /** Only this requested source reads the original mass's nasal fall. */
    const nose: () => IFeature[] = (): IFeature[] => {
      // The nose's body from its views (`AutoMovieHumanHeadNosePart`), its axis
      // the inset and twice the face's sagitta under its half width behind the
      // profile, so its sides lie inside the face where the face turns back.
      const middle: number = (plan.nasion + plan.tip) / 2;
      const fall: number =
        AutoMovieHumanHeadMassPart.frontAt(mass, middle, 0) -
        AutoMovieHumanHeadMassPart.frontAt(mass, middle, plan.noseWidth);
      const depth: number = INSET + 2 * fall;
      return [
        {
          part: AutoMovieHumanHeadNosePart.of(plan, depth),
          join: "merge",
          seed: [
            AutoMovieHumanHeadMedianProfile.profileAt(plan, middle),
            middle,
            0,
          ],
          contact: INSET,
          size: [plan.noseLead, plan.noseWidth],
          parent: "head.mass",
          material: mass,
          elongated: true,
          search: { phase: 0, from: 0.5, to: 0 },
        },
      ];
    };

    /** Each lip keeps its original source and shares only its contact preparation. */
    const lip: (upper: boolean) => IFeature[] = (
      upper: boolean,
    ): IFeature[] => {
      return [
        {
          part: AutoMovieHumanHeadLipPart.of(plan, upper, mass, lipContact()),
          join: "merge",
          seed: [plan.landmarks.stomion[0], plan.stomion, 0],
          contact: 0,
          size: [upper ? plan.upperLip : plan.lowerLip, plan.mouthWidth],
          parent: "head.mass",
          material: mass,
          elongated: true,
          search: { phase: Math.PI / 2, from: 0, to: 1 },
        },
      ];
    };

    /** Each orbital cutter owns its actual side input and explicit native host reads. */
    const orbit: (
      side: "left" | "right",
      sign: 1 | -1,
      eye: IAutoMovieHumanHeadEyeOpening,
    ) => IFeature[] = (
      side: "left" | "right",
      sign: 1 | -1,
      eye: IAutoMovieHumanHeadEyeOpening,
    ): IFeature[] => {
      const face: AutoMovieHumanHeadPrior.IFace =
        AutoMovieHumanHeadPrior.PRIOR.face;
      const z: number = sign * eye.place;
      const front: number = AutoMovieHumanHeadMassPart.frontAt(
        mass,
        plan.eye,
        z,
      );

      // The cutter reaches the lid margin, the prior's recess behind the
      // nasion's skin (`face.eyeRecess`): the closed lids over the globe are
      // the floor it leaves, so the head has no lid parts of its own. Lids
      // standing inside the bare head mass met nothing to join, and a cut to
      // the bony socket left a pit the globe is not there to fill.
      const floor: number =
        AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.nasion) -
        face.eyeRecess * k;
      const depth: number = Math.max(INSET, front - floor);
      return dome(
        `orbit.${side}`,
        "diff",
        [front + INSET, plan.eye, z],
        [-1, 0, 0],
        [0, 0, sign],
        [eye.length / 2, eye.height, eye.length / 2, eye.height],
        depth + INSET,
        2,
        [front, plan.eye, z],
        mass,
        attempts,
      );
    };
    const builders: readonly (() => IFeature[])[] = [
      nose,
      (): IFeature[] => lip(true),
      (): IFeature[] => lip(false),
      (): IFeature[] => orbit("left", 1, plan.left),
      (): IFeature[] => orbit("right", -1, plan.right),
    ];
    const factories: ReadonlyMap<string, () => IFeature[]> = new Map(
      names().map((name: string, i: number): [string, () => IFeature[]] => [
        name,
        builders[i]!,
      ]),
    );
    const retained: Map<string, IAttempt> = new Map();
    return {
      names: [...factories.keys()],
      read(names?: readonly string[]): IFeature[] {
        const wanted: Set<string> | null =
          names === undefined ? null : new Set(names);
        return [...factories].flatMap(
          ([name, make]: [string, () => IFeature[]]): IFeature[] => {
            if (wanted !== null && !wanted.has(name)) return [];
            const previous: IAttempt | undefined = retained.get(name);
            if (previous !== undefined) {
              if (previous.kind === "threw") throw previous.error;
              return previous.parts;
            }
            try {
              const parts: IFeature[] = make();
              retained.set(name, { kind: "returned", parts });
              return parts;
            } catch (error: unknown) {
              retained.set(name, { kind: "threw", error });
              throw error;
            }
          },
        );
      },
    };
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
    host?: IAutoMovieViewPart,
    attempts?: AutoMovieHumanHeadDome.IAttempt[],
  ): IFeature[] {
    const h: number = Math.max(INSET + 0.5, height);
    const source: AutoMovieHumanHeadDome.IPart | null =
      AutoMovieHumanHeadDome.attempt(
        {
          name,
          origin,
          outward,
          along,
          extents,
          height: h,
          profile,
          shoulder: AutoMovieViewSection.ELLIPSE,
        },
        host,
        seed,
        attempts,
      );
    return source === null
      ? []
      : [
          {
            part: source,
            join,
            seed,
            contact:
              source.attachment === null || source.attachment.parameter === null
                ? INSET
                : source.stations.at(-1)! - h + source.attachment.parameter,
            size: [h - INSET, Math.min(...extents)],
            parent: "head.mass",
            ...(host === undefined ? {} : { material: host }),
            ...(source.attachment === null
              ? {}
              : { attachment: source.attachment }),
            elongated: Math.max(...extents) > 2 * Math.min(...extents),
          },
        ];
  }
}
