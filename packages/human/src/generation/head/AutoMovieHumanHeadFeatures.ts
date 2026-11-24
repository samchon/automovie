import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadEyeOpening,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadLipContact,
  IAutoMovieHumanHeadPrior,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
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
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    return prepare(plan, mass, attempts).read();
  }

  /** One factory's actual return or original thrown value, owned by this preparation. */
  type IAttempt =
    | { kind: "returned"; parts: IAutoMovieHumanHeadFeatures.IFeature[] }
    | { kind: "threw"; error: unknown };

  /** Names of these same five factory slots; no parent input or geometry is required. */
  export function names(): string[] {
    return ["nose", "lip.upper", "lip.lower", "orbit.left", "orbit.right"];
  }

  /** Prepare the five original factories; no host read or regional constructor runs here. */
  export function prepare(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
  ): IAutoMovieHumanHeadFeatures.IPrepared {
    const k: number = plan.scale;
    let contact: IAutoMovieHumanHeadLipContact.IContact | undefined;

    /** The paired lips borrow this same actual original contact at explicit demand. */
    const lipContact: () => IAutoMovieHumanHeadLipContact.IContact =
      (): IAutoMovieHumanHeadLipContact.IContact => {
        contact ??= AutoMovieHumanHeadLipPart.contact(mass, plan.stomion);
        return contact;
      };

    /** Only this requested source reads the original mass's nasal fall. */
    const nose: () => IAutoMovieHumanHeadFeatures.IFeature[] =
      (): IAutoMovieHumanHeadFeatures.IFeature[] => {
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
    const lip: (upper: boolean) => IAutoMovieHumanHeadFeatures.IFeature[] = (
      upper: boolean,
    ): IAutoMovieHumanHeadFeatures.IFeature[] => {
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
    ) => IAutoMovieHumanHeadFeatures.IFeature[] = (
      side: "left" | "right",
      sign: 1 | -1,
      eye: IAutoMovieHumanHeadEyeOpening,
    ): IAutoMovieHumanHeadFeatures.IFeature[] => {
      const face: IAutoMovieHumanHeadPrior.IFace =
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
      const ceiling: number = AutoMovieHumanHeadMassPart.frontCeiling(mass, [
        plan.eye - eye.height,
        plan.eye + eye.height,
      ]);
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
        // Begin in front of the complete orbital footprint. The constant
        // stem ends at the same cap base and leaves the lid floor unchanged.
        ceiling - front,
      );
    };
    const builders: readonly (() => IAutoMovieHumanHeadFeatures.IFeature[])[] =
      [
        nose,
        (): IAutoMovieHumanHeadFeatures.IFeature[] => lip(true),
        (): IAutoMovieHumanHeadFeatures.IFeature[] => lip(false),
        (): IAutoMovieHumanHeadFeatures.IFeature[] =>
          orbit("left", 1, plan.left),
        (): IAutoMovieHumanHeadFeatures.IFeature[] =>
          orbit("right", -1, plan.right),
      ];
    const factories: ReadonlyMap<
      string,
      () => IAutoMovieHumanHeadFeatures.IFeature[]
    > = new Map(
      names().map(
        (
          name: string,
          i: number,
        ): [string, () => IAutoMovieHumanHeadFeatures.IFeature[]] => [
          name,
          builders[i]!,
        ],
      ),
    );
    const retained: Map<string, IAttempt> = new Map();
    return {
      names: [...factories.keys()],
      read(names?: readonly string[]): IAutoMovieHumanHeadFeatures.IFeature[] {
        const wanted: Set<string> | null =
          names === undefined ? null : new Set(names);
        return [...factories].flatMap(
          ([name, make]: [
            string,
            () => IAutoMovieHumanHeadFeatures.IFeature[],
          ]): IAutoMovieHumanHeadFeatures.IFeature[] => {
            if (wanted !== null && !wanted.has(name)) return [];
            const previous: IAttempt | undefined = retained.get(name);
            if (previous !== undefined) {
              if (previous.kind === "threw") throw previous.error;
              return previous.parts;
            }
            try {
              const parts: IAutoMovieHumanHeadFeatures.IFeature[] = make();
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
    attempts?: IAutoMovieHumanHeadDome.IAttempt[],
    stem?: number,
  ): IAutoMovieHumanHeadFeatures.IFeature[] {
    const h: number = Math.max(INSET + 0.5, height);
    const source: IAutoMovieHumanHeadDome.IPart | null =
      AutoMovieHumanHeadDome.attempt(
        {
          name,
          origin,
          outward,
          along,
          extents,
          height: h,
          ...(stem === undefined ? {} : { stem }),
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
