import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanConicSection as S } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Placement as Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Placing as T } from "./AutoMovieHumanF1Placing";
import {
  AutoMovieHumanF1SegmentLengths as Lengths,
} from "./AutoMovieHumanF1SegmentLengths";
import { AutoMovieViewJointedCourse } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1Placement,
  IAutoMovieHumanF1Placing,
  IAutoMovieHumanF1SegmentLengths,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieViewAxis,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * f1's centres before her curves (the Human skill's Centres Before Curves): which points every part is lofted about, what kind each is,
 * the rule that generates it from the joint centres, the segment frames and the person's measures, and how far each course stands from
 * its own sections and from its bone.
 *
 * A course is the engine's jointed axis (`AutoMovieViewAxis.jointed`): straight runs between consecutive centres and, at each interior
 * centre, a turn of half arclength `h` whose angle follows the quintic smoothstep, so the tangent and the curvature are continuous. The
 * turn cuts its corner by a set-back, so the course does not pass through an interior centre: it stands inside the corner there.
 *
 * Three kinds of centre make a course. A joint centre is an articulated joint of the bind skeleton (the origin of its segment); it moves
 * with the segment lengths (`AutoMovieHumanF1SegmentLengths`). A segment origin that is no joint is set by landmarks (the hip centres'
 * midpoint, suprasternale, the bitragion midpoint, tragion, subnasale, the breast's frame). An authored course datum is a point stored in
 * a segment's frame that no joint or landmark defines; each is generated here by a declared offset law in its bone's frame, with f1's
 * own offset as the provisional value, exact at f1.
 *
 * Turn half lengths stay f1's stored values. Read against the section's mean guide reach at each turn (`turns`), they follow no law of
 * the section's size: the digits' are 5 mm at every joint (0.37 to 0.83 of the reach), the helix's 3 mm and the antihelix's 2 mm, and the
 * limbs' run from 0.24 of the reach (the ball of the foot) to 1.5 (the ankle), larger where the turn's angle is larger. They are authored
 * per joint, so no law replaces them here.
 */
export namespace AutoMovieHumanF1Centres {
  /** What a course centre is. */
  export type Kind = "joint" | "origin" | "datum";

  /**
   * One course centre's inventory row.
   *
   * @evidence contracts/development/design.md#principled-representation The centre's kind, the frame that holds it, where f1's value comes from and the rule that should generate it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the centre table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A datum with no generating rule yet says so in `rule` rather than passing as a joint.
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds.
   */
  export interface ICentre {
    /** The centre's name in `AutoMovieHumanF1Placing.POINTS`. */
    name: string;
    /** The segment whose frame holds it. */
    frame: string;
    /** Its kind. */
    kind: Kind;
    /** Where f1's value comes from. */
    source: string;
    /** The rule that generates it from joint centres, segment frames and the person's measures. */
    rule: string;
  }

  /**
   * One turn of a course, measured.
   *
   * @evidence contracts/development/design.md#principled-representation The engine's own turn (angle, set-back, station) beside the section's size there, the quantities a half-length law would relate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is one column of the turn table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The section's size is read from the family's own fields, not from a loft.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface ITurn {
    /** The interior centre's name. */
    centre: string;
    /** The stored half arclength, mm. */
    half: number;
    /** The turn's angle, radians. */
    angle: number;
    /** How far the turn leaves each segment's line before the centre, mm. */
    setback: number;
    /** How far the course stands from the centre at the turn's middle, mm. */
    gap: number;
    /** The station of the turn's middle, mm. */
    station: number;
    /** The mean of the section's four guide reaches at that station, mm; NaN outside the family's knots. */
    radius: number;
  }

  /**
   * How far a course stands from its section and from its bone at one station.
   *
   * @evidence contracts/development/design.md#principled-representation The section's centre as the mean of its four guide extremes in the section chart, and the course point's distance to the bone line.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the offset table's columns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A family without a bone line reports null, not zero.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units and frames.
   */
  export interface IOffset {
    /** The station, mm. */
    station: number;
    /** The mean of the four guide extremes in the section chart `[u, v]`, mm from the course point. */
    centroid: [number, number];
    /** The course point's distance to the bone line, mm; null where the family has no bone line or the station lies past its ends. */
    bone: number | null;
  }

  /**
   * The authored course datums that follow a joint centre of their own frame: each keeps f1's offset from that joint centre in the frame
   * they share. The arm's course starts inside the thorax below the glenohumeral centre and the armpit's cutters stand beside it, so all
   * of them follow the shoulder's joint centre when a shoulder breadth moves it. Provisional: one person gives the offset, not its law.
   */
  export const ANCHORS: Readonly<Record<string, string>> = {
    armRoot: "humerus",
    armTurn: "humerus",
    armpit: "humerus",
    "axilla.0": "humerus",
    "axilla.1": "humerus",
    "axilla.2": "humerus",
    "axilla.3": "humerus",
    "vault.0": "humerus",
    "vault.1": "humerus",
  };

  /**
   * The bone line of a course: the joint centres its segments run between, by their names in the placing table. The arm's and the hand's
   * shared course starts at two thorax datums, so its bone line starts at the glenohumeral centre instead.
   */
  const BONES: Readonly<Record<string, readonly string[]>> = {
    arm: ["upperarm", "lowerarm", "hand", "middle1"],
    hand: ["upperarm", "lowerarm", "hand", "middle1"],
  };

  const joint = (chain: readonly IAutoMovieHumanSegmentJoint[], name: string): IAutoMovieHumanSegmentJoint => {
    const found: IAutoMovieHumanSegmentJoint | undefined = chain.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name);
    if (found === undefined) throw new Error("the chain has no joint " + name);
    return found;
  };

  const placed = (name: string): IAutoMovieHumanF1Placing.IPlaced => {
    const found: IAutoMovieHumanF1Placing.IPlaced | undefined = T.POINTS[name];
    if (found === undefined) throw new Error("f1 has no point " + name);
    return found;
  };

  /**
   * One centre's inventory row: its kind by the placing table, and its generating rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A point at its segment's origin is a joint centre when the segment is articulated and a landmark origin otherwise; any other point is an authored datum whose rule is stated by its frame and role.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Kind from the table, rule from one ordered list of cases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown point is refused; a datum with no law yet is named unresolved in its rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure description coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function describe(name: string): ICentre {
    const point: IAutoMovieHumanF1Placing.IPlaced = placed(name);
    const origin: boolean = point.local.every((x: number): boolean => x === 0);
    const frame: string = point.frame;
    const parent: string | null = joint(T.CHAIN, frame).parent;
    if (origin && Placement.ARTICULATED.includes(frame))
      return {
        name,
        frame,
        kind: "joint",
        source: "the reference rig's bind joint, the origin of `" + frame + "` in the chain",
        rule:
          frame === "humerus"
            ? "held in the thorax's frame; a shoulder breadth (biacromial, ANSUR II) would move it, unresolved on f1 (no acromion)"
            : frame === "femur"
              ? "half `hipJointCentreBreadth` lateral of the hip centres' midpoint in the pelvis's frame (AutoMovieHumanHipSupportPlacement)"
              : parent === "hand" || parent === "foot"
                ? "its stored offset in the " + parent + "'s frame spread along the " + parent + "'s axis by its length ratio and across by its breadth ratio (AutoMovieHumanF1SegmentLengths)"
                : "its parent's joint centre plus the segment's length along the stored bone direction in the parent's frame (AutoMovieHumanF1SegmentLengths.chain)",
      };
    if (origin)
      return {
        name,
        frame,
        kind: "origin",
        source: "a landmark origin of the segment frames (AutoMovieHumanF1Frames)",
        rule: "the origin of `" + frame + "` by its landmark definition; its offset in its parent's frame is a trunk length or a skin attachment",
      };
    const anchor: string | undefined = ANCHORS[name];
    const end: RegExpMatchArray | null = name.match(/^([a-z]+)End$/);
    const rule: string =
      anchor !== undefined
        ? "the `" + anchor + "` joint centre plus f1's offset from it in the " + frame + "'s frame (provisional offset law, `local`)"
        : end !== null && frame.endsWith(".distal")
          ? "on the distal bone's axis at the distal length: the pad centre `" + end[1] + "Pad` plus 4 mm, scaled with the bone (a toe's with the foot's length)"
          : frame === "hand" || frame === "foot"
            ? "its stored point in the " + frame + "'s frame spread along the " + frame + "'s axis by its length ratio and across by its breadth ratio"
            : name === "axisFloor" || name === "axisCrown"
              ? "the trunk course's end on the figure's vertical through the reference origin (x = 0, z = 0): an authoring axis, not anatomy; it should be the line through the sections' centres at the pelvis and the head, unresolved"
              : frame === "ear"
                ? "a point of the ear's template in the ear's frame, rigid on tragion; sized by the ear's own length and breadth (Farkas), unresolved"
                : frame === "nose"
                  ? "a point of the nose's frame (subnasale origin, axes from nasion and pronasale), rigid; sized by the nose's protrusion and breadth (Farkas), unresolved"
                  : frame === "breast"
                    ? "on the breast frame's own x axis (y = z = 0); its length is the breast projection"
                    : "a stored point of the " + frame + "'s frame with no generating rule yet";
    return { name, frame, kind: "datum", source: "authored in step 1 and re-based into `" + frame + "` (AutoMovieHumanF1Placing.POINTS)", rule };
  }

  /**
   * Every course's centres, described, by family name.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the placing table's courses, the one list of what each family is lofted about.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `describe` per centre.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No family is skipped: cutters and ear parts are listed with the body.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the table.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure listing coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records.
   */
  export function inventory(): Record<string, ICentre[]> {
    return Object.fromEntries(
      Object.entries(T.COURSES).map(([family, names]: [string, string[]]): [string, ICentre[]] => [family, names.map(describe)]),
    );
  }

  /**
   * A stored point's local coordinates at a person: spread or scaled with its segment (`AutoMovieHumanF1SegmentLengths.local`), then, for
   * an anchored datum (`ANCHORS`), moved by its joint centre's own move in the frame they share. At f1's lengths and chain the stored
   * coordinates themselves are returned.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The offset law: datum = joint centre + (f1 datum - f1 joint centre), both in the frame that holds them; f1's offset is the provisional value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One length map and one anchored translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An anchor that is not a child of the datum's frame is refused; an unmoved anchor adds nothing, so f1 is exact bit for bit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work plus one chain lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The stored coordinates are borrowed when nothing moves.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the stored triple or one new triple.
   */
  export function local(name: string, fields: IAutoMovieHumanF1SegmentLengths.IFields = Lengths.F1, chain: readonly IAutoMovieHumanSegmentJoint[] = T.CHAIN): AutoMovieVector3Tuple {
    const base: AutoMovieVector3Tuple = Lengths.local(fields, name);
    const anchor: string | undefined = ANCHORS[name];
    if (anchor === undefined) return base;
    const [own, stored]: IAutoMovieHumanSegmentJoint[] = [joint(chain, anchor), joint(T.CHAIN, anchor)];
    if (own!.parent !== placed(name).frame) throw new Error("the anchor " + anchor + " does not stand in the frame of " + name);
    if (own!.offset.every((x: number, k: number): boolean => Object.is(x, stored!.offset[k]))) return base;
    return F.add(base, F.sub(own!.offset, stored!.offset));
  }

  /**
   * A family's course centres at a person, figure frame, mm: each centre of `AutoMovieHumanF1Placing.COURSES` through the person's chain
   * (`AutoMovieHumanF1SegmentLengths.chain`, or the given chain) and pose. With f1's lengths, the stored chain and no pose the stored
   * centres are reproduced bit for bit.
   *
   * @evidence contracts/development/implementation.md#principled-implementation `o + A q` of each centre's local coordinates in its segment's frame, the placing table's own definition, on the chain the lengths make.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain, one frame map, one point per centre.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A family the table has no course for is refused; no centre is interpolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain composition and constant work per centre.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work f1 borrows the reference frames through `AutoMovieHumanF1Placement.frames`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh points.
   */
  export function course(
    family: string,
    fields: IAutoMovieHumanF1SegmentLengths.IFields = Lengths.F1,
    chain: readonly IAutoMovieHumanSegmentJoint[] = Lengths.chain(fields),
    pose?: IAutoMovieHumanF1Placement.IPose,
  ): AutoMovieVector3Tuple[] {
    const names: string[] | undefined = T.COURSES[family];
    if (names === undefined) throw new Error("f1 has no course for " + family);
    const frames: IAutoMovieHumanF1Placement.IFrames = Placement.frames(pose, chain);
    return names.map((name: string): AutoMovieVector3Tuple => F.toWorld(Placement.frame(placed(name).frame, frames), local(name, fields, chain)));
  }

  /** The mean reach of a section's four guides and their mean point in the chart, from the family's fields at one station. */
  function section(family: IAutoMovieHumanConicLoft.IFamily, read: (s: number) => number[], station: number): { radius: number; centroid: [number, number] } {
    const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(station), family.layout);
    const guides: [number, number][] = chain.guides.map((k: number): [number, number] => [chain.input.points[k]![0], chain.input.points[k]![1]]);
    if (guides.length !== 4) throw new Error("a section of " + family.name + " has " + guides.length + " guides, four expected");
    return {
      radius: guides.reduce((sum: number, p: [number, number]): number => sum + Math.hypot(p[0], p[1]), 0) / 4,
      centroid: [(guides[0]![0] + guides[1]![0] + guides[2]![0] + guides[3]![0]) / 4, (guides[0]![1] + guides[1]![1] + guides[2]![1] + guides[3]![1]) / 4],
    };
  }

  /**
   * A family's turns, measured: each interior centre's stored half length beside the turn's angle, set-back, distance from its centre and
   * the section's mean guide reach at the turn's middle.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The angle, set-back and station are the engine's own course preparation; the gap is the course point's distance to the centre at the turn's middle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One course preparation and one section read per turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An inadmissible course is refused with the engine's reason; a turn outside the family's knots reports NaN for its section.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the turns.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure measurement coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records.
   */
  export function turns(family: IAutoMovieHumanConicLoft.IFamily): ITurn[] {
    const prepared: IAutoMovieViewJointedCourse.ICourse | string = AutoMovieViewJointedCourse.prepare(family.centres, family.halves);
    if (typeof prepared === "string") throw new Error("course of " + family.name + ": " + prepared);
    const names: readonly string[] = T.COURSES[family.name] ?? [];
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    const read: (s: number) => number[] = H.reader(family);
    return prepared.turns.map((turn: IAutoMovieViewJointedCourse.ITurn): ITurn => {
      const station: number = turn.start + turn.half;
      const centre: readonly number[] = family.centres[turn.centre]!;
      const at: readonly number[] = axis.at(station).origin;
      const inside: boolean = station >= family.knots[0]! && station <= family.knots.at(-1)!;
      return {
        centre: names[turn.centre] ?? String(turn.centre),
        half: turn.half,
        angle: turn.angle,
        setback: turn.setback,
        gap: Math.hypot(at[0]! - centre[0]!, at[1]! - centre[1]!, at[2]! - centre[2]!),
        station,
        radius: inside ? section(family, read, station).radius : NaN,
      };
    });
  }

  /**
   * How far a family's course stands from its sections' own centres and from its bone line, at every knot.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The section's centre is the mean of its four guide extremes in the chart about the course point (zero when the course is the section's centre line); the bone distance is the course point's distance to the polyline through the joint centres.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One section read and one point-to-polyline distance per knot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the stored fields only, no loft; a family with fewer than two joint centres reports no bone distance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the knots times the bone line's segments.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure measurement coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain records.
   */
  export function offsets(family: IAutoMovieHumanConicLoft.IFamily): IOffset[] {
    const names: readonly string[] =
      BONES[family.name] ?? (T.COURSES[family.name] ?? []).filter((name: string): boolean => describe(name).kind === "joint");
    const bones: AutoMovieVector3Tuple[] = names.map((name: string): AutoMovieVector3Tuple => Placement.point(name));
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    const read: (s: number) => number[] = H.reader(family);

    // The distance to one bone and the point's share along it; a share outside [0, 1] on an end bone lies past the bone line.
    const toSegment = (p: AutoMovieVector3Tuple, a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): [number, number] => {
      const ab: AutoMovieVector3Tuple = F.sub(b, a);
      const share: number = F.dot(F.sub(p, a), ab) / F.dot(ab, ab);
      const q: AutoMovieVector3Tuple = F.sub(p, F.add(a, F.scale(ab, Math.min(1, Math.max(0, share)))));
      return [Math.hypot(q[0], q[1], q[2]), share];
    };
    return family.knots.map((station: number): IOffset => {
      const o: readonly number[] = axis.at(station).origin;
      const p: AutoMovieVector3Tuple = [o[0]!, o[1]!, o[2]!];
      let bone: number | null = null;
      let least: number = Infinity;
      for (let k: number = 1; k < bones.length; ++k) {
        const [distance, share]: [number, number] = toSegment(p, bones[k - 1]!, bones[k]!);
        if (distance >= least) continue;
        least = distance;
        bone = (k === 1 && share < 0) || (k === bones.length - 1 && share > 1) ? null : distance;
      }
      return { station, centroid: section(family, read, station).centroid, bone };
    });
  }
}
