import {
  Vector3,
  bracketedBisection,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { AutoMovieMotionHumanLeg } from "./AutoMovieMotionHumanLeg";

/** The resolution a rise's shift is timed to, seconds: a millisecond, far below a film frame. */
const POISE_RESOLUTION: number = 1e-3;

/**
 * A rise onto the toes: both feet turn about their toes' joints, which stay
 * where they stand with the toes flat, so each heel and ankle rises and the
 * body with them. A law that needs height it cannot lean for (a kiss on a
 * forehead, a reach for a shelf) raises its root by `lift` and adds `legs`.
 *
 * The heel's angle is the foot's pitch about the joint, degrees; the ankle
 * rises by the joint-to-ankle lever's turn, about 7 cm at 35 degrees on an
 * average foot (74 mm measured on the average polygon man, whose ankle
 * stands 129 mm behind the toes' joint).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, what stays on the floor, who uses it and the angle's meaning with a magnitude.
 * @evidence contracts/development/design.md#principled-representation A foot placement pivoted about a sole point, the representation the lunge's trailing foot uses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance type, the raised foot, the root's lift and the legs' primitives; read by the kiss.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No height is stated: it follows from the foot's own lever.
 */
export namespace AutoMovieMotionHumanRise {
  /**
   * A foot with its heel raised about its toes' joint.
   *
   * @param body The body.
   * @param side The foot.
   * @param flat The foot as it stands flat.
   * @param degrees The heel's raise, degrees.
   * @returns The raised foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the pivot.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid turn of the foot about the metatarsophalangeal joint held at its flat place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pivot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The joint's place is read off the flat foot, not assumed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFoot.pivot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function foot(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    flat: IAutoMovieMotionHumanFoot.IPlacement,
    degrees: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return HumanFoot.pivot(
      body,
      side,
      "mtp",
      HumanFoot.point(body, side, "mtp", flat),
      HumanFoot.heading(flat.rotation),
      -degrees,
    );
  }

  /**
   * The least seconds a move of the whole-body centre of mass between two
   * postures takes so the body stays balanced through it: the sway over the
   * balls of the feet before the heels rise, the anticipatory shift of
   * rising onto the toes (Nardone and Schieppati 1988, Exp Brain Res 69;
   * read through secondary summaries), and the heels' rise itself, which
   * carries the body on over the toes.
   *
   * The centre moves from one posture's to the other's by a minimum-jerk
   * course (Flash and Hogan 1985), the clock's own envelope. The shortest
   * such course keeps the extrapolated centre of mass, the centre plus its
   * velocity over the inverted pendulum's eigenfrequency (Hof, Gazendam and
   * Sinke 2005, `l` 1.34 hip heights, the balance audit's condition), inside
   * the base the move ends on, and with `back` also inside the base the
   * reverse move starts on.
   *
   * @param body The body.
   * @param start The posture the move starts from, its feet planted.
   * @param end The posture the move ends on, its feet planted.
   * @param back Whether the reverse move is timed by the same seconds: its lead is then kept within `start`'s base, behind `start`'s centre.
   * @returns The move's duration, seconds; 0 when the centre does not move.
   * @throws {HumanRefusal} When the ending centre lies outside its base, where no course can end balanced.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, its course, the condition its duration meets and both directions.
   * @evidence contracts/development/implementation.md#principled-implementation For a minimum-jerk course of length d over T the extrapolated centre's lead is d (s(u) + s'(u) / (w T)); its maximum over u is at the closed-form root of s' + s'' / (w T) = 0, and it falls toward d with T, so the least T whose lead stays within the base's room ahead of the start is bisected.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two support readings, one closed-form lead and one bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A centre that ends outside its base has no course that ends balanced, and is refused rather than timed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two posture solves, then constant work per bisection step, about twenty steps to a millisecond.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanBalance.support` and `along`, the engine's pendulum, `minimumJerk` and `bracketedBisection`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function poise(
    body: IAutoMovieMotionHumanBody,
    start: IAutoMovieMotionHumanPosture,
    end: IAutoMovieMotionHumanPosture,
    back: boolean,
  ): number {
    const from: IAutoMovieMotionHumanBalance.ISupportResult = HumanBalance.support(body, start);
    const to: IAutoMovieMotionHumanBalance.ISupportResult = HumanBalance.support(body, end);
    const way: IAutoMovieVector3 = {
      x: to.centre.x - from.centre.x,
      y: 0,
      z: to.centre.z - from.centre.z,
    };
    const length: number = Math.hypot(way.x, way.z);
    if (!(length > 0)) return 0;
    // The room the lead has: from the start to the edge ahead of the end,
    // and, back, from the end to the edge behind the start.
    const ahead: number = length + HumanBalance.along(to.centre, to.points, way);
    const behind: number = back
      ? length + HumanBalance.along(from.centre, from.points, Vector3.scale(way, -1))
      : Infinity;
    const room: number = Math.min(ahead, behind);
    if (!(room > length))
      throw new HumanRefusal({
        kind: "reach",
        axis: "stance",
        value: length,
        feasible: null,
        reason: `the rise asks the centre of mass ${(length * 1000).toFixed(0)} mm forward, and the feet's base leaves it ${(room * 1000).toFixed(0)} mm`,
        fix: "come nearer first, or aim at a region within the arm's reach",
      });
    const omega: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
    // The extrapolated centre's greatest lead over a course of T seconds.
    const lead = (seconds: number): number => {
      const a: number = omega * seconds;
      const u: number = (a - 4 + Math.sqrt((a - 4) * (a - 4) + 8 * a)) / (2 * a);
      const profile = minimumJerk(Math.min(1, Math.max(0, u)));
      return length * (profile.s + profile.ds / a);
    };
    let long: number = 1 / omega;
    while (!(lead(long) <= room)) long *= 2;
    return bracketedBisection(
      (seconds: number): boolean => lead(seconds) > room,
      0,
      long,
      POISE_RESOLUTION,
    );
  }

  /**
   * How far the root moves with the ankles of a rise: the mean of both
   * ankles' travel.
   *
   * @param body The body.
   * @param stance Both feet as they stand flat.
   * @param degrees The heels' raise, degrees.
   * @returns The travel, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the travel is the mean of and its frame.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis rides the two ankles, so it takes their mean travel and the legs keep their lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two raised feet and one mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both feet are read, so feet of unequal headings are carried.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `foot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lift(
    body: IAutoMovieMotionHumanBody,
    stance: IAutoMovieMotionHumanRise.Stance,
    degrees: number,
  ): IAutoMovieVector3 {
    const travel = (side: "left" | "right"): IAutoMovieVector3 =>
      Vector3.subtract(
        foot(body, side, stance[side], degrees).ankle,
        stance[side].ankle,
      );
    return Vector3.scale(Vector3.add(travel("left"), travel("right")), 0.5);
  }

  /**
   * The legs of a rise: each foot's goal on its raised placement, planted,
   * with the toes bent back flat on the floor.
   *
   * @param props The body, the flat stance, the window in seconds since the action's start and the heels' raise in degrees at a second.
   * @returns One primitive per leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each leg is given and the argument's units.
   * @evidence contracts/development/implementation.md#principled-implementation The foot's rigid pivot with the toes' joint extended by the same angle, which leaves the toes on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One write per leg: the toes' joint and the leg's goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goal is solved on the posture written so far, so a raised or leaned root is followed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `foot` and `AutoMovieMotionHumanLeg.goal`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitives close over their props and retain no current placement, posture, time or FK workspace. Their declared input demand keeps the current root and own leg, including unchanged own-leg joints, while unrelated primitive writers may be omitted.
   */
  export function legs(
    props: IAutoMovieMotionHumanRise.ILegsProps,
  ): IAutoMovieMotionHumanPrimitive[] {
    return (["left", "right"] as const).map(
      (side: "left" | "right"): IAutoMovieMotionHumanPrimitive => ({
        channels: [`${side}Leg`],
        reads: ["root", `${side}Leg`],
        from: props.from,
        to: props.to,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          const degrees: number = props.degrees(seconds);
          return {
            ...posture,
            joints: { ...posture.joints, [`${side}Toes`]: [degrees, 0, 0] },
            limbs: {
              ...posture.limbs,
              [`${side}Leg`]: AutoMovieMotionHumanLeg.goal(
                props.body,
                posture,
                side,
                foot(props.body, side, props.stance[side], degrees),
                true,
              ),
            },
          };
        },
      }),
    );
  }
}
