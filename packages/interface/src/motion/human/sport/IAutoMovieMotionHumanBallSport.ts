import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Team ball skills performed with an implied ball (#3247): the stationary
 * basketball dribble, the volleyball forearm pass (dig) and overhead pass
 * (set), and the football throw-in. The ball is implied, the hands moving
 * where it would make them, except a throw-in given a held ball (`prop`):
 * both hands grip it to the release, where it is launched on the path that
 * rises at the release angle through `at` (`throwObjectLaunch.aimed`, the
 * throw's own range equation), and flies from there (#3377). The launch
 * point is the ball's centre between the hands, as the throw's is its grip
 * point, not the prop's own origin.
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
 * Every skill is a phrase: `ready` in the skill's set position after 0.5 s
 * (provisional), the stroke, and back to standing in 0.5 s.
 *
 * Not drafted: shots, passes, layups, rebounds, the spike, the block, the
 * serve, ball kicks, headers and the goalkeeper (they need the throw and the
 * ball-strike owners, #3232 and #3244, and the jump law).
 *
 * @evidence contracts/development/common.md#meaningful-documentation side: The dribbling hand; `right` when absent. count: Dribble bounces; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. prop: The ball a throw-in throws, a prop the hands hold from before it (a `pickUp`); absent, the ball is implied and nothing flies. Read by the throw-in only.
 * @evidence contracts/development/design.md#principled-representation side: The dribbling hand; `right` when absent. count: Dribble bounces; 4 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. prop: The ball a throw-in throws, a prop the hands hold from before it (a `pickUp`); absent, the ball is implied and nothing flies. Read by the throw-in only.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.ballSport, params); sport/ballSport.ts (ballSport.plan, context); sport/ballSport.ts (ballSport.plan); executable/cases/ballSportCases.ts (ballSportCases).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionManner, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBallSport {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The skill, the hand, the bounce count, and a throw-in's ball and target.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The skill. */
    kind: IAutoMovieMotionHumanBallSport.Kind;

    /** The dribbling hand; `right` when absent. */
    side?: "left" | "right";

    /** Dribble bounces; 4 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    count?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;

    /** The ball a throw-in throws, a prop the hands hold from before it (a `pickUp`); absent, the ball is implied and nothing flies. Read by the throw-in only. */
    prop?: string;

    /** The point a thrown ball's path passes through, world metres; required with `prop`. Read by the throw-in only. */
    at?: IAutoMovieVector3;
  }

  /**
   * Capture cases of the team ball skills (#3247) from quiet standing, with an implied ball. The skills.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Capture cases of the team ball skills (#3247) from quiet standing, with an implied ball. The skills.
   * @evidence contracts/development/design.md#principled-representation Closed choices "dribble", "dig", "set", "throwIn" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/ballSportCases.ts (ballSportCases).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in ballSportCases.
   */
  export type Kind = "dribble" | "dig" | "set" | "throwIn";
}
