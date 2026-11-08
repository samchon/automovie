import { AutoMovieHumanSiteControls } from "../limb/AutoMovieHumanSiteControls";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmBreadth } from "./AutoMovieHumanArmBreadth";
import { AutoMovieHumanArmFrame } from "./AutoMovieHumanArmFrame";
import { AutoMovieHumanArmHandControls } from "./AutoMovieHumanArmHandControls";

type Vec3 = AutoMovieHumanArmBones.IBones["shoulder"];

/**
 * One arm with its palm as one walk over the humerus, the forearm and the
 * third metacarpal (#3050, #3051): straight along each bone at the neutral
 * pose, the elbow and the wrist C2 turns over their own depths (a joint
 * between nearly collinear segments is a walk station, never a merge), open
 * at its top inside the shoulder girdle, whose merge trims it, and closed at
 * the palm's distal cap by its declared pole the fingers merge onto.
 *
 * Centres: past the glenohumeral centre along the humerus by the deltoid
 * site's largest edge (so the tube's top lies inside the girdle at every
 * phase), the elbow centre, the wrist centre
 * (`AutoMovieHumanArmBones`, de Leva's shares), the third metacarpal's head
 * (the caller's, from the hand's joints), and the dome's tip past it by the
 * palm's distal reach. The bones' directions are the bind pose's, a rig
 * convention (the A-pose's abduction and the hand's carry), not any scanned
 * posture, so the walk's line stands where the rig's arm hangs; the sections
 * about it are the person's.
 *
 * Sites: each the caller's law with its place (bone and share), its box
 * (its four edges from the bone's axis in the walk's chart) and its
 * fullness owner: the deltoid (`bideltoidBreadth`), the biceps tape midway
 * acromion to radiale as the retained olecranon-site proxy, the elbow tape at the epicondyles, the forearm's
 * greatest tape, the wrist tape at stylion, the palm's wrist crease and its
 * knuckle line (`handBreadth`, `handCircumference`).
 * The chart uses base rotation-minimizing transport through WJC. When the
 * caller supplies the hand's radial direction, the engine joins a signed
 * C2 material roll from WJC to MCP3, then carries that constant relative
 * roll with the base frame. The MCP target is projected into its actual
 * normal plane; this is not a fixed angle or a new projection at every site.
 */
export namespace AutoMovieHumanArmWalk {
  /** One invocation shares direct frame and local hand controls across both original consumers. */
  export interface IShared {
    /** Bone-relative chart without section solves or part publication. */
    frame: AutoMovieHumanArmFrame.IOutput;

    /** Local forearm-to-palm owner, independent of upper-arm measurements. */
    hand: AutoMovieHumanArmHandControls.IOutput;
  }

  /** Physical hand chart on the common distal scalar law, beginning at its named wrist tape. */
  export interface IHandChart {
    /** Actual wrist measurement station through the distal cap, calibration mm. */
    domain: readonly [number, number];

    /** Only original hand-chart bracketing stations; no proximal-arm coordinates are prepared. */
    stations: readonly number[];
  }

  /** Common original controls and the declared hand region; no completed arm is retained. */
  export interface IPrepared extends AutoMovieHumanSiteControls.IOutput {
    /** Null controls preserve failure; a null hand chart means the caller supplied no named wrist. */
    controls:
      | (AutoMovieHumanSiteControls.IControls & {
          /** Required physical chart for production hand contacts, without refitting any global scalar. */
          hand: IHandChart | null;
        })
      | null;
  }

  /** Symmetric arms-down width and the independently placed GH, calibration mm. */
  export interface IMeasuring {
    /** Public maximum horizontal breadth in the deltoid region. */
    breadth: number;
    /** Absolute lateral GH coordinate in the neutral measuring convention. */
    lateral: number;
    /** Actual rigid GH-to-elbow length. */
    humerus: number;
  }
  /** One site's law: its name, place, box and owner. */
  export interface ISiteLaw {
    /** The measurement site, named in diagnostics. */
    site: string;

    /** Bone: 1 the humerus, 2 the forearm, 3 the third metacarpal (0 is the run inside the girdle). */
    bone: number;

    /** Share of the bone from its proximal centre. */
    share: number;

    /** Signed edges [+u,+v,-u,-v] from the course axis, calibration mm. Base RMF carries forward +u through WJC; an explicitly supplied hand target adds the WJC-to-MCP3 material roll, making palm +u radial and +v its palmar/dorsal short direction. */
    edges: [number, number, number, number];

    /** A tape solved on the box, or a sourced shoulder. */
    fullness: AutoMovieHumanSiteViewPart.ISite["fullness"];
  }

  /** The sites, from the shoulder to the knuckles. */
  /** The published sites, from the shoulder to the knuckles; a caller may give fewer while a law is owed. */
  export const SITES: readonly string[] = [
    "deltoid",
    "biceps",
    "elbow",
    "forearm",
    "wrist",
    "crease",
    "knuckles",
  ];

  /** Control points and ring phases of every section, a multiple of 4: the trunk's density, over the reference arm's spans. */
  export const ORDER: number = 256;

  /**
   * Prepare the common scalar/frame laws before either adjoining original is published.
   *
   * @param name The chain's name, `arm.left` or `arm.right`.
   * @param bones The side's arm bones.
   * @param knuckle The third metacarpal's head, the palm's last centre.
   * @param reach The palm's distal cap reach past the final centre, half its anatomical palmar/dorsal depth rather than its radial breadth, mm.
   * @param sites The sites by rising place, the first standing nearest the shoulder (its box also fills the run inside the girdle).
   * @param joints The elbow's and the wrist's depths, mm, their turns' lengths.
   * @param gap Widest spacing between layers, mm.
   * @param crease Independent public palm-crease locus, when supplied.
   * @param radial Signed hand-across direction at MCP3; its endpoint normal-plane projection defines the C2 WJC-to-MCP3 roll, held relative to the base RMF afterward. Omission retains the base frame throughout.
   * @param measuring Production bideltoid and independently placed GH. The fixed upper segment is carried rigidly to arms-down; the proximal pole through the humeral midpoint defines this model's deltoid region. A standalone limb without torso inputs omits this width solve.
   * @returns The same normalized scalar/section/frame controls consumed directly by arm publication and hand attachments.
   */
  export function prepare(
    name: string,
    bones: Pick<AutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">,
    knuckle: Vec3,
    reach: number,
    sites: ISiteLaw[],
    joints: { elbow: number; wrist: number },
    gap: number,
    crease?: Vec3,
    radial?: Vec3,
    measuring?: IMeasuring,
    connection?: IShared,
  ): IPrepared {
    const arrangement: AutoMovieHumanArmFrame.IOutput | string =
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
    const fail: (detail: string) => IPrepared = (
      detail: string,
    ): IPrepared => ({
      controls: null,
      diagnostics: [
        {
          producer: `view.${name}`,
          level: 2,
          contract: "shoulder source",
          detail,
        },
      ],
    });
    if (typeof arrangement === "string") return fail(arrangement);
    const source: AutoMovieHumanWalkPart.ISource = arrangement.source;
    const run: number = arrangement.run;
    const d: number = arrangement.humerus;
    const handControls: AutoMovieHumanArmHandControls.IOutput | undefined =
      connection?.hand ??
      (source.input.sites.some(
        (site: AutoMovieHumanSiteViewPart.ISite): boolean =>
          site.site === "forearm",
      ) &&
      source.input.sites.some(
        (site: AutoMovieHumanSiteViewPart.ISite): boolean =>
          site.site === "wrist",
      )
        ? AutoMovieHumanArmHandControls.create(arrangement)
        : undefined);
    if (handControls?.hand.controls === null) return handControls.hand;
    const connected: AutoMovieHumanSiteViewPart.IInput =
      handControls?.connect(source.input) ?? source.input;

    /** Original callers lacking a hand chart retain their direct whole-source controls. */
    const shared: (input: AutoMovieHumanSiteViewPart.IInput) => IPrepared = (
      input: AutoMovieHumanSiteViewPart.IInput,
    ): IPrepared => {
      const prepared: AutoMovieHumanSiteControls.IOutput =
        AutoMovieHumanSiteControls.prepare(input);
      if (prepared.controls === null)
        return { controls: null, diagnostics: prepared.diagnostics };
      const original: AutoMovieHumanSiteControls.IControls = prepared.controls;
      const wrist: AutoMovieHumanSiteViewPart.ISite | undefined =
        input.sites.find(
          (site: AutoMovieHumanSiteViewPart.ISite): boolean =>
            site.site === "wrist",
        );
      const hand: IHandChart | null =
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
    };
    const prepareInput: (
      input: AutoMovieHumanSiteViewPart.IInput,
    ) => IPrepared = handControls?.prepare ?? shared;
    if (measuring === undefined) return prepareInput(connected);
    const end: number = source.station(
      0,
      (run + measuring.humerus / 2) / (run + d),
    );
    if (!(end <= source.runs[0]!.end))
      return fail(
        "The selected deltoid measuring domain enters the elbow turn",
      );
    const normalized: AutoMovieHumanArmBreadth.IResult | string =
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

  /** Publish this actual arm from its shared generating controls; callers needing the palm request prepare directly. */
  export function define(
    ...args: Parameters<typeof prepare>
  ): AutoMovieHumanSiteViewPart.IDefinition {
    return AutoMovieHumanSiteViewPart.fromControls(prepare(...args));
  }

  /** Loft the same normalized definition that attachment consumers can retain. */
  export function create(
    name: string,
    bones: Pick<AutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">,
    knuckle: Vec3,
    reach: number,
    sites: ISiteLaw[],
    joints: { elbow: number; wrist: number },
    gap: number,
    crease?: Vec3,
    radial?: Vec3,
    measuring?: IMeasuring,
  ): AutoMovieHumanSiteViewPart.IResult {
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
