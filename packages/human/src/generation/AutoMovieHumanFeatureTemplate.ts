import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentFrame,
} from "@automovie/interface";

/**
 * A surface feature with its own centre as a template in its bone's frame: a bone end, a tendon, a pad, a plate's bed.
 *
 * A feature that has its own centre (an olecranon, a patella, a malleolus, an extensor tendon, a thenar pad, a navel, a nail's bed) is
 * not a patch of heights on one person's chart. It is a small form placed on a segment: a centre and two directions in that segment's
 * frame, an extent along and across, an outline, and a height over its footprint. Stated so, it rides its bone when a joint turns and
 * it follows a person by what makes it:
 *
 * - `bone`: the skeleton shows through the skin. Its place and extent follow the segment's length and bony breadth; tissue leaves its
 *   height.
 * - `tendon`: a cord between two bones. As `bone`.
 * - `pad`: soft tissue. Its place and extent follow the skeleton; its height follows the tissue's ratio.
 *
 * The footprint is the superellipse `|x / a|^n + |y / b|^n = 1` of the two half extents: `n = 2`, the default, is an ellipse, and a
 * larger `n` squares it toward the rectangle of the extents (a nail's bed, a tendon's strip). The footprint's radius `r` is
 * `(|x / a|^n + |y / b|^n)^(1 / n)`, 1 on the edge.
 *
 * The height over the footprint is the centre's height times a profile of `r`:
 *
 * - a bump, `(1 - r^2)^3`, the default: it and its first two derivatives vanish on the edge;
 * - a plateau with a ramp (`flat`): 1 while `r` is under `flat`, then down to nothing at the edge by the quintic smoothstep, whose
 *   first two derivatives vanish at both of its ends.
 *
 * Either way a relief window that holds the footprint meets the wall with no crease (3d-modeling's lofting, on a relief's window and
 * its C2 ramp). A squared footprint takes a plateau: at its centre `r^2` bends unevenly unless `n` is 2, and a plateau is flat there.
 */
export namespace AutoMovieHumanFeatureTemplate {
  /** What makes a feature, which decides what moves its height. */
  export type Class = "bone" | "tendon" | "pad";

  /** One feature in its segment's frame. */
  export interface ITemplate {
    /** The feature's name. */
    name: string;

    /** What makes it. */
    class: Class;

    /** The segment whose frame it is placed in. */
    segment: string;

    /** Its centre in that frame, mm. */
    centre: AutoMovieVector3Tuple;

    /** The unit direction of its long extent in that frame. */
    along: AutoMovieVector3Tuple;

    /** The unit direction of its short extent in that frame, square to `along`. */
    across: AutoMovieVector3Tuple;

    /** Its half extents along and across, mm. */
    extent: [number, number];

    /** Its height at the centre, mm: positive a mound, negative a hollow. */
    height: number;

    /** The footprint's superellipse exponent, at least 2; absent, 2, an ellipse. A value over 2 needs `flat`. */
    squareness?: number;

    /** The share of the footprint's radius, in [0, 1), over which the height is whole before its ramp; absent, the bump. */
    flat?: number;
  }

  /** How a person differs from the template's person at the feature's segment. */
  export interface IChange {
    /** The segment's length ratio along the feature's `along`. */
    along: number;

    /** The skeleton's breadth ratio along the feature's `across`. */
    across: number;

    /** The tissue's ratio there. */
    tissue: number;
  }

  /** A template placed in the figure's frame. */
  export interface IPlaced {
    /** The centre, mm. */
    centre: AutoMovieVector3Tuple;

    /** The unit direction of the long extent. */
    along: AutoMovieVector3Tuple;

    /** The unit direction of the short extent. */
    across: AutoMovieVector3Tuple;

    /** The unit direction the height stands along, `along x across`. */
    normal: AutoMovieVector3Tuple;
  }

  /** What a feature between two landmarks is given besides them. */
  export interface ISpan {
    /** The feature's name. */
    name: string;

    /** What makes it. */
    class: Class;

    /** The segment whose frame the landmarks are given in. */
    segment: string;

    /** The direction out of the skin near the feature, in that frame; it need not be unit nor square to the span. */
    outward: AutoMovieVector3Tuple;

    /** The feature's half width across the span, mm. */
    half: number;

    /** Its height at the centre, mm. */
    height: number;

    /** The footprint's exponent and the plateau's share, as `ITemplate` takes them. */
    squareness?: number;

    /** As `ITemplate.flat`. */
    flat?: number;
  }

  /** Refuse a template whose numbers the laws cannot read. */
  function admit(template: ITemplate): void {
    const { along, across }: ITemplate = template;
    if (Math.abs(F.dot(along, along) - 1) > 1e-9 || Math.abs(F.dot(across, across) - 1) > 1e-9 || Math.abs(F.dot(along, across)) > 1e-9)
      throw new Error("feature template: the directions of " + template.name + " must be unit and square");
    if (!(template.extent[0] > 0 && template.extent[1] > 0)) throw new Error("feature template: the extents of " + template.name + " must be positive");
    const n: number = template.squareness ?? 2;
    if (!(n >= 2)) throw new Error("feature template: the squareness of " + template.name + " must be at least 2");
    if (template.flat !== undefined && !(template.flat >= 0 && template.flat < 1)) throw new Error("feature template: the plateau of " + template.name + " must lie in [0, 1)");
    if (n !== 2 && template.flat === undefined) throw new Error("feature template: the squared footprint of " + template.name + " takes a plateau");
  }

  /**
   * A feature that runs between two landmarks of one segment: a tendon, a clavicle, a muscle's ridge, a furrow.
   *
   * @param from The landmark it starts at, in the segment's frame, mm.
   * @param to The landmark it ends at.
   * @param span Its name, class, segment, the outward direction there, its half width and its height.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The feature's long direction is the line of its two landmarks, its centre their midpoint and its half length half their distance; its short direction is square to that line and to the outward direction, so its footprint lies on the skin's side of the bone. Premise: the outward direction is not along the span.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One midpoint, one unit vector and one cross product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No feature is named in the law; coincident landmarks and an outward direction along the span are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the units and what each number of the result is taken from.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function between(from: AutoMovieVector3Tuple, to: AutoMovieVector3Tuple, span: ISpan): ITemplate {
    const line: AutoMovieVector3Tuple = F.sub(to, from);
    const length: number = Math.hypot(line[0], line[1], line[2]);
    if (!(length > 0)) throw new Error("feature template: the landmarks of " + span.name + " coincide");
    const along: AutoMovieVector3Tuple = F.scale(line, 1 / length);
    const side: AutoMovieVector3Tuple = F.cross(span.outward, along);
    const breadth: number = Math.hypot(side[0], side[1], side[2]);
    if (!(breadth > 1e-9 * Math.hypot(span.outward[0], span.outward[1], span.outward[2]))) throw new Error("feature template: the outward direction of " + span.name + " runs along its span");
    const template: ITemplate = {
      name: span.name,
      class: span.class,
      segment: span.segment,
      centre: F.mid(from, to),
      along,
      across: F.scale(side, 1 / breadth),
      extent: [length / 2, span.half],
      height: span.height,
      ...(span.squareness === undefined ? {} : { squareness: span.squareness }),
      ...(span.flat === undefined ? {} : { flat: span.flat }),
    };
    admit(template);
    return template;
  }

  /**
   * The template at a person: its place and extent by the skeleton's ratios, its height by its class.
   *
   * @param template The feature at the person it was stated on.
   * @param change The person's ratios at its segment.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A feature fixed on a bone moves and stretches with the bone (its centre's components along its two directions take the two skeleton ratios, the third is kept); a bone's or a tendon's prominence is not tissue, so only a pad's height takes the tissue's ratio. The outline's exponent and the plateau's share are shape and are kept.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the class.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No feature is named in the law; nonpositive ratios and a template `admit` refuses are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States what each ratio acts on.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function at(template: ITemplate, change: IChange): ITemplate {
    for (const ratio of [change.along, change.across, change.tissue]) if (!(Number.isFinite(ratio) && ratio > 0)) throw new Error("feature template: every ratio must be finite and positive");
    admit(template);
    const { along, across }: ITemplate = template;
    const [a, b]: [number, number] = [F.dot(template.centre, along), F.dot(template.centre, across)];
    const centre: AutoMovieVector3Tuple = F.add(template.centre, F.add(F.scale(along, (change.along - 1) * a), F.scale(across, (change.across - 1) * b)));
    return {
      ...template,
      centre,
      extent: [template.extent[0] * change.along, template.extent[1] * change.across],
      height: template.class === "pad" ? template.height * change.tissue : template.height,
    };
  }

  /**
   * The template in the figure's frame, on its segment's frame at whatever pose that frame holds.
   *
   * @param template The feature.
   * @param frame Its segment's frame in the figure's frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A point and two directions stated in a frame are carried by that frame's rigid map, so the feature keeps its place on the bone at every pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three frame maps and one cross product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is read from a skin or a chart.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and what the normal is.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure map coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function place(template: ITemplate, frame: IAutoMovieHumanSegmentFrame): IPlaced {
    const along: AutoMovieVector3Tuple = F.toWorldDirection(frame, template.along);
    const across: AutoMovieVector3Tuple = F.toWorldDirection(frame, template.across);
    return { centre: F.toWorld(frame, template.centre), along, across, normal: F.cross(along, across) };
  }

  /**
   * The template's height over its footprint at a point of the footprint's plane, mm.
   *
   * @param template The feature.
   * @param x The distance from the centre along `along`, mm.
   * @param y The distance from the centre along `across`, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The footprint's radius is the superellipse's, `(|x / a|^n + |y / b|^n)^(1 / n)`. The bump `h (1 - r^2)^3` is the lowest power of `1 - r^2` whose value, slope and bend vanish on the edge; the plateau's ramp is `1 - (10 t^3 - 15 t^4 + 6 t^5)` in `t = (r - flat) / (1 - flat)`, flat to second order at both ends. So either profile meets its wall C2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One radius and one of two profiles, zero outside the footprint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp inside the footprint; a template `admit` refuses is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the units, the two profiles and the edge's continuity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function height(template: ITemplate, x: number, y: number): number {
    admit(template);
    const n: number = template.squareness ?? 2;
    const r: number = (Math.abs(x / template.extent[0]) ** n + Math.abs(y / template.extent[1]) ** n) ** (1 / n);
    if (r >= 1) return 0;
    if (template.flat === undefined) return template.height * (1 - r * r) ** 3;
    if (r <= template.flat) return template.height;
    const t: number = (r - template.flat) / (1 - template.flat);
    return template.height * (1 - (10 * t ** 3 - 15 * t ** 4 + 6 * t ** 5));
  }
}
