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
 * largest edge, inside the heel. Those runs carry the nearest site's box, a
 * construction never seen: the merges trim them.
 *
 * Sites. The four published tapes the anatomy carries at their sites (ISO 8559-1 5.3.20 thigh
 * below the gluteal fold, 5.3.22 the knee
 * at mid-patella, 5.3.24 the calf at its widest, 5.3.26 the ankle at its
 * least), each placed on its bone by its height and owning the section's
 * fullness there; each site's box (its anterior, lateral, posterior and
 * medial edges from the bone's axis) is the caller's law, and the knee's
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

  /** The sites, from the hip down. */
  export const SITES: readonly string[] = ["thigh", "knee", "calf", "ankle"];

  /** Control points and ring phases of every section: 256, over four times the reference pack's about 57 spans per leg section (`generalization.md`, Leg), a multiple of 4. */
  export const ORDER: number = 256;

  /**
   * Build and loft one leg.
   *
   * @param name The chain's name, `leg.left` or `leg.right`.
   * @param bones The side's hip, knee and ankle centres (`AutoMovieHumanLegBones.of`, reflected for the right).
   * @param law Each site's law, by the names of {@link SITES}.
   * @param gap Widest spacing between layers, mm.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(name: string, bones: AutoMovieHumanLegBones.IBones, law: (site: string) => ISiteLaw, gap: number): AutoMovieHumanSiteViewPart.IResult {
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
    const sites: AutoMovieHumanWalkPart.ISite[] = [
      { site: "top", bone: 0, share: 0, edges: laws[0]!.edges, fullness: { girth: laws[0]!.girth } },
      ...SITES.map((s: string, k: number): AutoMovieHumanWalkPart.ISite => ({ site: s, ...place(laws[k]!.height), edges: laws[k]!.edges, fullness: { girth: laws[k]!.girth } })),
      { site: "bottom", bone: 3, share: 1, edges: laws[laws.length - 1]!.edges, fullness: { girth: laws[laws.length - 1]!.girth } },
    ];
    const knee: ISiteLaw = laws[SITES.indexOf("knee")]!;
    return AutoMovieHumanWalkPart.create({
      name,
      centres: [top, bones.hip, bones.knee, bones.ankle, bottom],

      // The hip and the ankle continue their bones straight (no turn): their
      // half lengths only keep the turns apart. The knee turns over its depth.
      joints: [{ half: 1 }, { half: (knee.edges[0] - knee.edges[2]) / 2 }, { half: 1 }],
      u: [1, 0, 0],
      sites,
      order: ORDER,
      samples: ORDER,
      gap,
    });
  }
}
