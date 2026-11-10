import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The goal maths of bringing a weapon surface onto a target point: where a
 * two-segment limb's middle joint (elbow or knee) and end joint (wrist or
 * ankle) must be for a point on its distal segment to sit on the target, the
 * flexion that takes, and the declared rule when the target is out of reach.
 *
 * Only goals are computed here: the end joint's point and the middle joint's
 * position become an `IHumanPosture` limb goal (`point` and a `bend` hint
 * beside the middle joint), and the engine's `fitChainToTarget` solves the
 * joint angles within the range of motion, as Unreal's two-bone IK with a pole
 * target and Final IK's limb solver take an effector goal and a bend goal. The
 * placement is the triangle of the two segment lengths and the root-to-point
 * distance (law of cosines), in the plane through the root and the point that
 * contains the preferred bend direction.
 *
 * Reachability is decided against a flexion band at contact (a straight
 * punch lands nearly extended, a hook near a right angle, a kick's knee not
 * locked): within the band the point is met exactly; beyond the band's
 * longest reach the limb extends along the line toward the target at that
 * reach and stops short, the declared miss-at-maximum-reach rule, and the
 * shortfall is reported; inside the shortest reach either the contact slides
 * along the distal segment toward the middle joint (a jammed kick lands with
 * the upper shin or the knee) or, where the surface is rigid with the end
 * joint (a fist), the middle joint flexes past the band up to
 * {@link JAM_FLEXION}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that only goals are computed, the triangle method, the band and the reach statuses.
 * @evidence contracts/development/design.md#principled-representation A limb solve's input and result in world metres and degrees, the status a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reach, chain, hint and advance functions with their types, read by the punch, the kick and the tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector; the joints are left to the engine's limb fit.
 */
export namespace StrikingReach {
  /** The most a middle joint flexes when a rigid-ended limb is jammed, degrees: below the elbow's and knee's 145 to 150 degree range. */
  export const JAM_FLEXION: number = 140;

  /**
   * One limb solve's input; every point in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and meaning.
   * @evidence contracts/development/design.md#principled-representation World points, lengths in metres, a bend direction, a flexion band in degrees and whether the contact may slide; a parallel bend is refused by the solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the triangle and the band need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IChain {
    /** The root joint (shoulder or hip). */
    root: IAutoMovieVector3;

    /** Where the distal segment's chosen point must go. */
    point: IAutoMovieVector3;

    /** Root to middle joint, metres. */
    upper: number;

    /** Middle joint to the chosen point along the distal segment, metres; the wrist or ankle itself when equal to `lower`. */
    along: number;

    /** Middle joint to end joint, metres. */
    lower: number;

    /** A direction the middle joint bends toward (the elbow down, the knee leading); any non-zero vector not parallel to root-to-point. */
    bend: IAutoMovieVector3;

    /** The flexion band at contact, degrees `[least, most]`, 0 straight. */
    flexion: readonly [number, number];

    /** Whether contact may slide along the distal segment when too close (a shin), or the surface is rigid with the end joint (a fist, a sole). */
    slide: boolean;
  }

  /**
   * One limb solve's result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and meaning, the gap its sign.
   * @evidence contracts/development/design.md#principled-representation The joints and the landing point in world metres, the flexion in degrees, the contact's distance along the distal segment, a closed status union and a signed gap.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the laws turn into goals and records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISolution {
    /** The middle joint, world metres. */
    middle: IAutoMovieVector3;

    /** The end joint (wrist or ankle), world metres. */
    end: IAutoMovieVector3;

    /** Where the chosen point lands, world metres: the target, or the nearest point of the line toward it when short. */
    point: IAutoMovieVector3;

    /** The middle joint's flexion, degrees. */
    flexion: number;

    /** The distance from the middle joint at which the contact sits, metres. */
    along: number;

    /** `reached`, `short` (miss at maximum reach) or `jammed` (closer than the band). */
    status: "reached" | "short" | "jammed";

    /** How far the point falls short of the target, metres: positive when short, negative when jammed past it, otherwise 0. */
    gap: number;
  }

  /**
   * Reach of a two-segment limb to a point at a flexion.
   *
   * @param upper Root to middle joint, metres.
   * @param along Middle joint to the point, metres.
   * @param flexion Degrees, 0 straight.
   * @returns Root-to-point distance, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every unit.
   * @evidence contracts/development/implementation.md#principled-implementation The law of cosines with the interior angle 180 degrees less the flexion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reach(upper: number, along: number, flexion: number): number {
    const c: number = Math.cos((flexion * Math.PI) / 180);
    return Math.sqrt(upper * upper + along * along + 2 * upper * along * c);
  }

  /**
   * Place a limb so a point of its distal segment meets a target.
   *
   * @param input The limb and the target.
   * @returns The goals and the reach status.
   * @throws {Error} When the target coincides with the root, or the bend direction is parallel to the reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusals; the namespace states the statuses and the comments derive the slide.
   * @evidence contracts/development/implementation.md#principled-implementation The root-middle-point triangle by the law of cosines in the plane containing the bend; beyond the band the limb extends along the line at the longest reach, inside it the contact slides at the most flexion or the joint flexes to the jam limit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Band reaches, status, then the triangle and the joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Degenerate inputs throw; an unreachable target is reported short with its gap instead of met by a stretched limb.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chain(input: IChain): ISolution {
    const { root, upper, lower } = input;
    let along: number = input.along;
    const toward: IAutoMovieVector3 = Vector3.subtract(input.point, root);
    const distance: number = Vector3.length(toward);
    if (!(distance > 1e-9))
      throw new Error("A strike's target coincides with the limb's root");
    const e1: IAutoMovieVector3 = Vector3.scale(toward, 1 / distance);
    const side: IAutoMovieVector3 = Vector3.subtract(
      input.bend,
      Vector3.scale(e1, Vector3.dot(input.bend, e1)),
    );
    if (!(Vector3.length(side) > 1e-9))
      throw new Error("A limb's bend direction is parallel to its reach");
    const e2: IAutoMovieVector3 = Vector3.normalize(side);
    const [least, most] = input.flexion;
    const longest: number = reach(upper, along, least);
    const shortest: number = reach(upper, along, most);

    let status: ISolution["status"] = "reached";
    let span: number = distance;
    let gap: number = 0;
    if (distance > longest) {
      // Out of reach: extend along the line at the band's longest reach.
      status = "short";
      gap = distance - longest;
      span = longest;
    } else if (distance < shortest) {
      status = "jammed";
      if (input.slide) {
        // Keep the band's most flexion and slide the contact toward the middle
        // joint: |root-point|^2 = u^2 + a^2 + 2 u a cos(phi), solved for a.
        const c: number = Math.cos((most * Math.PI) / 180);
        along = Math.max(
          0,
          -upper * c +
            Math.sqrt(
              Math.max(0, distance * distance - upper * upper * (1 - c * c)),
            ),
        );
        span = Math.max(distance, Math.abs(upper - along));
      } else span = Math.max(distance, reach(upper, along, JAM_FLEXION));

      // Negative when even the most flexion leaves the point beyond the
      // target, the overlap the root must back away by.
      gap = distance - span;
    }

    // The triangle root, middle, point: the angle at the root from the law
    // of cosines, opening toward the bend side.
    const cosAlpha: number = Math.min(
      1,
      Math.max(
        -1,
        (upper * upper + span * span - along * along) / (2 * upper * span),
      ),
    );
    const sinAlpha: number = Math.sqrt(1 - cosAlpha * cosAlpha);
    const middle: IAutoMovieVector3 = Vector3.add(
      root,
      Vector3.add(
        Vector3.scale(e1, upper * cosAlpha),
        Vector3.scale(e2, upper * sinAlpha),
      ),
    );
    const point: IAutoMovieVector3 = Vector3.add(root, Vector3.scale(e1, span));
    const distal: IAutoMovieVector3 =
      along > 1e-9
        ? Vector3.normalize(Vector3.subtract(point, middle))
        : Vector3.normalize(Vector3.subtract(middle, root));
    const end: IAutoMovieVector3 = Vector3.add(
      middle,
      Vector3.scale(distal, lower),
    );
    const thigh: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(middle, root),
    );
    const flexion: number =
      (Math.acos(Math.min(1, Math.max(-1, Vector3.dot(thigh, distal)))) * 180) /
      Math.PI;
    return { middle, end, point, flexion, along, status, gap };
  }

  /**
   * A bend hint beside a solved middle joint: the joint pushed further toward
   * its bend side, so the hint defines the bend plane even when the limb is
   * nearly straight.
   *
   * @param root The root joint.
   * @param solution The solve.
   * @param bend The bend direction the solve used.
   * @param distance How far beyond the middle joint, metres.
   * @returns The hint point, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why the hint is pushed beyond the joint and every unit.
   * @evidence contracts/development/implementation.md#principled-implementation The bend direction's component perpendicular to the root-to-end axis, added to the middle joint at the given distance, so the hint stays off the reach axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection and one offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the solve already refuses a bend parallel to the reach.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hint(
    root: IAutoMovieVector3,
    solution: ISolution,
    bend: IAutoMovieVector3,
    distance: number,
  ): IAutoMovieVector3 {
    const e1: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(solution.end, root),
    );
    const side: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(bend, Vector3.scale(e1, Vector3.dot(bend, e1))),
    );
    return Vector3.add(solution.middle, Vector3.scale(side, distance));
  }

  /**
   * How far the body must close along the line for a limb to reach: the
   * excess of the root-to-target distance over the limb's comfortable reach
   * (its band's reach at `share` of the way from the shortest to the longest),
   * limited to the entry the stance allows.
   *
   * @param distance Root-to-target distance, metres.
   * @param comfortable The reach the strike prefers to land at, metres.
   * @param limit The longest entry, metres.
   * @returns The advance along the line, metres in `[-limit, limit]`; negative backs away from a target too close.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's range and sign; the comfortable reach is the caller's.
   * @evidence contracts/development/implementation.md#principled-implementation The excess of the distance over the comfortable reach, clamped to the stance's entry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function advance(
    distance: number,
    comfortable: number,
    limit: number,
  ): number {
    return Math.min(limit, Math.max(-limit, distance - comfortable));
  }
}
