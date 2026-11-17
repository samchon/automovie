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
 * - `wrist`: the arm's section plane where its face ends; the arm proximal, the wrist's stub distal.
 * - `carpus`: the hand's section plane at its course's station nearest the midpoint of the wrist's centre and the thumb's first joint;
 *   the wrist's stub proximal, the palm and the thumb's ray distal.
 * - `web.thumb`: the plane through that midpoint that holds the bisector of the thumb's first segment and the wrist-to-middle-knuckle
 *   line and the normal of the plane those two span; the thumb on its side, the palm and the four fingers on the other.
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
     * Where the near parts give skin up to the surface: outside it they keep everything, whichever side it lies on. The far parts read
     * the surface everywhere. A surface built about one joint runs on without end, and far from the joint it cuts skin that is the near
     * part's alone (the armscye's surface passes the hip's side); the far part's own sections never reach there, but near the joint
     * they are one loop with the near part's skin and must lose all of it. Absent, the near parts read it everywhere as well.
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
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No digit is special: the thumb is one of these too.
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

    /** How far from the centre the surface divides skin, mm. */
    reach: number;

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
    /** The armscye's landmark surface: positive on the arm's side, mm. */
    armscye: (p: V) => number;

    /** The shoulder joint's centre, mm. */
    shoulder: V;

    /** The breast's surface on the chest; absent on a figure without a breast family. */
    mammary?: ILandmarked;

    /** The surface at the auricle's root on the head; absent while the plate is not a part of its own. */
    ear?: ILandmarked;

    /** The wrist's centre, mm. */
    wrist: V;

    /** The thumb. */
    thumb: IDigit;

    /** The fingers in their row's order, from the little one. */
    fingers: IDigit[];

    /** The index of the finger whose first joint, with the wrist, gives the palm's line (the middle finger's). */
    palm: number;

    /** The toes in their row's order, from the little one. */
    toes: IDigit[];

    /** The sole's normal, a unit direction. */
    sole: V;

    /** The hip joint's centre, mm. */
    hip: V;

    /** The trunk's foot: the height of its family's first station, mm. */
    foot: number;

    /** The section planes of the arm at its end, of the hand at the carpus and at the heads, and of the leg at the ball of the foot. */
    ends: { wrist: IEnd; carpus: IEnd; hand: IEnd; foot: IEnd };

    /** The part names of the limbs' families: the trunk, the arm, the wrist's stub, the palm, the leg and the leg's twin. */
    parts: { trunk: string; arm: string; wrist: string; hand: string; leg: string; twin: string };
  }

  /** How near the shoulder joint the armscye's surface divides, mm: the reach of the skin its landmarks were read on. */
  export const ARMSCYE_MM: number = 190;

  /** How far from a row's or the hand's joint its planes divide skin, mm: past the widest hand's and foot's half breadth. */
  const ROW_MM: number = 60;

  /** How far from the midpoint of two knuckles their web's plane divides skin, mm: half `ROW_MM`. */
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
    const out: ISurface[] = [
      { name: "armscye", group: "shoulder", near: [parts.trunk], far: [parts.arm], side: input.armscye, within: (p: V): boolean => Math.hypot(...sub(p, input.shoulder)) < ARMSCYE_MM, anchor: input.shoulder, reach: ARMSCYE_MM },
    ];
    for (const [name, group, landmarked] of [["mammary", "chest", input.mammary], ["ear.root", "ear", input.ear]] as [string, string, ILandmarked | undefined][])
      if (landmarked !== undefined)
        out.push({ name, group, near: [parts.trunk], far: [landmarked.part], side: landmarked.side, within: (p: V): boolean => Math.hypot(...sub(p, landmarked.centre)) < landmarked.reach, anchor: landmarked.centre, reach: landmarked.reach });

    // The hand: the wrist's and the carpus's section planes, and the plane that parts the thumb's ray from the palm and the fingers.
    const base: V = middle(input.wrist, input.thumb.first);
    const ray: V = unit(sub(input.thumb.second, input.thumb.first));
    const palm: V = unit(sub(input.fingers[input.palm]!.first, input.wrist));
    const between: V = unit(add(ray, palm));
    out.push({ name: "wrist", group: "hand", near: [parts.arm], far: [parts.wrist], side: plane(input.ends.wrist.point, input.ends.wrist.normal), anchor: input.ends.wrist.point, reach: ROW_MM });
    out.push({ name: "carpus", group: "hand", near: [parts.wrist], far: [parts.hand, input.thumb.part], side: plane(input.ends.carpus.point, input.ends.carpus.normal), anchor: base, reach: ROW_MM });
    // Toward the thumb: the part of the thumb's own direction square to the bisector.
    out.push({ name: "web.thumb", group: "hand", near: [parts.hand, ...input.fingers.map((d: IDigit): string => d.part)], far: [input.thumb.part], side: plane(base, toward(cross(unit(cross(ray, palm)), between), ray)), anchor: base, reach: ROW_MM });

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
   * on the neighbour's side, each read only where it divides. A part no surface names keeps everything.
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
    return (p: V): number => Math.max(-Infinity, ...mine.map(({ surface, sign }: { surface: ISurface; sign: number }): number => (sign < 0 || surface.within === undefined || surface.within(p) ? sign * surface.side(p) : -Infinity)));
  }
}
