import type { IHumanBody } from "../body/IHumanBody";
import { KickForm } from "./KickForm";

/**
 * The girths of a striking limb's capsules: the radii a shown leg's and a
 * shown arm's tapered capsules carry at their joints, and a capsule's radius
 * at a share of its axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three readings and their unit.
 * @evidence contracts/development/design.md#principled-representation A capsule's girth is one radius or the two at its axis ends, as the plan's weapons carry it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The leg's and the arm's radii and the interpolated girth, read through `StrikingWeapon`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every radius is the body's own measure; none is an actor's constant.
 */
export namespace StrikingWeaponGirth {
  /**
   * A shown leg's girths at its joints, metres, as its tapered capsules'
   * radii: the thigh narrows from its own radius at the hip to the shank's
   * at the knee, where the shown thigh meets the shank, and the shank from
   * there to the foot capsule's radius at the ankle (half the foot's depth,
   * `KickForm.FOOT_RADIUS_SHARE`), which the foot keeps to the ball.
   *
   * @param body The leg's body.
   * @returns The thigh's, the shank's and the foot's radii.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States joint order, tapered interfaces and metre units.
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent segment girths share the measured knee/ankle radii; the foot uses the existing FOOT_RADIUS_SHARE of ankle height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measure read builds the three declared capsule radii.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the named anatomical measurements and foot-radius share.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and three output radius records.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar construction with no repeated expensive work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function legRadii(
    body: IHumanBody,
  ): [readonly [number, number], readonly [number, number], number] {
    const m: IHumanBody["measure"] = body.measure;
    const foot: number = KickForm.FOOT_RADIUS_SHARE * m.ankleHeight;
    return [[m.thighRadius, m.shankRadius], [m.shankRadius, foot], foot];
  }

  /**
   * A shown arm's girths at its joints, metres, as its capsules' radii: the
   * upper arm narrows from its own radius at the shoulder to the forearm's
   * at the elbow, where the shown upper arm meets the forearm; the forearm
   * and the fist keep the forearm's radius, which places the fist's axis end
   * one radius behind the knuckles (`StrikingWeapon.posed`).
   *
   * @param body The arm's body.
   * @returns The upper arm's, the forearm's and the fist's radii.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States capsule order, metre units and the shared elbow/fist girth.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the body's measured upper-arm and forearm radii at their existing shared segment interfaces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One measure lookup builds three radius entries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual body's girths without an actor-specific constant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and output space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar construction.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function armRadii(
    body: IHumanBody,
  ): [readonly [number, number], number, number] {
    const m: IHumanBody["measure"] = body.measure;
    return [
      [m.upperArmRadius, m.forearmRadius],
      m.forearmRadius,
      m.forearmRadius,
    ];
  }

  /**
   * A chain capsule's radius at a share of its axis from its first end.
   *
   * @param radii The capsule's radius or its two end radii.
   * @param share 0 at the first end, 1 at the other.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint shares, constant/tapered forms and metre units.
   * @evidence contracts/development/implementation.md#principled-implementation A tapered capsule linearly interpolates its two declared end radii.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar-or-pair branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the caller's exact share and declared radii.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure scalar arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function girth(
    radii: number | readonly [number, number],
    share: number,
  ): number {
    return typeof radii === "number"
      ? radii
      : radii[0] + (radii[1] - radii[0]) * share;
  }
}
