import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { KickForm } from "./KickForm";

/** The alternatives of `GirthRadii`'s site. */
type GirthRadii = number | readonly [number, number];

/**
 * The girths of a striking limb's capsules: the radii a shown leg's and a shown
 * arm's tapered capsules carry at their joints, and a capsule's radius at a
 * share of its axis.
 */
export namespace StrikingWeaponGirth {
  /**
   * A shown leg's girths at its joints, metres, as its tapered capsules' radii:
   * the thigh narrows from its own radius at the hip to the shank's at the
   * knee, where the shown thigh meets the shank, and the shank from there to
   * the foot capsule's radius at the ankle (half the foot's depth,
   * `KickForm.FOOT_RADIUS_SHARE`), which the foot keeps to the ball.
   *
   * @param body The leg's body.
   * @returns The thigh's, the shank's and the foot's radii.
   */
  export function legRadii(
    body: IAutoMovieMotionHumanBody,
  ): [readonly [number, number], readonly [number, number], number] {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const foot: number = KickForm.FOOT_RADIUS_SHARE * m.ankleHeight;
    return [[m.thighRadius, m.shankRadius], [m.shankRadius, foot], foot];
  }

  /**
   * A shown arm's girths at its joints, metres, as its capsules' radii: the
   * upper arm narrows from its own radius at the shoulder to the forearm's at
   * the elbow, where the shown upper arm meets the forearm; the forearm and the
   * fist keep the forearm's radius, which places the fist's axis end one radius
   * behind the knuckles (`StrikingWeapon.posed`).
   *
   * @param body The arm's body.
   * @returns The upper arm's, the forearm's and the fist's radii.
   */
  export function armRadii(
    body: IAutoMovieMotionHumanBody,
  ): [readonly [number, number], number, number] {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
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
   */
  export function girth(radii: GirthRadii, share: number): number {
    return typeof radii === "number"
      ? radii
      : radii[0] + (radii[1] - radii[0]) * share;
  }
}
