import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";

type Vec3 = AutoMovieHumanArmBones.IBones["shoulder"];

/**
 * One arm with its palm as one walk over the humerus, the forearm and the
 * third metacarpal (#3050, #3051): straight along each bone at the neutral
 * pose, the elbow and the wrist C2 turns over their own depths (a joint
 * between nearly collinear segments is a walk station, never a merge), open
 * at its top inside the shoulder girdle, whose merge trims it, and closed at
 * the palm's distal cap by a G2 dome the fingers merge onto.
 *
 * Centres: past the glenohumeral centre along the humerus by the deltoid
 * site's largest edge (so the tube's top lies inside the girdle at every
 * phase), the glenohumeral centre, the elbow centre, the wrist centre
 * (`AutoMovieHumanArmBones`, de Leva's shares), the third metacarpal's head
 * (the caller's, from the hand's joints), and the dome's tip past it by the
 * palm's distal reach.
 *
 * Sites: each the caller's law with its place (bone and share), its box
 * (its four edges from the bone's axis in the walk's chart) and its
 * fullness owner: the deltoid (`bideltoidBreadth`), the biceps tape midway
 * acromion to olecranon, the elbow tape at the epicondyles, the forearm's
 * greatest tape, the wrist tape at stylion, the palm's wrist crease and its
 * knuckle line (`handBreadth`, `handCircumference`).
 */
export namespace AutoMovieHumanArmWalk {
  /** One site's law: its name, place, box and owner. */
  export interface ISiteLaw {
    /** The measurement site, named in diagnostics. */
    site: string;

    /** Bone: 1 the humerus, 2 the forearm, 3 the third metacarpal (0 is the run inside the girdle). */
    bone: number;

    /** Share of the bone from its proximal centre. */
    share: number;

    /** The box's edges from the bone's axis in the walk's chart, calibration mm: along `+u` (forward on the humerus, carried along the walk without spin, so on the palm it faces where the neutral forearm's rotation turns it), along `+v`, along `-u`, along `-v`. */
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
   * @param reach The palm's distal cap's reach past that head to the dome's tip, mm.
   * @param sites The sites by rising place, the first standing nearest the shoulder (its box also fills the run inside the girdle).
   * @param joints The elbow's and the wrist's depths, mm, their turns' lengths.
   * @param gap Widest spacing between layers, mm.
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
  ): AutoMovieHumanSiteViewPart.IResult {
    const laws: ISiteLaw[] = sites;
    const deltoid: ISiteLaw = laws[0]!;
    const run: number = Math.max(...deltoid.edges.map(Math.abs));
    const d: number = Math.hypot(...([0, 1, 2].map((c: number): number => bones.shoulder[c]! - bones.elbow[c]!) as [number, number, number]));
    const top: Vec3 = [0, 1, 2].map((c: number): number => bones.shoulder[c]! + ((bones.shoulder[c]! - bones.elbow[c]!) * run) / d) as Vec3;
    return AutoMovieHumanWalkPart.create({
      name,
      centres: [top, bones.shoulder, bones.elbow, bones.wrist, knuckle],

      // The glenohumeral centre continues the humerus straight; the elbow and
      // the wrist turn over half their depths each side.
      joints: [{ half: 1 }, { half: joints.elbow / 2 }, { half: joints.wrist / 2 }],
      u: [1, 0, 0],
      sites: [
        { site: "top", bone: 0, share: 0, edges: deltoid.edges, fullness: deltoid.fullness },
        ...laws.map((l: ISiteLaw): AutoMovieHumanWalkPart.ISite => ({ site: l.site, bone: l.bone, share: l.share, edges: l.edges, fullness: l.fullness })),
      ],
      tip: reach,
      order: ORDER,
      samples: ORDER,
      gap,
    });
  }
}
