import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanJoints } from "./AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRoot } from "./AutoMovieMotionHumanRoot";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Trunk phrases: the trunk turned on the pelvis, the body sunk into its
 * knees, and the hips moved back under a limb held out.
 *
 * The hip shifts are solved by {@link HumanBalance.shift} on the body at the
 * phrase's fullest pose and scaled between by the clock's envelope, so no
 * shift is stated as a constant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three phrases and how the hip shifts are found.
 * @evidence contracts/development/design.md#principled-representation A trunk movement is a twist shared along the spine, or a root and pitch change that keeps the centre of mass over the feet; the balance is solved on the body, so the same phrase holds for every body shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three phrases, one record, the sunk posture the crouch is built on (also read by a law that solves its own inclination) and the chest's share. No law reads them yet: the reactions state their trunk angles as their own curves, and the strikes and the everyday laws rebuilt for #3286 are the consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The crouch takes one record because it has seven inputs; the turn and the counterbalance take positional arguments because each has few and no optional one.
 */
export namespace AutoMovieMotionHumanTrunk {
  /** The chest's share of a trunk turn; the lumbar spine takes the rest. */
  export const CHEST: number = 0.6;

  /**
   * A turn: the trunk twists on the pelvis and comes back (the wind-up and
   * the rotation of a throw or a punch, a turn toward a neighbour).
   *
   * @param clock The action's clock.
   * @param rise The instants the turn starts growing and is full at.
   * @param fall The instants the turn starts shrinking and is gone at.
   * @param degrees The twist at its fullest, degrees; positive toward the performer's left.
   * @returns The primitive, on the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the two windows, the unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation Axial rotation of the trunk is mostly thoracic, the lumbar spine allowing little, so the chest takes the larger stated share and the spine the rest, and the two sum to the asked twist.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call with the two joints' twists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is the named constant `CHEST`, a modelling choice for a rig with two trunk joints; the pelvis is not turned, which is the root's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanJoints.pulse`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per evaluated second.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function turn(
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    degrees: number,
  ): IAutoMovieMotionHumanPrimitive {
    return AutoMovieMotionHumanJoints.pulse(clock, rise, fall, {
      chest: [0, 0, CHEST * degrees],
      spine: [0, 0, (1 - CHEST) * degrees],
    });
  }

  /**
   * A crouch over two windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its meaning, unit and range.
   * @evidence contracts/development/design.md#principled-representation A crouch is how far the hips sink and how far the trunk pitches, between a sinking and a rising window; the knees are not stated because the planted feet decide them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven required members, read only by `crouch`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member and no hip shift: the shift is solved, so a caller cannot state one that unbalances the body.
   */
  export interface ICrouch {
    /** The body. */
    body: IHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IHumanPosture;

    /** The action's clock. */
    clock: AutoMovieMotionClock.IClock;

    /** The instants the body starts sinking and is lowest at. */
    rise: readonly [string, string];

    /** The instants the body starts rising and stands again at. */
    fall: readonly [string, string];

    /** How far the hips sink at the lowest, metres; not negative. */
    depth: number;

    /** The trunk's forward inclination at the lowest, degrees, shared between the pelvis and the spine by `sunk`; not negative. */
    pitch: number;
  }

  /**
   * A posture sunk into its knees: the hips lowered and moved back along the
   * heading, and the trunk inclined forward over them by the lumbopelvic
   * rhythm (`HumanTrunk.incline`), the pelvis taking no more than the planted
   * legs' hip flexion leaves it (`HumanTrunk.pelvisLimit`) and the spine the
   * rest. The legs keep their goals.
   *
   * @param body The body.
   * @param posture The posture, its pelvis level.
   * @param depth How far the hips sink, metres.
   * @param inclination The trunk's forward inclination, degrees.
   * @param back How far the hips move back along the heading, metres.
   * @returns The sunk posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is lowered, moved and inclined, who shares the inclination and each parameter's unit.
   * @evidence contracts/development/implementation.md#principled-implementation Folded thighs use up the hip's flexion range, so a deep crouch inclines the trunk through the spine rather than the pelvis (Esola et al. 1996 for the rhythm); a pelvis pitched past the range would pull the planted feet off the floor. The limit is read over the leg goals' ankles with the hips at their sunk place.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One hips goal, one incline and one root placed under the pitched hips.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture without both leg goals has no thighs to read, so its pelvis takes the rhythm's full share; the hips' place is read in the yaw frame, so a posture already pitched is not a valid input, as the parameter states.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the split and the limit to `HumanTrunk`, the owner the bend, the sit and the rise read.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function sunk(
    body: IHumanBody,
    posture: IHumanPosture,
    depth: number,
    inclination: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const goal: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      { x: hips.x, y: hips.y - depth, z: hips.z - back },
    );
    const level: IAutoMovieVector3 = Vector3.subtract(
      goal,
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        hips,
      ),
    );
    const left: IHumanPosture.IGoal | undefined = posture.limbs.leftLeg;
    const right: IHumanPosture.IGoal | undefined = posture.limbs.rightLeg;
    const tilt = HumanTrunk.incline(
      posture.joints,
      inclination,
      left === undefined || right === undefined
        ? Infinity
        : HumanTrunk.pelvisLimit(body, level, posture.yaw, {
            left: left.point,
            right: right.point,
          }),
    );
    const tipped: IHumanPosture = {
      ...posture,
      pitch: posture.pitch + tilt.pitch,
      joints: tilt.joints,
    };
    return {
      ...tipped,
      root: Vector3.subtract(
        goal,
        Quaternion.rotateVector(resolveHumanPosture.heading(tipped), hips),
      ),
    };
  }

  /**
   * A crouch: the hips sink and the trunk inclines forward over them
   * (`sunk`), the hips moved back so the centre of mass stays over the feet,
   * and the body stands again (a duck, the dip before a jump, a load taken
   * into the legs). The planted legs keep their goals, so the knees bend.
   *
   * @param props The body, the standing posture, the windows, the depth and the pitch.
   * @returns The primitive, on the root and the trunk.
   * @throws {Error} When the depth or the pitch is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, why the knees bend, the channels and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Standing balance keeps the centre of mass over the base of support, so the hip shift is solved by `HumanBalance.shift` on the lowest pose and scaled with the depth and the pitch by the clock's envelope. The shift is solved once on the standing posture, so between the ends the balance is the linear share of the solved one, not solved again.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper builds the lowered pose for a share; it serves both the solve and the write.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative or non-numeric depth or pitch throws; no shift is stated.
   * @evidence contracts/development/implementation.md#efficient-algorithms The balance is solved once when the phrase is built, not per evaluated second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the lowered pose to `sunk` and the solve to `HumanBalance.shift`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps its arguments and one solved number.
   */
  export function crouch(props: ICrouch): IAutoMovieMotionHumanPrimitive {
    if (!(props.depth >= 0) || !(props.pitch >= 0))
      throw new Error("A crouch's depth and pitch are not negative");
    const low = (
      posture: IHumanPosture,
      share: number,
      back: number,
    ): IHumanPosture =>
      sunk(props.body, posture, props.depth * share, props.pitch * share, back);
    const back: number = HumanBalance.shift(
      props.body,
      (b: number): IHumanPosture => low(props.standing, 1, b),
    );
    return {
      channels: ["root", "trunk"],
      from: props.clock.at(props.rise[0]),
      to: props.clock.at(props.fall[1]),
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const share: number = props.clock.envelope(
          props.rise,
          props.fall,
          seconds,
        );
        return low(posture, share, back * share);
      },
    };
  }

  /**
   * A counterbalance: the hips move back along the heading under a limb held
   * out ahead and come forward again as it returns (a kick's leg, a load at
   * arm's length), by the shift that puts the centre of mass of the extended
   * pose back over the feet.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param rise The instants the limb starts extending and is fullest at.
   * @param fall The instants the limb starts returning and is back at.
   * @param extended The action's posture at the limb's fullest extension.
   * @returns The primitive, on the root.
   * @throws {HumanRefusal} `base` on `balance` when no place of the hips within `HumanBalance.REACH` brings the centre of mass inside the feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the movement, the two windows, which pose the shift is solved on and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A limb held out ahead moves the centre of mass forward, and the body answers by moving the hips back; the shift is the one `HumanBalance.shift` finds for the extended pose, applied along the heading by the clock's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solve and one excursion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No distance is stated, and a pose already balanced solves to no shift; a pose no shift balances is refused with the measured remainder instead of being shown falling.
   * @evidence contracts/development/implementation.md#efficient-algorithms The balance is solved once when the phrase is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanBalance.shift`, `AutoMovieMotionHumanRoot.place` and `AutoMovieMotionHumanRoot.excursion`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps the clock, the windows and one solved number; the extended posture is read only during the solve.
   */
  export function counterbalance(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    rise: readonly [string, string],
    fall: readonly [string, string],
    extended: IHumanPosture,
  ): IAutoMovieMotionHumanPrimitive {
    const shifted = (b: number): IHumanPosture =>
      AutoMovieMotionHumanRoot.place(extended, {
        point: { x: 0, y: 0, z: -b },
        yaw: 0,
      });
    const back: number = HumanBalance.shift(
      body,
      shifted,
      // The extended posture is the caller's, so its hips may stand anywhere
      // the planted legs let them: a body tipped whole about its feet has
      // them most of a leg's length ahead.
      HumanBalance.REACH,
    );
    // No place of the hips holds the pose when the nearest one still leaves
    // the centre of mass outside the feet.
    const margin: number = HumanBalance.margin(body, shifted(back));
    if (back > 0 && !(margin > 0)) {
      const ahead: number = HumanBalance.offset(body, shifted(back));
      throw new HumanRefusal({
        kind: "base",
        axis: "balance",
        value: Number(ahead.toFixed(4)),
        feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
        reason: `the extended pose cannot be balanced over the feet: with the hips ${(back * 1000).toFixed(0)} mm back, the nearest place the search reaches, the centre of mass still stands ${(ahead * 1000).toFixed(0)} mm ahead of the soles' middle and ${(-margin * 1000).toFixed(0)} mm outside the feet`,
        fix: "pitch the trunk less, hold the limbs nearer, or give the body a support or a step",
      });
    }
    return AutoMovieMotionHumanRoot.excursion(clock, rise, fall, {
      point: { x: 0, y: 0, z: -back },
      yaw: 0,
    });
  }
}
