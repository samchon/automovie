import { AutoMovieIllinois } from "@automovie/engine";
import type { AutoMovieHumanArmConstruction } from "../AutoMovieHumanArmConstruction";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

type Vec3 = [number, number, number];

/**
 * The arm's site laws from the person's tapes. Each section's four extents
 * about its centre come from the reference set's arm sections per girth
 * (`AutoMovieHumanReferenceOutlines.UPPER_ARM`, `FOREARM`; estimated from the
 * private reference set: no published source gives a limb section's shape),
 * each times the site's published tape, and each tape owns its fullness.
 *
 * Sites:
 * - the biceps midway acromion to olecranon (from the glenohumeral centre,
 *   `(1/2 - ACROMION) / (1 - ACROMION - RADIALE)` of the humerus, de Leva's
 *   shares in `AutoMovieHumanArmBones`), the upper arm's table at half its
 *   length;
 * - the elbow at its centre;
 * - the wrist at stylion (`STYLION_WRIST` short of the wrist centre);
 * - the knuckles at the third metacarpal's head: the hand's breadth across,
 *   and the depth whose inscribed ellipse runs the hand's tape. No published
 *   source splits the palm's depth about the bone, so it is split evenly.
 *
 * The walk's chart `v` (`t x u`) is lateral on the left arm and medial on the
 * right, so each side takes its lateral and medial extents on its own side.
 */
export namespace AutoMovieHumanArmInterim {
  /**
   * The arm's site laws.
   *
   * @param side The arm.
   * @param inputs The arm's tapes and the hands' dimensions, calibration mm.
   * @param elbow The elbow centre.
   * @param wrist The wrist centre.
   * @returns The site laws.
   */
  export function sites(side: "left" | "right", inputs: AutoMovieHumanArmConstruction.IInputs, elbow: Vec3, wrist: Vec3): AutoMovieHumanArmWalk.ISiteLaw[] {
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const biceps: number = (1 / 2 - AutoMovieHumanArmBones.ACROMION) / (1 - AutoMovieHumanArmBones.ACROMION - AutoMovieHumanArmBones.RADIALE);
    const forearm: number = Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]);
    const box = (table: AutoMovieHumanReferenceOutlines.ITable, share: number, girth: number): [number, number, number, number] => {
      const read = (column: string): number => T.at(table, column, share) * girth;
      const lateral: number = read("lateral");
      const medial: number = read("medial");
      const [plus, minus]: [number, number] = side === "left" ? [lateral, medial] : [medial, lateral];
      return [read("anterior"), plus, -read("posterior"), -minus];
    };
    const hand: AutoMovieHumanArmConstruction.IHand = side === "left" ? inputs.left : inputs.right;
    const depth: number = ellipseDepth(hand.breadth, inputs.circumference);
    return [
      { site: "biceps", bone: 1, share: biceps, edges: box(T.UPPER_ARM, 0.5, inputs.bicep), fullness: { girth: inputs.bicep } },
      { site: "elbow", bone: 2, share: 0, edges: box(T.FOREARM, 1, inputs.elbow), fullness: { girth: inputs.elbow } },
      { site: "wrist", bone: 2, share: 1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm, edges: box(T.FOREARM, 0, inputs.wrist), fullness: { girth: inputs.wrist } },
      { site: "knuckles", bone: 3, share: 1, edges: [depth / 2, hand.breadth / 2, -depth / 2, -hand.breadth / 2], fullness: { girth: inputs.circumference } },
    ];
  }

  /**
   * The depth whose inscribed ellipse with a breadth runs a tape: the root of
   * Ramanujan's second approximation by the Illinois rule, between a sliver
   * and the circle's reach; the breadth itself where the tape cannot be met.
   *
   * @param breadth The whole breadth, mm.
   * @param girth The tape, mm.
   * @returns The whole depth, mm.
   */
  export function ellipseDepth(breadth: number, girth: number): number {
    const perimeter = (d: number): number => {
      const a: number = breadth / 2;
      const b: number = d / 2;
      const h: number = ((a - b) / (a + b)) ** 2;
      return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    };
    return AutoMovieIllinois.root((d: number): number => perimeter(d) - girth, 1e-6, girth, 1e-6, 100) ?? breadth;
  }
}
