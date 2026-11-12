import { AutoMovieLoftChain, type AutoMovieConstructionRealization, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort, IAutoMovieConstructionSplit } from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1Concha } from "./AutoMovieHumanF1Concha";
import { AutoMovieHumanF1Ear } from "./AutoMovieHumanF1Ear";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1Joints } from "./AutoMovieHumanF1Joints";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1Nose } from "./AutoMovieHumanF1Nose";
import { AutoMovieHumanF1Nostril } from "./AutoMovieHumanF1Nostril";
import { AutoMovieHumanF1Scapha } from "./AutoMovieHumanF1Scapha";
import { AutoMovieHumanF1ToeBig } from "./AutoMovieHumanF1ToeBig";
import { AutoMovieHumanF1ToeIndex } from "./AutoMovieHumanF1ToeIndex";
import { AutoMovieHumanF1ToeLittle } from "./AutoMovieHumanF1ToeLittle";
import { AutoMovieHumanF1ToeMiddle } from "./AutoMovieHumanF1ToeMiddle";
import { AutoMovieHumanF1ToeRing } from "./AutoMovieHumanF1ToeRing";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";

/**
 * The f1 figure in its reference pose, generated from its authored conic
 * families alone: no reference mesh, recovered curve or observation file is
 * read anywhere on this path.
 *
 * The body is one sewn skin, built by the engine's construction operators:
 * the trunk from the crotch to the crown, the nose's free end, and on each
 * side an arm that runs from the armpit's sagittal plane round the shoulder
 * and through the wrist to the finger webs, a leg that runs from below the
 * crotch round the ankle to the toe webs, an ear, five fingers and five toes.
 * The trunk's open lower end is split into the two legs along the midsagittal
 * chord, and each arm, each ear and the nose is attached at a port on the
 * trunk; those bands span from a curve on the trunk to a ring of the part and
 * meet both G2 without a traced intersection. Each finger and toe is a
 * capsule merged onto its limb's cap along the curve where it comes out. The
 * crown, each hand, each foot, each ear, the nose and each digit close in a
 * pole.
 *
 * The hand's sections leave out the thumb past where it stands free, as the
 * trunk's leave out the arms, the ears and the nose. The face's eyes and
 * mouth are height fields over the trunk's wall. A hollow with a wall of its
 * own is a loft cut out: each nostril from the head, and each ear's hollow
 * from the ear before the ear is attached.
 */
export namespace AutoMovieHumanF1 {
  /** One generated surface piece. */
  export interface IPiece {
    /** `body` for the sewn skin, else a digit's chain name, with `.mirror` for the reflected twin. */
    name: string;

    /** Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). */
    positions: number[];

    /** Triangle indices, counter-clockwise seen from outside. */
    indices: number[];

    /** What the engine refused, one line each; empty when the piece was admitted whole. */
    diagnostics: string[];
  }

  /** One authored family in the figure. */
  export interface IMember {
    /** The authored definition. */
    family: AutoMovieHumanConicLoft.IFamily;

    /** Present a second time as its twin across the median plane `z = 0`. */
    mirrored: boolean;

    /**
     * How far a loose family is carried before its first knot and past its last, mm. There its fields continue as the straight
     * end tangents of their natural cubics, so a digit reaches into the hand or the foot. The overlap is not a join. Absent, no reach.
     */
    reach?: [number, number];
  }

  /** The families the sewn body is built from. */
  export const BODY: { trunk: AutoMovieHumanConicLoft.IFamily; arm: AutoMovieHumanConicLoft.IFamily; leg: AutoMovieHumanConicLoft.IFamily; ear: AutoMovieHumanConicLoft.IFamily; nose: AutoMovieHumanConicLoft.IFamily } = { trunk: AutoMovieHumanF1Trunk, arm: AutoMovieHumanF1Arm, leg: AutoMovieHumanF1Leg, ear: AutoMovieHumanF1Ear, nose: AutoMovieHumanF1Nose };

  /** One digit sewn to its limb. */
  export interface IDigit {
    /** The digit's authored definition. */
    family: AutoMovieHumanConicLoft.IFamily;

    /** The limb whose cap it leaves through. */
    limb: "arm" | "leg";

    /**
     * The digit leaves its limb's end over a knuckle in the row of knuckles, as one of the children of the end's split (`FANS`). The thumb
     * leaves the hand's side, its first joint deep in the palm, and keeps the root closed `ROOT_MM` behind its first joint.
     */
    knuckle: boolean;
  }

  /**
   * The digits sewn to the body. A knuckled digit is a child of its limb's split (`FANS`). The thumb is merged onto the hand's side as a
   * capsule: besides its tip it closes in a point inside the hand (`ROOT_MM`), so it meets the hand in a closed curve wherever it comes out.
   */
  export const DIGITS: readonly IDigit[] = [
    { family: AutoMovieHumanF1FingerMiddle, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerRing, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerIndex, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerPinky, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerThumb, limb: "arm", knuckle: false },
    { family: AutoMovieHumanF1ToeBig, limb: "leg", knuckle: true },
    { family: AutoMovieHumanF1ToeIndex, limb: "leg", knuckle: true },
    { family: AutoMovieHumanF1ToeMiddle, limb: "leg", knuckle: true },
    { family: AutoMovieHumanF1ToeRing, limb: "leg", knuckle: true },
    { family: AutoMovieHumanF1ToeLittle, limb: "leg", knuckle: true },
  ];

  /** The families not sewn: none now. A loose family is emitted as a closed tube of its own, carried by its reach under its neighbour's skin. */
  export const LOOSE: readonly IMember[] = [];

  /** Every authored family of the figure. */
  export const FAMILIES: readonly IMember[] = [
    { family: BODY.trunk, mirrored: false },
    { family: BODY.arm, mirrored: true },
    { family: BODY.leg, mirrored: true },
    { family: BODY.ear, mirrored: true },
    { family: BODY.nose, mirrored: false },
    ...DIGITS.map((digit: IDigit): IMember => ({ family: digit.family, mirrored: true })),
    ...LOOSE,
  ];

  /**
   * The crotch's seam: the curve both legs' bands start from, under the perineum from the front fork to the back one, in place of the
   * straight chord across the trunk's end. On the chord the two bands met at each fork in a corner, and their triangles folded through
   * each other there (178 degrees), a slit seen from the front.
   *
   * The forks are the trunk's end ring on the median line, 808 mm high, 53.08 mm forward and 17.73 mm back; the chord between them is
   * 70.81 mm. Each knot is `[along, depth]` in metres: the distance from the front fork, `53.08 - x` for a point `x` mm forward, and how far
   * the reference's midline lies under the ring, `808 - y`, both read off `FamilyConicScan.ts crotch` (`midline`) every 10 mm from 30 mm
   * forward to 10 mm back. The midline rises above the ring toward the front fork (809.4 mm at 40 mm forward), where the seam must leave
   * the fork down along the trunk, so the knot at 40 mm holds the ring's level. The bands turn round each fork over 0.6 rad of their clock.
   */
  const CROTCH: { knots: [number, number][]; corner: number } = { knots: [[0.0131, 0], [0.0231, 0.0011], [0.0331, 0.0028], [0.0431, 0.0031], [0.0531, 0.0029], [0.0631, 0.0018]], corner: 0.6 };

  /** A limb whose open end is split into its knuckled digits. */
  interface IFan {
    /** The digits in the seams' order, from the little finger or the little toe (`fanSeams`). */
    digits: string[];

    /** Each seam's web line, knots `[along, depth]` in metres in its plane (`IAutoMovieConstructionSplit.IProfile`). */
    webs: [number, number][][];

    /** The bands' turn at each fork, radians of clock. */
    corner: number;

    /** Where each digit's band lands on it, mm past its first station, the web. */
    rail: number;

    /** Columns round each band, a quarter on each seam it takes. */
    columns: number;
  }

  /**
   * The limbs split at their ends, Birn's hand: the palm lofted on past the knuckles, its end cut into one opening per finger along the
   * webs, and each opening bridged to its finger by a band. The hand's end at 595 mm on the arm's course, which turns at the middle
   * finger's first joint toward the four fingers' mean direction, faces the fingers, so each band runs on to its finger. The web lines are
   * `FamilyConicScan.ts webs` every 2 mm along each seam's chord, depths of 0 left out so the seam leaves its fork along the host. Each band
   * takes 192 columns: on 96, 0.5 to 1 mm apart along a seam, its quads stood as a comb of steps along every seam.
   */
  const FANS: { arm: IFan; leg: IFan } = {
    arm: {
      digits: ["finger.pinky", "finger.ring", "finger.middle", "finger.index"],
      webs: [
        [[0.006, 0.0007], [0.008, 0.002], [0.01, 0.0019], [0.012, 0.0005]],
        [[0.01, 0.003], [0.012, 0.0061], [0.014, 0.0081], [0.016, 0.0087], [0.018, 0.0082], [0.02, 0.0064], [0.022, 0.0037], [0.024, 0.0003]],
        [[0.006, 0.0036], [0.008, 0.0065], [0.01, 0.0072], [0.012, 0.0064], [0.014, 0.0052], [0.016, 0.0037], [0.018, 0.0019]],
      ],
      corner: 0.6,
      rail: 3,
      columns: 192,
    },
    // The foot's end at 975 mm on the leg's course, turned at the ball of the foot toward the five toes. Between the index and the big toe
    // the rays from 8 to 18 mm along the chord ran on into the big toe (31 to 47 mm against 16 and 13 on either side) and are left out.
    // Beside each fork the web stands up to 10 mm out of the end, on the sole as on top, so each seam first runs out along the foot and
    // then turns across: the knots before the first web knot and after the last are `FamilyConicScan.ts webs`' run-out readings, rays
    // along the chord every millimetre out from the end; read only every 2 mm along the chord, the seam turned down within 1 to 2 mm of
    // its fork and stood a pointed tent between the toes on top. The bands turn over 0.75 rad of clock at each fork, nearly half of a
    // stretch's 1.57: columns square to the ring and to the seam converge inside a fork's corner within about the turn's window, and the
    // toe bands, 16 to 20 mm long, folded beside their forks over 185 of 3,840 clocks at 0.6 rad, 110 at 0.75 and 237 at 0.3 (sampled
    // every 0.008 rad and 1/40 of each band's span, normals flipping between neighbours).
    leg: {
      digits: ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"],
      webs: [
        [[0.0004, 0.001], [0.0009, 0.002], [0.002, 0.0031], [0.004, 0.0038], [0.006, 0.0039], [0.008, 0.0037], [0.01, 0.0034], [0.012, 0.0024], [0.014, 0.0008]],
        [[0.0005, 0.001], [0.0007, 0.002], [0.0009, 0.003], [0.0012, 0.004], [0.0014, 0.005], [0.002, 0.0076], [0.004, 0.0116], [0.006, 0.0127], [0.008, 0.013], [0.01, 0.0128], [0.012, 0.0121], [0.014, 0.0113], [0.016, 0.0102], [0.018, 0.0088], [0.02, 0.0071], [0.022, 0.0035], [0.0225, 0.001]],
        [[0.0008, 0.001], [0.001, 0.002], [0.0012, 0.003], [0.0014, 0.004], [0.002, 0.007], [0.004, 0.0145], [0.006, 0.0172], [0.008, 0.018], [0.01, 0.0185], [0.012, 0.0184], [0.014, 0.018], [0.016, 0.0177], [0.018, 0.0171], [0.02, 0.0162], [0.022, 0.0145], [0.024, 0.0104], [0.0248, 0.009], [0.025, 0.008], [0.0252, 0.007], [0.0254, 0.006], [0.0257, 0.005], [0.0258, 0.004], [0.0258, 0.003], [0.0258, 0.002], [0.0258, 0.001]],
        [[0.0001, 0.001], [0.0001, 0.002], [0.0003, 0.003], [0.0006, 0.004], [0.0008, 0.005], [0.001, 0.006], [0.0013, 0.007], [0.002, 0.0094], [0.004, 0.0135], [0.006, 0.0158], [0.02, 0.0128], [0.022, 0.0104], [0.024, 0.0069], [0.026, 0.0031], [0.0265, 0.002], [0.027, 0.001]],
      ],
      corner: 0.75,
      rail: 3,
      columns: 192,
    },
  };

  /** Chord of the thumb's blend on either side of the curve where it meets the hand, mm: at 1 mm it folds in the acute web beside the index finger. */
  const THUMB_CHORD_MM: number = 0.5;

  /** How far behind its first joint the thumb's root closes in a point, inside the hand, mm. */
  const ROOT_MM: number = 10;


  /**
   * Station spacing of the layers and derived outlines of a sewn family, mm. Each part adds stations of its own where its section turns fast,
   * so 4 mm is admitted whole; at 2 mm the engine read one toe's middle section as degenerate, and at 8 mm it refuses the arm's face.
   */
  const LAYER_MM: number = 4;

  /**
   * How far outside the arm's ring the port loop stands on the trunk's own skin, mm. With the rail 10 mm in, at 6 mm every column of the band
   * leaves the trunk toward the ring and reaches it along the arm's own direction (`FamilyConicArmscye.ts`), 6 to 19 mm long. At 3 mm with
   * the rail 3 mm in the same held, but a band 4 mm long turned from the trunk's skin to the arm's so sharply that it showed as a line round
   * the shoulder.
   */
  const ARMSCYE_MARGIN_MM: number = 6;

  /**
   * How far below the armpit's crease the arm's ring is still followed by the loop, mm. The ring 10 mm into the arm dips 25 mm below the
   * crease, since the arm hangs down from it; a loop that follows it there cuts away the trunk's side up to the crease, and the band is a
   * web across the hollow.
   */
  const ARMPIT_DROP_MM: number = -6;

  /** Width of the smooth maximum by which the loop meets that floor, mm: the loop rounds onto the floor over about this much height. */
  const ARMPIT_ROUND_MM: number = 12;

  /**
   * Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. The arm's first station is 2 mm
   * past the armscye's plane and its course is nearly square to that plane for its first 25 mm, so its ring 10 mm on lies beside the plane. The ear's band lands half a millimetre in: its dome starts 5 mm out and its hollow is cut to within 1.5 mm of its root. The nose's lands 4 mm in, so the band is wide where a nostril's cut crosses it: 0.5 mm wide, its triangulation failed on another machine's arithmetic, and 2 mm in the nostril's own face failed.
   */
  export const RAIL_MM: { arm: number; leg: number; ear: number; nose: number } = { arm: 10, leg: 6, ear: 0.5, nose: 4 };

  /**
   * How far outside the nose's root its port loop stands on the face, and outside the auricle's root the ear's stands on the skull, mm.
   * The ear's is wider: the concha's bowl is cut across the ear's band down to its floor, and at 4 mm its front edge, by the tragus, came
   * out past the loop onto the head's own skin, where the cut left the skin open along it.
   */
  const NOSE_MARGIN_MM: number = 4;
  const AURICLE_MARGIN_MM: number = 6;

  /**
   * Spacing of a digit's layers at its root, mm, and how far from its first station that holds, mm. Each digit meets its limb in a curve a few
   * millimetres across with a blend 1 mm wide; on layers 4 mm apart the digit's root was a few flat facets.
   */
  const WEB_LAYER_MM: number = 1;
  const WEB_REACH_MM: number = 12;

  /**
   * When a layer is added midway between two of a family that carries reliefs: its skin there stands off the middle of the chord between the
   * two by more than `sagitta` mm at some phase. No interval is cut below `least` mm. Layers are level rings, so a fold that crosses them
   * aslant, as the one under the breast does, is drawn in steps as tall as the layers are apart; where the skin turns that fast the layers
   * must stand closer than the 4 mm that carries the rest.
   */
  const FOLD: { sagitta: number; least: number; phases: number } = { sagitta: 0.15, least: 0.5, phases: 96 };

  /** Columns round each band and rows across it. */
  const BAND: { count: number; rows: number } = { count: 96, rows: 8 };

  /**
   * Columns round each leg's band at the crotch and round each arm's at the armscye. A band twists from its loop's direction to its ring's, so
   * each of its quads is two triangles of different slope, and a column wider than about 2 mm shows as a pair of stripes: at 96 columns a ring
   * of facets stood round each thigh, at 144 upright hatching, and at 288, 2 mm apart round a thigh's girth of 565 mm, neither.
   */
  const THIGH_COLUMNS: number = 288;
  const SHOULDER_COLUMNS: number = 192;

  /** The sewn body's declaration: its construction tree and the view parts its source leaves name. */
  export interface IConstruction {
    /** The tree: both arm ports over the crotch split over the trunk. */
    root: AutoMovieConstructionNode;

    /** The view part of every source leaf, by its name. */
    sources: Map<string, IAutoMovieViewPart>;
  }

  /**
   * The armscye's port on the trunk's chart.
   *
   * The armscye is the armpit's sagittal plane: the trunk owns the skin medial of it and the arm the skin lateral of it, the shoulder's cap
   * included. The arm's course leaves the trunk square to that plane, so the ring the band lands on lies beside the plane. The port is that
   * ring's own outline as the trunk's chart sees it, each point's height above the axis's foot and its phase about the axis, pushed out from
   * the outline's centre by the margin so the loop stands on the trunk's own skin round the ring. The loop is written as the ellipse on the
   * outline's half extents with a share per column. An ellipse alone stood up to 29 mm from the ring under the armpit, where the ring's
   * lower edge runs aslant, and the band there reached the arm against the arm's own direction.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   */
  export function armscye(side: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY.arm : AutoMovieHumanConicLoft.mirror(BODY.arm, BODY.arm.name + ".mirror");
    const first: number = family.knots[0]!;
    const rail: number = first + RAIL_MM.arm;

    // The arm's ring at the rail, read from a loft of its first stations alone.
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, [first, rail, first + 2 * RAIL_MM.arm, first + 4 * RAIL_MM.arm]);
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const outline: [number, number][] = Array.from({ length: 4 * SHOULDER_COLUMNS }, (_: unknown, j: number): [number, number] => {
      const p: number[] = AutoMovieLoftChain.point(chain, rail, (2 * Math.PI * j) / (4 * SHOULDER_COLUMNS));
      // The floor under the crease, met by a smooth maximum: held by a plain one, the loop ran level along the floor and turned up at a
      // corner at each end, and the band stood a box-shaped notch at the back of the armpit.
      const floor: number = J.armpit[1] - ARMPIT_DROP_MM;
      return [(p[1]! + floor + Math.hypot(p[1]! - floor, ARMPIT_ROUND_MM)) / 2 - J.axisFloor[1], Math.atan2(p[2]!, p[0]!)];
    });
    const span = (c: 0 | 1): [number, number] => [Math.min(...outline.map((q: [number, number]): number => q[c])), Math.max(...outline.map((q: [number, number]): number => q[c]))];
    const [stations, phases]: [number, number][] = [span(0), span(1)];
    const centre: [number, number] = [(stations[0] + stations[1]) / 2, (phases[0] + phases[1]) / 2];
    const semi: [number, number] = [(stations[1] - stations[0]) / 2, (phases[1] - phases[0]) / 2];

    // Each outline point by its clock on that ellipse and its distance from the centre as a share of the ellipse's.
    const polar: [number, number][] = outline
      .map((q: [number, number]): [number, number] => {
        const x: number = (q[0] - centre[0]) / semi[0];
        const y: number = (side * (q[1] - centre[1])) / semi[1];
        return [(Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI), Math.hypot(x, y)];
      })
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const shape: number[] = Array.from({ length: SHOULDER_COLUMNS }, (_: unknown, k: number): number => {
      const clock: number = (2 * Math.PI * k) / SHOULDER_COLUMNS;
      const after: number = polar.findIndex((q: [number, number]): boolean => q[0] >= clock);
      // The outline's two points on either side of the clock; round the turn's end, its last point and its first.
      const [a, b]: [number, number][] = after > 0 ? [polar[after - 1]!, polar[after]!] : after === 0 ? [[polar.at(-1)![0] - 2 * Math.PI, polar.at(-1)![1]], polar[0]!] : [polar.at(-1)!, [polar[0]![0] + 2 * Math.PI, polar[0]![1]]];
      const share: number = b[0] === a[0] ? a[1] : a[1] + ((b[1] - a[1]) * (clock - a[0])) / (b[0] - a[0]);

      // The margin as a share of the ellipse's own distance at this clock, a phase taken at the armpit's side distance.
      return share + ARMSCYE_MARGIN_MM / Math.hypot(semi[0] * Math.cos(clock), semi[1] * J.armpit[2] * Math.sin(clock));
    });
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense: side, shape };
  }

  /**
   * The ear's port on the trunk's chart: an ellipse about the centre of the auricle's root, its semi-axes the root's half height in station and
   * its half depth as a phase at the root's side distance, both widened by the margin so the loop stands on the skull round the root.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   */
  export function auricle(side: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    return {
      centre: [(J.earBase[1] - J.axisFloor[1]) / 1000, side * Math.atan2(J.earBase[2], J.earBase[0])],
      semi: [(J.earHalf[0] + AURICLE_MARGIN_MM) / 1000, Math.atan((J.earHalf[1] + AURICLE_MARGIN_MM) / J.earBase[2])],
      sense: 1,
    };
  }

  /**
   * The nose's port on the trunk's chart: an ellipse about the centre of the nose's root on the median line in front, its semi-axes the root's
   * half height in station and its half width as a phase at the root's forward distance, both widened by the margin.
   */
  export function nostril(): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    return {
      centre: [(J.noseBase[1] - J.axisFloor[1]) / 1000, 0],
      semi: [(J.noseHalf[0] + NOSE_MARGIN_MM) / 1000, Math.atan((J.noseHalf[1] + NOSE_MARGIN_MM) / J.noseBase[0])],
      sense: 1,
    };
  }

  /**
   * Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the
   * plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
   *
   * @param family The limb's family, its end open.
   * @param station The end's station, mm.
   * @param joints The two digits' first and second joints: `[[first, second], [first, second]]`.
   * @param up The palm's or the sole's normal, or any direction the plane must hold.
   */
  export function valley(family: AutoMovieHumanConicLoft.IFamily, station: number, joints: [[number[], number[]], [number[], number[]]], up: number[]): [number, number] {
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, family.knots);
    if (loft.chain === null) throw new Error("valley: the limb does not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const mid = (a: number[], b: number[]): number[] => [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2, (a[2]! + b[2]!) / 2];
    const m1: number[] = mid(joints[0][0], joints[1][0]);
    const m2: number[] = mid(joints[0][1], joints[1][1]);
    const d: number[] = [m2[0]! - m1[0]!, m2[1]! - m1[1]!, m2[2]! - m1[2]!];
    const normal: number[] = [d[1]! * up[2]! - d[2]! * up[1]!, d[2]! * up[0]! - d[0]! * up[2]!, d[0]! * up[1]! - d[1]! * up[0]!];
    const side = (t: number): number => {
      const p: number[] = AutoMovieLoftChain.point(chain, station, t);
      return (p[0]! - m1[0]!) * normal[0]! + (p[1]! - m1[1]!) * normal[1]! + (p[2]! - m1[2]!) * normal[2]!;
    };
    const count: number = 720;
    const crossings: number[] = [];
    for (let k: number = 0; k < count; ++k) {
      let [lo, hi]: number[] = [(2 * Math.PI * k) / count, (2 * Math.PI * (k + 1)) / count];
      if (side(lo!) <= 0 === side(hi!) <= 0) continue;
      for (let i: number = 0; i < 50; ++i) {
        const middle: number = (lo! + hi!) / 2;
        if (side(middle) <= 0 === side(lo!) <= 0) lo = middle;
        else hi = middle;
      }
      crossings.push((lo! + hi!) / 2);
    }
    if (crossings.length !== 2) throw new Error("valley: the plane crosses the limb's end " + crossings.length + " times");
    return [crossings[0]!, crossings[1]!];
  }

  /**
   * The seams a limb's open end is split along between its knuckled digits (`IAutoMovieConstructionSplit.outer`), from the little
   * finger's or the little toe's valley inward, each a pair of host phases on the end's ring enclosing the one before; each seam's heading,
   * the two digits' mean direction (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or
   * sole normal. The split of a fanned limb's end (`FANS`) and `FamilyConicScan.ts webs` read it.
   *
   * @param which The limb.
   */
  export function fanSeams(which: "arm" | "leg"): { station: number; seams: [number, number][]; headings: [number, number, number][]; normal: number[]; up: number[] } {
    const J = AutoMovieHumanF1Joints;
    const family: AutoMovieHumanConicLoft.IFamily = { ...BODY[which], tips: undefined };
    const station: number = family.knots.at(-1)!;
    const sub = (a: number[], b: number[]): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const [a, b]: number[][] = [sub(J.index1, J.hand), sub(J.pinky1, J.hand)];
    const up: number[] = which === "arm" ? [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!] : [0, -1, 0];
    const rows: [number[], number[]][] = which === "arm" ? [[J.pinky1, J.pinky2], [J.ring1, J.ring2], [J.middle1, J.middle2], [J.index1, J.index2]] : [[J.littletoe1, J.littletoe2], [J.ringtoe1, J.ringtoe2], [J.middletoe1, J.middletoe2], [J.indextoe1, J.indextoe2], [J.bigtoe1, J.bigtoe2]];
    const seams: [number, number][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i) {
      const [p, q]: [number, number] = valley(family, station, [rows[i]!, rows[i + 1]!], up);
      if (seams.length === 0) {
        seams.push([p, q]);
        continue;
      }
      // Of the three readings of the same two crossings, the one that encloses the seam before.
      const [ia, ib]: [number, number] = seams.at(-1)!;
      const enclosing: [number, number] | undefined = ([[p, q], [q, p + 2 * Math.PI], [q - 2 * Math.PI, p]] as [number, number][]).find(([x, y]: [number, number]): boolean => x < ia && y > ib && y < x + 2 * Math.PI);
      if (enclosing === undefined) throw new Error("fanSeams: the valleys of the " + which + " do not nest");
      seams.push(enclosing);
    }
    const frame = AutoMovieHumanConicLoft.axis(family).at(station);
    const normal: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
    // Each seam's plane holds the two digits' mean direction, the line from their first joints' midpoint to their second joints'.
    const headings: [number, number, number][] = rows.slice(1).map((row: [number[], number[]], i: number): [number, number, number] => {
      const before: [number[], number[]] = rows[i]!;
      const d: number[] = [0, 1, 2].map((c: number): number => (row[1][c]! + before[1][c]! - row[0][c]! - before[0][c]!) / 2);
      const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      return [Math.round((d[0]! / l) * 1e4) / 1e4, Math.round((d[1]! / l) * 1e4) / 1e4, Math.round((d[2]! / l) * 1e4) / 1e4];
    });
    return { station, seams, headings, normal, up };
  }

  /**
   * Declare the sewn body.
   *
   * @param layer Station spacing of each family's layers and derived outlines, mm.
   */
  export function construction(layer: number = LAYER_MM): IConstruction {
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (family: AutoMovieHumanConicLoft.IFamily, fine: number = -Infinity): AutoMovieConstructionNode => {
      const from: number = family.knots[0]!;
      const to: number = family.knots.at(-1)!;
      const count: number = Math.ceil((to - from) / layer) + 1;
      const even: number[] = Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1));

      // Inside a relief whose net is finer along the station than the layers, each layer interval is cut until it is as fine: rings 4 mm
      // apart showed the face's net, 2.6 mm apart, as level steps.
      const stations: number[] = even.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = even[i - 1]!;
        const pitch: number = Math.min(layer, before < fine ? WEB_LAYER_MM : layer, ...(family.reliefs ?? []).filter((relief): boolean => relief.stations[0] < s && relief.stations[1] > before).map((relief): number => (relief.stations[1] - relief.stations[0]) / (relief.rows - 3)));
        const cuts: number = Math.ceil((s - before) / pitch - 1e-9);
        return Array.from({ length: cuts }, (_: unknown, k: number): number => before + ((s - before) * (k + 1)) / cuts);
      });
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, folded(family, stations)));
      return { type: "source", name: family.name, source: family.name };
    };

    // The same stations with a layer added wherever the family's relieved skin turns too fast between two of them (`FOLD`).
    const folded = (family: AutoMovieHumanConicLoft.IFamily, stations: number[]): number[] => {
      if ((family.reliefs ?? []).length === 0) return stations;
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
      if (loft.chain === null) return stations;
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const ring = (s: number): number[][] => Array.from({ length: FOLD.phases }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / FOLD.phases));
      const between = (a: number, low: number[][], b: number, high: number[][]): number[] => {
        if (b - a <= 2 * FOLD.least) return [];
        const middle: number = (a + b) / 2;
        const mid: number[][] = ring(middle);
        const off: boolean = mid.some((p: number[], j: number): boolean => Math.hypot(p[0]! - (low[j]![0]! + high[j]![0]!) / 2, p[1]! - (low[j]![1]! + high[j]![1]!) / 2, p[2]! - (low[j]![2]! + high[j]![2]!) / 2) > FOLD.sagitta);
        return off ? [...between(a, low, middle, mid), middle, ...between(middle, mid, b, high)] : [];
      };
      const rings: number[][][] = stations.map(ring);
      return stations.flatMap((s: number, i: number): number[] => (i === 0 ? [s] : [...between(stations[i - 1]!, rings[i - 1]!, s, rings[i]!), s]));
    };
    const twin = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror");
    const trunk: string = BODY.trunk.name;

    // A limb with its digits: each digit is merged onto the limb's cap before the limb is attached to the trunk, so the engine traces where a
    // capsule comes out against the limb alone. Merged after the whole body was sewn, every digit was traced against all of it.
    const limb = (which: "arm" | "leg", side: 1 | -1): { node: AutoMovieConstructionNode; face: string } => {
      // The limb's end stays open and is split into its knuckled digits (`FANS`); the thumb is merged onto the hand's side first, as a
      // capsule closed `ROOT_MM` behind its first joint, inside the hand.
      const fanned: IFan = FANS[which];
      const leaned: AutoMovieHumanConicLoft.IFamily = { ...BODY[which], tips: [BODY[which].tips![0], null] };
      const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? leaned : twin(leaned);
      let node: AutoMovieConstructionNode = leaf(family);
      for (const digit of DIGITS.filter((d: IDigit): boolean => d.limb === which && !d.knuckle)) {
        const capsule: AutoMovieHumanConicLoft.IFamily = { ...digit.family, tips: [{ from: digit.family.knots[0]!, tip: -ROOT_MM, covered: true }, digit.family.tips?.[1] ?? null] };
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? capsule : twin(capsule);
        node = {
          type: "join",
          kind: "merge",
          name: "web." + part.name,
          host: node,
          part: leaf(part, digit.family.knots[0]! + WEB_REACH_MM),
          seed: { type: "search", partFace: part.name, hostFace: family.name, phase: 0, from: 0, to: 0.7 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: THUMB_CHORD_MM / 1000 },
          hostWidth: { type: "chord", value: THUMB_CHORD_MM / 1000 },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
        };
      }

      // The split: the end's seams along the valleys between the knuckled digits (`fanSeams`), each curved along its web line (`IFan.webs`)
      // in the plane that holds the two digits' mean direction. The twin's phases run the other way, so a seam `[a, b]` is `[-b, -a]` there,
      // read from its other fork: its knots run back along the chord, and its heading is reflected.
      const fan = fanSeams(which);
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(leaned, leaned.knots);
      if (loft.chain === null) throw new Error("the " + which + " does not loft");
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const seam = (j: number): IAutoMovieConstructionSplit.ISeam => {
        const [a, b]: [number, number] = fan.seams[j]!;
        const knots: [number, number][] = fanned.webs[j]!;
        const [pa, pb]: number[][] = [AutoMovieLoftChain.point(chain, fan.station, a), AutoMovieLoftChain.point(chain, fan.station, b)];
        const chord: number = Math.hypot(pb[0]! - pa[0]!, pb[1]! - pa[1]!, pb[2]! - pa[2]!) / 1000;
        const h: [number, number, number] = fan.headings[j]!;
        return side > 0
          ? { seam: [a, b], profile: { knots, corner: fanned.corner, heading: h } }
          : { seam: [-b, -a], profile: { knots: knots.map(([along, depth]: [number, number]): [number, number] => [chord - along, depth]).reverse(), corner: fanned.corner, heading: [h[0], h[1], -h[2]] } };
      };
      const children: IAutoMovieConstructionSplit.IChild[] = fanned.digits.map((name: string): IAutoMovieConstructionSplit.IChild => {
        const digit: IDigit = DIGITS.find((d: IDigit): boolean => d.family.name === name)!;
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? digit.family : twin(digit.family);
        return { band: "band." + part.name, part: leaf(part), partFace: part.name, partEnd: "bottom", rail: fanned.rail / 1000, correspondence: "length" };
      });
      const first: IAutoMovieConstructionSplit.ISeam = seam(0);
      node = {
        type: "split",
        name: "fan." + family.name,
        host: node,
        hostFace: family.name,
        hostEnd: "top",
        seam: first.seam,
        ...(first.profile === undefined ? {} : { profile: first.profile }),
        outer: fan.seams.slice(1).map((_: [number, number], j: number): IAutoMovieConstructionSplit.ISeam => seam(j + 1)),
        count: fanned.columns,
        rows: BAND.rows,
        children: children as IAutoMovieConstructionSplit["children"],
      };
      return { node, face: family.name };
    };

    // The trunk's section chart has +u forward and +v to +Z, so the seam from phase 0 to pi gives the first child the +Z half of the end.
    const legs: { node: AutoMovieConstructionNode; face: string }[] = [limb("leg", 1), limb("leg", -1)];
    let root: AutoMovieConstructionNode = {
      type: "split",
      name: "crotch",
      host: leaf(BODY.trunk),
      hostFace: trunk,
      hostEnd: "bottom",
      seam: [0, Math.PI],
      profile: CROTCH,
      count: THIGH_COLUMNS,
      rows: BAND.rows,
      children: [
        { band: "band." + legs[0]!.face, part: legs[0]!.node, partFace: legs[0]!.face, partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
        { band: "band." + legs[1]!.face, part: legs[1]!.node, partFace: legs[1]!.face, partEnd: "bottom", rail: RAIL_MM.leg / 1000 },
      ],
    };
    for (const side of [1, -1] as const) {
      const arm: { node: AutoMovieConstructionNode; face: string } = limb("arm", side);
      root = { type: "port", name: "armscye." + arm.face, host: root, hostFace: trunk, loop: armscye(side), band: "band." + arm.face, part: arm.node, partFace: arm.face, partEnd: "bottom", rail: RAIL_MM.arm / 1000, count: SHOULDER_COLUMNS, rows: BAND.rows };
      const ear: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY.ear : twin(BODY.ear);
      // The ear owns two hollows, each a loft cut out of it, both read from the reference. The upper one, the scapha and the fossa above
      // the bowl, runs along the shell's normal and is cut from the ear alone before the ear is attached. The concha's bowl, low and
      // forward behind the tragus, is read from the skin's depth and cut after the ear is attached; its cutter runs square into the head
      // to the bowl's floor, is closed at both ends, and its cut crosses the ear's band from rim to rim and back, with a blend 0.1 mm
      // wide (at 0.25 mm it folded). The leaf's pole stands on the antihelix between the two. Each curve is walked by its own length.
      const cutter = (family: AutoMovieHumanConicLoft.IFamily, host: AutoMovieConstructionNode, chord: number, phase: number): AutoMovieConstructionNode => ({ type: "join", kind: "diff", name: "cut." + family.name, host, part: leaf(family), seed: { type: "search", partFace: family.name, hostFace: ear.name, phase, from: 0, to: 0.9 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: chord / 1000 }, hostWidth: { type: "chord", value: chord / 1000 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04 });
      const scapha: AutoMovieHumanConicLoft.IFamily = side > 0 ? AutoMovieHumanF1Scapha : twin(AutoMovieHumanF1Scapha);
      const concha: AutoMovieHumanConicLoft.IFamily = side > 0 ? AutoMovieHumanF1Concha : twin(AutoMovieHumanF1Concha);
      root = { type: "port", name: "auricle." + ear.name, host: root, hostFace: trunk, loop: auricle(side), band: "band." + ear.name, part: cutter(scapha, leaf(ear), 0.25, Math.PI), partFace: ear.name, partEnd: "bottom", rail: RAIL_MM.ear / 1000, count: BAND.count, rows: BAND.rows };
      root = cutter(concha, root, 0.1, Math.PI);
    }
    root = { type: "port", name: "nostril." + BODY.nose.name, host: root, hostFace: trunk, loop: nostril(), band: "band." + BODY.nose.name, part: leaf(BODY.nose), partFace: BODY.nose.name, partEnd: "bottom", rail: RAIL_MM.nose / 1000, count: BAND.count, rows: BAND.rows };
    // Each nostril is cut from the head: its loft comes up out of the nose's underside and closes inside it.
    for (const side of [1, -1] as const) {
      const hollow: AutoMovieHumanConicLoft.IFamily = side > 0 ? AutoMovieHumanF1Nostril : twin(AutoMovieHumanF1Nostril);
      root = { type: "join", kind: "diff", name: "cut." + hollow.name, host: root, part: leaf(hollow), seed: { type: "search", partFace: hollow.name, hostFace: BODY.nose.name, phase: 0, from: 0, to: 0.9 }, parameter: { type: "phase" }, partWidth: { type: "chord", value: 0.0005 }, hostWidth: { type: "chord", value: 0.0005 }, continuity: "G2", count: 48, rows: 4, tolerance: 1e-12, grazing: 0.05 };
    }
    return { root, sources };
  }

  /**
   * Generate the figure's pieces: the sewn body, then every loose family and its twin.
   *
   * @param step Station spacing of a loose family's layers, mm.
   * @param phases Vertices round every layer of a loose family.
   * @param chord Largest distance the sewn body's triangles may stand off its surfaces, metres. Most of the generation time is this tessellation.
   */
  export function create(step: number = 4, phases: number = 128, chord: number = 0.001): IPiece[] {
    const declared: IConstruction = construction();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root }, { chord, sources: declared.sources });
    const pieces: IPiece[] = [{ name: "body", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), diagnostics: real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => d.node + " (" + d.contract + "): " + d.detail) }];
    for (const { family, mirrored, reach } of LOOSE) {
      // Layers from the first knot to the last, widened by the member's reach, evenly spaced at most `step` apart.
      const from: number = family.knots[0]! - (reach?.[0] ?? 0);
      const to: number = family.knots.at(-1)! + (reach?.[1] ?? 0);
      const count: number = Math.max(2, Math.ceil((to - from) / step) + 1);
      const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1));
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
      const diagnostics: string[] = loft.diagnostics.map((d: unknown): string => JSON.stringify(d));
      if (loft.chain === null) {
        pieces.push({ name: family.name, positions: [], indices: [], diagnostics });
        continue;
      }
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;

      // Past the last knot the loft's own cap layers follow, and the pole closes them by a fan.
      const layers: number[] = [...stations, ...chain.layers.map((layer: { y: number }): number => layer.y).filter((y: number): boolean => y > to)];
      const rings: number[][][] = layers.map((s: number): number[][] => Array.from({ length: phases }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases)));
      for (const sign of mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings) for (const p of ring) positions.push(p[0]! / 1000, p[1]! / 1000, (sign * p[2]!) / 1000);
        if (chain.pole?.end === "top") {
          const apex: number = positions.length / 3;
          const last: number = (rings.length - 1) * phases;
          positions.push(chain.pole.point[0] / 1000, chain.pole.point[1] / 1000, (sign * chain.pole.point[2]) / 1000);
          for (let j: number = 0; j < phases; ++j) indices.push(...(sign > 0 ? [last + j, apex, last + ((j + 1) % phases)] : [last + j, last + ((j + 1) % phases), apex]));
        }
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < phases; ++j) {
            const a: number = i * phases + j;
            const b: number = i * phases + ((j + 1) % phases);

            // The reflection reverses the winding, so the twin's triangles are listed the other way round.
            if (sign > 0) indices.push(a, a + phases, b, b, a + phases, b + phases);
            else indices.push(a, b, a + phases, b, b + phases, a + phases);
          }
        pieces.push({ name: family.name + (sign > 0 ? "" : ".mirror"), positions, indices, diagnostics });
      }
    }
    return pieces;
  }
}
