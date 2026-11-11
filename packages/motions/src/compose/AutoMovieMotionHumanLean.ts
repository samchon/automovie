import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Trunk lean primitives: the whole body above the feet tipped about the
 * hips, with the hips moved back so the centre of mass stays over the feet.
 *
 * A standing person who tips the trunk forward moves the hips back by the
 * same movement, or falls forward (the counter-movement of a bow, a reach to
 * the floor, a look under a table). The planted legs keep their goals and are
 * solved again when the posture is resolved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a lean tips, about what, why the hips move back and what the legs do.
 * @evidence contracts/development/design.md#principled-representation A lean is a pitch about the hip joint with a horizontal hip shift that keeps the centre of mass over the base of support, the counter-movement of standing balance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tipped posture (`tip`), the balanced lean (`bow`) and the small tilt that needs no balance (`tilt`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hip shift is solved by the balance owner on the body and never stated as a constant.
 */
export namespace AutoMovieMotionHumanLean {
  /**
   * A lean over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit, its sign and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The deepest pitch, the posture the balance is solved on, the span written and the share of the pitch held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `bow`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hip shift is not a member: it follows from the body and the peak.
   */
  export interface IBow {
    /** The body. */
    body: IHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IHumanPosture;

    /** The deepest forward pitch, degrees; positive. */
    peak: number;

    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * How much of the peak pitch the trunk holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     */
    weight(seconds: number): number;
  }

  /**
   * A tilt of the whole body about the root, degrees added to the posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is tilted, about what, and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The two angles the trunk channel owns besides its joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by a tilt's `angles`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members required and named, instead of a positional pair.
   */
  export interface IAngles {
    /** Forward pitch added, degrees. */
    pitch: number;

    /** Roll added, degrees. */
    roll: number;
  }

  /**
   * A tilt over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The span the trunk is written over and the tilt added at each second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `tilt`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tilt is a function of seconds and not a peak with a named easing.
   */
  export interface ITilt {
    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * The tilt added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     */
    angles(seconds: number): IAngles;
  }

  /**
   * The body tilted about its root without a balance shift: the small leans
   * a standing body makes inside its base of support (a recoil, a sway, a
   * lean toward a listener).
   *
   * @param props The window and the tilt.
   * @returns The primitive, on the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is tilted, that no balance shift is made and when that is right.
   * @evidence contracts/development/implementation.md#principled-implementation The pitch and the roll are added to the posture's own, so a tilt composes with a base that already leans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two sums.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root is not moved; a lean deep enough to need the hips back is `bow`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function tilt(props: ITilt): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["trunk"],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const more: IAngles = props.angles(seconds);
        return {
          ...posture,
          pitch: posture.pitch + more.pitch,
          roll: posture.roll + more.roll,
        };
      },
    };
  }

  /**
   * A posture tipped forward about the hips.
   *
   * @param body The body.
   * @param posture The posture.
   * @param pitch Forward pitch added, degrees.
   * @param back How far the hips move back along the heading, metres.
   * @returns The tipped posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's unit and direction.
   * @evidence contracts/development/implementation.md#principled-implementation The hip joint is held at its place moved back by the shift while the pitch is added, and the root is the point that puts the rotated hip offset there: a rotation about the hips, not about the root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target point, one rotated offset and one subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hips' place is read from the posture's own root and heading before the pitch is added.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point` and `resolveHumanPosture.heading`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tip(
    body: IHumanBody,
    posture: IHumanPosture,
    pitch: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const target: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y,
      z: hips.z - back,
    });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(tipped),
      hips,
    );
    return { ...tipped, root: Vector3.subtract(target, offset) };
  }

  /**
   * A bow: the trunk pitched by a share of a peak, the hips moved back by the
   * balance shift solved once at the peak ({@link HumanBalance.shift}) and
   * scaled between by the pitch's sine, the lever of the trunk's weight ahead
   * of the hips.
   *
   * @param props The body, the standing posture, the peak and the window.
   * @returns The primitive, on the root and the trunk.
   * @throws {Error} When the peak is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pitch, where the hip shift comes from, how it scales between and when it throws.
   * @evidence contracts/development/implementation.md#principled-implementation The trunk's weight acts ahead of the hips by its length times the pitch's sine, so the shift that balances the peak scales to any smaller pitch by the ratio of sines.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One balance solution at plan time, then one `tip` per written second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A peak of 0 or less throws before the division by its sine; the weight is clamped to [0, 1].
   * @evidence contracts/development/implementation.md#efficient-algorithms The balance is solved once, not at every second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanBalance.shift` and `tip`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive keeps one number beside its props.
   */
  export function bow(props: IBow): IAutoMovieMotionHumanPrimitive {
    if (!(props.peak > 0)) throw new Error("A bow's peak pitch is positive");
    const sine = (degrees: number): number =>
      Math.sin((degrees * Math.PI) / 180);
    const lean: number =
      HumanBalance.shift(
        props.body,
        (back: number): IHumanPosture =>
          tip(props.body, props.standing, props.peak, back),
      ) / sine(props.peak);
    return {
      channels: ["root", "trunk"],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const pitch: number =
          props.peak * Math.min(1, Math.max(0, props.weight(seconds)));
        return tip(props.body, posture, pitch, lean * sine(pitch));
      },
    };
  }
}
