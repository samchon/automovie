import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Team ball skills. The original dribble, dig, set and throw-in describe
 * implied-ball motion (#3247), and the throw-in can release a held ball
 * (#3377). The court releases publish the real spherical ball through the
 * common prop flight owner (#3698). An independently placed `stageCatch`
 * can take custody at a realized interception, including after a bounce.
 * The high-hand contest and the volleyball stroke variants have their own
 * support and hand timing.
 *
 * - Dribble: the knees give a twentieth of the stature (provisional), the
 *   palm faces down at the hand's side ahead of the hip, pushes down a
 *   quarter of the arm and rises again `count` times at 2 bounces a second
 *   (provisional).
 * - Dig: in a crouch, both arms reach from the displayed shoulders, nearly
 *   straight, to a platform pointing 40 degrees below the horizontal, the
 *   palms together; the platform lifts 10 degrees at the contact.
 * - Set: in a crouch, both hands stand above the forehead, palms up and
 *   forward; at the contact the legs extend and the hands rise overhead.
 * - Throw-in: both feet stay on the ground (the Laws of the Game), both
 *   hands are drawn behind the head while the trunk arches back about the
 *   hips, and they come over the head and forward as the trunk flexes, along
 *   a line rising at 30 degrees, the distance-best release angle (Linthorne
 *   and Everett 2006), to where it meets the arms' reach about the flexed
 *   shoulders.
 *
 * The existing implied phrases use a ready position, stroke and return.
 * The court and volleyball variants define support and arm timings for
 * their respective skills.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the legacy skills, their compatibility with implied motion, and the shared flight and custody of the modeled court releases.
 * @evidence contracts/development/design.md#principled-representation The selected skill controls whether a named prop flies or the action only plans the posture. Targets and times are world metres and action or flight seconds respectively.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.ballSport, params); sport/ballSport.ts (ballSport.plan, context); sport/ballSport.ts (ballSport.plan); executable/cases/ballSportCases.ts (ballSportCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBallSport {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The skill, hand, implied bounce count, release prop and aim, and optional volleyball contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The skill. */
    kind: IAutoMovieMotionHumanBallSport.Kind;

    /** Dribbling or throwing hand; `right` when absent. */
    side?: "left" | "right";

    /** Dribble bounces; 4 when absent, at 2 bounces a second (`ballSport.BOUNCES`, provisional): a 2 s dribble.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;

    /** The previously held ball. Optional for throw-in, required for court releases, and unused for an implied skill or a contest. */
    prop?: string;

    /** World metres. The throw-in, chest pass, set shot and handball throw aim through this centre. A bounce pass aims at this floor position. A contest uses it as a gaze target. */
    at?: IAutoMovieVector3;

    /**
     * Positive seconds from release through `at` for a chest pass, set shot, handball throw, or the first impact of a bounce pass.
     * Exclusive minimum: 0. Unit: s. Each court skill has a provisional default.
     */
    flightSeconds?: number;

    /** The volleyball stroke's authored palm or forearm surface position, world metres. Omitted to use the stroke's fitted default. */
    contactAt?: IAutoMovieVector3;
  }

  /**
   * The supported legacy, court and volleyball phrases.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Enumerates the legacy, planted court and volleyball actions.
   * @evidence contracts/development/design.md#principled-representation Each literal dispatches to a fixed support and interaction profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/ballSportCases.ts (ballSportCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literals leave support, pose and prop handling with the motion dispatch and its planners.
   */
  export type Kind =
    | "dribble"
    | "dig"
    | "set"
    | "throwIn"
    | "dribbleRelease"
    | "chestPass"
    | "bouncePass"
    | "setShot"
    | "handballThrow"
    | "highHandContest"
    | "volleyballServe"
    | "volleyballSpike"
    | "volleyballBlock"
    | "volleyballReceive"
    | "volleyballSet";
}
