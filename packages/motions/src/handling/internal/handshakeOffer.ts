import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { handshakeOfferAttempt } from "./handshakeOfferAttempt";
import { handshakeReach } from "./handshakeReach";

/*
 * The arm a person offers for a handshake, and where two such arms meet.
 *
 * The offering arm holds the upper arm `SHOULDER` forward of hanging and the
 * elbow flexed `ELBOW`, which slopes the forearm `90 - SHOULDER - ELBOW`
 * degrees below level to the hand; both angles are provisional, as no
 * measurement of the offering arm was located. Two offering arms meet at the
 * point both forearms reach from their elbows (`point`), and a difference in
 * elbow height is taken by the elbows first (`shape`): the two forearms turn by
 * one angle, the higher partner's further down and the lower partner's up, so
 * the angle between the forearms, which the clasping fingers need to clear the
 * other's wrist, stays what two equal partners have, and the upper arms stay
 * where they were, because a raised upper arm is the costly joint of a reach
 * and an elbow anywhere from 60 to 100 degrees is not (McAtamney and Corlett
 * 1993, RULA: a survey method for the investigation of work-related upper limb
 * disorders, Applied Ergonomics 24(2):91). A higher arm the turn would
 * straighten lowers its upper arm toward hanging instead, the cheapest
 * upper-arm posture of the same survey, by the least angle that keeps its elbow
 * `EXTENDED` flexed at the bottom of the pump. The rule for unequal partners is
 * provisional, as no measurement of their clasp point was located.
 */
export namespace handshakeOffer {
  /*
   * Elbow flexion of the offering arm, degrees; provisional. With
   * SHOULDER it slopes the forearm 15 degrees below level.
   */
  export const ELBOW: number = 45;

  /*
   * Shoulder flexion of the offering arm, degrees; provisional.
   */
  export const SHOULDER: number = 30;

  /*
   * The least elbow flexion an arm keeps at the bottom of the pump, degrees;
   * provisional. A straight arm has no stroke left, and the deviated wrist
   * holds the palm a few millimetres nearer than the forearm's line does.
   */
  export const EXTENDED: number = 15;

  /*
   * The most both upper arms come back together for partners standing near,
   * degrees: from the offering arm's to hanging; provisional.
   */
  export const RETRACT: number = SHOULDER;

  /*
   * A forearm's length from the elbow to the palm socket with the wrist
   * straight: the socket's place in the hand's rest frame, whose fingers lie
   * along the forearm (the x axis, away from the midline), measured from the
   * elbow one forearm behind the wrist. The socket sits off the forearm's line
   * by the palm's depth, so this is shorter than the forearm plus the socket's
   * distance from the wrist.
   * Parameter body: The body.
   * Parameter side: The arm.
   * Returns: Metres.
   */
  export function forearm(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): number {
    const socket: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "palm",
    ).point;
    return Vector3.length({
      ...socket,
      x: socket.x + (side === "left" ? 1 : -1) * body.measure.forearm,
    });
  }

  /*
   * How far a palm lies from its shoulder with the elbow flexed
   * EXTENDED, the farthest the pump may take it.
   * Parameter upper: The upper arm, metres.
   * Parameter lower: The forearm to the palm, metres.
   * Returns: Metres.
   */
  export function reach(upper: number, lower: number): number {
    return Math.sqrt(
      upper * upper +
        lower * lower +
        2 * upper * lower * Math.cos((EXTENDED * Math.PI) / 180),
    );
  }

  /*
   * The shape two offering arms take over a difference in elbow height, in the
   * vertical plane through the two shoulders.
   *
   * Both forearms turn by the same angle, the higher one down and the lower one
   * up, so the palms meet. When that turn would take the higher palm, at the
   * bottom of the pump, beyond reach, the higher upper arm lowers toward
   * hanging by the least angle that keeps it within, which lowers the elbow and
   * so shortens the turn too.
   * Parameter upper: The upper arm above the higher elbow, metres.
   * Parameter higher: The forearm (to the palm) below the higher elbow, metres.
   * Parameter lower: The other forearm, metres.
   * Parameter drop: How far the higher elbow stands above the lower with both upper
   * arms offering, metres; not negative.
   * Parameter pump: The pump's amplitude, metres.
   * Returns: The shape.
   */
  export function shape(
    upper: number,
    higher: number,
    lower: number,
    drop: number,
    pump: number,
  ): IShape {
    const radians = (degrees: number): number => (degrees * Math.PI) / 180;
    const slope: number = radians(90 - SHOULDER - ELBOW);
    const offered: number = radians(SHOULDER);
    const limit: number = reach(upper, higher);

    // The shared turn with the higher upper arm lowered by `lowered`.
    const turn = (lowered: number): number => {
      const left: number =
        drop - upper * (Math.cos(offered - lowered) - Math.cos(offered));
      const excess = (turned: number): number =>
        higher * Math.sin(slope + turned) -
        lower * Math.sin(slope - turned) -
        left;
      if (excess(0) >= 0) return 0;
      const steepest: number = Math.PI / 2 - slope;
      return AutoMovieEngineMath.bracketedBisection(
        (turned: number): boolean => excess(turned) < 0,
        0,
        steepest,
        steepest / 2 ** 50,
      );
    };
    // Whether the higher palm stays within reach at the bottom of the pump.
    const fits = (lowered: number): boolean => {
      const turned: number = turn(lowered);
      return (
        Math.hypot(
          upper * Math.sin(offered - lowered) +
            higher * Math.cos(slope + turned),
          upper * Math.cos(offered - lowered) +
            higher * Math.sin(slope + turned) +
            pump,
        ) <= limit
      );
    };
    const lowered: number = fits(0)
      ? 0
      : !fits(offered)
        ? offered
        : AutoMovieEngineMath.bracketedBisection(
            (angle: number): boolean => !fits(angle),
            0,
            offered,
            offered / 2 ** 50,
          );
    return {
      lowered: (lowered * 180) / Math.PI,
      turn: (turn(lowered) * 180) / Math.PI,
    };
  }
  /*
   * Where two shaking hands meet: the point both forearms reach from the elbows
   * of the two offering arms.
   *
   * Each upper arm is held `SHOULDER` forward of hanging, toward the partner in
   * the vertical plane through the two acting shoulders, and the point is the
   * lower of the two that lie one forearm (to the palm) from each elbow
   * (`resolveAutoMovieMutualGoal` on the elbows). Partners of one size meet
   * with both arms in the offering shape; a difference in elbow height turns
   * the two forearms and leaves the upper arms where they were, until the
   * pump's lowest point would lie beyond reach of the partner with the
   * higher elbow, whose upper arm then lowers toward hanging by the least angle
   * that keeps the point within (by bisection, as `shape` does in the plane).
   * The hands point along the line that halves the angle between the two
   * forearms, so each wrist deviates as much as the other.
   *
   * Elbows farther apart than the two forearms bring both upper arms forward by
   * one common angle, the least at which the forearms meet in line (by
   * bisection, the elbows' distance falling as the arms swing toward each
   * other). Elbows so near that the forearms meet steeper than the offering
   * slope would straighten an arm past EXTENDED at the bottom of the
   * pump: both upper arms then come back together, toward hanging and no
   * farther, by the least common angle (at most RETRACT) at which both
   * pump bottoms lie within reach, so the elbows bend more instead. Partners
   * whose chests would touch, or so near that the elbows pass each other or the
   * hands meet beyond a shoulder, have no meeting.
   *
   * Partners the rules cannot bring together are refused on `partner` with the
   * bound that failed and its measured value (the elbows' distance against the
   * two forearms, or the pump's lowest point against the reach of the partner
   * who overreaches it most), and with the band of shoulder gaps at which this
   * pair does shake hands as the feasible range.
   * Parameter a: One partner's body and acting shoulder joint in world metres.
   * Parameter b: The other's.
   * Parameter side: The shaking hand of both.
   * Parameter pump: How far the hands travel below the point after meeting, metres.
   * Returns: The meeting; the point is the same for either order.
   * When the partners stand too near or too far for
   * their arms to meet, naming the bound that failed and the gaps that would
   * plan.
   */
  export function point(
    a: ISide,
    b: ISide,
    side: AutoMovieHumanSide,
    pump: number,
  ): IMeeting {
    const tried: handshakeReach.IAttempt = handshakeOfferAttempt(
      a,
      b,
      side,
      pump,
    );
    if (tried.kind === "met") return tried.meeting;
    throw handshakeReach.refusal(
      a,
      b,
      side,
      pump,
      tried.miss,
      handshakeOfferAttempt,
    );
  }

  /*
   * One partner of a meeting.
   */
  export interface ISide {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The acting shoulder joint, world metres.
     */
    shoulder: IAutoMovieVector3;
  }

  /*
   * Where and along what line two hands meet.
   */
  export interface IMeeting {
    /*
     * The meeting point of the two palm sockets, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * Where the first partner's fingers point before either hand turns in its
     * palm's plane, world unit vector; the second partner's point the opposite
     * way.
     */
    fingers: IAutoMovieVector3;
  }

  /*
   * The shape of two offering arms over a difference in elbow height.
   */
  export interface IShape {
    /*
     * How far the higher partner's upper arm lowers toward hanging, degrees.
     */
    lowered: number;

    /*
     * How far the higher forearm turns down and the lower forearm turns up from
     * the offering slope, degrees.
     */
    turn: number;
  }
}
