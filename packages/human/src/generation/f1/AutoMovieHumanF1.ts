import { AutoMovieLoftChain, type AutoMovieConstructionRealization, type AutoMovieLoftFrame, AutoMovieNaturalSpline, type AutoMovieViewAxis, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionFill, IAutoMovieConstructionPort, IAutoMovieConstructionSplit } from "@automovie/interface";

import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Antihelix } from "./AutoMovieHumanF1Antihelix";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1Hand } from "./AutoMovieHumanF1Hand";
import { AutoMovieHumanF1Axilla } from "./AutoMovieHumanF1Axilla";
import { AutoMovieHumanF1Breast } from "./AutoMovieHumanF1Breast";
import { AutoMovieHumanF1Concha } from "./AutoMovieHumanF1Concha";
import { AutoMovieHumanF1Helix } from "./AutoMovieHumanF1Helix";
import { AutoMovieHumanF1FingerIndex } from "./AutoMovieHumanF1FingerIndex";
import { AutoMovieHumanF1FingerMiddle } from "./AutoMovieHumanF1FingerMiddle";
import { AutoMovieHumanF1FingerPinky } from "./AutoMovieHumanF1FingerPinky";
import { AutoMovieHumanF1FingerRing } from "./AutoMovieHumanF1FingerRing";
import { AutoMovieHumanF1FingerThumb } from "./AutoMovieHumanF1FingerThumb";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1Nose } from "./AutoMovieHumanF1Nose";
import { AutoMovieHumanF1Nostril } from "./AutoMovieHumanF1Nostril";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Plate } from "./AutoMovieHumanF1Plate";
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
 * chord, and each arm, each breast and the nose is attached at a port on the
 * trunk; those bands span from a curve on the trunk to a ring of the part and
 * meet both G2 without a traced intersection. Each finger and toe is a
 * capsule merged onto its limb's cap along the curve where it comes out, and
 * each ear is its plate with the helix and the antihelix merged on it as
 * tubes, merged onto the head along the curve round the plate's root. The
 * crown, each hand, each foot, each ear, the nose and each digit close in a
 * pole.
 *
 * The hand's sections leave out the thumb past where it stands free, as the
 * trunk's leave out the arms, the ears and the nose. The face's eyes and
 * mouth are height fields over the trunk's wall. A hollow with a wall of its
 * own is a loft cut out: each nostril and each ear's bowl from the head.
 *
 * Every family is placed through f1's segment frames (`assemble`): its course, its chart's `up` and its reliefs' directions are stored in
 * the frames of the segments they belong to (`AutoMovieHumanF1Placing`) and mapped to the figure's frame at a pose, the reference pose
 * unless another is given. Whatever reads the figure's frame here (the port loops, the fan seams, the fills) reads it through those frames.
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
  export const BODY: { trunk: AutoMovieHumanConicLoft.IFamily; arm: AutoMovieHumanConicLoft.IFamily; hand: AutoMovieHumanConicLoft.IFamily; leg: AutoMovieHumanConicLoft.IFamily; ear: AutoMovieHumanConicLoft.IFamily; nose: AutoMovieHumanConicLoft.IFamily; breast: AutoMovieHumanConicLoft.IFamily } = { trunk: AutoMovieHumanF1Trunk, arm: AutoMovieHumanF1Arm, hand: AutoMovieHumanF1Hand, leg: AutoMovieHumanF1Leg, ear: AutoMovieHumanF1Plate, nose: AutoMovieHumanF1Nose, breast: AutoMovieHumanF1Breast };

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
   * The least shoulder of a toe's arcs (`AutoMovieHumanConicSection.ILayout.least`). The big toe's arc from its top to its medial side held
   * shoulders of 0.24 and 0.27 at its last two knots, 43 and 53 mm: an arc that hugs its chord turns at its ends, and the toe's medial side
   * stood a corner that its short cap carried into a fan of facets (`toes.front` px 640..790 x 440..540, folds of 33 degrees). The bound is
   * the knee's (`FamilyConicBody.ts --least=0.3`); every other toe's arcs and every toe's first section already hold 0.34 or more, so the
   * seams read on the toes' first rings (`fanSeams`) do not move.
   */
  const TOE_LEAST: number = 0.3;

  /**
   * The length of a toe's dome as a share of its section's mean reach where the dome starts (`rounded`). The big toe's reference section
   * reaches 7.95 mm on average 3.13 mm before its tip and 10.97 mm at 13.13 mm (its fitted fields at 53 and 43 mm, within 0.6 mm of the
   * skin): a half ellipse through the first whose foot stands on the wall is 8 mm long on a reach of 10 mm. A dome as long as its reach
   * (share 1) drew the big toe's end as a tapered ellipsoid on `toes.left`, where the reference's is blunt.
   */
  const TOE_DOME: number = 0.8;

  /**
   * The largest turn of a toe's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`), the arm's. On the
   * uniform 48 phases a toe takes by its girth, the big toe's medial side, where its section turns fastest, stood as flat strips along the toe
   * that read as a fan of facets from the front (`toes.front` px 640..790 x 440..540), as the forefoot's edge did on the leg's uniform phases.
   * Only a toe whose fit held an arc under `TOE_LEAST` has such a corner, the big toe alone: spaced by turn at 0.1 or 0.2 rad, the little
   * toe's band folded at its plantar fork (edges of 130 to 170 degrees over 32 to 53 edges at [132, 1, 198], against none past 112 on its
   * uniform phases), since its ring's phases moved under the fork's fill.
   */
  const TOE_TURN: number = 0.1;

  /**
   * Rings a toe's dome is meshed in (`AutoMovieHumanConicLoft.ITip.rings`). The dome turns its normal a quarter turn from the wall to the
   * tip, and the cap's twelve rings, at equal steps of the root of the distance to the tip, turned it 6 to 9 degrees each: under flat
   * shading every toe's tip stood as a bullseye of bands (`toes.front` px 200..260 x 520..570 and 540..600 x 440..500). Thirty turn it
   * 3 degrees or less each.
   */
  const TOE_CAP_RINGS: number = 30;

  /**
   * A toe whose closed end is a round dome: its cap starts as far before its tip as `TOE_DOME` of the mean reach of its section there
   * (the mean of its four extents), so the end is a half ellipsoid on that section.
   *
   * Each toe's fields were fitted up to the last station whose plane still cuts a loop of the reference, 3.1 to 3.6 mm before its tip, and the
   * cap closed from there (`ITip.from` at the last knot). There the reference's section is already the dome's (the big toe's 15 by 17 mm
   * at 53 mm against 19 by 25 at 43), but a natural cubic has no bend at its last knot, so the wall ran on straight to 53 mm and the cap,
   * 3.1 mm long, closed it as a flat disc ringed where the cap starts (`toes.left` px 700..840 x 330..600); on the small toes, whose walls
   * still shrink fast there, the cap continued their taper to a point. Started where the dome's length is its share of the reach (found by
   * fixed-point iteration from the last knot), the cap's law draws the dome itself. A toe also holds its arcs at `TOE_LEAST`, and one
   * whose fit held an arc under it spaces its phases by `TOE_TURN`.
   *
   * @param family A toe as fitted, closing at its last knot.
   */
  function rounded(family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily {
    const layout: AutoMovieHumanConicSection.ILayout = { ...family.layout, least: TOE_LEAST };
    const end: AutoMovieHumanConicLoft.ITip = family.tips![1]!;
    const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(family);
    const reach = (s: number): number => {
      const chain: AutoMovieHumanConicSection.IChain = AutoMovieHumanConicSection.resolve(read(s), layout);
      return chain.guides.reduce((sum: number, g: number, q: number): number => sum + Math.abs(chain.input.points[g]![q % 2]!), 0) / 4;
    };
    let from: number = end.from;
    for (let k: number = 0; k < 16; ++k) from = Math.max(family.knots[1]!, end.tip - TOE_DOME * reach(from));

    // Only a toe whose fit held an arc under the bound has a corner to space its phases about.
    const { shoulders }: { shoulders: number } = AutoMovieHumanConicSection.offsets(family.layout);
    const cornered: boolean = family.values.slice(shoulders).some((field: number[]): boolean => field.some((x: number): boolean => x < TOE_LEAST));
    return { ...family, layout, ...(cornered ? { turn: TOE_TURN } : {}), tips: [family.tips![0], { ...end, from: Math.round(from * 100) / 100, rings: TOE_CAP_RINGS }] };
  }

  /**
   * The digits sewn to the body. A knuckled digit is a child of its limb's split (`FANS`). The thumb is merged onto the hand's side as a
   * capsule: besides its tip it closes in a point inside the hand (`ROOT_MM`), so it meets the hand in a closed curve wherever it comes out.
   * A toe's end is a round dome (`rounded`).
   */
  export const DIGITS: readonly IDigit[] = [
    { family: AutoMovieHumanF1FingerMiddle, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerRing, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerIndex, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerPinky, limb: "arm", knuckle: true },
    { family: AutoMovieHumanF1FingerThumb, limb: "arm", knuckle: false },
    { family: rounded(AutoMovieHumanF1ToeBig), limb: "leg", knuckle: true },
    { family: rounded(AutoMovieHumanF1ToeIndex), limb: "leg", knuckle: true },
    { family: rounded(AutoMovieHumanF1ToeMiddle), limb: "leg", knuckle: true },
    { family: rounded(AutoMovieHumanF1ToeRing), limb: "leg", knuckle: true },
    { family: rounded(AutoMovieHumanF1ToeLittle), limb: "leg", knuckle: true },
  ];

  /** The families not sewn: none now. A loose family is emitted as a closed tube of its own, carried by its reach under its neighbour's skin. */
  export const LOOSE: readonly IMember[] = [];

  /** Every authored family of the figure. */
  export const FAMILIES: readonly IMember[] = [
    { family: BODY.trunk, mirrored: false },
    { family: BODY.arm, mirrored: true },
    { family: BODY.hand, mirrored: true },
    { family: BODY.leg, mirrored: true },
    { family: BODY.ear, mirrored: true },
    { family: AutoMovieHumanF1Helix, mirrored: true },
    { family: AutoMovieHumanF1Antihelix, mirrored: true },
    { family: BODY.nose, mirrored: false },
    { family: BODY.breast, mirrored: true },
    ...DIGITS.map((digit: IDigit): IMember => ({ family: digit.family, mirrored: true })),
    ...LOOSE,
  ];

  /**
   * Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`),
   * so `FAMILIES` does not hold them. Each is listed as stored, with `cut`, the family the figure lofts from it: the nostril is drawn in by
   * its rim and spread past its mouth (`drawnIn`, `spreadOut`), the others are cut as stored. A reader that changes a cutter's stored
   * fields reads through `cut` the wall the figure would cut with them.
   */
  export const CUTTERS: readonly { family: AutoMovieHumanConicLoft.IFamily; mirrored: boolean; cut: (family: AutoMovieHumanConicLoft.IFamily) => AutoMovieHumanConicLoft.IFamily }[] = [
    { family: AutoMovieHumanF1Axilla, mirrored: true, cut: (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => family },
    { family: AutoMovieHumanF1Concha, mirrored: true, cut: (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => family },
    { family: AutoMovieHumanF1Nostril, mirrored: true, cut: (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => spreadOut(drawnIn(family, NOSTRIL_RIM_MM), NOSTRIL_MOUTH_MM, NOSTRIL_SPREAD_MM) },
  ];

  /** Every family of the figure placed at a pose (`assemble`). */
  export interface IAssembly {
    /** Every segment's frame at the pose, in the figure's frame. */
    frames: AutoMovieHumanF1Placement.IFrames;

    /** `BODY` at the pose. */
    body: typeof BODY;

    /** `DIGITS` at the pose. */
    digits: IDigit[];

    /** The helix's tube at the pose. */
    helix: AutoMovieHumanConicLoft.IFamily;

    /** The antihelix's tube at the pose. */
    antihelix: AutoMovieHumanConicLoft.IFamily;

    /** The armpit's slit cutter at the pose, as stored. */
    axilla: AutoMovieHumanConicLoft.IFamily;

    /** The ear's bowl cutter at the pose, as stored. */
    concha: AutoMovieHumanConicLoft.IFamily;

    /** The nostril's cutter at the pose, as stored, before `CUTTERS`' `cut`. */
    nostril: AutoMovieHumanConicLoft.IFamily;

    /** Every family above, once: `FAMILIES`' and `CUTTERS`' families at the pose. */
    families: AutoMovieHumanConicLoft.IFamily[];

    /**
     * A station of a stored family carried to the pose, mm (`AutoMovieHumanConicPose.map`): `from` when `length` is absent, else the
     * length at the pose of the stretch `length` mm long that starts at `from`. A station constant read along a posed family (where a
     * face ends, where a band lands) goes through it; at the reference pose both are the numbers given.
     */
    station: (family: string, from: number, length?: number) => number;

    /** A datum of `AutoMovieHumanF1Placing.POINTS` at the pose, mm in the figure's frame. */
    point: (name: string) => [number, number, number];

    /** A direction of `AutoMovieHumanF1Placing.DIRECTIONS` at the pose, in the figure's frame. */
    direction: (name: string) => [number, number, number];
  }

  /**
   * Place every family of the figure at a pose: each family's course, `up` and relief directions are read from the re-based table through
   * the chain of segment frames (`AutoMovieHumanF1Placement.place`), and its section table is carried untouched. Where the pose changes
   * a course's joint angles its turns keep their set-backs, its stations are mapped and its chart takes its joints' twist
   * (`AutoMovieHumanConicPose`). Absent, the pose is the reference pose, at which every family is its stored module number for number. A twin is not placed: it is the reflection of its placed
   * side in the median plane, as before.
   *
   * @param pose One rotation per joint by segment name; a joint it leaves undefined keeps its reference rotation.
   */
  export function assemble(pose?: AutoMovieHumanF1Placement.IPose): IAssembly {
    const frames: AutoMovieHumanF1Placement.IFrames = AutoMovieHumanF1Placement.frames(pose);
    const maps: Map<string, ((station: number) => number) | null> = new Map();
    const place = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => {
      const posed: { family: AutoMovieHumanConicLoft.IFamily; station: ((station: number) => number) | null } = AutoMovieHumanF1Placement.repose(family, frames);
      maps.set(family.name, posed.station);
      return posed.family;
    };
    const body: typeof BODY = { trunk: place(BODY.trunk), arm: place(BODY.arm), hand: place(BODY.hand), leg: place(BODY.leg), ear: place(BODY.ear), nose: place(BODY.nose), breast: place(BODY.breast) };
    const digits: IDigit[] = DIGITS.map((digit: IDigit): IDigit => ({ ...digit, family: place(digit.family) }));
    const [helix, antihelix, axilla, concha, nostril]: AutoMovieHumanConicLoft.IFamily[] = [AutoMovieHumanF1Helix, AutoMovieHumanF1Antihelix, AutoMovieHumanF1Axilla, AutoMovieHumanF1Concha, AutoMovieHumanF1Nostril].map(place);
    return {
      frames,
      body,
      digits,
      helix: helix!,
      antihelix: antihelix!,
      axilla: axilla!,
      concha: concha!,
      nostril: nostril!,
      families: [...Object.values(body), helix!, antihelix!, ...digits.map((digit: IDigit): AutoMovieHumanConicLoft.IFamily => digit.family), axilla!, concha!, nostril!],
      station: (family: string, from: number, length?: number): number => {
        const map: ((station: number) => number) | null | undefined = maps.get(family);
        if (map === undefined) throw new Error("assemble: no family " + family);
        return length === undefined ? (map === null ? from : map(from)) : map === null ? length : map(from + length) - map(from);
      },
      point: (name: string): [number, number, number] => AutoMovieHumanF1Placement.point(name, frames),
      direction: (name: string): [number, number, number] => AutoMovieHumanF1Placement.direction(name, frames),
    };
  }

  /** A point in the trunk's chart: its station along the trunk's course from the course's foot, mm, and its coordinates across it, mm. */
  interface IChart {
    station: number;
    u: number;
    v: number;
  }

  /**
   * The trunk's chart of a point of the figure's frame at a pose: its station along the trunk's course and its coordinates across it, `u`
   * along the chart's `up` and `v = u x t` as the engine charts a course, whose angle `atan2(v, u)` is the chart's phase. The point is
   * mapped into the pelvis's frame, the trunk's own, and read there about the trunk's course, so a port loop read through it follows a
   * posed child and does not change when the whole figure moves. The trunk's course is straight and its chart has no roll.
   */
  function trunkChart(placed: IAssembly): (p: readonly number[]) => IChart {
    const pelvis: F.IFrame = AutoMovieHumanF1Placement.frame("pelvis", placed.frames);
    const floor: F.V3 = F.toLocal(pelvis, placed.body.trunk.centres[0]!);
    const t: F.V3 = F.unit(F.sub(F.toLocal(pelvis, placed.body.trunk.centres[1]!), floor));
    const u: F.V3 = F.perpendicular(F.toLocalDirection(pelvis, placed.body.trunk.up), t);
    const v: F.V3 = F.cross(u, t);
    return (p: readonly number[]): IChart => {
      const q: F.V3 = F.sub(F.toLocal(pelvis, [p[0]!, p[1]!, p[2]!]), floor);
      return { station: F.dot(q, t), u: F.dot(q, u), v: F.dot(q, v) };
    };
  }

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
  const CROTCH: { knots: [number, number][]; corner: number; fair: [number, number] } = { knots: [[0.0131, 0], [0.0231, 0.0011], [0.0331, 0.0028], [0.0431, 0.0031], [0.0531, 0.0029], [0.0631, 0.0018]], corner: 0.6, fair: [0.35, 0.35] };

  /** A limb whose open end is split into its knuckled digits. */
  interface IFan {
    /** The digits in the seams' order, from the little finger or the little toe (`fanSeams`). */
    digits: string[];

    /** Each seam's web line, knots `[along, depth]` in metres in its plane (`IAutoMovieConstructionSplit.IProfile`). */
    webs: [number, number][][];

    /** The bands' turn at each fork, radians of clock. */
    corner: number;

    /** The share of its length each band's ribbon keeps at a fork (`IAutoMovieConstructionSplit.IProfile.reach`); absent, the whole. */
    reach?: number;

    /** Whether the bands leave the limb's end square to its ring (`IAutoMovieConstructionSplit.IProfile.square`); absent, along its station lines. */
    square?: boolean;

    /** The radius of the skin faired about each fork, as a share of its seam's chord (`IAutoMovieConstructionSplit.IProfile.fair`), one for both forks or `[palm or sole, back]`; absent, the forks stay as drawn. */
    fair?: number | [number, number];

    /** Where each digit's band lands on it, mm past its first station, the web. */
    rail: number;

    /** Columns round each band, a quarter on each seam it takes. */
    columns: number;

    /**
     * Grid stations across each band (`IAutoMovieConstructionSplit.rows`). At the bands' default 8, rows up to 2 mm apart drew the fork
     * fills as facets and folded the bands where a column turns, beside the hand's palm forks (173 degrees on the middle finger's band) and
     * in front of the toes' plantar forks (179); at 24 the hand's split keeps one edge folding by 90 degrees or more (8 before) and the
     * leg's 22 (51), and the toes' tops are smooth (`limbview`, a scratch render of one limb's split). At 16 the leg kept 33.
     */
    rows: number;
  }

  /**
   * The limbs split at their ends, Birn's hand: the palm lofted on past the knuckles, its end cut into one opening per finger along the
   * webs, and each opening bridged to its finger by a band. The hand's end at 595 mm on the arm's course, which turns at the middle
   * finger's first joint toward the four fingers' mean direction, faces the fingers, so each band runs on to its finger. The web lines are
   * `FamilyConicScan.ts webs` every 2 mm along each seam's chord, depths of 0 left out so the seam leaves its fork along the host, with the
   * run-out knots it reads beside a palm fork; they were read again once the palm's net (`arm.palm`) brought the end ring's palm side onto
   * the skin, where every web now starts at its palm fork instead of 6 to 10 mm along the chord, and again on the hand's own family
   * (`AutoMovieHumanF1Hand`) for the ring and middle fingers' seams. They were read once more after the hand's wall was laid again from
   * its sound knots at the thumb's web (#3412: the shoulders after anchors 0 and 7 at 552 and 564 mm, and the fullness about anchor 1 at
   * 552 mm), whose refitted palm net moves the end ring by 0.1 mm at most; the webs moved by 0.1 mm at eight knots. The little finger's
   * seam keeps the web read on the arm's end ring
   * (3.0 mm deep): read on the hand's (2.2 mm, from 0.5 mm at 2 mm along) the ring finger's band folded by 175 degrees over 7 edges beside
   * its palm fork ([176, 919, 465], band station 6.5 mm), and with that one seam's old web alone the fold is gone (`limbview`). Each band
   * takes 192 columns: on 96, 0.5 to 1 mm apart along a seam, its quads stood as a comb of steps along every seam. The hand's ribbons keep
   * half their length at each fork (`reach`): the skin's edges folding by more than 90 degrees over the hand fall from 168 to 119. Both
   * limbs' bands leave the end square to its ring (`square`): along the station lines, which lean along the ring where the sections change
   * shape under their polar phase, the toes' bands folded more (edges folding by 60 degrees or more round the toe roots, 197 against 149),
   * and the big toe's band drew a dark slit from its top fork; the hand's are unchanged (62 against 60). Both limbs fair the skin about
   * every fork over a disc half the seam's chord across (`fair`, `fairAutoMovieSolidMesh`): at a fork the end and two bands meet in a corner
   * no one surface owns, and the bands' ribbons turn beside it over the corner window, a share of the seam, so the marks there run as long
   * as the window (8 to 15 mm along the toes' top forks, `limbview`, a scratch render of one limb). Discs of 4 and 5 mm left every mark;
   * at half the chord, 9 to 14 mm, the top forks of the toes open into a V as the reference's do and the hand's dorsal notches soften.
   * The backs take 0.7 of the chord and the palm and the sole half: at half everywhere narrow dark V's stayed at the middle toes' top forks
   * and a bump at the little finger's; at 0.7 everywhere the fill under the plantar forks bulged below the sole; at 0.8 on the back the toes
   * read as webbed far up.
   */
  const FANS: { arm: IFan; leg: IFan } = {
    arm: {
      digits: ["finger.pinky", "finger.ring", "finger.middle", "finger.index"],
      webs: [
        [[0.002, 0.0015], [0.004, 0.0029], [0.006, 0.003], [0.008, 0.0015]],
        [[0.0012, 0.001], [0.002, 0.0027], [0.004, 0.0058], [0.006, 0.0081], [0.008, 0.0094], [0.01, 0.0097], [0.012, 0.0085], [0.014, 0.006], [0.016, 0.0025]],
        [[0.0012, 0.001], [0.002, 0.0027], [0.004, 0.0057], [0.006, 0.0069], [0.008, 0.0066], [0.01, 0.0055], [0.012, 0.0042], [0.014, 0.0025], [0.016, 0.0005]],
      ],
      corner: 0.6,
      reach: 0.5,
      square: true,
      fair: [0.5, 0.7],
      rail: 3,
      columns: 192,
      rows: 24,
    },
    // The foot's end at 975 mm on the leg's course, turned at the ball of the foot toward the five toes. Every seam's plane passes through
    // the gap between its toes' facing skins (`fanSeams`); held midway between the index and the big toe's axes it ran through the big
    // toe, whose rays from 8 to 18 mm along the chord ran on inside it (31 to 47 mm) and were left out. Beside each fork the web stands up to 10 mm out of the end, on the sole as on top, so each seam first runs out along the foot and
    // then turns across: the knots before the first web knot and after the last are `FamilyConicScan.ts webs`' run-out readings, rays
    // along the chord every millimetre out from the end; read only every 2 mm along the chord, the seam turned down within 1 to 2 mm of
    // its fork and stood a pointed tent between the toes on top. The bands turn over 0.75 rad of clock at each fork, nearly half of a
    // stretch's 1.57: columns square to the ring and to the seam converge inside a fork's corner within about the turn's window, and the
    // toe bands, 16 to 20 mm long, folded beside their forks over 185 of 3,840 clocks at 0.6 rad, 110 at 0.75 and 237 at 0.3 (sampled
    // every 0.008 rad and 1/40 of each band's span, normals flipping between neighbours). Their ribbons keep a quarter of their length at
    // each fork (`reach`): 110 clocks fold at the whole length, 44 at a half, 24 at a quarter and 28 at a tenth, and the webs' blades on top
    // become grooves. The hand's bands keep their whole length: theirs fold in 13 clocks of 3,072 at the whole, 48 at a quarter.
    leg: {
      digits: ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"],
      webs: [
        [[0.0004, 0.001], [0.001, 0.002], [0.002, 0.003], [0.004, 0.0038], [0.006, 0.0038], [0.008, 0.0036], [0.01, 0.0033], [0.012, 0.0023], [0.014, 0.0008]],
        [[0.0005, 0.001], [0.0007, 0.002], [0.0009, 0.003], [0.0012, 0.004], [0.0014, 0.005], [0.002, 0.0076], [0.004, 0.0117], [0.006, 0.0129], [0.008, 0.0133], [0.01, 0.013], [0.012, 0.0123], [0.014, 0.0114], [0.016, 0.0102], [0.018, 0.0091], [0.02, 0.0072], [0.022, 0.0036], [0.0225, 0.001]],
        [[0.0008, 0.001], [0.001, 0.002], [0.0012, 0.003], [0.0014, 0.004], [0.002, 0.007], [0.004, 0.0144], [0.006, 0.0171], [0.008, 0.0179], [0.01, 0.0182], [0.012, 0.018], [0.014, 0.0176], [0.016, 0.017], [0.018, 0.0162], [0.02, 0.015], [0.022, 0.0136], [0.024, 0.0102], [0.0247, 0.009], [0.025, 0.008], [0.0252, 0.007], [0.0254, 0.006], [0.0256, 0.005], [0.0258, 0.004], [0.0258, 0.003], [0.0258, 0.002], [0.0258, 0.001]],
        [[0.0001, 0.001], [0.0001, 0.002], [0.0003, 0.003], [0.0005, 0.004], [0.0008, 0.005], [0.001, 0.006], [0.0012, 0.007], [0.0015, 0.008], [0.002, 0.0098], [0.004, 0.0141], [0.006, 0.0152], [0.008, 0.0156], [0.01, 0.0154], [0.012, 0.0149], [0.014, 0.0141], [0.016, 0.013], [0.018, 0.0117], [0.02, 0.0102], [0.022, 0.0087], [0.024, 0.0061], [0.026, 0.0028], [0.0269, 0.001]],
      ],
      corner: 0.75,
      reach: 0.25,
      square: true,
      fair: [0.5, 0.7],
      rail: 3,
      columns: 192,
      rows: 24,
    },
  };

  /**
   * The largest turn of a limb's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`); a limb absent here
   * keeps uniform phases. The leg's 160 uniform phases, set by the thigh's girth, turned by up to 0.83 rad each round the forefoot's outer
   * edge and up to 0.94 at the ankle (the lofted rings read every millimetre of station), and the outer edge of the forefoot showed as level
   * stripes, the phases' facets; they went with phases 2 mm apart everywhere. Spaced so that no ring turns by more than 0.2 rad between
   * two phases, the leg takes 360 phases, most of them round the foot's edges, and its rings, read every millimetre, turn by at
   * most 0.37 rad on the forefoot. The arm's 104 uniform phases, set by the shoulder's girth, stood as flat strips 2.7 mm wide down the
   * hand's ulnar edge, a row of terraces on `hand.left` (px 440..520 x 480..600) that stayed with every net of the hand taken off; at 0.2
   * rad (312 phases) faint ones stayed, and at 0.1 (568) they are gone.
   */
  const PHASE_TURN: { arm?: number; leg?: number } = { arm: 0.1, leg: 0.2 };

  /**
   * Where the arm's face ends, mm along its course, and the hand's family (`AutoMovieHumanF1Hand`, from 448) takes over across `WRIST`.
   * The arm family's one knuckle turn (half 10) drew the hand's back as two flat-bottomed valleys and creased the palm; the hand's own turn
   * (half 22) is fitted from 448, past the forearm's last level that a single section turn still follows, and the arm stops 3 mm before it
   * so that the band starts on the arm's own surface, not on a ring the hand's fit also claims.
   */
  const ARM_TO_MM: number = 445;

  /**
   * The band joining the arm's end to the hand (`IAutoMovieConstructionContinuation.band`): its rail into the hand, mm, its columns and its
   * rows. The rail, 10 mm, puts the hand's ring at 458, past the fit's first knot interval (448 to 468 at its 10 mm midpoint), so the band
   * meets the hand where its sections are fitted, not at their free start. 256 columns space the wrist's 165 mm girth 0.65 mm apart, finer
   * than either face's phases there (`PHASE_TURN.arm`), and 12 rows space the 13 mm span about 1.1 mm apart, as the fingers' bands.
   */
  const WRIST: { rail: number; count: number; rows: number } = { rail: 10, count: 256, rows: 12 };

  /** Chord of the thumb's blend on either side of the curve where it meets the hand, mm: at 1 mm it folds in the acute web beside the index finger. */
  const THUMB_CHORD_MM: number = 0.5;

  /**
   * The width of the skin faired about the thumb's blend, mm (`IAutoMovieConstructionJoin.fair`). The blend, 0.5 mm wide, met the hand in a
   * crisp ledge round the thumb's dorsal root (`limbview` close to [212, 972, 425], a scratch render of the arm's split alone). Faired over
   * 1.5 mm the fill folded the blend itself (edges folding by 90 degrees or more on the arm's split, 8 to 38); over 3 to 6 mm the ledge
   * softened and a fin stood in the web beside the index finger; over 8 mm, about the thumb's half width at its root, the root runs into
   * the hand with no ledge and the web is clean, with 6 edges folding by 115 to 138 degrees on the hand beside the root. Those folds, the
   * dark crevice in the web and the thin crease along the index metacarpal (`hand.left` px 640..650 x 370..405) are the fill's own rim
   * crossing the root's tight turn: over 11 mm the folds are 106 to 119 degrees, over 14 mm, the thumb's whole root, they are under 91 and
   * the crease is gone.
   */
  const THUMB_FAIR_MM: number = 14;

  /**
   * The width of the skin faired about each of the ear's merges, mm (`IAutoMovieConstructionJoin.fair`): 4 mm round the plate's root on the
   * head, where the auricle leaves the skull in a soft sulcus, and 1 mm about each tube's blend. At half a tube's width (3 and 2.4 mm, as
   * the thumb's is about half the thumb's) the two tubes' fills met over the narrow scapha at 1,566 to 1,572 mm and the antihelix's walk
   * was lost on the helix's.
   */
  const EAR_FAIR_MM: { helix: number; antihelix: number; root: number } = { helix: 1, antihelix: 1, root: 4 };

  /**
   * How many station lines round each part the seed searches of the ear's joins walk, phase first (`IAutoMovieConstructionSearchSeed.phases`):
   * which line of a part meets its host is a property of both surfaces, not of the part, so a fixed phase holds for one person only. On f1's
   * lens(1) plate the helix's phase-0 line stays outside the plate over its whole search (shares 0 to 0.5) and its first crossing line
   * of eight is 45 degrees, at station 26.8; the antihelix's is phase 0, at 6.8 (`FamilyConicEarRound.ts --crossing`). Eight lines,
   * 45 degrees apart, leave no side of a round tube more than 22.5 degrees from a walked line.
   */
  const EAR_SEED_LINES: number = 8;

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
   * Where the arm's band lands on it, mm from its first station, at the +Z arm's phases `2 pi j / 24`, joined by the periodic cubic. Behind
   * the armpit's crease the trunk's side and the arm's inner side meet in a slit, its top at 1,272 to 1,274 mm 25 to 35 mm behind the
   * crease's datum, and the arm's side falls 2 to 4 mm for each millimetre outward from it (`vault`, a scratch survey of the skin in planes
   * x = const); the ring 10 mm in hangs 22 mm below the slit's top at the arm's phases 96 to 136 degrees, and the band there left the
   * trunk upward and folded back over it (108 to 139 degrees, a speck on `shoulder.high-oblique`; `FamilyConicArmscye.ts --table`: host
   * cosines down to -0.82 over 24 columns). There, from 75 to 135 degrees, the rail comes up to 1.5 mm, to the first section's foot at
   * 1,263 mm, and the loop follows the ring under the slit (`ARMPIT_SINK_MM`): the band crosses the slit near its foot and the slit above
   * it is closed. Read by `FamilyConicArmscye.ts --table`, 3 columns point back, at -0.17 at worst, where the dip meets the front fold.
   */
  const ARM_RAILS_MM: number[] = [10, 10, 10, 10, 8, 3, 1.5, 1.5, 1.5, 3, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];

  /**
   * How far the loop's floor sinks where the arm's rail is shortest, mm, by the rail's share of its dip elsewhere. At 23 mm the floor is
   * 4 mm under the ring there, so the smooth maximum and the margin leave the loop 1 to 2 mm under the ring, across the slit from it: sunk
   * 18 mm the loop stood level with the ring and 16 columns left the trunk against it; sunk 28 or 40 mm it stood 3 to 6 mm under the ring
   * and up to 17 columns reached the arm against the arm's own direction, which falls 2 mm a millimetre there.
   */
  const ARMPIT_SINK_MM: number = 23;

  /** `ARM_RAILS_MM` for one side: the twin's chart runs the other way round, so its phase `psi` is the +Z arm's `-psi`. */
  export function armRails(side: 1 | -1): number[] {
    return side > 0 ? ARM_RAILS_MM : ARM_RAILS_MM.map((_: number, j: number): number => ARM_RAILS_MM[(ARM_RAILS_MM.length - j) % ARM_RAILS_MM.length]!);
  }

  /**
   * Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. The arm's first station is 2 mm
   * past the armscye's plane and its course is nearly square to that plane for its first 25 mm, so its ring 10 mm on lies beside the plane. The nose's band lands on a curve (`NOSE_RAILS_MM`).
   */
  export const RAIL_MM: { arm: number; leg: number; breast: number } = { arm: 10, leg: 6, breast: 1 };

  /**
   * How far from the breast's course the trunk's own skin starts round the port, mm, at the clocks `2 pi j / 8` about the course: 0 up, a
   * quarter turn to the side, a half turn down, three quarters toward the median line. The port's loop stands there. Under the breast it is
   * the fold's lower edge, where the chest begins (`FamilyConicBody.ts BREAST_CHEST_MM`, read off the skin's profile in half-planes about
   * the course: straight down the chest stands level 24 to 26 mm behind the top from 52 mm out), so the band spans the fold and the fold is
   * its short side; elsewhere the skin runs on from the breast with no crease, and the loop stands 5 to 6 mm outside the ring: 2 to 3.5 mm
   * out, the band joined the breast's flank to the trunk's in a visible line on `fold.left`. Over the upper flank, a quarter and an eighth
   * of a turn from the top, the loop stands 4 mm farther out (58 and 52 mm were read off the profile): there the band, 5 to 6 mm long, turned
   * from the trunk's side to the breast's within it and drew a ragged dark line along the breast's outer edge on `shoulder.high-oblique`
   * (px 600..700 x 540..610), its facets 1.9 mm columns by 0.55 mm rows; at 9 to 10 mm the turn is softer. Carried on 2 mm at three
   * eighths of a turn (47 to 49 mm), the fan of the band's columns at [99, 1246, 111] darkened (`fold.left`). The trunk's sections leave out the breast's
   * underside to 1.5 mm inside this curve, and elsewhere the skin to 1 mm inside the ring (`FamilyConicBody.ts BREAST_CLIP_MM`).
   */
  const BREAST_CHEST_MM: number[] = [62, 62, 56, 47, 52, 50, 54, 60];

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
   * 1.5 mm in, so the crease there is crisp and softer above. The floor's net (`AutoMovieHumanF1Nose`, `nose.floor`) lifts the ring
   * between the wings onto the underside's skin, which leaves it no longer star-shaped about its centroid, so the port matches it to its
   * loop by length (`correspondence`); by angle it was refused. Above the wings the
   * face keeps the sidewalls (`FamilyConicBody.ts noseCut`), and the band lands 5 to 8 mm in, the farther the higher, so its loop, 2.5 mm
   * outside this curve, stays on the face's own skin.
   */
  export const NOSE_RAILS_MM: readonly number[] = [10, 9.5, 8, 7, 6, 5, 3.5, 2.5, 2, 2, 1.5, 1.5, 3, 5.5, 8, 8.5, 9, 8.5, 8, 5.5, 3, 1.5, 1.5, 2, 2, 2.5, 3.5, 5, 6, 7, 8, 9.5];

  /**
   * How far outside the nose's rail curve its port loop stands on the face, mm: the rail lies 2 mm in front of the alar groove on the wing's
   * face (`FamilyConicBody.ts nose`), so 2.5 mm puts the loop in the groove and outside the box the face leaves to the nose.
   */
  const NOSE_MARGIN_MM: number = 2.5;

  /**
   * How much farther out the nose's loop stands under the columella, mm, at the loop's lowest clock, falling off as `(-cos c)^6` (half of
   * it about 10 mm to either side of the median line, nothing at the wings). The reference's lip turns forward into the subnasale over 6 mm of
   * height (its front at 120.6, 121.1, 122.2 and 124 mm forward at 1,538, 1,540, 1,542 and 1,544 mm, `FamilyConicScan.ts alar`); a loop 2.5 mm
   * below the floor stood on the face's own skin just under the nose's cut, which its net leaves fair and 1 mm hollow there, and the
   * profile showed a notch under the band (mouth.left px 580..598 x 235..265). Landed 5 mm below, the band spans the whole turn.
   */
  const NOSE_SUBNASAL_MM: number = 2.5;

  /**
   * The nose's band's cross profiles (`IAutoMovieConstructionPort.IProfile`), depths in metres along its inward normal, on its loop clock
   * (0 at the dorsum, a quarter turn at the +Z wing, a half turn under the columella). Read by `FamilyConicScan.ts band band.nose 64`: the
   * reference skin's depth below the plain band along its normal at shares 0.1 to 0.9 of its span, with the sidewall's net
   * (`AutoMovieHumanF1Nose`, `nose.side`) on, averaged over each window's columns and over the two sides (`+Z` and its mirror clock):
   * - Behind each wing, the alar-facial groove (clocks 1.57 to 2.36 and 3.93 to 4.71): the plain band stands 0.42, 0.70, 0.45 and 0.09 mm
   *   proud of the skin at the shares 0.2, 0.4, 0.6 and 0.8, a hollow nearer the face than the wing.
   * - Under each nostril's sill (clocks 2.6 to 3.0 and 3.28 to 3.68): the plain band lies 0.12, 0.52 and 0.87 mm inside the skin at 0.4, 0.6
   *   and 0.8, where the lip rolls into the floor; the band must end flat on the nose's ring, which lies 0.9 to 1.2 mm inside there itself,
   *   so the last knot takes 0.6 mm and the ring's own share is left to the floor's net.
   * Each window fades over 0.2 rad of clock (0.15 under the sill, where the columella's columns between the two stand within 0.35 mm).
   */
  const NOSE_PROFILES: IAutoMovieConstructionPort.IProfile[] = [
    { start: 1.57, end: 2.36, transition: 0.2, knots: [[0.3, 0.0003], [0.5, 0.0004], [0.7, 0.0002]] },
    { start: 3.93, end: 4.71, transition: 0.2, knots: [[0.3, 0.0003], [0.5, 0.0004], [0.7, 0.0002]] },
    { start: 2.6, end: 3.0, transition: 0.15, knots: [[0.4, -0.0001], [0.6, -0.0002]] },
    { start: 3.28, end: 3.68, transition: 0.15, knots: [[0.4, -0.0001], [0.6, -0.0002]] },
  ];

  /**
   * Spacing of a digit's layers at its root, mm, and how far from its first station that holds, mm. Each digit meets its limb in a curve a few
   * millimetres across with a blend 1 mm wide; on layers 4 mm apart the digit's root was a few flat facets.
   */
  const WEB_LAYER_MM: number = 1;

  /**
   * Trunk station from which its layers are spaced on the skin over the crown (`construction` `domed`), mm: 1,640 mm high, above the ears
   * (their roots reach 1,610 mm) and below where the skull's top turns over toward the vertex.
   */
  const CROWN_MM: number = 860;

  /**
   * The trunk's mesh over the face, apart from its nets: from station 690 to 830 mm (the chin to the brow) layers at most 1 mm apart, and
   * phases at most 0.016 rad apart round the whole trunk (`IFamily.phase`). The layers and phases had followed the face's finest nets (the
   * chin's 0.95 mm rows, the eyes' 105 columns); with those nets coarsened for their own sake to 1.4 to 2 mm rows and 73 columns, the face's
   * mesh read in level bands across the cheeks and the nose and in blocks over the lips and the chin, and the head's skin round the ear
   * in steps.
   */
  const TRUNK_FACE_LAYERS: [number, number, number] = [690, 830, 1];
  const TRUNK_PHASE: number = 0.016;

  /**
   * The rows by which a net cuts its family's layers (`leaf`), where they are not the net's own: a layer interval inside a net's window is
   * cut as fine as `(stations[1] - stations[0]) / (rows - 3)`, and these nets were stored at coarser grids for their numbers' sake
   * (issue #3197, stage B2), which would have thinned the layers with them (the nose's from 54 to 41).
   * Each entry is the row count the net had when its family's layers were last accepted, so the mesh stays as it was; a twin and a
   * mirrored family's net read their original's entry. Tessellation, not shape.
   */
  const NET_LAYER_ROWS: Record<string, number> = { "leg.hollow.1": 18, "nose.under": 31 };

  /**
   * The nose's largest phase step, radians (`IFamily.phase`): the column of its finest net as it was last accepted, `nose.under` at 39
   * columns over its window of 2.0416 to 4.2416 rad, which gave the nose 104 phases. That net is stored at 21 columns now (issue #3197,
   * stage B2), and the nose's phases would have followed it down to 64. Tessellation, not shape.
   */
  const NOSE_PHASE: number = (4.2416 - 2.0416) / (39 - 3);

  /**
   * Station spacing of the fingers' and the thumb's layers past their roots, mm. At the body's 4 mm the digits' rings showed as fine level
   * stripes along the thumb and the fingers under flat shading (`hand.high-oblique` px 610..660 x 520..580, a fold of 30 degrees at the
   * thumb's [238.8, 942, 427.7]), where a finger's section turns faster along it than the trunk's does; at 2 mm they are gone.
   */
  const FINGER_LAYER_MM: number = 2;

  /**
   * The largest turn of a finger's or the thumb's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`),
   * as the arm's (`PHASE_TURN`). On phases set by its girth the thumb's flat side turned into its edges between few columns and drew a
   * sawtooth of long thin facets along the thumb (`limbview` close to [236, 945, 427]), the stripes `hand.high-oblique` showed.
   */
  const FINGER_TURN: number = 0.1;
  const WEB_REACH_MM: number = 12;

  /**
   * When a layer is added midway between two of a family that carries reliefs: its skin there stands off the middle of the chord between the
   * two by more than `sagitta` mm at some phase. No interval is cut below `least` mm. Layers are level rings, so a fold that crosses them
   * aslant, as the one under the breast does, is drawn in steps as tall as the layers are apart; where the skin turns that fast the layers
   * must stand closer than the 4 mm that carries the rest.
   *
   * Over a crease's stations on its family (`creases`: the fold under each breast, 400 to 490 mm on the trunk) a layer is also added where the
   * skin turns along the station by more than `turn` degrees between the two halves of the interval, at `fine` phases. Flat shading shows
   * the turn, not the sagitta: the fold turned 14 to 20 degrees across one layer 2 to 4 mm tall, a sagitta of 0.1 mm, and stood in level
   * steps from the front. The rule holds only there: everywhere on the trunk it added 166 rings and moved the head's, whose rings the
   * ear's band is triangulated against. The mouth's band of the trunk (722 to 758 mm, `trunk.mouth`'s stations) takes it too: the lips turn through their whole roll within a few
   * millimetres of height, and on the layers the sagitta left there, 2 to 2.6 mm apart, each lip stood in level bands of light and dark
   * from the front and in steps in profile (mouth.front px 200..720 x 330..640, mouth.left).
   */
  const FOLD: { sagitta: number; least: number; phases: number; turn: number; fine: number; creases: { family: string; stations: [number, number] }[] } = { sagitta: 0.15, least: 0.5, phases: 96, turn: 4, fine: 192, creases: [{ family: "trunk", stations: [400, 490] }, { family: "trunk", stations: [722, 758] }] };

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
   * Grid stations across each arm's band. Each column's ribbons take their own scale (`ribbons: "column"`), so in front of the armpit and
   * over the cap the band arches from the trunk to the arm over its whole length instead of hugging its chord, and its rows must follow
   * that arch as the splits' rows follow theirs (`IFan.rows`).
   */
  const ARMSCYE_ROWS: number = 24;

  /**
   * Spacing of the breast's layers, mm. Over the dome a ring moves 1.5 to 4 mm across the skin for each millimetre of station, so layers
   * 4 mm apart stood as concentric steps on `fold.front`, and at 1 mm the rings still showed as ring facets folding by about 4 degrees
   * ([118, 1272, 90]).
   */
  const BREAST_LAYER_MM: number = 0.5;

  /**
   * Largest distance between the breast's neighbouring phases, mm (`AutoMovieHumanConicLoft.IFamily.pitch`). At the figure's 4 mm the
   * breast's girth of about 315 mm took about 80 phases, and with its layers half a millimetre apart the dome still showed radial spokes
   * and ring facets on `fold.front` (px 300..500 x 200..300): the phases' facets, converging on the tip. 1.5 mm is the ear rim's pitch.
   */
  const BREAST_PITCH_MM: number = 1.5;
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

  /**
   * Spacing of a nostril cutter's layers over its whole length, mm. The cutter's wall turns from its flared mouth into the canal within
   * about 2.5 mm of station above the cut (its station line at 0.4 rad round turns 72 degrees between 10.4 and 13 mm along its course,
   * where its knots at 9 and 11 mm change its section by 7 mm), and on layers 1.6 mm apart there the mesh folded 64 to 72 degrees along
   * one ring inside each nostril, a faint streak down its walls (mouth.front px 555..600 x 190..260). On layers 1 mm apart the folds were
   * 44 degrees.
   */
  const NOSTRIL_LAYER_MM: number = 0.5;

  /**
   * The nostril cutter's mouth, mm along its course: its first fitted knot (`AutoMovieHumanF1Nostril`, sections read from 9 mm), whose
   * section the lead carries out of the nose; the cut meets the floor 8 to 10 mm along it. And how far its later knots and its closed end are
   * moved on (`spreadOut`), mm: fitted, the section moves 7 mm between the knots at 9 and 11 mm, a flare whose station line turns 72 degrees
   * into the canal within 2.5 mm, and that turn stood as a streak inside each nostril however finely it was layered (folds of 32 to 50
   * degrees on layers half a millimetre apart). Spread by this much the canal starts 2 mm higher and the flare is drawn over 4 mm: the
   * nostril's lateral wall reads as one shadow from the front and from below, as the reference's does. Spread by 1 or 1.5 mm, one
   * nostril's face was refused by the triangulation ("interior point hits an unshared boundary", "does not share one original diagonal").
   */
  const NOSTRIL_MOUTH_MM: number = 9;
  const NOSTRIL_SPREAD_MM: number = 2;

  /** The sewn body's declaration: its construction tree and the view parts its source leaves name. */
  export interface IConstruction {
    /** The tree: both arm ports over the crotch split over the trunk. */
    root: AutoMovieConstructionNode;

    /** The view part of every source leaf, by its name. */
    sources: Map<string, IAutoMovieViewPart>;

    /** The skin's discs faired once it is drawn (`IAutoMovieConstruction.fills`), metres. */
    fills: IAutoMovieConstructionFill[];
  }

  /**
   * Spacing of the armpit slit cutter's layers, mm (`AutoMovieHumanF1Axilla`). Its sections narrow from the dome under the crease's front
   * to the cusp behind it within about 20 mm of station, and its cut runs along the arm's band, so its rings stand a millimetre apart as a
   * digit's root's do (`WEB_LAYER_MM`).
   */
  const AXILLA_LAYER_MM: number = 1;

  /**
   * Where the slit's cut is seeded: at the middle of the longest branch of its cutter's measured crossing with the skin, on the +Z side;
   * the twin's phase is mirrored, since a twin's `v` is negated. The cutter's surface, sampled every 0.5 mm at 720 phases from tip to tip
   * and classed inside or outside the realized body by the nearest triangle's side (`isect`, a scratch probe), meets the band in one
   * branch down each flank the whole length, on the band: the arm side's 75 mm, from 59 to 132 degrees, the trunk side's 70 mm, from 212
   * to 328. The trunk side's middle is station 60.5, phase 4.6173, [-37.4, 1266.5, 149.4], on the band (the twin's 1.6659); the search
   * spans 2 mm either side, shares 0.613 to 0.669 of the cutter's stations from its tip at 15 to its tip at 86: over 0.9 mm the twin's
   * found no meeting. Seeded on the cutter's bottom, phase pi, from its front end, the cut on the corrected trunk was lost on the
   * trunk's face at [-51.7, 1276.4, 147.2].
   */
  const AXILLA_SEED: { phase: number; from: number; to: number } = { phase: 4.6173, from: 0.613, to: 0.669 };
  /**
   * The radius the skin is faired over where the breast's band fans against the trunk below the breast's side, mm, about the thorax's
   * datum `AutoMovieHumanF1Joints.breastFan` on the +Z side and its mirror image on the other: a dark dash on `fold.left`
   * (px 600..640 x 335..345), folds of 14 degrees in the band's own triangles (`creases.ts`), where the loop's distance falls from 56 to
   * 47 mm within an eighth of a turn.
   */
  const BREAST_FAN_FILL_MM: number = 4;

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
   * The ring, the armpit's crease and the axis's foot are read in the trunk's chart at the pose (`trunkChart`), heights as stations along
   * the trunk's course, so the loop follows a posed arm.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function armscye(side: 1 | -1, placed: IAssembly = assemble()): IAutoMovieConstructionPort.ILoop {
    const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.body.arm : AutoMovieHumanConicLoft.mirror(placed.body.arm, placed.body.arm.name + ".mirror");
    // Stations past the arm's first knot as the stored arm dates them, carried to the pose: the first sections lie in the shoulder's turn.
    const past = (mm: number): number => placed.station(BODY.arm.name, BODY.arm.knots[0]! + mm);
    const chart: (p: readonly number[]) => IChart = trunkChart(placed);
    const armpit: IChart = chart(placed.point("armpit"));

    // The arm's ring at its rail curve (`armRails`), read from a loft of its first stations alone.
    const along: (psi: number) => number = AutoMovieNaturalSpline.periodic(armRails(side).map(past));
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, [past(0), past(Math.min(...ARM_RAILS_MM) / 2), past(RAIL_MM.arm), past(2 * RAIL_MM.arm), past(4 * RAIL_MM.arm)]);
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const behind: (psi: number) => number = AutoMovieNaturalSpline.periodic(armRails(side).map((mm: number): number => (RAIL_MM.arm - mm) / (RAIL_MM.arm - Math.min(...ARM_RAILS_MM))));
    const outline: [number, number][] = Array.from({ length: 4 * SHOULDER_COLUMNS }, (_: unknown, j: number): [number, number] => {
      const psi: number = (2 * Math.PI * j) / (4 * SHOULDER_COLUMNS);
      const p: IChart = chart(AutoMovieLoftChain.point(chain, along(psi), psi));
      // The floor under the crease, met by a smooth maximum: held by a plain one, the loop ran level along the floor and turned up at a
      // corner at each end, and the band stood a box-shaped notch at the back of the armpit. Behind the crease, where the rail comes up to
      // the arm's first section, the floor sinks by the same share, so the loop follows the ring there.
      const floor: number = armpit.station - ARMPIT_DROP_MM - ARMPIT_SINK_MM * Math.max(0, Math.min(1, behind(psi)));
      return [(p.station + floor + Math.hypot(p.station - floor, ARMPIT_ROUND_MM)) / 2, Math.atan2(p.v, p.u)];
    });
    // The margin's phase is taken at the armpit's side distance from the trunk's course.
    return around(outline, SHOULDER_COLUMNS, ARMSCYE_MARGIN_MM, armpit.v, side);
  }

  /**
   * A port loop round a part's ring as the trunk's chart sees it: the ellipse on the outline's half extents about their middle, with each
   * column's distance from the centre a share of the ellipse's, pushed out from the centre by the margin.
   *
   * @param outline The ring's points in the trunk's chart, `[station, phase]`, mm and radians, densely round it.
   * @param columns The band's columns.
   * @param margin How far outside the ring the loop stands, mm, or that distance at each clock round the ellipse.
   * @param radius The distance from the trunk's axis at which a phase is read as millimetres, mm.
   * @param sense The phase's sense of increasing clock.
   */
  function around(outline: [number, number][], columns: number, margin: number | ((clock: number) => number), radius: number, sense: 1 | -1): IAutoMovieConstructionPort.ILoop {
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
      return share + (typeof margin === "number" ? margin : margin(clock)) / Math.hypot(semi[0] * Math.cos(clock), semi[1] * radius * Math.sin(clock));
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

  /**
   * A family whose knots past `mouth`, and its closed end, are moved on along its course by a distance: the section at `mouth` and every
   * section before it stay, and the change from it to the next knot's section is drawn over that much more station. A cutter whose wall
   * turns from its flared mouth into its canal within a few millimetres is spread so it turns more gently.
   *
   * @param family The family.
   * @param mouth The station of the last knot that stays, mm.
   * @param mm The distance, mm.
   */
  function spreadOut(family: AutoMovieHumanConicLoft.IFamily, mouth: number, mm: number): AutoMovieHumanConicLoft.IFamily {
    const moved = (s: number): number => (s > mouth ? s + mm : s);
    const end = (tip: AutoMovieHumanConicLoft.ITip | null): AutoMovieHumanConicLoft.ITip | null => (tip === null ? null : { ...tip, from: moved(tip.from), tip: moved(tip.tip) });
    return { ...family, knots: family.knots.map(moved), ...(family.tips === undefined ? {} : { tips: [end(family.tips[0]), end(family.tips[1])] }) };
  }

  /** Whether the "mm" field at `f` starts a (u, v) pair: an even count of "mm" fields runs up to it. */
  function pairsBefore(units: string[], f: number): boolean {
    let run: number = 0;
    for (let g: number = f - 1; g >= 0 && units[g] === "mm"; --g) ++run;
    return run % 2 === 0;
  }

  /**
   * The nose's port on the trunk's chart: the nose's own rail curve as the trunk's chart sees it, each point's height above the axis's foot
   * and its phase about the axis, pushed out by the margin, as the armscye's loop is the arm's ring. Its phase is read as millimetres at the
   * ring's mean distance from the trunk's axis.
   *
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function nostril(placed: IAssembly = assemble()): IAutoMovieConstructionPort.ILoop {
    const family: AutoMovieHumanConicLoft.IFamily = placed.body.nose;
    const first: number = family.knots[0]!;
    const along: (psi: number) => number = AutoMovieNaturalSpline.periodic(NOSE_RAILS_MM.map((rail: number): number => first + rail));
    const far: number = first + Math.max(...NOSE_RAILS_MM);
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, [first, (first + far) / 2, far, far + LAYER_MM]);
    if (loft.chain === null) throw new Error("the nose's first stations do not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const chart: (p: readonly number[]) => IChart = trunkChart(placed);
    const ring: IChart[] = Array.from({ length: 4 * NOSE_COLUMNS }, (_: unknown, j: number): IChart => {
      const psi: number = (2 * Math.PI * j) / (4 * NOSE_COLUMNS);
      return chart(AutoMovieLoftChain.point(chain, along(psi), psi));
    });
    const radius: number = ring.reduce((sum: number, p: IChart): number => sum + Math.hypot(p.u, p.v), 0) / ring.length;
    return around(
      ring.map((p: IChart): [number, number] => [p.station, Math.atan2(p.v, p.u)]),
      NOSE_COLUMNS,
      (clock: number): number => NOSE_MARGIN_MM + NOSE_SUBNASAL_MM * Math.max(0, -Math.cos(clock)) ** 6,
      radius,
      1,
    );
  }

  /**
   * The breast's port on the trunk's chart: each point of the breast's ring at its rail carried out from the breast's course, square to
   * it, to the distance `BREAST_CHEST_MM` gives at its clock, as the trunk's chart sees it; written as the armscye's loop is. Its phase is
   * read as millimetres at the ring's mean distance from the trunk's axis.
   *
   * The clocks' zero, up, is the thorax's Y made square to the course, and the ring is read in the trunk's chart at the pose
   * (`trunkChart`).
   *
   * @param side +1 for the +Z side, -1 for its twin.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function mammary(side: 1 | -1, placed: IAssembly = assemble()): IAutoMovieConstructionPort.ILoop {
    const family: AutoMovieHumanConicLoft.IFamily = placed.body.breast;
    const first: number = family.knots[0]!;
    const rail: number = first + RAIL_MM.breast;
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, [first, rail, first + 2 * LAYER_MM, first + 4 * LAYER_MM]);
    if (loft.chain === null) throw new Error("the breast's first stations do not loft");
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;

    // The course's point and directions at the rail: along it, up squared to it, and to +Z square to both.
    const frame: AutoMovieLoftFrame.IFrame = AutoMovieHumanConicLoft.axis(family).at(rail);
    const w: number[] = [0, 1, 2].map((k: number): number => family.centres[1]![k]! - family.centres[0]![k]!);
    const length: number = Math.hypot(w[0]!, w[1]!, w[2]!);
    const t: number[] = w.map((x: number): number => x / length);
    const y: F.V3 = AutoMovieHumanF1Placement.frame("thorax", placed.frames).axes[1];
    const rise: number = t[0]! * y[0] + t[1]! * y[1] + t[2]! * y[2];
    const up: number[] = [y[0] - rise * t[0]!, y[1] - rise * t[1]!, y[2] - rise * t[2]!];
    const lateral: number[] = [t[1]! * up[2]! - t[2]! * up[1]!, t[2]! * up[0]! - t[0]! * up[2]!, t[0]! * up[1]! - t[1]! * up[0]!];
    const chest: (clock: number) => number = AutoMovieNaturalSpline.periodic(BREAST_CHEST_MM);
    const ring: number[][] = Array.from({ length: 4 * SHOULDER_COLUMNS }, (_: unknown, j: number): number[] => {
      const p: number[] = AutoMovieLoftChain.point(chain, rail, (2 * Math.PI * j) / (4 * SHOULDER_COLUMNS));
      const off: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
      const r: number = Math.hypot(off[0]!, off[1]!, off[2]!);
      const clock: number = Math.atan2(off[0]! * lateral[0]! + off[1]! * lateral[1]! + off[2]! * lateral[2]!, off[0]! * up[0]! + off[1]! * up[1]! + off[2]! * up[2]!);
      const out: number = chest(clock < 0 ? clock + 2 * Math.PI : clock) / r;
      return [0, 1, 2].map((k: number): number => frame.origin[k]! + off[k]! * out);
    });
    const chart: (p: readonly number[]) => IChart = trunkChart(placed);
    const seen: IChart[] = ring.map(chart);
    const radius: number = seen.reduce((sum: number, p: IChart): number => sum + Math.hypot(p.u, p.v), 0) / seen.length;
    return around(
      seen.map((p: IChart): [number, number] => [p.station, side * Math.atan2(p.v, p.u)]),
      SHOULDER_COLUMNS,
      0,
      radius,
      side,
    );
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
   * toward the middle of the gap between the two digits' facing skins (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or
   * sole normal. The split of a fanned limb's end (`FANS`) and `FamilyConicScan.ts webs` read it.
   *
   * The joints are the datums at the pose. The palm's normal is the vector product of the wrist's lines to the index and the pinky
   * finger's first joints; the sole's is the foot's stored direction `leg.fan.up`, the floor's normal reversed in the reference pose.
   *
   * @param which The limb.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function fanSeams(which: "arm" | "leg", placed: IAssembly = assemble()): { station: number; seams: [number, number][]; headings: [number, number, number][]; normal: number[]; up: number[] } {
    const at: (name: string) => number[] = placed.point;
    const family: AutoMovieHumanConicLoft.IFamily = { ...(which === "arm" ? placed.body.hand : placed.body.leg), tips: undefined };
    const station: number = family.knots.at(-1)!;
    const sub = (a: number[], b: number[]): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const [a, b]: number[][] = [sub(at("index1"), at("hand")), sub(at("pinky1"), at("hand"))];
    const up: number[] = which === "arm" ? [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!] : placed.direction("leg.fan.up");
    const rows: [number[], number[]][] = (which === "arm" ? ["pinky", "ring", "middle", "index"] : ["littletoe", "ringtoe", "middletoe", "indextoe", "bigtoe"]).map((digit: string): [number[], number[]] => [at(digit + "1"), at(digit + "2")]);
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
    // Each seam's plane holds its chord and the middle of the gap between the two digits' skins where they face each other, on each
    // digit's first section: the point of that ring farthest toward the other ring's centre. Held to the digits' mean direction instead
    // (the line from their first joints' midpoint to their second joints'), the plane between the index and the big toe stood midway
    // between their axes, 12.3 mm from each, but the big toe is the wider: its skin crossed the plane by 1.1 to 1.5 mm from 8 to 18 mm
    // along the seam, and the web scan's rays there ran on inside the big toe (31 to 47 mm) and were left out. The gap's middle stands
    // 3.1 mm toward the index toe there, and within 0.7 mm of the mean-direction plane at every other seam.
    const names: string[] = which === "arm" ? ["finger.pinky", "finger.ring", "finger.middle", "finger.index"] : ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"];
    const end: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, family.knots);
    if (end.chain === null) throw new Error("fanSeams: the " + which + " does not loft");
    const firstRings: number[][][] = names.map((name: string): number[][] => {
      const digit: AutoMovieHumanConicLoft.IFamily = placed.digits.find((d: IDigit): boolean => d.family.name === name)!.family;
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...digit, tips: [null, digit.tips?.[1] ?? null] }, digit.knots);
      if (loft.chain === null) throw new Error("fanSeams: " + name + " does not loft");
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      return Array.from({ length: 256 }, (_: unknown, k: number): number[] => AutoMovieLoftChain.point(chain, digit.knots[0]!, (2 * Math.PI * k) / 256));
    });
    const centre = (ring: number[][]): number[] => [0, 1, 2].map((c: number): number => ring.reduce((sum: number, p: number[]): number => sum + p[c]!, 0) / ring.length);
    const headings: [number, number, number][] = seams.map(([phase]: [number, number], i: number): [number, number, number] => {
      const [one, two]: number[][][] = [firstRings[i]!, firstRings[i + 1]!];
      const toward: number[] = sub(centre(two), centre(one));
      const reach = (p: number[]): number => p[0]! * toward[0]! + p[1]! * toward[1]! + p[2]! * toward[2]!;
      const near: number[] = one.reduce((best: number[], p: number[]): number[] => (reach(p) > reach(best) ? p : best));
      const far: number[] = two.reduce((best: number[], p: number[]): number[] => (reach(p) < reach(best) ? p : best));
      const d: number[] = sub([0, 1, 2].map((c: number): number => (near[c]! + far[c]!) / 2), AutoMovieLoftChain.point(end.chain!, station, phase));
      const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      return [Math.round((d[0]! / l) * 1e4) / 1e4, Math.round((d[1]! / l) * 1e4) / 1e4, Math.round((d[2]! / l) * 1e4) / 1e4];
    });
    return { station, seams, headings, normal, up };
  }

  /**
   * Declare the sewn body.
   *
   * @param layer Station spacing of each family's layers and derived outlines, mm.
   * @param pose The pose the families are placed at (`assemble`); absent, the reference pose.
   */
  export function construction(layer: number = LAYER_MM, pose?: AutoMovieHumanF1Placement.IPose): IConstruction {
    const placed: IAssembly = assemble(pose);
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (family: AutoMovieHumanConicLoft.IFamily, fine: number = -Infinity, close: number = WEB_LAYER_MM, pitch: number = layer, until: number = Infinity, dome: number = Infinity): AutoMovieConstructionNode => {
      const from: number = family.knots[0]!;
      const to: number = Math.min(family.knots.at(-1)!, until);
      const count: number = Math.ceil((to - from) / pitch) + 1;
      const even: number[] = Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1));

      // Inside a relief whose net is finer along the station than the layers, each layer interval is cut until it is as fine: rings 4 mm
      // apart showed the face's net, 2.6 mm apart, as level steps.
      const stations: number[] = even.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = even[i - 1]!;
        const step: number = Math.min(pitch, before < fine ? close : pitch, ...(family.name === BODY.trunk.name && s > TRUNK_FACE_LAYERS[0] && before < TRUNK_FACE_LAYERS[1] ? [TRUNK_FACE_LAYERS[2]] : []), ...(family.reliefs ?? []).filter((relief): boolean => relief.stations[0] < s && relief.stations[1] > before).map((relief): number => (relief.stations[1] - relief.stations[0]) / ((NET_LAYER_ROWS[relief.name.replace(/(\.twin)?(\.mirror)?$/, "")] ?? relief.rows) - 3)));
        const cuts: number = Math.ceil((s - before) / step - 1e-9);
        return Array.from({ length: cuts }, (_: unknown, k: number): number => before + ((s - before) * (k + 1)) / cuts);
      });
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, folded(family, domed(family, swept(family, stations), dome))));
      return { type: "source", name: family.name, source: family.name };
    };

    // The same stations with each interval from `from` on cut until no ring point of the wall moves farther than a layer between two
    // rings. Over a dome the skin faces up, and a ring point moves across it several times as far as the station: on f1's crown the wall
    // narrows 1.2 to 1.3 mm a millimetre of station, rings 4 mm apart stood 6 to 7 mm apart on the skin and drew concentric terraces on
    // `head.high-oblique`. Measured on the wall alone, without the reliefs, and only over the crown, so the head's rings below, which the
    // ear's band is triangulated against, stay where they were.
    const domed = (family: AutoMovieHumanConicLoft.IFamily, stations: number[], from: number): number[] => {
      if (!Number.isFinite(from)) return stations;
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, reliefs: undefined }, stations);
      if (loft.chain === null) return stations;
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const moved = (s: number, t: number): number =>
        Math.max(
          ...Array.from({ length: FOLD.phases }, (_: unknown, j: number): number => {
            const [p, q]: number[][] = [s, t].map((x: number): number[] => AutoMovieLoftChain.point(chain, x, (2 * Math.PI * j) / FOLD.phases));
            return Math.hypot(p![0]! - q![0]!, p![1]! - q![1]!, p![2]! - q![2]!);
          }),
        );
      return stations.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = stations[i - 1]!;
        const cuts: number = before < from ? 1 : Math.max(1, Math.ceil(moved(before, s) / layer - 1e-9));
        return Array.from({ length: cuts }, (_: unknown, k: number): number => before + ((s - before) * (k + 1)) / cuts);
      });
    };

    // The same stations with each interval cut until no ring point moves farther than a layer by the course frame's own sweep. Round a
    // turn a point off the course moves by `1 + kappa d` times the station, `d` its distance toward the turn's outside: round the shoulder
    // the deltoid's cap moved 7 to 10 mm between layers 4 mm apart, round the heel 8 to 10, and every ring showed as a stripe. Measured by
    // the frame alone, not by the rings' whole change, so a section that changes shape on a straight course keeps its layers.
    const swept = (family: AutoMovieHumanConicLoft.IFamily, stations: number[]): number[] => {
      if (family.centres.length < 3) return stations;
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create({ ...family, reliefs: undefined }, stations);
      if (loft.chain === null) return stations;
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const course: AutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(family);
      const reach = (s: number, t: number): number => {
        const [from, to]: AutoMovieLoftFrame.IFrame[] = [course.at(s), course.at(t)];
        return Math.max(
          ...Array.from({ length: FOLD.phases }, (_: unknown, j: number): number => {
            const p: number[] = AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / FOLD.phases);
            const r: number[] = [0, 1, 2].map((k: number): number => p[k]! - from.origin[k]!);
            const [x, y]: number[] = [from.u, from.v].map((e: [number, number, number]): number => r[0]! * e[0] + r[1]! * e[1] + r[2]! * e[2]);
            return Math.hypot(...[0, 1, 2].map((k: number): number => to.origin[k]! + x! * to.u[k]! + y! * to.v[k]! - p[k]!));
          }),
        );
      };
      return stations.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = stations[i - 1]!;
        const cuts: number = Math.ceil(Math.max(reach(before, s), reach(s, before)) / layer - 1e-9);
        return Array.from({ length: Math.max(1, cuts) }, (_: unknown, k: number): number => before + ((s - before) * (k + 1)) / Math.max(1, cuts));
      });
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
      const cut: number[] = stations.flatMap((s: number, i: number): number[] => (i === 0 ? [s] : [...between(stations[i - 1]!, rings[i - 1]!, s, rings[i]!), s]));

      // Over a crease's window, where the skin turns along the station faster than `FOLD.turn` between an interval's halves.
      const windows: [number, number][] = FOLD.creases.filter((crease): boolean => crease.family === family.name).map((crease): [number, number] => crease.stations);
      if (windows.length === 0) return cut;
      const fine = (s: number): number[][] => Array.from({ length: FOLD.fine }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / FOLD.fine));
      const turned = (low: number[], mid: number[], high: number[]): number => {
        const u: number[] = [0, 1, 2].map((k: number): number => mid[k]! - low[k]!);
        const w: number[] = [0, 1, 2].map((k: number): number => high[k]! - mid[k]!);
        const cosine: number = (u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!) / (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(w[0]!, w[1]!, w[2]!));
        return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
      };
      const bend = (a: number, low: number[][], b: number, high: number[][]): number[] => {
        if (b - a <= 2 * FOLD.least) return [];
        const middle: number = (a + b) / 2;
        const mid: number[][] = fine(middle);
        const off: boolean = mid.some((p: number[], j: number): boolean => turned(low[j]!, p, high[j]!) > FOLD.turn);
        return off ? [...bend(a, low, middle, mid), middle, ...bend(middle, mid, b, high)] : [];
      };
      const inside = (a: number, b: number): boolean => windows.some((window: [number, number]): boolean => a >= window[0] && b <= window[1]);
      const sharp: (number[][] | null)[] = cut.map((s: number, i: number): number[][] | null => (inside(cut[Math.max(0, i - 1)]!, s) || inside(s, cut[Math.min(cut.length - 1, i + 1)]!) ? fine(s) : null));
      return cut.flatMap((s: number, i: number): number[] => (i === 0 ? [s] : [...(inside(cut[i - 1]!, s) ? bend(cut[i - 1]!, sharp[i - 1]!, s, sharp[i]!) : []), s]));
    };
    const twin = (family: AutoMovieHumanConicLoft.IFamily): AutoMovieHumanConicLoft.IFamily => AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror");
    // A digit as stored, whose stations the constants below are given in; `placed.station` carries each to the pose.
    const stored = (name: string): AutoMovieHumanConicLoft.IFamily => DIGITS.find((d: IDigit): boolean => d.family.name === name)!.family;
    const trunk: string = BODY.trunk.name;

    // A limb with its digits: each digit is merged onto the limb's cap before the limb is attached to the trunk, so the engine traces where a
    // capsule comes out against the limb alone. Merged after the whole body was sewn, every digit was traced against all of it.
    const limb = (which: "arm" | "leg", side: 1 | -1): { node: AutoMovieConstructionNode; face: string } => {
      // The limb's end stays open and is split into its knuckled digits (`FANS`); the thumb is merged onto the hand's side first, as a
      // capsule closed `ROOT_MM` behind its first joint, inside the hand.
      const fanned: IFan = FANS[which];
      const own: AutoMovieHumanConicLoft.IFamily = which === "arm" ? placed.body.hand : placed.body.leg;
      const leaned: AutoMovieHumanConicLoft.IFamily = { ...own, tips: [which === "arm" ? null : own.tips![0], null], ...(PHASE_TURN[which] === undefined ? {} : { turn: PHASE_TURN[which] }) };
      const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? leaned : twin(leaned);
      let node: AutoMovieConstructionNode = leaf(family);
      for (const digit of placed.digits.filter((d: IDigit): boolean => d.limb === which && !d.knuckle)) {
        const capsule: AutoMovieHumanConicLoft.IFamily = { ...digit.family, tips: [{ from: digit.family.knots[0]!, tip: -ROOT_MM, covered: true }, digit.family.tips?.[1] ?? null], ...(which === "arm" ? { turn: FINGER_TURN } : {}) };
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? capsule : twin(capsule);
        node = {
          type: "join",
          kind: "merge",
          name: "web." + part.name,
          host: node,
          part: leaf(part, placed.station(digit.family.name, stored(digit.family.name).knots[0]! + WEB_REACH_MM), WEB_LAYER_MM, which === "arm" ? FINGER_LAYER_MM : layer),
          seed: { type: "search", partFace: part.name, hostFace: family.name, phase: 0, from: 0, to: 0.7 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: THUMB_CHORD_MM / 1000 },
          hostWidth: { type: "chord", value: THUMB_CHORD_MM / 1000 },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
          fair: THUMB_FAIR_MM / 1000,
        };
      }

      // The split: the end's seams along the valleys between the knuckled digits (`fanSeams`), each curved along its web line (`IFan.webs`)
      // in the plane that holds the two digits' mean direction. The twin's phases run the other way, so a seam `[a, b]` is `[-b, -a]` there,
      // read from its other fork: its knots run back along the chord, and its heading is reflected.
      const fan = fanSeams(which, placed);
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(leaned, leaned.knots);
      if (loft.chain === null) throw new Error("the " + which + " does not loft");
      const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const seam = (j: number): IAutoMovieConstructionSplit.ISeam => {
        const [a, b]: [number, number] = fan.seams[j]!;
        const knots: [number, number][] = fanned.webs[j]!;
        const [pa, pb]: number[][] = [AutoMovieLoftChain.point(chain, fan.station, a), AutoMovieLoftChain.point(chain, fan.station, b)];
        const chord: number = Math.hypot(pb[0]! - pa[0]!, pb[1]! - pa[1]!, pb[2]! - pa[2]!) / 1000;
        const h: [number, number, number] = fan.headings[j]!;
        const tuned: Pick<IAutoMovieConstructionSplit.IProfile, "reach" | "square" | "fair"> = { ...(fanned.reach === undefined ? {} : { reach: fanned.reach }), ...(fanned.square === true ? { square: true } : {}), ...(fanned.fair === undefined ? {} : { fair: typeof fanned.fair === "number" || side > 0 ? fanned.fair : [fanned.fair[1], fanned.fair[0]] }) };
        return side > 0
          ? { seam: [a, b], profile: { knots, corner: fanned.corner, heading: h, ...tuned } }
          : { seam: [-b, -a], profile: { knots: knots.map(([along, depth]: [number, number]): [number, number] => [chord - along, depth]).reverse(), corner: fanned.corner, heading: [h[0], h[1], -h[2]], ...tuned } };
      };
      const children: IAutoMovieConstructionSplit.IChild[] = fanned.digits.map((name: string): IAutoMovieConstructionSplit.IChild => {
        const digit: IDigit = placed.digits.find((d: IDigit): boolean => d.family.name === name)!;
        const own: AutoMovieHumanConicLoft.IFamily = which === "arm" ? { ...digit.family, turn: FINGER_TURN } : digit.family;
        const part: AutoMovieHumanConicLoft.IFamily = side > 0 ? own : twin(own);
        return { band: "band." + part.name, part: leaf(part, -Infinity, WEB_LAYER_MM, which === "arm" ? FINGER_LAYER_MM : layer), partFace: part.name, partEnd: "bottom", rail: placed.station(name, stored(name).knots[0]!, fanned.rail) / 1000, correspondence: "length" };
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
        rows: fanned.rows,
        children: children as IAutoMovieConstructionSplit["children"],
      };
      if (which === "leg") return { node, face: family.name };

      // The arm ends open before the wrist (`ARM_TO_MM`) and the hand, a family of its own on a wider knuckle turn, continues it across a
      // band (`WRIST`), since the two families' sections need not share one ring.
      const arm: AutoMovieHumanConicLoft.IFamily = { ...placed.body.arm, tips: [placed.body.arm.tips![0], null], ...(PHASE_TURN.arm === undefined ? {} : { turn: PHASE_TURN.arm }) };
      const armFamily: AutoMovieHumanConicLoft.IFamily = side > 0 ? arm : twin(arm);
      return {
        node: { type: "continue", name: "wrist." + armFamily.name, host: leaf(armFamily, -Infinity, WEB_LAYER_MM, layer, placed.station(BODY.arm.name, ARM_TO_MM)), hostFace: armFamily.name, hostEnd: "top", part: node, partFace: family.name, partEnd: "bottom", band: { rail: placed.station(BODY.hand.name, BODY.hand.knots[0]!, WRIST.rail) / 1000, count: WRIST.count, rows: WRIST.rows, correspondence: "length" } },
        face: armFamily.name,
      };
    };

    // The trunk's section chart has +u forward and +v to +Z, so the seam from phase 0 to pi gives the first child the +Z half of the end.
    const legs: { node: AutoMovieConstructionNode; face: string }[] = [limb("leg", 1), limb("leg", -1)];
    let root: AutoMovieConstructionNode = {
      type: "split",
      name: "crotch",
      host: leaf({ ...placed.body.trunk, phase: TRUNK_PHASE }, -Infinity, WEB_LAYER_MM, layer, Infinity, CROWN_MM),
      hostFace: trunk,
      hostEnd: "bottom",
      seam: [0, Math.PI],
      profile: CROTCH,
      count: THIGH_COLUMNS,
      rows: BAND.rows,
      children: [
        { band: "band." + legs[0]!.face, part: legs[0]!.node, partFace: legs[0]!.face, partEnd: "bottom", rail: placed.station(BODY.leg.name, BODY.leg.knots[0]!, RAIL_MM.leg) / 1000 },
        { band: "band." + legs[1]!.face, part: legs[1]!.node, partFace: legs[1]!.face, partEnd: "bottom", rail: placed.station(BODY.leg.name, BODY.leg.knots[0]!, RAIL_MM.leg) / 1000 },
      ],
    };
    for (const side of [1, -1] as const) {
      const arm: { node: AutoMovieConstructionNode; face: string } = limb("arm", side);
      root = { type: "port", name: "armscye." + arm.face, host: root, hostFace: trunk, loop: armscye(side, placed), band: "band." + arm.face, part: arm.node, partFace: arm.face, partEnd: "bottom", rail: placed.station(BODY.arm.name, BODY.arm.knots[0]!, Math.min(...ARM_RAILS_MM)) / 1000, rails: armRails(side).map((mm: number): number => placed.station(BODY.arm.name, BODY.arm.knots[0]!, mm) / 1000), ribbons: "column", count: SHOULDER_COLUMNS, rows: ARMSCYE_ROWS };
      // The armpit's slit, cut after the arm's port: no wall is star-shaped about the slit (the conic audit), and the arm's band closes it
      // 12 to 17 mm under its apex. The cutter's sections are the slit's air from 3 mm under that band up to its apex, drawn in from the
      // walls, its arm-side flank concave under the apex (`AutoMovieHumanF1Axilla`). It is seeded on its bottom, phase pi, whose station line
      // stands in the flesh above the band where the cutter closes at its front end and runs on under the band; its top's stays above the
      // band all along. Walked by its own length; at a phase parameter the twin's trace was lost. Blended 0.25 mm wide on either side: at
      // 0.5 mm the twin's cutter face did not triangulate ("subconstraints cross without a supplied shared vertex"), with 256 columns or
      // the search reversed as well.
      const axilla: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.axilla : twin(placed.axilla);
      root = { type: "join", kind: "diff", name: "cut." + axilla.name, host: root, part: leaf(axilla, Infinity, AXILLA_LAYER_MM), seed: { type: "search", partFace: axilla.name, hostFace: "band." + arm.face, phase: side > 0 ? AXILLA_SEED.phase : 2 * Math.PI - AXILLA_SEED.phase, from: AXILLA_SEED.from, to: AXILLA_SEED.to }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.00025 }, hostWidth: { type: "chord", value: 0.00025 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04 };      // The ear as its parts. The plate is the auricle's back sheet from its root, 6 mm inside the head, out to under the rim, the whole
      // lobule included; at mid heights it runs from the head out to the rim, so its front face is the concha's back wall. The helix and
      // the antihelix are round tubes along their crests, walked by their own length and seeded on their top lines, phase 0, which come up
      // out of the plate past their buried ends; the scapha and the fossa are the plate's floor between them. The plate is merged onto the
      // head along the curve round its root, seeded on its root end, phase pi, which leaves the head at the plate's top cap (no port, no
      // band); then the helix, whose front end runs down its crus into the head, onto the two; then the antihelix, its lower end in the plate
      // and its upper end inside the helix's tube, so neither tube's walk crosses the other's blend. Each merge's blend is faired over half
      // its part's width (`IAutoMovieConstructionJoin.fair`, as the thumb's). Last the concha's bowl is cut from the head in front of the
      // antihelix: its cutter runs square into the head to the bowl's floor and is closed at both ends; seeded on its lower side, phase pi,
      // which is its twin's too. Its back side, phase pi / 2, only grazes the plate's front face, and its other lines meet the head only
      // inside its cap (a scratch probe along its four quarter lines).
      const helix: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.helix : twin(placed.helix);
      const antihelix: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.antihelix : twin(placed.antihelix);
      const concha: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.concha : twin(placed.concha);
      const plate: AutoMovieHumanConicLoft.IFamily = side > 0 ? placed.body.ear : twin(placed.body.ear);
      const ridge = (host: AutoMovieConstructionNode, part: AutoMovieHumanConicLoft.IFamily, fair: number): AutoMovieConstructionNode => ({ type: "join", kind: "merge", name: "ridge." + part.name, host, part: leaf(part, Infinity), seed: { type: "search", partFace: part.name, hostFace: plate.name, phase: 0, phases: EAR_SEED_LINES, from: 0, to: 0.5 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.00025 }, hostWidth: { type: "chord", value: 0.00025 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04, fair: fair / 1000 });
      root = { type: "join", kind: "merge", name: "root." + plate.name, host: root, part: leaf(plate, Infinity), seed: { type: "search", partFace: plate.name, hostFace: trunk, phase: Math.PI, phases: EAR_SEED_LINES, from: 0, to: 1 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.0005 }, hostWidth: { type: "chord", value: 0.0005 }, continuity: "G2", count: 256, rows: 4, tolerance: 1e-12, grazing: 0.04, fair: EAR_FAIR_MM.root / 1000 };
      root = ridge(root, helix, EAR_FAIR_MM.helix);
      root = ridge(root, antihelix, EAR_FAIR_MM.antihelix);
      root = { type: "join", kind: "diff", name: "cut." + concha.name, host: root, part: leaf(concha), seed: { type: "search", partFace: concha.name, hostFace: trunk, phase: Math.PI, phases: EAR_SEED_LINES, from: 0, to: 0.9 }, parameter: { type: "arc" }, partWidth: { type: "chord", value: 0.00025 }, hostWidth: { type: "chord", value: 0.00025 }, continuity: "G2", count: 192, rows: 4, tolerance: 1e-12, grazing: 0.04 };

      // The breast, which the trunk's sections leave out: its band spans the fold under it from the chest to the breast's own wall. Its
      // layers stand half a millimetre apart all along it (`BREAST_LAYER_MM`) and its phases 1.5 mm (`BREAST_PITCH_MM`).
      const breast: AutoMovieHumanConicLoft.IFamily = side > 0 ? { ...placed.body.breast, pitch: BREAST_PITCH_MM } : twin({ ...placed.body.breast, pitch: BREAST_PITCH_MM });
      root = { type: "port", name: "mammary." + breast.name, host: root, hostFace: trunk, loop: mammary(side, placed), band: "band." + breast.name, part: leaf(breast, Infinity, BREAST_LAYER_MM), partFace: breast.name, partEnd: "bottom", rail: RAIL_MM.breast / 1000, count: SHOULDER_COLUMNS, rows: BAND.rows };
    }
    root = { type: "port", name: "nostril." + BODY.nose.name, host: root, hostFace: trunk, loop: nostril(placed), band: "band." + BODY.nose.name, part: leaf({ ...placed.body.nose, phase: NOSE_PHASE }), partFace: BODY.nose.name, partEnd: "bottom", rail: Math.min(...NOSE_RAILS_MM) / 1000, rails: NOSE_RAILS_MM.map((rail: number): number => rail / 1000), correspondence: "length", profiles: NOSE_PROFILES, count: NOSE_COLUMNS, rows: BAND.rows };
    // Each nostril is cut from the head: its loft comes up out of the nose's underside and closes inside it. The band lands behind it, so the
    // cut lies wholly on the nose's own face and its blend may be as wide as the rim's roll; while the cut crossed the band at the sill only
    // a blend 0.15 mm wide found its rails there.
    for (const side of [1, -1] as const) {
      const drawn: AutoMovieHumanConicLoft.IFamily = spreadOut(drawnIn(placed.nostril, NOSTRIL_RIM_MM), NOSTRIL_MOUTH_MM, NOSTRIL_SPREAD_MM);
      const hollow: AutoMovieHumanConicLoft.IFamily = side > 0 ? drawn : twin(drawn);
      root = { type: "join", kind: "diff", name: "cut." + hollow.name, host: root, part: leaf(hollow, Infinity, NOSTRIL_LAYER_MM), seed: { type: "search", partFace: hollow.name, hostFace: BODY.nose.name, phase: 0, from: 0, to: 0.9 }, parameter: { type: "phase" }, partWidth: { type: "chord", value: NOSTRIL_RIM_MM / 1000 }, hostWidth: { type: "chord", value: NOSTRIL_RIM_MM / 1000 }, continuity: "G2", count: 48, rows: 4, tolerance: 1e-12, grazing: 0.05 };
    }
    const breastFan: [number, number, number] = placed.point("breastFan");
    const fills: IAutoMovieConstructionFill[] = [1, -1].map((side: number): IAutoMovieConstructionFill => ({ point: [breastFan[0] / 1000, breastFan[1] / 1000, (side * breastFan[2]) / 1000], radius: BREAST_FAN_FILL_MM / 1000 }));
    return { root, sources, fills };
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
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord, sources: declared.sources });
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
