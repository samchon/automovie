import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanLegBones } from "./AutoMovieHumanLegBones";

type Vec3 = AutoMovieHumanLegBones.Vec3;

/**
 * One leg as one walk over the femur and the tibia (#3048): straight along
 * each bone's mechanical axis at the neutral pose, the knee a C2 turn over
 * its own depth, open at both ends inside its hosts, the trunk above and the
 * foot below, whose merges trim it (the leg is the part in both, its station
 * lines leaving each host across the fold).
 *
 * Ends. Above the hip centre the walk runs on along the femur's line by the
 * thigh site's largest edge, so the tube's top lies inside the pelvis at every
 * phase (the hip centre itself stands about that deep under the skin); below
 * the ankle centre it runs on along the tibia's line by the ankle site's
 * largest edge, inside the heel. Each run closes in a G2 dome whose tip is that
 * end point, so the station lines start inside the host at every phase and
 * leave it once, between the dome and the nearest published site (the
 * merge's trace needs one crossing per phase): the merges trim the domes.
 *
 * Sites. The five published tapes the anatomy carries at their sites (ISO 8559-1 5.3.20 thigh
 * below the gluteal fold, ANSUR II's lower thigh at the suprapatella, 5.3.22 the knee
 * at mid-patella, 5.3.24 the calf at its widest, 5.3.26 the ankle at its
 * least), each placed on its bone by its height and owning the section's
 * fullness there; each site's box (its anterior, lateral, posterior and
 * medial edges from the bone's axis) is the caller's law, its edge toward the
 * median plane stopped at the plane (a leg and its mirror never cross), and the knee's
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
  export const SITES: readonly string[] = ["thigh", "lowerThigh", "knee", "calf", "ankle"];

  /** Control points and ring phases of every section: 256, over four times the reference pack's about 57 spans per leg section (`generalization.md`, Leg), a multiple of 4. */
  export const ORDER: number = 256;

  /**
   * Build and loft one leg.
   *
   * @param name The chain's name, `leg.left` or `leg.right`.
   * @param bones The side's hip, knee and ankle centres (`AutoMovieHumanLegBones.of`, reflected for the right).
   * @param law Each public site's law by SITES, with optional named intermediate rows of that same retained source profile.
   * @param gap Widest spacing between layers, mm.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(name: string, bones: Pick<AutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">, law: ILaw, gap: number): AutoMovieHumanSiteViewPart.IResult {
    const laws: ISiteLaw[] = SITES.map((s: string): ISiteLaw => law(s));
    const reach = (l: ISiteLaw): number => Math.max(...l.edges.map(Math.abs));
    const along = (from: Vec3, to: Vec3, by: number): Vec3 => {
      const d: number = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
      return [to[0] + ((to[0] - from[0]) * by) / d, to[1] + ((to[1] - from[1]) * by) / d, to[2] + ((to[2] - from[2]) * by) / d];
    };
    const top: Vec3 = along(bones.knee, bones.hip, reach(laws[0]!));
    const bottom: Vec3 = along(bones.knee, bones.ankle, reach(laws[laws.length - 1]!));

    // A site's share of its bone from its height: the femur (bone 1) from
    // the hip down, the tibia (bone 2) from the knee down.
    const place = (height: number): { bone: number; share: number } =>
      height >= bones.knee[1]
        ? { bone: 1, share: (bones.hip[1] - height) / (bones.hip[1] - bones.knee[1]) }
        : { bone: 2, share: (bones.knee[1] - height) / (bones.knee[1] - bones.ankle[1]) };
    // A leg and its mirror (J6) meet at the median plane and never cross it:
    // a site's edge toward the plane stops there, measured from the bone's
    // line at the site.
    const median = (height: number, edges: [number, number, number, number]): [number, number, number, number] => {
      const { bone, share } = place(height);
      const [from, to]: [Vec3, Vec3] = bone === 1 ? [bones.hip, bones.knee] : [bones.knee, bones.ankle];
      const z: number = from[2] + share * (to[2] - from[2]);
      return z > 0 ? [edges[0], edges[1], edges[2], Math.max(edges[3], -z)] : z < 0 ? [edges[0], Math.min(edges[1], -z), edges[2], edges[3]] : edges;
    };
    // The retained profile rows constrain the source shape itself, instead
    // of reading that profile at five sites and replacing it by a sparse
    // angle spline influenced by the two hidden poles. Public tapes remain
    // their own unaltered sites. The intermediate rows are not measurements.
    const placed: { site: string; law: ISiteLaw }[] = [...SITES, ...(law.intermediate ?? [])].map((site: string): { site: string; law: ISiteLaw } => ({ site, law: law(site) })).sort((a: { law: ISiteLaw }, b: { law: ISiteLaw }): number => b.law.height - a.law.height);
    const sites: AutoMovieHumanWalkPart.ISite[] = placed.map((site: { site: string; law: ISiteLaw }): AutoMovieHumanWalkPart.ISite => ({ site: site.site, ...place(site.law.height), edges: median(site.law.height, site.law.edges), fullness: { girth: site.law.girth } }));
    const knee: ISiteLaw = laws[SITES.indexOf("knee")]!;
    return AutoMovieHumanWalkPart.create({
      name,
      centres: [top, bones.hip, bones.knee, bones.ankle, bottom],

      // The hip and the ankle continue their bones straight (no turn): their
      // half lengths only keep the turns apart. The knee turns over its depth.
      joints: [{ half: 1 }, { half: (knee.edges[0] - knee.edges[2]) / 2 }, { half: 1 }],
      u: [1, 0, 0],
      sites,

      // Both ends close in domes inside their hosts (the pelvis above, the
      // heel below), so every phase leaves each host once.
      base: true,
      tip: 0,
      order: ORDER,
      samples: ORDER,
      gap,
    });
  }
}
