/**
 * Every surface that divides the body's skin between two neighbouring parts, each declared once as a rule on joint centres.
 *
 * Where two parts meet, one skin is described by two families. Each point of that skin is one part's: a surface fixed in the skeleton
 * parts it, the family on either side is fitted to its own side alone, and the construction joins the two on that surface (a split's
 * seam plane, a parent's end plane, a join's loop). The surface is therefore read three times, by the fit of each neighbour and by the
 * tree, and all three read this module: a rule here is a function of joint centres, so a person whose joints move gets her own
 * surfaces and a posed limb carries its own (`packages/human/docs/techniques/joints-one-shot.md`, The hypotheses).
 *
 * The rules, on the stored side (+Z):
 * - `armscye`: the landmark surface the caller supplies (`AutoMovieHumanF1Armscye.surface`), within `ARMSCYE_MM` of the shoulder
 *   joint; the trunk medial of it, the arm lateral.
 * - `mammary`, `ear.root`: a landmark surface each, supplied as the armscye's is, within its own reach of its centre; the trunk on the
 *   near side, the breast and the auricle's plate on the far side. A figure without one of them declares none.
 * - `wrist`: the arm's section plane where its face ends; the arm proximal, the hand distal.
 * - `thumb.root`: a landmark surface about the thumb's metacarpophalangeal centre, supplied as the armscye's is, within its own reach
 *   of that centre; the hand and the four fingers on the near side, the thumb on the far side. The thumb leaves the hand's side: a
 *   plane through the wrist and the thumb's first joint ran along the thumb's sections and left the first web's sheet on the thumb.
 * - `heads.hand`, `heads.foot`: the parent's section plane where its digits part from it; the parent proximal, the digits distal.
 * - `web.<a>.<b>` between neighbouring digits of a row: the plane through the midpoint of their two first joints that holds the
 *   bisector of their first segments and the row's normal (the palm's, from the wrist and the row's two outer knuckles; the sole's,
 *   which the caller supplies).
 * - `hip`: the level plane midway between the hip centre's height and the trunk's foot; the trunk above, the legs below.
 * - `crotch`: the median plane; one leg either side.
 *
 * The three section planes are their parent family's own (a split's end is a section of its host), so the caller reads them off the
 * families and hands them in (`IEnd`).
 */
export namespace AutoMovieHumanF1Divide {
  /** A point or a direction, mm. */
  export type V = [number, number, number];

  /**
   * One dividing surface: the parts it parts, and how far a point stands past it toward the far ones.
   *
   * @evidence contracts/development/design.md#principled-representation One signed distance and the parts that read it with opposite signs; a region where the surface is meant to divide.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by `outside`, by the fit's complement check or by the tree.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No part owns a surface of its own; a surface names exactly two sides.
   * @evidence contracts/development/common.md#meaningful-documentation Members state sign and unit.
   */
  export interface ISurface {
    /** The surface's name. */
    name: string;

    /** The joint the surface belongs to: every part of a group's surfaces meets there, and each point of skin is one part's. */
    group: string;

    /** The parts on the negative side. */
    near: string[];

    /** The parts on the positive side. */
    far: string[];

    /** Signed distance past the surface, mm, positive on the far parts' side. */
    side: (p: V) => number;

    /**
     * The region the surface divides: inside it a point is the near parts' on the negative side and the far parts' on the positive
     * side; outside it the near parts keep the point, whichever side it lies on, and the far parts have no claim to it. A surface
     * built about one joint runs on without end: far from the joint it cuts skin that is the near part's alone (the armscye's
     * surface passes the hip's side), and its far side takes in skin that is nobody's on that joint (the thumb's root surface, read
     * at the knuckles, takes in the fingers). Stated on both sides by one region, every point has exactly one owner across the
     * surface by construction. Absent, the surface divides everywhere (a plane between the parts of a row).
     */
    within?: (p: V) => boolean;

    /** The joint the surface belongs to, mm. */
    anchor: V;

    /** How far from the anchor the surface divides skin, mm: the reach a complement check reads. */
    reach: number;
  }

  /**
   * A parent's section plane where its children part from it.
   *
   * @evidence contracts/development/design.md#principled-representation A point of the parent's course and the course's direction there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `create` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The plane is the parent's own section plane, not a second plane authored beside it.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface IEnd {
    /** The course's point, mm. */
    point: V;

    /** The course's direction there, toward the children. */
    normal: V;
  }

  /**
   * A digit of a row: its part and the centres of its first two joints.
   *
   * @evidence contracts/development/design.md#principled-representation The two centres fix where the digit leaves its parent and which way.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `create` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No digit of a row is special; the thumb is no digit of a row and has its surface.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units.
   */
  export interface IDigit {
    /** The part's name, as the fit and the tree know it. */
    part: string;

    /** The centre of the joint the digit leaves its parent at, mm. */
    first: V;

    /** The centre of its next joint, mm. */
    second: V;
  }

  /**
   * A dividing surface through landmarks of the skin about a centre (`AutoMovieHumanLandmarkSurface`), for a part on a host's side.
   *
   * @evidence contracts/development/design.md#principled-representation The surface's measure, the centre it was built about and how far from it the landmarks reach.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `create` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reach is the landmark set's own, stated by whoever reads the landmarks, not a constant shared between joints of different size.
   * @evidence contracts/development/common.md#meaningful-documentation Members state sign and unit.
   */
  export interface ILandmarked {
    /** Signed distance past the surface, mm, positive on the part's side. */
    side: (p: V) => number;

    /** The centre the surface was built about, mm. */
    centre: V;

    /** How far from the centre the surface divides skin, mm: the ball about the joint that holds its landmarks. */
    reach: number;

    /** The part's course from the centre on, mm: the joint centres it runs through, at least two; it runs on straight past the last. */
    course: V[];

    /** How far from that course the part's own skin stands at most, mm: past the ball the surface divides within this of the course. */
    tube: number;

    /** The part's name. */
    part: string;
  }

  /**
   * What the surfaces are built from.
   *
   * @evidence contracts/development/design.md#principled-representation Joint centres, the three parents' section planes and the one landmark surface; nothing read off a fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member enters one rule of `create`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The rows are ordered lists, so no rule names a digit.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units and order.
   */
  export interface IInput {
    /** The armscye's landmark surface about the shoulder joint, with the arm's course. */
    armscye: ILandmarked;

    /** The breast's surface on the chest; absent on a figure without a breast family. */
    mammary?: ILandmarked;

    /** The surface at the auricle's root on the head; absent while the plate is not a part of its own. */
    ear?: ILandmarked;

    /** The wrist's centre, mm. */
    wrist: V;

    /** The surface at the thumb's root on the hand. */
    thumb: ILandmarked;

    /** The fingers in their row's order, from the little one. */
    fingers: IDigit[];

    /** The toes in their row's order, from the little one. */
    toes: IDigit[];

    /** The sole's normal, a unit direction. */
    sole: V;

    /** The hip joint's centre, mm. */
    hip: V;

    /** The trunk's foot: the height of its family's first station, mm. */
    foot: number;

    /** The section planes of the arm at its end, of the hand at the heads, and of the leg at the ball of the foot. */
    ends: IInputEnds;

    /** The part names of the limbs' families: the trunk, the arm, the hand, the leg and the leg's twin. */
    parts: IInputParts;
  }

  /** The parts object of {@link IInput}. */
  export type IInputParts = { trunk: string; arm: string; hand: string; leg: string; twin: string };

  /** The ends object of {@link IInput}. */
  export type IInputEnds = { wrist: IEnd; hand: IEnd; foot: IEnd };

  /** How near the shoulder joint the armscye's surface divides, mm: the reach of the skin its landmarks were read on. */
  export const ARMSCYE_MM: number = 190;

  /*
   * How far from a row's or the hand's joint its planes divide skin, mm: past the widest hand's and foot's half breadth.
   */
  const ROW_MM: number = 60;

  /*
   * How far from the midpoint of two knuckles their web's plane divides skin, mm: half `ROW_MM`.
   */
  const WEB_MM: number = 30;

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: V): V => {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    if (!(l > 0)) throw new Error("divide: a direction has no length");
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const middle = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const plane = (point: V, normal: V): ((p: V) => number) => {
    const n: V = unit(normal);
    return (p: V): number => dot(sub(p, point), n);
  };
  const toward = (normal: V, direction: V): V => (dot(normal, direction) > 0 ? normal : [-normal[0], -normal[1], -normal[2]]);

  /**
   * Every dividing surface of the stored side.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each plane is a point and a normal built from joint centres by the rule its name states; the armscye is the supplied landmark surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list, one entry a surface; one rule serves both rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is read off a fit or a render and no digit is named; a degenerate direction is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per surface.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The landmark surface is built once by the caller that also joins by it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closures retain a point and a normal each.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace text states each rule.
   */
  export function create(input: IInput): ISurface[] {
    const { parts } = input;
    // A landmark surface divides inside the ball about its joint and, past it, inside the tube about its part's course.
    const tubed = (p: V, course: readonly V[]): number => {
      let least: number = Infinity;
      for (let i: number = 0; i + 1 < course.length; ++i) {
        const [a, e]: V[] = [course[i]!, sub(course[i + 1]!, course[i]!)];
        // The last stretch runs on past its end: the part's skin goes on to its tip along it.
        const t: number = Math.max(0, Math.min(i + 2 === course.length ? Infinity : 1, dot(sub(p, a!), e!) / (dot(e!, e!) || 1)));
        least = Math.min(least, Math.hypot(p[0] - a![0] - t * e![0], p[1] - a![1] - t * e![1], p[2] - a![2] - t * e![2]));
      }
      return least;
    };
    const landmarked = (name: string, group: string, near: string[], surface: ILandmarked): ISurface => ({
      name,
      group,
      near,
      far: [surface.part],
      side: surface.side,
      within: (p: V): boolean => Math.hypot(...sub(p, surface.centre)) < surface.reach || tubed(p, surface.course) < surface.tube,
      anchor: surface.centre,
      reach: surface.reach,
    });
    const out: ISurface[] = [landmarked("armscye", "shoulder", [parts.trunk], input.armscye)];
    if (input.mammary !== undefined) out.push(landmarked("mammary", "chest", [parts.trunk], input.mammary));
    if (input.ear !== undefined) out.push(landmarked("ear.root", "ear", [parts.trunk], input.ear));
    // The hand: the arm's end plane, and the surface at the thumb's root.
    out.push({ name: "wrist", group: "hand", near: [parts.arm], far: [parts.hand], side: plane(input.ends.wrist.point, input.ends.wrist.normal), anchor: input.ends.wrist.point, reach: ROW_MM });
    out.push(landmarked("thumb.root", "hand", [parts.hand, ...input.fingers.map((d: IDigit): string => d.part)], input.thumb));

    const row = (digits: readonly IDigit[], parent: string, end: IEnd, up: V, label: string): void => {
      const axes: V[] = digits.map((d: IDigit): V => unit(sub(d.second, d.first)));
      out.push({ name: "heads." + label, group: label, near: [parent], far: digits.map((d: IDigit): string => d.part), side: plane(end.point, end.normal), anchor: end.point, reach: ROW_MM });
      for (let i: number = 0; i + 1 < digits.length; ++i) {
        const [a, b]: IDigit[] = [digits[i]!, digits[i + 1]!];
        const centre: V = middle(a!.first, b!.first);
        out.push({ name: `web.${a!.part}.${b!.part}`, group: label, near: [a!.part], far: [b!.part], side: plane(centre, toward(cross(unit(add(axes[i]!, axes[i + 1]!)), up), sub(b!.first, a!.first))), anchor: centre, reach: WEB_MM });
      }
    };
    row(input.fingers, parts.hand, input.ends.hand, unit(cross(sub(input.fingers.at(-1)!.first, input.wrist), sub(input.fingers[0]!.first, input.wrist))), "hand");
    row(input.toes, parts.leg, input.ends.foot, input.sole, "foot");

    // The hip and the crotch.
    const level: number = (input.hip[1] + input.foot) / 2;
    out.push({ name: "hip", group: "hip", near: [parts.trunk], far: [parts.leg], side: plane([0, level, 0], [0, -1, 0]), anchor: [0, level, input.hip[2]], reach: 200 });
    out.push({ name: "crotch", group: "hip", near: [parts.twin], far: [parts.leg], side: plane([0, 0, 0], [0, 0, 1]), anchor: [0, input.foot, 0], reach: 120 });
    return out;
  }

  /**
   * How far a point stands outside a part's own skin, mm, positive outside: the greatest of the part's surfaces' distances past them
   * on the neighbour's side, each read inside its region; outside a surface's region its near parts keep the point and its far parts
   * do not. A part no surface names keeps everything.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A part keeps the intersection of its sides; the greatest signed distance to a neighbour's side is positive exactly outside that intersection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same closures serve both neighbours, with opposite signs and no margin.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the surfaces that name the part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The surfaces are filtered once per part.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure borrows the surfaces.
   * @evidence contracts/development/common.md#meaningful-documentation States the sign and the unit.
   */
  export function outside(surfaces: readonly ISurface[], name: string): (p: V) => number {
    const mine: { surface: ISurface; sign: number }[] = surfaces.flatMap((surface: ISurface): { surface: ISurface; sign: number }[] => (surface.near.includes(name) ? [{ surface, sign: 1 }] : surface.far.includes(name) ? [{ surface, sign: -1 }] : []));
    return (p: V): number => Math.max(-Infinity, ...mine.map(({ surface, sign }: { surface: ISurface; sign: number }): number => (surface.within === undefined || surface.within(p) ? sign * surface.side(p) : sign < 0 ? Infinity : -Infinity)));
  }
}
