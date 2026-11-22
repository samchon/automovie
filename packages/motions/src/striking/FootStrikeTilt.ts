import { DEFAULT_HUMANOID_ROM, Vector3, abductionRange } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
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
 * past `r(ψ)` tilts the whole body away from it about the support hip by the
 * excess, at most `KickForm.LEAN_MOST`; a kicker's pelvis tilts 6° to 17° at
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
   * @evidence contracts/development/implementation.md#principled-implementation The leg's elevation against the range ellipse's reach at its azimuth, in closed form; the tilt turns the trunk away from the leg about the horizontal axis across it.
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
    const excess: number = elevation - reach;
    if (!(excess > 0)) return undefined;

    // A positive turn about the horizontal axis across the leg carries the
    // body's up away from the leg.
    return {
      axis: Vector3.normalize(Vector3.cross(across, FootStrikeForms.UP)),
      degrees: Math.min(KickForm.LEAN_MOST, excess),
    };
  }
}
