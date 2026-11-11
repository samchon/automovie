import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Bend hints: the world point an elbow or a knee bends toward, from a named
 * preset on a posture.
 *
 * A limb goal places the wrist or the ankle and leaves one freedom, the turn
 * of the middle joint about the line from the limb's root to its end. The
 * hint fixes it. An elbow's hint is a point beside the shoulder, stated in
 * upper-arm lengths outward, upward and forward of the shoulder's rest place
 * and carried by the posture's root rotation, so it follows a turned and a
 * leaned trunk. A knee's hint is a point one metre ahead of the knee's rest
 * place along the foot's heading, so the knee bends over the foot (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 *
 * A law takes a preset and passes its own point only where its action bends
 * the limb another way, with the reason in a comment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a hint decides, the frame and unit of an elbow's and a knee's hint, and when a law passes its own point.
 * @evidence contracts/development/design.md#principled-representation A hint is the pole vector of two-bone inverse kinematics; an elbow's is stated in upper-arm lengths from the shoulder so one preset fits every body, a knee's follows the foot's heading as the knee does in gait.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One table of presets and three functions; the only owner of default bends, read by every law that builds a limb goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Presets are a closed union keyed into one table; shares are plain numbers of a stated unit, and no law name appears.
 */
export namespace AutoMovieMotionHumanBend {
  /**
   * A side of the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two sides a limb is on.
   * @evidence contracts/development/design.md#principled-representation The body's bilateral symmetry as a closed union, the form the rig's bone names take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Side = "left" | "right";

  /**
   * An elbow hint in upper-arm lengths from the shoulder's rest place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the origin and the unit; each member gives its direction and sign.
   * @evidence contracts/development/design.md#principled-representation Three shares along the trunk's own axes, scaled by the upper arm, so the hint keeps its place on a short and a long arm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the least that places a point; read by `arm` and held by `ARM`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All members required and named by direction, instead of a positional tuple.
   */
  export interface IShares {
    /** Away from the midline. */
    out: number;

    /** Upward; negative is below the shoulder. */
    up: number;

    /** Forward; negative is behind the shoulder. */
    forward: number;
  }

  /**
   * A named elbow hint; `ARM` states each one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the names are and where each is described.
   * @evidence contracts/development/design.md#principled-representation The distinct places an elbow takes about the trunk: hanging, close, behind, in front, across, ahead, wide low and wide high.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight names, each with a first user among the shipped laws; a law that needs another passes shares.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union that keys the table exhaustively; the names describe the elbow, not an action.
   */
  export type Arm =
    | "hang"
    | "tucked"
    | "behind"
    | "front"
    | "folded"
    | "forward"
    | "akimbo"
    | "raised";

  /**
   * The elbow presets (provisional shares, each the value its first user was
   * captured with):
   *
   * - `hang`: down, a little out and behind, as an unloaded arm hangs; the
   *   default of every reach;
   * - `tucked`: down and close to the flank, a hand in a pocket or a fist
   *   drawn back;
   * - `behind`: down and back, the hands met behind the body;
   * - `front`: down and slightly forward, the hands met in front of the body;
   * - `folded`: down and forward, a forearm laid across the body;
   * - `forward`: ahead of the shoulder and down, a hand at the chin or a
   *   guard;
   * - `akimbo`: out wide at waist height, a hand on the hip;
   * - `raised`: out wide above the shoulder, a hand behind the head.
   */
  export const ARM: Readonly<Record<Arm, IShares>> = {
    hang: { out: 0.4, up: -1, forward: -0.5 },
    tucked: { out: 0.35, up: -1, forward: -0.3 },
    behind: { out: 0.35, up: -0.9, forward: -0.4 },
    front: { out: 0.3, up: -0.9, forward: 0.1 },
    folded: { out: 0.3, up: -0.9, forward: 0.3 },
    forward: { out: 0.1, up: -0.8, forward: 0.6 },
    akimbo: { out: 0.9, up: -0.4, forward: -0.1 },
    raised: { out: 0.9, up: 0.5, forward: 0.3 },
  };

  /**
   * An elbow's bend hint.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the trunk; a pitch and a roll left out count as 0.
   * @param side The arm.
   * @param preset A named preset or the shares themselves.
   * @param out Extra outward share of the upper arm, for a wider elbow than the preset's; 0 by default.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame, the default preset, what `out` adds and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder's rest place plus the shares times the upper arm, mirrored by side, turned by the posture's root rotation and moved to its root: a rigid point of the trunk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table lookup and one rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The preset values are named provisional in `ARM`; an absent pitch or roll is 0 by the stated rule, and nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture.heading`, the one owner of a posture's root rotation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arm(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>,
    side: Side,
    preset: Arm | IShares = "hang",
    out: number = 0,
  ): IAutoMovieVector3 {
    const shares: IShares = typeof preset === "string" ? ARM[preset] : preset;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const sign: number = side === "left" ? 1 : -1;
    const length: number = body.measure.upperArm;
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading({
          yaw: posture.yaw,
          pitch: posture.pitch ?? 0,
          roll: posture.roll ?? 0,
        }),
        {
          x: shoulder.x + sign * (shares.out + out) * length,
          y: shoulder.y + shares.up * length,
          z: shoulder.z + shares.forward * length,
        },
      ),
    );
  }

  /**
   * The hint of an unloaded arm: the `hang` preset, widened by a share.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the trunk.
   * @param side The arm.
   * @param out Extra outward share of the upper arm; 0 by default.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which preset it is, what `out` adds and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The `hang` preset of `arm`, the hint every reach takes by default.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `arm`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no value of its own; the shares are `ARM.hang`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `arm`, so the transform exists once.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hang(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>,
    side: Side,
    out: number = 0,
  ): IAutoMovieVector3 {
    return arm(body, posture, side, "hang", out);
  }

  /**
   * A knee's bend hint: one metre ahead of the knee's rest place along a
   * heading.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the knee's rest place.
   * @param side The leg.
   * @param heading Where the foot points, degrees about +Y; the posture's heading when absent.
   * @param splay Degrees the knee opens away from the midline past that heading; 0 by default.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, the default heading, the sign of `splay` and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The knee's rest place carried by the root and the heading, then a unit step along the foot's heading opened outward by the splay: the knee tracks over the foot (Perry and Burnfield).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two nested floor-frame transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The one-metre step only sets a direction and is stated; a positive heading turns left, so the left knee opens by `+splay` and the right by `-splay`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`, the owner of the floor-frame transform.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function knee(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: Side,
    heading: number = posture.yaw,
    splay: number = 0,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: posture.root, yaw: posture.yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading + (side === "left" ? splay : -splay),
      },
      { x: 0, y: 0, z: 1 },
    );
  }
}
