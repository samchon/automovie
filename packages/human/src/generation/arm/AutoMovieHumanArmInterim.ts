import type { IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanChainBox } from "../limb/AutoMovieHumanChainBox";
import { AutoMovieHumanSegmentChart } from "../limb/AutoMovieHumanSegmentChart";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

type Vec3 = [number, number, number];

/**
 * The arm's interim site laws (#3044's rule for priors the campaign has not
 * yet replaced; `log-body.md`, "Interim accessors"): each site's box read on
 * today's arm and palm chains, swapped for the arm's laws when they land.
 */
export namespace AutoMovieHumanArmInterim {
  /**
   * Interim accessor: the arm's and palm's site boxes read on today's arm and
   * palm chains (`AutoMovieHumanChainBox`): the biceps midway acromion to
   * olecranon (from the glenohumeral centre `(1/2 - ACROMION) / (1 - ACROMION
   * - RADIALE)` of the humerus, de Leva's shares in `AutoMovieHumanArmBones`),
   * the elbow at its centre, the wrist at stylion (`STYLION_WRIST` short of the
   * wrist centre), the knuckles at the third metacarpal's head. A site whose
   * point falls outside today's section is left out. Each box is read about
   * today's section's own axis point, so the site takes today's size and the
   * bone line its place: today's arm does not stand on the bind skeleton's bone
   * (it runs a radius off it, on its upper side), and reading its extents
   * about the bone carried that offset into the walk. Owed laws: the deltoid's
   * site and box, the forearm's site and bone place, the palm's thickness.
   *
   * @param arm Today's arm chain.
   * @param palm Today's palm chain.
   * @param shoulder The glenohumeral centre.
   * @param elbow The elbow centre.
   * @param wrist The wrist centre.
   * @param knuckle The third metacarpal's head.
   * @returns The site laws that box.
   */
  export function sites(arm: IAutoMovieLoftChain, palm: IAutoMovieLoftChain, shoulder: Vec3, elbow: Vec3, wrist: Vec3, knuckle: Vec3): AutoMovieHumanArmWalk.ISiteLaw[] {
    const biceps: number = (1 / 2 - AutoMovieHumanArmBones.ACROMION) / (1 - AutoMovieHumanArmBones.ACROMION - AutoMovieHumanArmBones.RADIALE);
    const forearm: number = AutoMovieHumanSegmentChart.distance(wrist, elbow);
    const places: [string, number, number, Vec3, Vec3, IAutoMovieLoftChain][] = [
      ["biceps", 1, biceps, shoulder, elbow, arm],
      ["elbow", 2, 0, elbow, wrist, arm],
      ["wrist", 2, 1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm, elbow, wrist, arm],
      ["knuckles", 3, 1, wrist, knuckle, palm],
    ];
    return places.flatMap(([site, b, share, from, to, on]: [string, number, number, Vec3, Vec3, IAutoMovieLoftChain]): AutoMovieHumanArmWalk.ISiteLaw[] => {
      const point: Vec3 = AutoMovieHumanSegmentChart.lerp(from, to, share);
      const [u, v]: [Vec3, Vec3] = AutoMovieHumanSegmentChart.of(from, to, [1, 0, 0]);
      const box: AutoMovieHumanChainBox.IBox | null = AutoMovieHumanChainBox.at(on, point, u, v, true);
      return box === null ? [] : [{ site, bone: b, share, edges: box.edges, fullness: { shoulder: box.shoulder } }];
    });
  }
}
