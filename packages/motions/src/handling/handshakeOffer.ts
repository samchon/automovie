import { Vector3, resolveAutoMovieMutualGoal } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";

/**
 * The arm a person offers for a handshake, and where two such arms meet.
 *
 * The offering arm holds the upper arm `SHOULDER` forward of hanging and the
 * elbow flexed `ELBOW`, which slopes the forearm `90 - SHOULDER - ELBOW`
 * degrees below level to the hand; both angles are provisional, as no
 * measurement of the offering arm was located. Two offering arms meet at the
 * point both forearms reach from their elbows (`point`), and a difference in
 * elbow height is taken by the elbows first (`shape`): the two forearms turn
 * by one angle, the higher partner's further down and the lower partner's up,
 * so the angle between the forearms, which the clasping fingers need to
 * clear the other's wrist, stays what two equal partners have, and the upper
 * arms stay where they were, because a raised upper arm is the costly joint
 * of a reach and an elbow anywhere from 60 to 100 degrees is not (McAtamney
 * and Corlett 1993, RULA: a survey method for the investigation of
 * work-related upper limb disorders, Applied Ergonomics 24(2):91). A higher
 * arm the turn would straighten lowers its upper arm toward hanging instead,
 * the cheapest upper-arm posture of the same survey, by the least angle that
 * keeps its elbow `EXTENDED` flexed at the bottom of the pump. The rule for
 * unequal partners is provisional, as no measurement of their clasp point was
 * located.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the offering shape, the meeting rule with its source, what is provisional, and each function's units and refusal.
 * @evidence contracts/development/design.md#principled-representation Three named angles, a forearm length, a shared turn, a lowered upper arm and a world point; no pair or body is special-cased.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the handshake's plan and its standing gap read, owned in one place.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's two-sphere mutual goal applied at the elbows, so the accommodation falls on the joints RULA scores lightest.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow placement, one criterion for a straightened arm shared by the plane rule and the world rule, one call of the shared rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Partners beyond reach are refused with the gap they can close; nothing is clamped onto an arm.
 * @evidence contracts/development/implementation.md#efficient-algorithms Closed form but for fixed-length bisections.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveAutoMovieMutualGoal` and the hand's palm socket.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure functions that retain nothing.
 */
export namespace handshakeOffer {
  /**
   * Elbow flexion of the offering arm, degrees; provisional. With
   * {@link SHOULDER} it slopes the forearm 15 degrees below level.
   */
  export const ELBOW: number = 45;

  /** Shoulder flexion of the offering arm, degrees; provisional. */
  export const SHOULDER: number = 30;

  /**
   * The least elbow flexion an arm keeps at the bottom of the pump, degrees;
   * provisional. A straight arm has no stroke left, and the deviated wrist
   * holds the palm a few millimetres nearer than the forearm's line does.
   */
  export const EXTENDED: number = 15;

  /**
   * A forearm's length from the elbow to the palm socket with the wrist
   * straight: the socket's place in the hand's rest frame, whose fingers lie
   * along the forearm (the x axis, away from the midline), measured from the
   * elbow one forearm behind the wrist. The socket sits off the forearm's
   * line by the palm's depth, so this is shorter than the forearm plus the
   * socket's distance from the wrist.
   *
   * @param body The body.
   * @param side The arm.
   * @returns Metres.
   */
  export function forearm(body: IHumanBody, side: HumanHand.Side): number {
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

  /**
   * How far a palm lies from its shoulder with the elbow flexed
   * {@link EXTENDED}, the farthest the pump may take it.
   *
   * @param upper The upper arm, metres.
   * @param lower The forearm to the palm, metres.
   * @returns Metres.
   */
  export function reach(upper: number, lower: number): number {
    return Math.sqrt(
      upper * upper +
        lower * lower +
        2 * upper * lower * Math.cos((EXTENDED * Math.PI) / 180),
    );
  }

  /**
   * The shape two offering arms take over a difference in elbow height, in
   * the vertical plane through the two shoulders.
   *
   * Both forearms turn by the same angle, the higher one down and the lower
   * one up, so the palms meet. When that turn would take the higher palm, at
   * the bottom of the pump, beyond {@link reach}, the higher upper arm lowers
   * toward hanging by the least angle that keeps it within, which lowers the
   * elbow and so shortens the turn too.
   *
   * @param upper The upper arm above the higher elbow, metres.
   * @param higher The forearm (to the palm) below the higher elbow, metres.
   * @param lower The other forearm, metres.
   * @param drop How far the higher elbow stands above the lower with both upper arms offering, metres; not negative.
   * @param pump The pump's amplitude, metres.
   * @returns The shape.
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
      let low: number = 0;
      let high: number = Math.PI / 2 - slope;
      for (let i: number = 0; i < 50; i++) {
        const middle: number = (low + high) / 2;
        if (excess(middle) < 0) low = middle;
        else high = middle;
      }
      return high;
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
    let lowered: number = 0;
    if (!fits(0)) {
      lowered = offered;
      if (fits(offered)) {
        let low: number = 0;
        for (let i: number = 0; i < 50; i++) {
          const middle: number = (low + lowered) / 2;
          if (fits(middle)) lowered = middle;
          else low = middle;
        }
      }
    }
    return {
      lowered: (lowered * 180) / Math.PI,
      turn: (turn(lowered) * 180) / Math.PI,
    };
  }

  /**
   * Where two shaking hands meet: the point both forearms reach from the
   * elbows of the two offering arms.
   *
   * Each upper arm is held `SHOULDER` forward of hanging, toward the partner
   * in the vertical plane through the two acting shoulders, and the point is
   * the lower of the two that lie one forearm (to the palm) from each elbow
   * (`resolveAutoMovieMutualGoal` on the elbows). Partners of one size meet
   * with both arms in the offering shape; a difference in elbow height turns
   * the two forearms and leaves the upper arms where they were, until the
   * pump's lowest point would lie beyond {@link reach} of the partner with
   * the higher elbow, whose upper arm then lowers toward hanging by the
   * least angle that keeps the point within (by bisection, as `shape` does
   * in the plane). The hands point along the line that halves the angle
   * between the two forearms, so each wrist deviates as much as the other.
   *
   * Elbows farther apart than the two forearms bring both upper arms forward
   * by one common angle, the least at which the forearms meet in line (by
   * bisection, the elbows' distance falling as the arms swing toward each
   * other); partners beyond two level upper arms and two forearms in line,
   * or with the pump's lowest point beyond the reach of either, are refused
   * with the widest shoulder gap the pair can close.
   *
   * @param a One partner's body and acting shoulder joint in world metres.
   * @param b The other's.
   * @param side The shaking hand of both.
   * @param pump How far the hands travel below the point after meeting, metres.
   * @returns The meeting; the point is the same for either order.
   * @throws {Error} When the partners stand beyond reach of each other.
   */
  export function point(
    a: ISide,
    b: ISide,
    side: HumanHand.Side,
    pump: number,
  ): IMeeting {
    const span: IAutoMovieVector3 = Vector3.subtract(b.shoulder, a.shoulder);
    const gap: number = Math.hypot(span.x, span.z);
    if (!(gap > 1e-9))
      throw new Error("A handshake needs two shoulders at different places");
    const lower: [number, number] = [
      forearm(a.body, side),
      forearm(b.body, side),
    ];
    const elbow = (
      one: ISide,
      ahead: number,
      degrees: number,
    ): IAutoMovieVector3 => {
      const flexion: number = (degrees * Math.PI) / 180;
      const forward: number =
        (ahead * one.body.measure.upperArm * Math.sin(flexion)) / gap;
      return {
        x: one.shoulder.x + forward * span.x,
        y: one.shoulder.y - one.body.measure.upperArm * Math.cos(flexion),
        z: one.shoulder.z + forward * span.z,
      };
    };
    const forearms: number = lower[0] + lower[1];
    const apart = (elbows: [IAutoMovieVector3, IAutoMovieVector3]): number =>
      Vector3.length(Vector3.subtract(elbows[1], elbows[0]));
    const refuse = (): Error =>
      new Error(
        `The hands cannot meet: the shoulders stand ${gap.toFixed(3)} m apart; bring them within about ${(
          a.body.measure.upperArm +
          b.body.measure.upperArm +
          Math.sqrt(Math.max(0, forearms * forearms - span.y * span.y))
        ).toFixed(3)} m of each other`,
      );
    const meet = (
      elbows: [IAutoMovieVector3, IAutoMovieVector3],
    ): IAutoMovieVector3 =>
      resolveAutoMovieMutualGoal({
        a: {
          shoulder: elbows[0],
          reach: lower[0],
          limit: lower[0] * (1 + 1e-9),
        },
        b: {
          shoulder: elbows[1],
          reach: lower[1],
          limit: lower[1] * (1 + 1e-9),
        },
      }).point;
    // Whether the pump's lowest point lies within one partner's reach.
    const within = (met: IAutoMovieVector3, i: number): boolean =>
      Vector3.length(
        Vector3.subtract(
          { ...met, y: met.y - pump },
          i === 0 ? a.shoulder : b.shoulder,
        ),
      ) <= reach((i === 0 ? a : b).body.measure.upperArm, lower[i]!);

    const offered: [IAutoMovieVector3, IAutoMovieVector3] = [
      elbow(a, 1, SHOULDER),
      elbow(b, -1, SHOULDER),
    ];
    let elbows: [IAutoMovieVector3, IAutoMovieVector3] = offered;
    if (apart(offered) > forearms) {
      // Too far for the offering arms: both upper arms come forward.
      const raised = (
        degrees: number,
      ): [IAutoMovieVector3, IAutoMovieVector3] => [
        elbow(a, 1, degrees),
        elbow(b, -1, degrees),
      ];
      if (apart(raised(90)) > forearms) throw refuse();
      let low: number = SHOULDER;
      let high: number = 90;
      for (let i: number = 0; i < 40; i++) {
        const middle: number = (low + high) / 2;
        if (apart(raised(middle)) > forearms) low = middle;
        else high = middle;
      }
      elbows = raised(high);
    } else {
      // The higher elbow's upper arm lowers while its palm would overreach.
      const top: number = offered[0].y >= offered[1].y ? 0 : 1;
      const lowered = (
        degrees: number,
      ): [IAutoMovieVector3, IAutoMovieVector3] =>
        top === 0
          ? [elbow(a, 1, SHOULDER - degrees), offered[1]]
          : [offered[0], elbow(b, -1, SHOULDER - degrees)];
      const short = (degrees: number): boolean => {
        const tried: [IAutoMovieVector3, IAutoMovieVector3] = lowered(degrees);
        return apart(tried) <= forearms && !within(meet(tried), top);
      };
      if (short(0)) {
        let low: number = 0;
        let high: number = SHOULDER;
        if (short(high)) throw refuse();
        for (let i: number = 0; i < 40; i++) {
          const middle: number = (low + high) / 2;
          if (short(middle)) low = middle;
          else high = middle;
        }
        elbows = lowered(high);
        if (apart(elbows) > forearms) throw refuse();
      }
    }
    const met: IAutoMovieVector3 = meet(elbows);
    if (!within(met, 0) || !within(met, 1)) throw refuse();

    // The hands lie along the bisector of the two forearms: level between
    // equal partners, tilted down from the higher elbow's side otherwise.
    const slopes: [number, number] = [
      Math.asin(Math.max(-1, Math.min(1, (elbows[0].y - met.y) / lower[0]))),
      Math.asin(Math.max(-1, Math.min(1, (elbows[1].y - met.y) / lower[1]))),
    ];
    const tilt: number = (slopes[0] - slopes[1]) / 2;
    return {
      point: met,
      fingers: {
        x: (Math.cos(tilt) * span.x) / gap,
        y: -Math.sin(tilt),
        z: (Math.cos(tilt) * span.z) / gap,
      },
    };
  }

  /** One partner of a meeting. */
  export interface ISide {
    /** The body. */
    body: IHumanBody;

    /** The acting shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;
  }

  /** Where and along what line two hands meet. */
  export interface IMeeting {
    /** The meeting point of the two palm sockets, world metres. */
    point: IAutoMovieVector3;

    /**
     * Where the first partner's fingers point before either hand turns in
     * its palm's plane, world unit vector; the second partner's point the
     * opposite way.
     */
    fingers: IAutoMovieVector3;
  }

  /** The shape of two offering arms over a difference in elbow height. */
  export interface IShape {
    /** How far the higher partner's upper arm lowers toward hanging, degrees. */
    lowered: number;

    /**
     * How far the higher forearm turns down and the lower forearm turns up
     * from the offering slope, degrees.
     */
    turn: number;
  }
}
