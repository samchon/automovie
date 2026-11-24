import { AutoMovieIllinois } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmConstruction,
  IAutoMovieHumanArmInterim,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanHandMeasures,
} from "@automovie/interface";

import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";

/**
 * The arm's site laws from the person's tapes. A tape alone leaves the
 * section's directional extents unspecified. Use a centred circle with radius
 * girth divided by 2 pi as the least-information conic. Forearm and wrist hold
 * their independent calipers where available. The hand supplies its own breadth
 * and tape, and the shoulder owns its own contact.
 *
 * Sites:
 *
 * - The first free deltoid row halfway between the shoulder centre and the biceps
 *   tape. ESTIMATE: continue that measured girth toward the shoulder until a
 *   separate deltoid tape is supplied;
 * - The biceps at the half-acromion-radiale station proxy (from GH, `(AR/2 -
 *   actualGHProjection)/H`). Radiale is not olecranon: the published
 *   acromion-to-olecranon midpoint needs its own landmark offset;
 * - The elbow at its centre;
 * - The forearm calipers sit at Perry et al. 2021's station 0.2 of
 *   radiale–stylion (CS2). ESTIMATE: place the greatest forearm tape at the
 *   same proximal belly station. Heinz et al. 2003 record that relaxed tape
 *   without its longitudinal address;
 * - The wrist at stylion (`STYLION_WRIST` short of the wrist centre);
 * - The knuckles at the third metacarpal's head: breadth along the retained
 *   radial u, depth along palmar/dorsal v. The depth's centred ellipse runs the
 *   hand's tape; the final asymmetric source box has its own tape owner. Depth
 *   splits evenly, while the caller preserves the breadth-centre offset of the
 *   same MCP packing.
 */
export namespace AutoMovieHumanArmInterim {
  /**
   * The arm's site laws.
   *
   * @param side The arm.
   * @param inputs The arm's tapes and the hands' dimensions, calibration mm.
   * @param elbow The elbow centre.
   * @param wrist The wrist centre.
   * @param placement Actual GH projection and rigid humerus from the same
   *   production skeleton, calibration mm.
   * @param crease Include the independent public palm-crease course.
   * @param radialCenter The palm breadth-centre offset from MCP3 along radial
   *   u, mm; zero for a caller without the source hand record.
   * @returns The site laws.
   */
  export function sites(
    side: "left" | "right",
    inputs: IAutoMovieHumanArmConstruction.IInputs,
    elbow: AutoMovieVector3Tuple,
    wrist: AutoMovieVector3Tuple,
    placement: IAutoMovieHumanArmInterim.ISitesPlacement,
    crease: boolean = false,
    radialCenter: number = 0,
  ): IAutoMovieHumanArmWalk.ISiteLaw[] {
    const biceps: number =
      (inputs.upper / 2 - placement.projection) / placement.humerus;
    if (!(biceps > 0 && biceps < 1))
      throw new Error("The biceps midpoint must lie inside the humerus");
    const forearm: number = Math.hypot(
      wrist[0] - elbow[0],
      wrist[1] - elbow[1],
      wrist[2] - elbow[2],
    );
    const stylion: number = 1 - AutoMovieHumanArmBones.STYLION_WRIST / forearm;
    const atForearm: number =
      (AutoMovieHumanArmBones.RADIALE * inputs.upper + 0.2 * inputs.lower) /
      forearm;
    const calipers: IAutoMovieHumanArmInterim.ISitesPlacement["calipers"] =
      placement.calipers;
    const forearmEdges: IAutoMovieHumanArmWalk.ISiteLaw["edges"] =
      calipers === undefined
        ? circle(inputs.forearm)
        : axes(
            calipers.forearmDepth * inputs.scale,
            calipers.forearmBreadth * inputs.scale,
          );
    const wristEdges: IAutoMovieHumanArmWalk.ISiteLaw["edges"] =
      calipers === undefined
        ? circle(inputs.wrist)
        : axes(
            calipers.wristDepth * inputs.scale,
            calipers.wristSkinBreadth * inputs.scale,
          );
    const hand: IAutoMovieHumanHandMeasures =
      side === "left" ? inputs.left : inputs.right;
    const depth: number = ellipseDepth(hand.breadth, inputs.circumference);
    const palm: [number, number, number, number] = [
      hand.breadth / 2 + radialCenter,
      depth / 2,
      -hand.breadth / 2 + radialCenter,
      -depth / 2,
    ];
    return [
      {
        site: "deltoid",
        bone: 1,
        share: biceps / 2,
        edges: circle(inputs.bicep),
        fullness: { girth: inputs.bicep },
      },
      {
        site: "biceps",
        bone: 1,
        share: biceps,
        edges: circle(inputs.bicep),
        fullness: { girth: inputs.bicep },
      },
      {
        site: "elbow",
        bone: 2,
        share: 0,
        edges: circle(inputs.elbow),
        fullness: { girth: inputs.elbow },
      },
      {
        site: "forearm",
        bone: 2,
        share: atForearm,
        edges: forearmEdges,
        fullness: { girth: inputs.forearm },
      },
      {
        site: "wrist",
        bone: 2,
        share: stylion,
        edges: wristEdges,
        fullness: { girth: inputs.wrist },
      },
      {
        site: "knuckles",
        bone: 3,
        share: 1,
        edges: [...palm],
        fullness: { girth: inputs.circumference },
      },
      ...(crease
        ? [
            {
              site: "crease",
              bone: 4,
              share: 1,
              edges: [...palm] as [number, number, number, number],
              fullness: { shoulder: Math.SQRT2 - 1 },
            },
          ]
        : []),
    ];
  }

  /** Four signed axes of the centred circle whose perimeter is the tape. */
  function circle(girth: number): [number, number, number, number] {
    const diameter: number = girth / Math.PI;
    return axes(diameter, diameter);
  }

  /** The conic's local forward/medial extents before its independent tape solve. */
  function axes(
    depth: number,
    breadth: number,
  ): [number, number, number, number] {
    return [depth / 2, breadth / 2, -depth / 2, -breadth / 2];
  }

  /**
   * The depth whose inscribed ellipse with a breadth runs a tape: the root of
   * Ramanujan's second approximation by the Illinois rule, between a sliver and
   * the declared positive depth bracket. A failed approximate solve is refused;
   * the final asymmetric native section owns its separate exact tape.
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
    if (
      !(
        Number.isFinite(breadth) &&
        breadth > 0 &&
        Number.isFinite(girth) &&
        girth > 0
      )
    )
      throw new Error(
        "The ellipse-depth proxy requires positive finite breadth and girth",
      );
    const depth: number | null = AutoMovieIllinois.root(
      (d: number): number => perimeter(d) - girth,
      1e-6,
      girth,
      1e-6,
      100,
    );
    if (
      depth === null ||
      !Number.isFinite(depth) ||
      !(depth > 0) ||
      Math.abs(perimeter(depth) - girth) > 1e-6
    )
      throw new Error(
        "Ramanujan's ellipse-depth proxy has no admitted positive root for the tape",
      );
    return depth;
  }
}
