import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanJointTurn } from "../limb/AutoMovieHumanJointTurn";
import { AutoMovieHumanArmBreadth } from "./AutoMovieHumanArmBreadth";

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
  export const SITES: readonly string[] = ["deltoid", "biceps", "elbow", "forearm", "wrist", "crease", "knuckles"];

  /** Control points and ring phases of every section, a multiple of 4: the trunk's density, over the reference arm's spans. */
  export const ORDER: number = 256;

  /**
   * Build and loft one arm with its palm.
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
   * @returns The part, its loft and the diagnostics.
   */
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
    const laws: ISiteLaw[] = sites;
    const first: ISiteLaw = laws[0]!;
    const run: number = Math.max(...first.edges.map(Math.abs));
    const d: number = Math.hypot(...([0, 1, 2].map((c: number): number => bones.shoulder[c]! - bones.elbow[c]!) as [number, number, number]));
    const top: Vec3 = [0, 1, 2].map((c: number): number => bones.shoulder[c]! + ((bones.shoulder[c]! - bones.elbow[c]!) * run) / d) as Vec3;
    const mapped = (bone: number, share: number): { bone: number; share: number } => bone < 2 ? { bone: 0, share: (bone === 0 ? share * run : run + share * d) / (run + d) } : { bone: bone - 1, share };
    const source: AutoMovieHumanWalkPart.ISource | string = AutoMovieHumanWalkPart.source({
      name,
      centres: [top, bones.elbow, bones.wrist, knuckle, ...(crease === undefined ? [] : [crease])],

      // GH remains a named point on the first straight segment, avoiding a
      // redundant almost-collinear joint after canonical unit conversion.
      joints: [{ half: joints.elbow / 2 }, { half: joints.wrist / 2 }, ...(crease === undefined ? [] : [{ half: AutoMovieHumanJointTurn.half(bones.wrist, knuckle, crease, reach) }])],
      u: [1, 0, 0],
      sites: [
        ...laws.map((l: ISiteLaw): AutoMovieHumanWalkPart.ISite => ({ site: l.site, ...mapped(l.bone, l.share), edges: l.edges, fullness: l.fullness })),
      ],
      ...(radial === undefined ? {} : { roll: { from: { bone: 2, share: 0 }, to: { bone: 2, share: 1 }, up: radial } }),
      tip: reach,

      // The proximal pole is hidden inside the girdle; final G2 is separate.
      base: true,
      order: ORDER,
      samples: ORDER,
      gap,
    });
    const fail = (detail: string): AutoMovieHumanSiteViewPart.IResult => ({ part: null, loft: null, view: null, diagnostics: [{ producer: `view.${name}`, level: 2, contract: "shoulder source", detail }] });
    if (typeof source === "string") return fail(source);
    if (measuring === undefined) return AutoMovieHumanSiteViewPart.create(source.input);
    const end: number = source.station(0, (run + measuring.humerus / 2) / (run + d));
    if (!(end <= source.runs[0]!.end)) return fail("The selected deltoid measuring domain enters the elbow turn");
    const normalized: AutoMovieHumanArmBreadth.IResult | string = AutoMovieHumanArmBreadth.fit(source.input, name.endsWith("left") ? "left" : "right", [0, end], measuring.breadth, measuring.lateral);
    return typeof normalized === "string" ? fail(normalized) : AutoMovieHumanSiteViewPart.create(normalized.input);
  }
}
