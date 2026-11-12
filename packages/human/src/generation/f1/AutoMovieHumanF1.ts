import { AutoMovieLoftChain, type AutoMovieConstructionRealization, AutoMovieNaturalSpline, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort } from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
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
     * Chord of the blend on either side of the curve where the digit meets the limb, mm: 1 for the fingers and the toes, whose webs leave no
     * room for a wider rail, and 0.5 for the thumb, whose blend folds at 1 mm in the acute web beside the index finger.
     */
    chord: number;
  }

  /**
   * The digits sewn to the body, in the order they are merged: the middle one of each limb first, then its neighbours outward. Each is merged
   * as a capsule: besides its tip it closes in a point `ROOT_MM` behind its first joint, inside the hand or the foot, so it meets the limb's
   * cap in a closed curve wherever it comes out.
   */
  export const DIGITS: readonly IDigit[] = [
    { family: AutoMovieHumanF1FingerMiddle, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerRing, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerIndex, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerPinky, limb: "arm", chord: 1 },
    { family: AutoMovieHumanF1FingerThumb, limb: "arm", chord: 0.5 },
    { family: AutoMovieHumanF1ToeBig, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeIndex, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeMiddle, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeRing, limb: "leg", chord: 1 },
    { family: AutoMovieHumanF1ToeLittle, limb: "leg", chord: 1 },
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

  /** How far behind its first joint a sewn digit closes in a point, mm. */
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
   * past the armscye's plane and its course is nearly square to that plane for its first 25 mm, so its ring 10 mm on lies beside the plane. The ear's band lands half a millimetre in: its dome starts 5 mm out and its hollow is cut to within 1.5 mm of its root. The nose's band lands on a curve (`NOSE_RAILS_MM`).
   */
  export const RAIL_MM: { arm: number; leg: number; ear: number } = { arm: 10, leg: 6, ear: 0.5 };

  /**
   * Where the nose's band lands on it, mm from its first station, at its phases `2 pi j / 32` (0 up, a quarter turn toward -Z, a half turn
   * down), joined by the periodic cubic: a curve, not one station, because the nose's root lies in no one plane. The nose's sections start
   * half a millimetre in front of the alar grooves, so from there its wall is the wings' outer face, but its first sections are closed by its
   * box's chords at the top, inside the dorsum, and at the bottom, inside the lip behind the subnasale. Read off the nose's own wall by its
   * distance to the reference skin (`FamilyConicScan.ts nose-rail`, the station from which it lies within 0.3 mm of the skin): the wings'
   * faces from the first station, and the dorsum from 10 mm in (x 123.5). Below, the wall leaves the lip's flesh for the skin 7 to 10.5 mm
   * in, but there the nostrils lie, back to 117.6 mm forward, and a cut that crossed the band admitted only a knife-edged blend. Below,
   * from 135 to 225 degrees round, the band lands on the line where the lip's front meets the nose's floor at 1,543 mm, read off level
   * sections at 1,542 and 1,544 mm (`FamilyConicScan.ts alar`): x 123 on the median line (9 mm in), 122.8 at 2.6 mm across (8.5), 122.2
   * at 5.4 mm (8), 120 at 8.7 mm (5.5, just behind each nostril's blended rim at 120.2 to 120.9) and 116.5 at 13 mm (3), so the band
   * rises from the lip straight into the floor. Landed 3 mm in all along, behind the nostrils, the band ran 4 to 6 mm back under the sill
   * from the lip's front and turned on itself (folds of 110 to 161 degrees along y 1,543); landed 10.5 mm in at the subnasale alone,
   * between neighbours at 3 mm, it stood as a notch. Where the wall is skin from the first station the band still lands 2 mm in, so it
   * rounds the alar groove; under the back of each wing, where the alar groove is sharpest (110 to 125 and 235 to 250 degrees), only
   * 1.5 mm in, so the crease there is crisp and softer above. Above the wings the
   * face keeps the sidewalls (`FamilyConicBody.ts noseCut`), and the band lands 5 to 8 mm in, the farther the higher, so its loop, 2.5 mm
   * outside this curve, stays on the face's own skin.
   */
  const NOSE_RAILS_MM: number[] = [10, 9.5, 8, 7, 6, 5, 3.5, 2.5, 2, 2, 1.5, 1.5, 3, 5.5, 8, 8.5, 9, 8.5, 8, 5.5, 3, 1.5, 1.5, 2, 2, 2.5, 3.5, 5, 6, 7, 8, 9.5];

  /**
   * How far outside the nose's rail curve its port loop stands on the face, and outside the auricle's root the ear's stands on the skull, mm.
   * The nose's: the rail lies 2 mm in front of the alar groove on the wing's face (`FamilyConicBody.ts nose`), so 2.5 mm puts the loop in the
   * groove and outside the box the face leaves to the nose. The ear's is wider: the concha's bowl is cut across the ear's band down to its
   * floor, and at 4 mm its front edge, by the tragus, came out past the loop onto the head's own skin, where the cut left the skin open along it.
   */
  const NOSE_MARGIN_MM: number = 2.5;
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

  /**
   * Columns round the nose's band. Its rail is a curve on the nose, which the band's end meets exactly only at its columns; between them the
   * band's own interpolation stood 0.03 mm off the nose's rail at 96 columns, and a nostril's cut, which crosses there, could not place its
   * crossing from one face to the next (`AutoMovieSolidClip.CROSSING`, 0.01 mm).
   */
  const NOSE_COLUMNS: number = 192;

  /**
   * The nostril's rim, mm: the width of its cut's blend on either side of the curve, and how far its cutter is drawn in so the opening,
   * widened by the blend, keeps the hollow's own size. The reference's rim, the alar rim and the sill, is a roll of about 1.5 to 2 mm radius
   * (`FamilyConicFigure.ts nose`, from below); with a blend of 0.15 mm the generated rim was a knife's edge.
   */
  const NOSTRIL_RIM_MM: number = 1.5;

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
    // The margin's phase is taken at the armpit's side distance.
    return around(outline, SHOULDER_COLUMNS, ARMSCYE_MARGIN_MM, J.armpit[2], side);
  }

  /**
   * A port loop round a part's ring as the trunk's chart sees it: the ellipse on the outline's half extents about their middle, with each
   * column's distance from the centre a share of the ellipse's, pushed out from the centre by the margin.
   *
   * @param outline The ring's points in the trunk's chart, `[station, phase]`, mm and radians, densely round it.
   * @param columns The band's columns.
   * @param margin How far outside the ring the loop stands, mm.
   * @param radius The distance from the trunk's axis at which a phase is read as millimetres, mm.
   * @param sense The phase's sense of increasing clock.
   */
  function around(outline: [number, number][], columns: number, margin: number, radius: number, sense: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const span = (c: 0 | 1): [number, number] => [Math.min(...outline.map((q: [number, number]): number => q[c])), Math.max(...outline.map((q: [number, number]): number => q[c]))];
    const [stations, phases]: [number, number][] = [span(0), span(1)];
    const centre: [number, number] = [(stations[0] + stations[1]) / 2, (phases[0] + phases[1]) / 2];
    const semi: [number, number] = [(stations[1] - stations[0]) / 2, (phases[1] - phases[0]) / 2];

    // Each outline point by its clock on that ellipse and its distance from the centre as a share of the ellipse's.
    const polar: [number, number][] = outline
      .map((q: [number, number]): [number, number] => {
        const x: number = (q[0] - centre[0]) / semi[0];
        const y: number = (sense * (q[1] - centre[1])) / semi[1];
        return [(Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI), Math.hypot(x, y)];
      })
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const shape: number[] = Array.from({ length: columns }, (_: unknown, k: number): number => {
      const clock: number = (2 * Math.PI * k) / columns;
      const after: number = polar.findIndex((q: [number, number]): boolean => q[0] >= clock);
      // The outline's two points on either side of the clock; round the turn's end, its last point and its first.
      const [a, b]: [number, number][] = after > 0 ? [polar[after - 1]!, polar[after]!] : after === 0 ? [[polar.at(-1)![0] - 2 * Math.PI, polar.at(-1)![1]], polar[0]!] : [polar.at(-1)!, [polar[0]![0] + 2 * Math.PI, polar[0]![1]]];
      const share: number = b[0] === a[0] ? a[1] : a[1] + ((b[1] - a[1]) * (clock - a[0])) / (b[0] - a[0]);

      // The margin as a share of the ellipse's own distance at this clock.
      return share + margin / Math.hypot(semi[0] * Math.cos(clock), semi[1] * radius * Math.sin(clock));
    });
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense, shape };
  }

  /**
   * A family with every section drawn in by a distance: at each knot each extreme moves that far toward the middle of the section's
   * extremes, and the shoulders and the medians, shares of their arcs, stay. A cutter whose cut is blended is drawn in by the blend's
   * width, which moves the opening's edge out again by about as much.
   *
   * @param family The family, whose layout's extremes come in (u, v) pairs.
   * @param mm The distance, mm.
   */
  function drawnIn(family: AutoMovieHumanConicLoft.IFamily, mm: number): AutoMovieHumanConicLoft.IFamily {
    const units: string[] = AutoMovieHumanConicSection.units(family.layout);
    const pairs: number[] = units.flatMap((unit: string, f: number): number[] => (unit === "mm" && units[f + 1] === "mm" && pairsBefore(units, f) ? [f] : []));
    const values: number[][] = family.values.map((row: number[]): number[] => [...row]);
    for (let k: number = 0; k < family.knots.length; ++k) {
      const centre: [number, number] = [pairs.reduce((s: number, f: number): number => s + family.values[f]![k]!, 0) / pairs.length, pairs.reduce((s: number, f: number): number => s + family.values[f + 1]![k]!, 0) / pairs.length];
      for (const f of pairs) {
        const [u, v]: [number, number] = [family.values[f]![k]!, family.values[f + 1]![k]!];
        const far: number = Math.hypot(u - centre[0], v - centre[1]);
        if (far <= mm) throw new Error("drawnIn: " + family.name + "'s section at knot " + k + " is narrower than " + mm + " mm");
        values[f]![k] = u - (mm * (u - centre[0])) / far;
        values[f + 1]![k] = v - (mm * (v - centre[1])) / far;
      }
    }
    return { ...family, values };
  }

  /** Whether the "mm" field at `f` starts a (u, v) pair: an even count of "mm" fields runs up to it. */
  function pairsBefore(units: string[], f: number): boolean {
    let run: number = 0;
    for (let g: number = f - 1; g >= 0 && units[g] === "mm"; --g) ++run;
    return run % 2 === 0;
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
   * The nose's port on the trunk's chart: the nose's own rail curve as the trunk's chart sees it, each point's height above the axis's foot
   * and its phase about the axis, pushed out by the margin, as the armscye's loop is the arm's ring. Its phase is read as millimetres at the
   * ring's mean distance from the trunk's axis.
   */
  export function nostril(): IAutoMovieConstructionPort.ILoop {
    const J = AutoMovieHumanF1Joints;
    const family: AutoMovieHumanConicLoft.IFamily = BODY.nose;
    const first: number = family.knots[0]!;
    const along: (psi: number) => number = AutoMovieNaturalSpline.periodic(NOSE_RAILS_MM.map((rail: number): number => first + rail));
    const far: number = first + Math.max(...NOSE_RAILS_MM);
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, [first, (first + far) / 2, far, far + LAYER_MM]);
    if (loft.chain === null) throw new Error("the nose's first stations do not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const ring: number[][] = Array.from({ length: 4 * NOSE_COLUMNS }, (_: unknown, j: number): number[] => {
      const psi: number = (2 * Math.PI * j) / (4 * NOSE_COLUMNS);
      return AutoMovieLoftChain.point(chain, along(psi), psi);
    });
    const radius: number = ring.reduce((sum: number, p: number[]): number => sum + Math.hypot(p[0]!, p[2]!), 0) / ring.length;
    return around(
      ring.map((p: number[]): [number, number] => [p[1]! - J.axisFloor[1], Math.atan2(p[2]!, p[0]!)]),
      NOSE_COLUMNS,
      NOSE_MARGIN_MM,
      radius,
      1,
    );
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
      const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? BODY[which] : twin(BODY[which]);
      let node: AutoMovieConstructionNode = leaf(family);
      for (const digit of DIGITS.filter((d: IDigit): boolean => d.limb === which)) {
        const capsule: AutoMovieHumanConicLoft.IFamily = { ...digit.family, tips: [{ from: digit.family.knots[0]!, tip: -ROOT_MM, covered: true }, digit.family.tips?.[1] ?? null] };
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? capsule : twin(capsule);
        node = {
          type: "join",
          kind: "merge",
          name: "web." + part.name,
          host: node,
          part: leaf(part, part.knots[0]! + WEB_REACH_MM),
          seed: { type: "search", partFace: part.name, hostFace: family.name, phase: 0, from: 0, to: 0.7 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: digit.chord / 1000 },
          hostWidth: { type: "chord", value: digit.chord / 1000 },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
        };
      }
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
    root = { type: "port", name: "nostril." + BODY.nose.name, host: root, hostFace: trunk, loop: nostril(), band: "band." + BODY.nose.name, part: leaf(BODY.nose), partFace: BODY.nose.name, partEnd: "bottom", rail: Math.min(...NOSE_RAILS_MM) / 1000, rails: NOSE_RAILS_MM.map((rail: number): number => rail / 1000), count: NOSE_COLUMNS, rows: BAND.rows };
    // Each nostril is cut from the head: its loft comes up out of the nose's underside and closes inside it. The band lands behind it, so the
    // cut lies wholly on the nose's own face and its blend may be as wide as the rim's roll; while the cut crossed the band at the sill only
    // a blend 0.15 mm wide found its rails there.
    for (const side of [1, -1] as const) {
      const drawn: AutoMovieHumanConicLoft.IFamily = drawnIn(AutoMovieHumanF1Nostril, NOSTRIL_RIM_MM);
      const hollow: AutoMovieHumanConicLoft.IFamily = side > 0 ? drawn : twin(drawn);
      root = { type: "join", kind: "diff", name: "cut." + hollow.name, host: root, part: leaf(hollow), seed: { type: "search", partFace: hollow.name, hostFace: BODY.nose.name, phase: 0, from: 0, to: 0.9 }, parameter: { type: "phase" }, partWidth: { type: "chord", value: NOSTRIL_RIM_MM / 1000 }, hostWidth: { type: "chord", value: NOSTRIL_RIM_MM / 1000 }, continuity: "G2", count: 48, rows: 4, tolerance: 1e-12, grazing: 0.05 };
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
