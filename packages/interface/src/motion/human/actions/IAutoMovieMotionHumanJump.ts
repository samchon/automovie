import type { IAutoMovieMotionHumanJumpAirborne } from "./IAutoMovieMotionHumanJumpAirborne";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A jump to a floor point: a push-off from a planted foot, a ballistic flight
 * and a two-footed landing that absorbs and rises to standing.
 *
 * The push-off starts from the entry exactly, so a walk cut while a stance
 * foot is planted continues without a jump in position or velocity: the root
 * follows a quintic Hermite path from the entry root and velocity to the
 * take-off root and velocity over `PUSH` seconds. The take-off foot is the
 * planted one (the front one in the entered body's own frame when both are,
 * the rear being about to leave),
 * held on the floor while it comes down about its heel if it was still in its
 * heel rocker and then rises about the toes' joint from its entry pitch to
 * 40°, its toes extending, the stance rockers in order and the forefoot rocker of a
 * push-off, the floor contact it declares being the heel while it pivots
 * there and the toes' joint after; the other leg, the reaching leg, leaves
 * the floor at the cut and withdraws under the body, its
 * ankle drawn under the hip and raised to 0.3 hip heights, the free-leg tuck
 * of a one-foot take-off, its foot turning from its entry rotation. The arms
 * swing forward and up from their entry angles with the push (shoulder
 * flexion to 60°), the arm action that adds to take-off velocity
 * (Ashby and Heegaard 2002, "Role of arm motion in the standing long jump",
 * J. Biomech. 35).
 *
 * Whatever the push-off moves on a path of its own (the take-off foot's
 * pitch, the reaching foot, the turn to the jump's heading, the shoulders)
 * also continues the rate it was entered with: the path starts at rest, and
 * the entry rate times the engine's `carriedRate` term (unit slope and
 * no acceleration at the cut, zero value, velocity and acceleration at its
 * end) is added to it over the push. A rate is carried only as long as its
 * room affords, the term peaking at `carriedRate.PEAK` of its duration times
 * the rate: the reaching foot's velocity and spin, a rigid motion of the
 * foot, for no longer than brings its heel or ball to the floor, and a
 * take-off foot whose heel was coming down about its ball for no longer than
 * lays it flat. The root's own push-off path starts at the entry's position,
 * velocity and acceleration, so a walk's stance, whose root is accelerating
 * downward at several metres per second squared, is not cut to a path at
 * rest acceleration: the planted knee is solved from the root and would show
 * that step as a change of its flexion rate within one frame. The reaching
 * ankle carries its entry acceleration the same way (the engine's
 * `carriedAcceleration`, over the carry of its velocity), so the reaching
 * knee is not left to absorb the root's.
 *
 * Flight is ballistic in the centre of mass, the one point gravity alone
 * moves while airborne: from the apex height `apex` above take-off (0.06 hip
 * heights plus a tenth of the jump's length when absent, provisional), the
 * vertical take-off speed is `sqrt(2 g apex)`, the flight time solves the
 * centre's landing height, and the horizontal speed covers its distance in
 * that time, the closed form of a drag-free projectile (`v = d / T - g T /
 * 2`, as the engine's ballistic solvers). At each airborne instant the root
 * is placed so the body's centre of mass, read by the engine's mass model
 * from the posture there, lies on that parabola, so moving the limbs in
 * flight shifts the trunk the way it would. The legs travel in the body's frame from their
 * take-off placements to their landing footprints, lifted at mid-flight.
 * Both feet land flat on footprints at the destination and at its height (a
 * box's top, a step; the flight's default apex then also clears that rise,
 * and an apex that does not is refused), at the body's rest
 * separation, turned out by the stance angle; the root lands 0.03 hip
 * heights low with the flight's velocity, absorbs to 0.12 hip heights low on
 * a quintic path that brings that velocity to rest over `ABSORB` seconds,
 * then rises to the upright stand ({@link standUpright}) over `RISE` seconds.
 * Planted legs are kept reachable by `resolveHumanPosture.lower`. The
 * push-off is drawn by `jumpPush`, the landing's places by `jumpLanding`
 * and the paths by `jumpPath`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.jump, params).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanJumpAirborne.IRotation, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanJump {
  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#principled-representation to: The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. on: The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. apex: Apex height of the flight above take-off, metres; positive. Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/jump.ts (jump.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.jump, params).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanJumpAirborne.IRotation, IAutoMovieMotionManner.IManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. */
    to: IAutoMovieVector3;

    /** The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. */
    on?: string;

    /** Apex height of the flight above take-off, metres; positive.
     * Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    apex?: number;

    /**
     * Turns the body makes in flight (#3428): somersaults about the axis
     * across the heading (`forward` or `backward`) or about the axis along it
     * (`left` or `right`, a side salto), and twists about the body's long
     * axis, signed by the right-hand rule about up. The flight turns by the
     * angular momentum that lands these turns on the composed body's shape
     * (`HumanPerformanceFlight`), so a tuck laid over the flight turns it
     * faster. No turn when absent.
     */
    rotation?: IAutoMovieMotionHumanJumpAirborne.IRotation;

    /** How it is performed: the manner's tempo scales the push-off, the absorption and the rise, never the flight, which gravity fixes; neutral when absent. */
    manner?: IAutoMovieMotionManner.IManner;
  }
}
