import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanJumpAirborne } from "../actions/IAutoMovieMotionHumanJumpAirborne";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHighJump } from "../sport/IAutoMovieMotionHumanHighJump";
import type { IAutoMovieMotionHumanHorizontalJump } from "../sport/IAutoMovieMotionHumanHorizontalJump";
import type { IAutoMovieMotionHumanHurdleClear } from "../sport/IAutoMovieMotionHumanHurdleClear";
import type { IAutoMovieMotionHumanPoleVault } from "../sport/IAutoMovieMotionHumanPoleVault";

/**
 * The flight laws: a push-off, a flight under gravity and a landing. A flight
 * lasts `sqrt(8 apex / g)` at gravity 9.80665 m/s2 for a level jump
 * (`jump.plan`); push-off, absorption and rise are provisional and scale with
 * `manner.pace`, and the flight does not.
 *
 * A `jump` pushes off one planted foot: there is no two-foot take-off, and a
 * body with no planted foot is refused. It lands on both feet, absorbs, and
 * rises to standing; only `stand` and `walk` may cut it, from its `settled`
 * instant (the end of the absorption) on. It yields the trunk, both arms and
 * both hands, the ones a layup, a jump throw, a spike or a block takes, and
 * carries the body by its root and legs, so an overlay (`throwObject`,
 * `release`, `armPhrase`) rides it.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanJump` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanJump<Chain> {
  /**
   * A jump to a floor point: a push-off from a planted foot, a ballistic flight
   * and a two-footed landing that absorbs and rises to standing.
   *
   * @param params The `to`, `on`, `apex`, `rotation` and `manner` of
   *   `IAutoMovieMotionHumanJump.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  jump(params: IAutoMovieMotionHumanJump.IParams, anchor?: string): Chain;

  /**
   * A long jump out of a run: the run is cut at the take-off foot's footfall on
   * the board, the jump's own push-off launches at a take-off angle of about 21
   * degrees (`horizontalJump.ANGLE`), the flight is ballistic, and both feet
   * land in the sand with the heels at the authored distance from the take-off
   * line, absorb and rise.
   *
   * Registered law: `registered("horizontalJump", params)`; not a chain method.
   *
   * @param params The `pit` and `distance` of
   *   `IAutoMovieMotionHumanHorizontalJump.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  horizontalJump(
    params: IAutoMovieMotionHumanHorizontalJump.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A high jump in the Fosbury flop: a one-foot take-off, a half turn that puts
   * the back to the bar, a backward lay-out over it with the back arched, the
   * legs lifted after the hips pass, and a landing on the back.
   *
   * Registered law: `registered("highJump", params)`; not a chain method.
   *
   * @param params The `to`, `on`, `bar`, `apexReserve` and `takeoffFoot` of
   *   `IAutoMovieMotionHumanHighJump.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  highJump(
    params: IAutoMovieMotionHumanHighJump.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A pole vault: out of a run, the hand that holds the pole plants its end on
   * the floor ahead at the take-off, the body swings over the planted end with
   * the pole, lets go as the pole stands upright, and flies on to come down
   * lying on the landing surface.
   *
   * Registered law: `registered("poleVault", params)`; not a chain method.
   *
   * @param params The `pole`, `end` and `on` of
   *   `IAutoMovieMotionHumanPoleVault.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  poleVault(
    params: IAutoMovieMotionHumanPoleVault.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A hurdle clearance out of a run: the run is cut at the take-off foot's
   * footfall before the hurdle, that foot pushes off, the lead leg swings over
   * the bar, the trail leg comes round over it, and the lead foot lands beyond,
   * where a run may take the stride on.
   *
   * Registered law: `registered("hurdleClear", params)`; not a chain method.
   *
   * @param params The `hurdle` of `IAutoMovieMotionHumanHurdleClear.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  hurdleClear(
    params: IAutoMovieMotionHumanHurdleClear.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * A jump to a floor point: a push-off from a planted foot, a ballistic flight
 * and a two-footed landing that absorbs and rises to standing.
 *
 * The push-off starts from the entry exactly, so a walk cut while a stance foot
 * is planted continues without a jump in position or velocity: the root follows
 * a quintic Hermite path from the entry root and velocity to the take-off root
 * and velocity over `PUSH` seconds. The take-off foot is the planted one (the
 * front one in the entered body's own frame when both are, the rear being about
 * to leave), held on the floor while it comes down about its heel if it was
 * still in its heel rocker and then rises about the toes' joint from its entry
 * pitch to 40°, its toes extending, the stance rockers in order and the
 * forefoot rocker of a push-off, the floor contact it declares being the heel
 * while it pivots there and the toes' joint after; the other leg, the reaching
 * leg, leaves the floor at the cut and withdraws under the body, its ankle
 * drawn under the hip and raised to 0.3 hip heights, the free-leg tuck of a
 * one-foot take-off, its foot turning from its entry rotation. The arms swing
 * forward and up from their entry angles with the push (shoulder flexion to
 * 60°), the arm action that adds to take-off velocity (Ashby and Heegaard 2002,
 * "Role of arm motion in the standing long jump", J. Biomech. 35).
 *
 * Whatever the push-off moves on a path of its own (the take-off foot's pitch,
 * the reaching foot, the turn to the jump's heading, the shoulders) also
 * continues the rate it was entered with: the path starts at rest, and the
 * entry rate times the engine's `carriedRate` term (unit slope and no
 * acceleration at the cut, zero value, velocity and acceleration at its end) is
 * added to it over the push. A rate is carried only as long as its room
 * affords, the term peaking at `carriedRate.PEAK` of its duration times the
 * rate: the reaching foot's velocity and spin, a rigid motion of the foot, for
 * no longer than brings its heel or ball to the floor, and a take-off foot
 * whose heel was coming down about its ball for no longer than lays it flat.
 * The root's own push-off path starts at the entry's position, velocity and
 * acceleration, so a walk's stance, whose root is accelerating downward at
 * several metres per second squared, is not cut to a path at rest acceleration:
 * the planted knee is solved from the root and would show that step as a change
 * of its flexion rate within one frame. The reaching ankle carries its entry
 * acceleration the same way (the engine's `carriedAcceleration`, over the carry
 * of its velocity), so the reaching knee is not left to absorb the root's.
 *
 * Flight is ballistic in the centre of mass, the one point gravity alone moves
 * while airborne: from the apex height `apex` above take-off (0.06 hip heights
 * plus a tenth of the jump's length when absent, provisional), the vertical
 * take-off speed is `sqrt(2 g apex)`, the flight time solves the centre's
 * landing height, and the horizontal speed covers its distance in that time,
 * the closed form of a drag-free projectile (`v = d / T - g T / 2`, as the
 * engine's ballistic solvers). At each airborne instant the root is placed so
 * the body's centre of mass, read by the engine's mass model from the posture
 * there, lies on that parabola, so moving the limbs in flight shifts the trunk
 * the way it would. The legs travel in the body's frame from their take-off
 * placements to their landing footprints, lifted at mid-flight. Both feet land
 * flat on footprints at the destination and at its height (a box's top, a step;
 * the flight's default apex then also clears that rise, and an apex that does
 * not is refused), at the body's rest separation, turned out by the stance
 * angle; the root lands 0.03 hip heights low with the flight's velocity,
 * absorbs to 0.12 hip heights low on a quintic path that brings that velocity
 * to rest over `ABSORB` seconds, then rises to the upright stand
 * ({@link standUpright}) over `RISE` seconds. Planted legs are kept reachable by
 * `resolveHumanPosture.lower`. The push-off is drawn by `jumpPush`, the
 * landing's places by `jumpLanding` and the paths by `jumpPath`.
 */
export namespace IAutoMovieMotionHumanJump {
  /** Parameters. */
  export interface IParams {
    /**
     * The point to land on, world metres: its height is the landing surface's,
     * the floor's 0, a box's top or a step's.
     */
    to: IAutoMovieVector3;

    /**
     * The prop whose top is landed on, its subject id, so the feet bear on it;
     * the floor when absent.
     */
    on?: string;

    /**
     * Apex height of the flight above take-off, metres; positive; 0.06 hip
     * heights plus a tenth of the jump's length when absent (`jump`,
     * provisional). Gravity decides the flight time: the take-off speed is
     * `sqrt(2 g apex)` and a level landing follows `sqrt(8 apex / g)` later, g
     * 9.80665 m/s2: 0.36 s for a 1 m jump at the reference hip (apex 0.15 m).
     * The push-off (0.3 s, `jump.PUSH`), the absorption (0.3 s, `jump.ABSORB`)
     * and the rise to standing (0.45 s, `jump.RISE`) are provisional and scaled
     * by `manner.pace`; the flight is not.
     */
    apex?: number;

    /**
     * Turns the body makes in flight: somersaults about the axis across the
     * heading (`forward` or `backward`) or about the axis along it (`left` or
     * `right`, a side salto), and twists about the body's long axis, signed by
     * the right-hand rule about up. The performance's staged default follows
     * the authored turn clock and requires a complete net rotation for this
     * feet-first landing. Explicit physical mode solves angular momentum on the
     * composed body, so a tuck can change its rate. Staged turns make no
     * momentum-conservation claim. No turn when absent.
     */
    rotation?: IAutoMovieMotionHumanJumpAirborne.IRotation;

    /**
     * How it is performed: the manner's tempo scales the push-off, the
     * absorption and the rise, never the flight, which gravity fixes; neutral
     * when absent.
     */
    manner?: IAutoMovieMotionManner;
  }
}
