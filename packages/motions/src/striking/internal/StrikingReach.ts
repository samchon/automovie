import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The goal maths of bringing a weapon surface onto a target point: where a
 * two-segment limb's middle joint (elbow or knee) and end joint (wrist or
 * ankle) must be for a point on its distal segment to sit on the target, the
 * flexion that takes, and the declared rule when the target is out of reach.
 *
 * Only goals are computed here: the end joint's point and the middle joint's
 * position become an `HumanPosture` limb goal (`point` and a `bend` hint beside
 * the middle joint), and the engine's `fitChainToTarget` solves the joint
 * angles within the range of motion, an effector goal and a bend goal as in
 * two-bone inverse kinematics with a swivel (Tolani, Goswami and Badler 2000,
 * Graphical Models 62(5):353). The placement is the triangle of the two segment
 * lengths and the root-to-point distance (law of cosines), in the plane through
 * the root and the point that contains the preferred bend direction.
 *
 * Reachability is decided against a flexion band at contact (a straight punch
 * lands nearly extended, a hook near a right angle, a kick's knee not locked):
 * within the band the point is met exactly; beyond the band's longest reach the
 * limb extends along the line toward the target at that reach and stops short,
 * the declared miss-at-maximum-reach rule, and the shortfall is reported;
 * inside the shortest reach either the contact slides along the distal segment
 * toward the middle joint (a jammed kick lands with the upper shin or the knee)
 * or, where the surface is rigid with the end joint (a fist), the middle joint
 * flexes past the band up to JAM_FLEXION.
 */
export namespace StrikingReach {
  /*
   * The most a middle joint flexes when a rigid-ended limb is jammed, degrees:
   * below the elbow's and knee's 145 to 150 degree range.
   */
  export const JAM_FLEXION: number = 140;

  /*
   * Reach of a two-segment limb to a point at a flexion.
   * Parameter upper: Root to middle joint, metres.
   * Parameter along: Middle joint to the point, metres.
   * Parameter flexion: Degrees, 0 straight.
   * Returns: Root-to-point distance, metres.
   */
  export function reach(upper: number, along: number, flexion: number): number {
    const c: number = Math.cos((flexion * Math.PI) / 180);
    return Math.sqrt(upper * upper + along * along + 2 * upper * along * c);
  }

  /*
   * Place a limb so a point of its distal segment meets a target.
   * Parameter input: The limb and the target.
   * Returns: The goals and the reach status.
   * When the target coincides with the root, or the bend
   * direction is parallel to the reach.
   */
  export function chain(
    input: IAutoMovieMotionHumanStrikingReach.IChain,
  ): IAutoMovieMotionHumanStrikingReach.ISolution {
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

    let status: IAutoMovieMotionHumanStrikingReach.ISolution["status"] =
      "reached";
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

  /*
   * A bend hint beside a solved middle joint: the joint pushed further toward
   * its bend side, so the hint defines the bend plane even when the limb is
   * nearly straight.
   * Parameter root: The root joint.
   * Parameter solution: The solve.
   * Parameter bend: The bend direction the solve used.
   * Parameter distance: How far beyond the middle joint, metres.
   * Returns: The hint point, world metres.
   */
  export function hint(
    root: IAutoMovieVector3,
    solution: IAutoMovieMotionHumanStrikingReach.ISolution,
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

  /*
   * How far the body must close along the line for a limb to reach: the excess
   * of the root-to-target distance over the limb's comfortable reach (its
   * band's reach at `share` of the way from the shortest to the longest),
   * limited to the entry the stance allows.
   * Parameter distance: Root-to-target distance, metres.
   * Parameter comfortable: The reach the strike prefers to land at, metres.
   * Parameter limit: The longest entry, metres.
   * Returns: The advance along the line, metres in `[-limit, limit]`; negative
   * backs away from a target too close.
   */
  export function advance(
    distance: number,
    comfortable: number,
    limit: number,
  ): number {
    return Math.min(limit, Math.max(-limit, distance - comfortable));
  }
}
