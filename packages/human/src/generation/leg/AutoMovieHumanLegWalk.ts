import type { IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanLegBones } from "./AutoMovieHumanLegBones";
import { AutoMovieHumanLegDistal } from "./AutoMovieHumanLegDistal";
import { AutoMovieHumanLegProximal } from "./AutoMovieHumanLegProximal";

/** A calibration-mm point or a unit course direction. */
type Vec3 = AutoMovieHumanLegBones.Vec3;

/**
 * One leg as one walk over the femur and the tibia (#3048): straight along
 * each bone's mechanical axis at the neutral pose, the knee a C2 turn over
 * its own depth. Declared extension domes close the base course above and
 * below the limb. A supplied actual hip parent constrains the unmeasured
 * proximal outward source; the foot reads the same actual ankle source.
 * Final joining remains the construction tree's separate responsibility.
 *
 * Ends. Above the hip centre the walk runs on along the femur's line by the
 * thigh site's largest edge; below
 * the ankle centre it runs on along the tibia's line by the ankle site's
 * largest edge. These engineering reaches place closing points, not a proof
 * that every hidden phase is contained or crosses its host once. The actual
 * canonical hip field supplies the optional proximal contact and physical
 * jets; the named-thigh-and-later source is retained. A local source transfer
 * alone does not certify the complete contact arc or final world C2.
 *
 * Sites. The five published tapes the anatomy carries at their sites (ISO 8559-1 5.3.20 thigh
 * below the gluteal fold, ANSUR II's lower thigh at the suprapatella, 5.3.22 the knee
 * at mid-patella, 5.3.24 the calf at its widest, 5.3.26 the ankle at its
 * least), each placed on its bone by its height and owning the section's
 * fullness there; each site's box (its anterior, lateral, posterior and
 * medial edges from the bone's axis) is the caller's law, its named edge
 * toward the median plane stopped there. Continuous source clearance is
 * checked separately. The knee's
 * depth sets the knee's turn.
 */
export namespace AutoMovieHumanLegWalk {
  /** One site's law, calibration mm. */
  export interface ISiteLaw {
    /** Height of the site over the floor. */
    height: number;

    /** The box's edges from the bone's axis: anterior, toward +Z (lateral on the left leg, medial on the right), posterior (negative), toward -Z (negative). */
    edges: [number, number, number, number];

    /** The tape there. */
    girth: number;
  }

  /**
   * Public tape laws and optional retained shape rows of the same source.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the five public sites distinct from normalized profile rows that author their intervening shape.
   * @evidence contracts/common.md#clear-and-simple-design A callable lookup and optional names preserve existing callers without a parallel curve owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Intermediate names do not become new measurements or sampled mesh readback.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes published site identities from retained placement/shape proxies.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callable data contract executes no interpolation.
   * @evidence contracts/performance.md#reuse-equivalent-work One law supplies public and intermediate sites to the same construction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the lookup and its finite list for one source definition.
   */
  export interface ILaw {
    /** A named calibration-mm site from the same resolved inputs. */
    (site: string): ISiteLaw;
    /** Retained intermediate shape names; the public SITES remain separately identifiable. */
    intermediate?: readonly string[];
  }

  /** The sites, from the hip down. */
  export const SITES: readonly string[] = [
    "thigh",
    "lowerThigh",
    "knee",
    "calf",
    "ankle",
  ];

  /** Control points and ring phases of every section: 256, over four times the reference pack's about 57 spans per leg section (`generalization.md`, Leg), a multiple of 4. */
  export const ORDER: number = 256;

  /** The exact pre-loft leg and the source station of its shared ankle anchor. */
  export type IDefinition = AutoMovieHumanSiteViewPart.IDefinition & {
    /** Physical station of bone 2/share 1 in this identical source, mm. */
    ankleStation: number;
    /** Same actual parent contact used to author the unmeasured proximal source. */
    proximal?: AutoMovieHumanLegProximal.IContact;
    /** Identical measured interval retained by the base, coupled trials/final and ankle consumer. */
    distal?: ReturnType<typeof AutoMovieHumanLegDistal>;
  };

  /** The canonical trial/final parent and its own named hip station. */
  export type IProximalParent = AutoMovieHumanLegProximal.IParent;

  /**
   * Prepare the actual leg family once; its retained distal interval serves the foot while the full proximal source is separately assembled.
   *
   * @evidence contracts/common.md#principled-implementation WalkPart owns the unchanged bones/sites and ankle mapping; an actual supplied hip parent authors only the unmeasured outward prefix, preserving complete named-thigh-and-later source functions.
   * @evidence contracts/common.md#clear-and-simple-design Returns the pure part/view preparation and ankle station together, leaving one loft to its consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Changes no bone, independent ankle section or public tape; a failed actual-parent transfer is not replaced by the old unsupported cap.
   * @evidence contracts/common.md#meaningful-documentation States calibration units and preserves a failed source as its axis diagnostic.
   * @evidence contracts/performance.md#efficient-algorithms Delegates one O(n) source/definition preparation without lofting.
   * @evidence contracts/performance.md#reuse-equivalent-work The returned definition is shared by the real leg loft and foot connection.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous body definition owns the finite preparation and ankle station.
   */
  export function define(
    name: string,
    bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">,
    law: ILaw,
    gap: number,
    parent?: IProximalParent,
  ): IDefinition {
    const prepared: AutoMovieHumanWalkPart.ISource | string = source(
      name,
      bones,
      law,
      gap,
    );
    if (typeof prepared === "string")
      return {
        part: null,
        view: null,
        ankleStation: NaN,
        diagnostics: [
          {
            producer: `walk.${name}`,
            level: 2,
            contract: "axis",
            detail: prepared,
          },
        ],
      };
    const base: IDefinition = {
      ...AutoMovieHumanSiteViewPart.define(prepared.input),
      ankleStation: prepared.station(2, 1),
    };
    if (base.part !== null) {
      const thigh: IAutoMovieViewPart.IKnot | undefined =
        base.part.front.positive.knots.find(
          (k: IAutoMovieViewPart.IKnot): boolean => k.site === "thigh",
        );
      if (thigh === undefined)
        throw new Error(
          "The actual leg has no named thigh for its retained distal authority",
        );
      base.distal = AutoMovieHumanLegDistal(base.part, thigh.station);
    }
    return parent === undefined ? base : reparent(base, parent);
  }

  /**
   * Author one actual trial from the immutable base preparation. Reusing that
   * base avoids solving the identical five tapes again for every parent trial.
   * A previous trial is not a new base and cannot accumulate shape changes.
   *
   * @evidence contracts/common.md#principled-implementation The original named thigh supplies its station and actual chart; the parent local transfer changes only the unsupported outward prefix and preserves the original ankle station and other complete functions.
   * @evidence contracts/common.md#clear-and-simple-design The same operation serves define(parent) and the coupled parent/leg tape caller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects an already reparented trial, missing canonical view or failed contact; it neither reuses a different parent as final nor falls back to the old cap.
   * @evidence contracts/common.md#meaningful-documentation Identifies immutable base versus actual trial ownership and the complete source preservation below the thigh.
   * @evidence contracts/performance.md#efficient-algorithms One source contact and O(n log n) emission-station union replace repeated unchanged girth preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the prepared base axis, unchanged edge/fullness objects and canonical metre declaration across trials.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns each trial result; this operation retains no old trial or global cache.
   */
  export function reparent(
    base: IDefinition,
    parent: IProximalParent,
  ): IDefinition {
    if (base.part === null) return base;
    const name: string = base.part.name;
    try {
      if (base.view === null || base.proximal !== undefined)
        throw new Error(
          "Proximal trial needs the unchanged base and its actual canonical view",
        );
      const thigh: IAutoMovieViewPart.IKnot | undefined =
        base.part.front.positive.knots.find(
          (site: IAutoMovieViewPart.IKnot): boolean => site.site === "thigh",
        );
      if (thigh === undefined)
        throw new Error(
          "Actual proximal leg source has no original public thigh station",
        );
      const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
        base.part.axis.at(thigh.station);
      const side: number = Math.sign(frame.origin[2] * frame.v[2]);
      if (side !== 1 && side !== -1)
        throw new Error(
          "Actual proximal leg source has no oriented lateral guide",
        );
      const proximal: AutoMovieHumanLegProximal.IResult =
        AutoMovieHumanLegProximal.create(
          base.part,
          thigh.station,
          parent,
          side,
        );
      const part: IAutoMovieViewPart = {
        ...base.part,
        side:
          side === 1
            ? { ...base.part.side, positive: proximal.outline }
            : { ...base.part.side, negative: proximal.outline },
        stations: [
          ...new Set([...base.part.stations, proximal.contact.station]),
        ].sort((a: number, b: number): number => a - b),
      };
      return {
        ...base,
        part,
        view: AutoMovieHumanConstructionView.of(part, base.view.axis),
        proximal: proximal.contact,
      };
    } catch (error) {
      return {
        part: null,
        view: null,
        ankleStation: base.ankleStation,
        diagnostics: [
          ...base.diagnostics,
          {
            producer: `walk.${name}.proximal`,
            level: 3,
            contract: "parent contact",
            detail: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  }

  /**
   * Build and loft one leg.
   *
   * @param name The chain's name, `leg.left` or `leg.right`.
   * @param bones The side's hip, knee and ankle centres (`AutoMovieHumanLegBones.of`, reflected for the right).
   * @param law Each public site's law by SITES, with optional named intermediate rows of that same retained source profile.
   * @param gap Widest spacing between layers, mm.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(
    name: string,
    bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">,
    law: ILaw,
    gap: number,
    parent?: IProximalParent,
  ): AutoMovieHumanSiteViewPart.IResult {
    return AutoMovieHumanSiteViewPart.loft(
      define(name, bones, law, gap, parent),
    );
  }

  /**
   * Declare the base leg and its authoritative bone-to-station mapping.
   * define owns an optional actual-parent proximal replacement. The foot
   * borrows the unchanged distal authority shared with that final definition;
   * complete-parent and production-loft requests still require the actual parent.
   * All coordinates and station lengths use calibration millimetres.
   *
   * @evidence contracts/common.md#principled-implementation Retains the original site placement, gaps, bone frame, cap reaches, fullness and named tape laws while exposing WalkPart's authoritative station mapping.
   * @evidence contracts/common.md#clear-and-simple-design One declaration feeds pure definition and the existing realization path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no parallel leg, recovered box, changed input or new anatomy datum.
   * @evidence contracts/common.md#meaningful-documentation States that source separation changes ownership access, not the accepted source geometry or public tape identities.
   * @evidence contracts/performance.md#efficient-algorithms Visits the finite named/intermediate site inventory once before the shared walk source preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same WalkPart source and station function for all consumers.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the declaration and its finite source arrays; no mesh or global cache is retained.
   */
  export function source(
    name: string,
    bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">,
    law: ILaw,
    gap: number,
  ): AutoMovieHumanWalkPart.ISource | string {
    const laws: ISiteLaw[] = SITES.map((s: string): ISiteLaw => law(s));
    const reach: (l: ISiteLaw) => number = (l: ISiteLaw): number =>
      Math.max(...l.edges.map(Math.abs));
    const along: (from: Vec3, to: Vec3, by: number) => Vec3 = (
      from: Vec3,
      to: Vec3,
      by: number,
    ): Vec3 => {
      const d: number = Math.hypot(
        to[0] - from[0],
        to[1] - from[1],
        to[2] - from[2],
      );
      return [
        to[0] + ((to[0] - from[0]) * by) / d,
        to[1] + ((to[1] - from[1]) * by) / d,
        to[2] + ((to[2] - from[2]) * by) / d,
      ];
    };
    const top: Vec3 = along(bones.knee, bones.hip, reach(laws[0]!));
    const bottom: Vec3 = along(
      bones.knee,
      bones.ankle,
      reach(laws[laws.length - 1]!),
    );

    // A site's share of its bone from its height: the femur (bone 1) from
    // the hip down, the tibia (bone 2) from the knee down.
    const place: (height: number) => { bone: number; share: number } = (
      height: number,
    ): { bone: number; share: number } =>
      height >= bones.knee[1]
        ? {
            bone: 1,
            share: (bones.hip[1] - height) / (bones.hip[1] - bones.knee[1]),
          }
        : {
            bone: 2,
            share: (bones.knee[1] - height) / (bones.knee[1] - bones.ankle[1]),
          };
    // A leg and its mirror (J6) meet at the median plane and never cross it:
    // a site's edge toward the plane stops there, measured from the bone's
    // line at the site.
    const median: (
      height: number,
      edges: [number, number, number, number],
    ) => [number, number, number, number] = (
      height: number,
      edges: [number, number, number, number],
    ): [number, number, number, number] => {
      const { bone, share } = place(height);
      const [from, to]: [Vec3, Vec3] =
        bone === 1 ? [bones.hip, bones.knee] : [bones.knee, bones.ankle];
      const z: number = from[2] + share * (to[2] - from[2]);
      return z > 0
        ? [edges[0], edges[1], edges[2], Math.max(edges[3], -z)]
        : z < 0
          ? [edges[0], Math.min(edges[1], -z), edges[2], edges[3]]
          : edges;
    };
    // The retained profile rows constrain the source shape itself, instead
    // of reading that profile at five sites and replacing it by a sparse
    // angle spline influenced by the two hidden poles. Public tapes remain
    // their own unaltered sites. The intermediate rows are not measurements.
    const placed: { site: string; law: ISiteLaw }[] = [
      ...SITES,
      ...(law.intermediate ?? []),
    ]
      .map((site: string): { site: string; law: ISiteLaw } => ({
        site,
        law: law(site),
      }))
      .sort(
        (a: { law: ISiteLaw }, b: { law: ISiteLaw }): number =>
          b.law.height - a.law.height,
      );
    const sites: AutoMovieHumanWalkPart.ISite[] = placed.map(
      (site: {
        site: string;
        law: ISiteLaw;
      }): AutoMovieHumanWalkPart.ISite => ({
        site: site.site,
        ...place(site.law.height),
        edges: median(site.law.height, site.law.edges),
        fullness: { girth: site.law.girth },
      }),
    );
    const knee: ISiteLaw = laws[SITES.indexOf("knee")]!;
    return AutoMovieHumanWalkPart.source({
      name,
      centres: [top, bones.hip, bones.knee, bones.ankle, bottom],

      // The hip and the ankle continue their bones straight (no turn): their
      // half lengths only keep the turns apart. The knee turns over its depth.
      joints: [
        { half: 1 },
        { half: (knee.edges[0] - knee.edges[2]) / 2 },
        { half: 1 },
      ],
      u: [1, 0, 0],
      sites,

      // Declared extension domes close the base source. Actual local parent
      // transfer and final hidden-containment/crossing admission are separate.
      base: true,
      tip: 0,
      order: ORDER,
      samples: ORDER,
      gap,
    });
  }
}
