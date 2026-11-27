import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmBones,
  IAutoMovieHumanArmBreadth,
  IAutoMovieHumanArmFrame,
  IAutoMovieHumanArmHandControls,
  IAutoMovieHumanArmJointWindows,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSiteControls,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanWalkPart,
} from "@automovie/interface";

import { AutoMovieHumanSiteControls } from "./AutoMovieHumanSiteControls";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanArmBreadth } from "./AutoMovieHumanArmBreadth";
import { AutoMovieHumanArmFrame } from "./AutoMovieHumanArmFrame";
import { AutoMovieHumanArmHandControls } from "./AutoMovieHumanArmHandControls";

/**
 * One arm with its palm as one walk over the humerus, the forearm and the third
 * metacarpal (#3050, #3051): straight along each bone at the neutral pose, the
 * elbow and the wrist C2 turns over their own depths (a joint between nearly
 * collinear segments is a walk station, never a merge), open at its top inside
 * the shoulder girdle, whose merge trims it, and closed at the palm's distal
 * cap by its declared pole the fingers merge onto.
 *
 * Centres: past the glenohumeral centre along the humerus by the deltoid site's
 * largest edge (so the tube's top lies inside the girdle at every phase), the
 * elbow centre, the wrist centre (`AutoMovieHumanArmBones`, de Leva's shares),
 * the third metacarpal's head (the caller's, from the hand's joints), and the
 * dome's tip past it by the palm's distal reach. The bones' directions are the
 * bind pose's, a rig convention (the A-pose's abduction and the hand's carry),
 * not any scanned posture, so the walk's line stands where the rig's arm hangs;
 * the sections about it are the person's.
 *
 * Sites: each the caller's law with its place (bone and share), its box (its
 * four edges from the bone's axis in the walk's chart) and its fullness owner:
 * the deltoid (`bideltoidBreadth`), the biceps tape midway acromion to radiale
 * as the retained olecranon-site proxy, the elbow tape at the epicondyles, the
 * forearm's greatest tape, the wrist tape at stylion, the palm's wrist crease
 * and its knuckle line (`handBreadth`, `handCircumference`). The chart uses
 * base rotation-minimizing transport through WJC. When the caller supplies the
 * hand's radial direction, the engine joins a signed C2 material roll from WJC
 * to MCP3, then carries that constant relative roll with the base frame. The
 * MCP target is projected into its actual normal plane; this is not a fixed
 * angle or a new projection at every site.
 */
export namespace AutoMovieHumanArmWalk {
  /** The sites, from the shoulder to the knuckles. */
  /**
   * The published sites, from the shoulder to the knuckles; a caller may give
   * fewer while a law is owed.
   */
  export const SITES: readonly string[] = [
    "deltoid",
    "biceps",
    "elbow",
    "forearm",
    "wrist",
    "crease",
    "knuckles",
  ];

  /**
   * Control points and ring phases of every section, a multiple of 4: the
   * trunk's density, over the reference arm's spans.
   */
  export const ORDER: number = 256;

  /**
   * Prepare the common scalar/frame laws before either adjoining original is
   * published.
   *
   * @param name The chain's name, `arm.left` or `arm.right`.
   * @param bones The side's arm bones.
   * @param knuckle The third metacarpal's head, the palm's last centre.
   * @param reach The palm's distal cap reach past the final centre, half its
   *   anatomical palmar/dorsal depth rather than its radial breadth, mm.
   * @param sites The sites by rising place, the first standing nearest the
   *   shoulder (its box also fills the run inside the girdle).
   * @param joints The elbow's and the wrist's depths, mm, their turns' lengths.
   * @param gap Widest spacing between layers, mm.
   * @param crease Independent public palm-crease locus, when supplied.
   * @param radial Signed hand-across direction at MCP3; its endpoint
   *   normal-plane projection defines the C2 WJC-to-MCP3 roll, held relative to
   *   the base RMF afterward. Omission retains the base frame throughout.
   * @param measuring Production bideltoid and independently placed GH. The
   *   fixed upper segment is carried rigidly to arms-down; the proximal pole
   *   through the humeral midpoint defines this model's deltoid region. A
   *   standalone limb without torso inputs omits this width solve.
   * @returns The same normalized scalar/section/frame controls consumed
   *   directly by arm publication and hand attachments.
   */
  export function prepare(
    name: string,
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">,
    knuckle: AutoMovieVector3Tuple,
    reach: number,
    sites: IAutoMovieHumanArmWalk.ISiteLaw[],
    joints: IAutoMovieHumanArmJointWindows,
    gap: number,
    crease?: AutoMovieVector3Tuple,
    radial?: AutoMovieVector3Tuple,
    measuring?: IAutoMovieHumanArmWalk.IMeasuring,
    connection?: IAutoMovieHumanArmWalk.IShared,
  ): IAutoMovieHumanArmWalk.IPrepared {
    const arrangement: IAutoMovieHumanArmFrame.IOutput | string =
      connection?.frame ??
      AutoMovieHumanArmFrame.create({
        name,
        bones,
        knuckle,
        reach,
        sites,
        joints,
        gap,
        crease,
        radial,
        order: ORDER,
      });
    function fail(detail: string): IAutoMovieHumanArmWalk.IPrepared {
      return {
        controls: null,
        diagnostics: [
          {
            producer: `view.${name}`,
            level: 2,
            contract: "shoulder source",
            detail,
          },
        ],
      };
    }
    if (typeof arrangement === "string") return fail(arrangement);
    const source: IAutoMovieHumanWalkPart.ISource = arrangement.source;
    const run: number = arrangement.run;
    const d: number = arrangement.humerus;
    const handControls: IAutoMovieHumanArmHandControls.IOutput | undefined =
      connection?.hand ??
      (source.input.sites.some(
        (site: IAutoMovieHumanSectionSite): boolean => site.site === "forearm",
      ) &&
      source.input.sites.some(
        (site: IAutoMovieHumanSectionSite): boolean => site.site === "wrist",
      )
        ? AutoMovieHumanArmHandControls.create(arrangement)
        : undefined);
    if (handControls?.hand.controls === null) return handControls.hand;
    const connected: IAutoMovieHumanSectionSource =
      handControls?.connect(source.input) ?? source.input;

    /**
     * Original callers lacking a hand chart retain their direct whole-source
     * controls.
     */
    function shared(
      input: IAutoMovieHumanSectionSource,
    ): IAutoMovieHumanArmWalk.IPrepared {
      const prepared: IAutoMovieHumanSiteControls.IOutput =
        AutoMovieHumanSiteControls.prepare(input);
      if (prepared.controls === null)
        return { controls: null, diagnostics: prepared.diagnostics };
      const original: IAutoMovieHumanSiteControls.IControls = prepared.controls;
      const wrist: IAutoMovieHumanSectionSite | undefined = input.sites.find(
        (site: IAutoMovieHumanSectionSite): boolean => site.site === "wrist",
      );
      const hand: IAutoMovieHumanArmWalk.IHandChart | null =
        wrist === undefined
          ? null
          : {
              domain: [wrist.station, original.scalars.stations.at(-1)!],
              stations: [
                wrist.station,
                ...original.scalars.stations.filter(
                  (station: number): boolean => station > wrist.station,
                ),
              ],
            };
      return {
        controls: { ...original, hand },
        diagnostics: prepared.diagnostics,
      };
    }
    const prepareInput: (
      input: IAutoMovieHumanSectionSource,
    ) => IAutoMovieHumanArmWalk.IPrepared = handControls?.prepare ?? shared;
    if (measuring === undefined) return prepareInput(connected);
    const end: number = source.station(
      0,
      (run + measuring.humerus / 2) / (run + d),
    );
    if (!(end <= source.runs[0]!.end))
      return fail(
        "The selected deltoid measuring domain enters the elbow turn",
      );
    const normalized: IAutoMovieHumanArmBreadth.IResult | string =
      AutoMovieHumanArmBreadth.fit(
        connected,
        name.endsWith("left") ? "left" : "right",
        [0, end],
        measuring.breadth,
        measuring.lateral,
      );
    return typeof normalized === "string"
      ? fail(normalized)
      : prepareInput(normalized.input);
  }

  /**
   * Publish this actual arm from its shared generating controls; callers
   * needing the palm request prepare directly.
   */
  export function define(
    ...args: IAutoMovieHumanArmWalk.DefineArgs
  ): IAutoMovieHumanSourceDefinition {
    return AutoMovieHumanSiteViewPart.fromControls(prepare(...args));
  }

  /** Loft the same normalized definition that attachment consumers can retain. */
  export function create(
    name: string,
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">,
    knuckle: AutoMovieVector3Tuple,
    reach: number,
    sites: IAutoMovieHumanArmWalk.ISiteLaw[],
    joints: IAutoMovieHumanArmJointWindows,
    gap: number,
    crease?: AutoMovieVector3Tuple,
    radial?: AutoMovieVector3Tuple,
    measuring?: IAutoMovieHumanArmWalk.IMeasuring,
  ): IAutoMovieHumanSourceRealization {
    return AutoMovieHumanSiteViewPart.loft(
      define(
        name,
        bones,
        knuckle,
        reach,
        sites,
        joints,
        gap,
        crease,
        radial,
        measuring,
      ),
    );
  }
}
