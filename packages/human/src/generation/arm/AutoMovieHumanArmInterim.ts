import { AutoMovieIllinois } from "@automovie/engine";
import type { AutoMovieHumanArmConstruction } from "../AutoMovieHumanArmConstruction";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";
import { AutoMovieHumanDeltoidSpan } from "./AutoMovieHumanDeltoidSpan";

type Vec3 = [number, number, number];

/**
 * The arm's site laws from the person's tapes. Each section's four extents
 * about its centre come from the reference set's arm sections per girth
 * (`AutoMovieHumanReferenceOutlines.UPPER_ARM`, `FOREARM`; estimated from the
 * private reference set: no published source gives a limb section's shape),
 * each times the site's published tape, and each tape owns its fullness.
 *
 * Sites:
 * - the first free deltoid row at .3H, with retained girth multiplier1.026;
 *   its box uses the current biceps template as an explicit family transfer,
 *   not the older polar ArmRows or a claim that .3H is the maximum;
 * - the biceps at the retained half-acromion-radiale station proxy (from
 *   GH, `(AR/2 - actualGHProjection)/H`).
 *   Radiale is not olecranon: the published acromion-to-olecranon midpoint
 *   needs its own landmark offset. The upper-arm shape table is read at half;
 * - the elbow at its centre;
 * - the greatest forearm tape at the existing reference estimate of 0.215
 *   elbow-to-stylion (an observed location, not the measurement definition);
 * - the wrist at stylion (`STYLION_WRIST` short of the wrist centre);
 * - the knuckles at the third metacarpal's head: breadth along the retained
 *   radial u, depth along palmar/dorsal v. The source table's anterior is
 *   body-forward projected normal to the axis; in this thumb-forward bind
 *   it is radial, not palm-normal (estimate_arm_sections and anatomy/arm).
 *   The depth's centred ellipse runs the hand's tape; the final asymmetric
 *   source box has its own tape owner. Depth splits evenly, while the caller
 *   preserves the breadth-centre offset of the same MCP packing.
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
   * @param placement Actual GH projection and rigid humerus from the same production skeleton, calibration mm.
   * @param crease Include the independent public palm-crease course.
   * @param radialCenter The palm breadth-centre offset from MCP3 along radial u, mm; zero for a caller without the source hand record.
   * @returns The site laws.
   */
  export function sites(side: "left" | "right", inputs: AutoMovieHumanArmConstruction.IInputs, elbow: Vec3, wrist: Vec3, placement: { projection: number; humerus: number }, crease: boolean = false, radialCenter: number = 0): AutoMovieHumanArmWalk.ISiteLaw[] {
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const biceps: number = (inputs.upper / 2 - placement.projection) / placement.humerus;
    if (!(biceps > AutoMovieHumanDeltoidSpan.ROOT && biceps < 1)) throw new Error("The retained biceps midpoint must follow the first free deltoid source row inside the humerus");
    const forearm: number = Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]);
    const box: (table: AutoMovieHumanReferenceOutlines.ITable, share: number, girth: number) => [number, number, number, number] = (table: AutoMovieHumanReferenceOutlines.ITable, share: number, girth: number): [number, number, number, number] => {
      const read: (column: string) => number = (column: string): number => T.at(table, column, share) * girth;
      const lateral: number = read("lateral");
      const medial: number = read("medial");
      const [plus, minus]: [number, number] = side === "left" ? [lateral, medial] : [medial, lateral];
      return [read("anterior"), plus, -read("posterior"), -minus];
    };
    const hand: AutoMovieHumanArmConstruction.IHand = side === "left" ? inputs.left : inputs.right;
    const depth: number = ellipseDepth(hand.breadth, inputs.circumference);
    const palm: [number, number, number, number] = [hand.breadth / 2 + radialCenter, depth / 2, -hand.breadth / 2 + radialCenter, -depth / 2];
    return [
      { site: "deltoid", bone: 1, share: AutoMovieHumanDeltoidSpan.ROOT, edges: box(T.UPPER_ARM, 0.5, AutoMovieHumanDeltoidSpan.ROOT_GIRTH * inputs.bicep), fullness: { girth: AutoMovieHumanDeltoidSpan.ROOT_GIRTH * inputs.bicep } },
      { site: "biceps", bone: 1, share: biceps, edges: box(T.UPPER_ARM, 0.5, inputs.bicep), fullness: { girth: inputs.bicep } },
      { site: "elbow", bone: 2, share: 0, edges: box(T.FOREARM, 1, inputs.elbow), fullness: { girth: inputs.elbow } },
      { site: "forearm", bone: 2, share: 0.215 * (1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm), edges: box(T.FOREARM, 1 - 0.215, inputs.forearm), fullness: { girth: inputs.forearm } },
      { site: "wrist", bone: 2, share: 1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm, edges: box(T.FOREARM, 0, inputs.wrist), fullness: { girth: inputs.wrist } },
      { site: "knuckles", bone: 3, share: 1, edges: [...palm], fullness: { girth: inputs.circumference } },
      ...(crease ? [{ site: "crease", bone: 4, share: 1, edges: [...palm] as [number, number, number, number], fullness: { shoulder: Math.SQRT2 - 1 } }] : []),
    ];
  }

  /**
   * The depth whose inscribed ellipse with a breadth runs a tape: the root of
   * Ramanujan's second approximation by the Illinois rule, between a sliver
   * and the declared positive depth bracket. A failed approximate solve is
   * refused; the final asymmetric native section owns its separate exact tape.
   *
   * @param breadth The whole breadth, mm.
   * @param girth The tape, mm.
   * @returns The whole depth, mm.
   */
  export function ellipseDepth(breadth: number, girth: number): number {
    const perimeter: (d: number) => number = (d: number): number => {
      const a: number = breadth / 2;
      const b: number = d / 2;
      const h: number = ((a - b) / (a + b)) ** 2;
      return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    };
    if (!(Number.isFinite(breadth) && breadth > 0 && Number.isFinite(girth) && girth > 0))
      throw new Error("Palm ellipse proxy requires positive finite breadth and girth");
    const depth: number | null = AutoMovieIllinois.root(
      (d: number): number => perimeter(d) - girth, 1e-6, girth, 1e-6, 100,
    );
    if (depth === null || !Number.isFinite(depth) || !(depth > 0) ||
      Math.abs(perimeter(depth) - girth) > 1e-6)
      throw new Error("Palm Ramanujan ellipse-depth proxy has no admitted positive root for its unchanged tape");
    return depth;
  }
}
