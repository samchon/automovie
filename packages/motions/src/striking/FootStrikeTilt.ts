import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  abductionRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import type { CloseStrikeLegs } from "./CloseStrikeLegs";
import { FootStrikeForms } from "./FootStrikeForms";
import { KickForm } from "./KickForm";

/**
 * How far a foot strike tilts the body away from its leg so the hip can lift
 * the leg to the contact.
 *
 * The hip's reach at an azimuth about the pelvis is read as the ellipse of
 * its range table (`DEFAULT_HUMANOID_ROM`): flexion `F` forward, abduction
 * `A` to the side, `1 / r² = cos²ψ / F² + sin²ψ / A²`. The abduction ceiling
 * is the one the flexion the leg asks admits (`abductionRange`: 45° straight
 * to 60° flexed 90°, AAOS 1965). A leg at elevation `ε` from straight down
 * past the comfortable share of that reach, `KickForm.RANGE_SHARE · r(ψ)`,
 * tilts the whole body away from it about the support hip by the excess, at
 * most `KickForm.LEAN_MOST`, so the leg ends inside the range rather than on
 * its edge; a kicker's pelvis tilts 6° to 17° at
 * its peak from a body-level to a face-level roundhouse kick (Kim, Kim, Lee,
 * Han and Kwon 2010), and the trunk leans past it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ellipse, its limits' source, the excess and its bound.
 * @evidence contracts/development/design.md#principled-representation The range table's limits and the leg's elevation and azimuth, degrees, give one tilt record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader of a tilt or none.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limits are the engine's range table and the kick's lean bound.
 */
export namespace FootStrikeTilt {
  /**
   * Read the tilt a leg from a hip to an ankle needs.
   *
   * @param side The kicking side.
   * @param yaw The pelvis's heading at the contact, degrees.
   * @param hip The kicking hip at the contact, world metres.
   * @param ankle The ankle's contact place, world metres.
   * @returns The tilt about a world axis through the support hip, or none when the hip's range reaches the leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their frames and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The leg's elevation against the comfortable share of the range ellipse's reach at its azimuth, in closed form; the tilt turns the trunk away from the leg about the horizontal axis across it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Leg angles, limits, reach, then the tilt.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg within the range is left untilted; the tilt never passes the kick's lean bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The range table, its flexed abduction, the heading frame and the kick's lean bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    side: AutoMovieHumanSide,
    yaw: number,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
  ): CloseStrikeLegs.ITilt | undefined {
    const constraint: IAutoMovieJointConstraint | undefined =
      DEFAULT_HUMANOID_ROM[`${side}UpperLeg`];
    if (
      constraint === undefined ||
      constraint.flexion === null ||
      constraint.abduction === null
    )
      throw new Error(
        `The range-of-motion table gives ${side}UpperLeg no flexion or abduction`,
      );
    const leg: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankle, hip),
    );
    const flat: IAutoMovieVector3 = { x: leg.x, y: 0, z: leg.z };
    if (Vector3.length(flat) < 1e-9) return undefined;
    const across: IAutoMovieVector3 = Vector3.normalize(flat);
    const elevation: number =
      (Math.acos(Math.max(-1, Math.min(1, -leg.y))) * 180) / Math.PI;

    // The leg's azimuth about the pelvis's heading, positive outward.
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const left: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(FootStrikeForms.UP, forward),
    );
    const outward: IAutoMovieVector3 = Vector3.scale(
      left,
      side === "left" ? 1 : -1,
    );
    const azimuth: number = Math.atan2(
      Vector3.dot(across, outward),
      Vector3.dot(across, forward),
    );

    // The range ellipse's reach at that azimuth, its abduction ceiling the
    // one the leg's flexion admits.
    const F: number = constraint.flexion.max;
    const flexed: IAutoMovieAngleRange | null = abductionRange(
      constraint,
      Math.max(0, elevation * Math.cos(azimuth)),
    );
    const A: number =
      azimuth >= 0 ? flexed!.max : -constraint.abduction.min;
    const reach: number =
      1 /
      Math.sqrt(
        Math.cos(azimuth) ** 2 / (F * F) + Math.sin(azimuth) ** 2 / (A * A),
      );
    // The leg is brought inside the range by the share a kick treats as its
    // comfortable range (`KickForm.RANGE_SHARE`), not onto its edge, where
    // the fit pins the hip and the knee cannot open into the contact.
    const excess: number = elevation - KickForm.RANGE_SHARE * reach;
    if (!(excess > 0)) return undefined;

    // A positive turn about the horizontal axis across the leg carries the
    // body's up away from the leg.
    return {
      axis: Vector3.normalize(Vector3.cross(across, FootStrikeForms.UP)),
      degrees: Math.min(KickForm.LEAN_MOST, excess),
    };
  }

  /**
   * The knee's hint for a leg from a hip to an ankle, its turn about the leg
   * kept inside the hip's twist range.
   *
   * The thigh carried from straight down to the leg by the shortest swing
   * carries the pelvis's forward to the knee's untwisted direction; the
   * asked hint's direction about the leg is its twist from that. A twist
   * past the comfortable share of the hip's twist range
   * (`KickForm.RANGE_SHARE`) is turned back to it, the hint kept at its
   * distance from the leg's middle.
   *
   * @param side The kicking side.
   * @param pelvis The pelvis's world rotation at the contact.
   * @param hip The kicking hip, world metres.
   * @param ankle The ankle's contact place, world metres.
   * @param asked The law's knee hint, world metres.
   * @returns The hint, the asked one when its twist is within the range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the untwisted direction, the twist and the clamp.
   * @evidence contracts/development/implementation.md#principled-implementation The swing-twist reading of the knee's direction about the leg, clamped in closed form to the range table's twist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Leg, untwisted direction, twist, clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hint within the range is returned unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The range table and the kick's range share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function knee(
    side: AutoMovieHumanSide,
    pelvis: IAutoMovieQuaternion,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    asked: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const twist: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[`${side}UpperLeg`]?.twist;
    if (twist === null || twist === undefined) return asked;
    const leg: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(ankle, hip),
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(hip, ankle, 0.5);
    const across = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(leg, Vector3.dot(v, leg)));
    const offset: IAutoMovieVector3 = across(Vector3.subtract(asked, middle));
    if (Vector3.length(offset) < 1e-9) return asked;
    const down: IAutoMovieVector3 = Quaternion.rotateVector(pelvis, {
      x: 0,
      y: -1,
      z: 0,
    });
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(pelvis, {
      x: 0,
      y: 0,
      z: 1,
    });
    const axis: IAutoMovieVector3 = Vector3.cross(down, leg);
    const swing: IAutoMovieQuaternion =
      Vector3.length(axis) < 1e-9
        ? Quaternion.identity()
        : Quaternion.fromAxisAngle(
            axis,
            (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(down, leg)))) *
              180) /
              Math.PI,
          );
    const rest: IAutoMovieVector3 = across(
      Quaternion.rotateVector(swing, forward),
    );
    if (Vector3.length(rest) < 1e-9) return asked;
    const from: IAutoMovieVector3 = Vector3.normalize(rest);
    const to: IAutoMovieVector3 = Vector3.normalize(offset);
    const turned: number =
      (Math.atan2(
        Vector3.dot(Vector3.cross(from, to), leg),
        Vector3.dot(from, to),
      ) *
        180) /
      Math.PI;
    const limit: number =
      KickForm.RANGE_SHARE * Math.min(Math.abs(twist.min), Math.abs(twist.max));
    if (Math.abs(turned) <= limit) return asked;
    return Vector3.add(
      middle,
      Vector3.scale(
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(leg, Math.sign(turned) * limit),
          from,
        ),
        Vector3.length(offset),
      ),
    );
  }
}
