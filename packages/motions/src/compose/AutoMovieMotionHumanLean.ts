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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tipped posture (`tip`), the balanced lean (`bow`), the small tilt about the root that needs no balance (`tilt`), and the tilt about the hips (`pivot`) with the sway over planted feet built on it (`sway`).
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
     * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by the function that writes the part; the builders from a clock fill it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reader clamps the result to [0, 1] instead of trusting the member, so an implementation that overshoots cannot push the part past its ends.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
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
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, the unit and that the pitch and the roll are added to the posture.
     * @evidence contracts/development/implementation.md#principled-implementation The pitch and the roll are a pure function of the seconds, so any time course of a tilt fits one member.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `tilt`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tilt is stated as two angles per second and not as a peak with a named easing, so no case of one easing is built in.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
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
   * A posture tilted about its hip joint: the pitch and the roll are added
   * and the root is moved so the hips stay where they were. A standing body
   * leans from the hips up while its legs stay on their feet; a tilt about
   * the root, which lies on the floor, would swing the hips away by their
   * height times the tilt's sine and pull the feet off their plants.
   *
   * @param body The body.
   * @param posture The posture.
   * @param more The pitch and the roll added, degrees.
   * @returns The tilted posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is added, what stays in place and why the root is not the pivot.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' place is the root plus the rotated rest offset of the hips; the new root is that place less the offset rotated by the tilted heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two rotated offsets and one subtraction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hips' place is read with the posture's own pitch and roll, so a posture that already leans keeps its hips too.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture.heading`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function pivot(
    body: IHumanBody,
    posture: IHumanPosture,
    more: IAngles,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const held: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), hips),
    );
    const tilted: IHumanPosture = {
      ...posture,
      pitch: posture.pitch + more.pitch,
      roll: posture.roll + more.roll,
    };
    return {
      ...tilted,
      root: Vector3.subtract(
        held,
        Quaternion.rotateVector(resolveHumanPosture.heading(tilted), hips),
      ),
    };
  }

  /**
   * A sway over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its frame and its unit, and what an absent member means.
   * @evidence contracts/development/design.md#principled-representation The span written, the tilt about the hips, the hips' travel over the floor and the leg goals the hips' height is solved against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `sway`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hips' height is not a member: it follows from the legs.
   */
  export interface ISway {
    /** The body. */
    body: IHumanBody;

    /** Seconds since the action's start from which the root and the trunk are written. */
    from: number;

    /** Seconds since the action's start until which the root and the trunk are written. */
    to: number;

    /**
     * The tilt about the hips added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, the unit and that the angles are added to the posture.
     * @evidence contracts/development/implementation.md#principled-implementation The pitch and the roll are a pure function of the seconds, so any time course of a sway fits one member.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tilt is stated as two angles per second and not as a peak with a named easing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    angles(seconds: number): IAngles;

    /**
     * The hips' travel over the floor from where the posture holds them;
     * none when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns Metres in the performer's floor frame: `x` left, `z` forward; `y` is not read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the frame, the unit and the component that is not read.
     * @evidence contracts/development/implementation.md#principled-implementation The travel is a pure function of the seconds in the frame the root primitives use, so a sway composes with a root that already moves.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The height is never taken from the member, since the legs decide it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    shift?(seconds: number): IAutoMovieVector3;

    /**
     * The leg goals the hips' height is solved against; the posture's own
     * leg goals when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns The two leg goals at that second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the result and what an absent member reads.
     * @evidence contracts/development/implementation.md#principled-implementation The root is written before the legs, so an action whose own rows move the feet states where they are at each second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goals are only read for the height and never written, so the leg rows stay the owners of the legs.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    legs?(
      seconds: number,
    ): Pick<IHumanPosture["limbs"], "leftLeg" | "rightLeg">;
  }

  /**
   * The body swayed over its feet: tilted about the hips, the hips carried
   * over the floor, and the root lowered until both planted legs reach their
   * feet. This is the lean of a body that keeps its feet where they are (a
   * recoil, a push taken, a weight shift).
   *
   * @param props The window, the tilt, the travel and the legs.
   * @returns The primitive, on the root and the trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three things done to the body, in order, and when the primitive fits.
   * @evidence contracts/development/implementation.md#principled-implementation The hips are the pivot of a standing lean and a planted leg has a fixed length, so the hips' height follows from where the feet are once the hips have moved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One `pivot`, one floor-frame translation and one `resolveHumanPosture.lower`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The travel's height is discarded and the written posture keeps its own limbs: the legs given are read for the height only.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `pivot`, `HumanFrame.point` and `resolveHumanPosture.lower`, the owner of a planted leg's reach.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function sway(props: ISway): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["root", "trunk"],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const tilted: IHumanPosture = pivot(
          props.body,
          posture,
          props.angles(seconds),
        );
        const travel: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
          { ...(props.shift?.(seconds) ?? { x: 0, y: 0, z: 0 }), y: 0 },
        );
        const moved: IHumanPosture = {
          ...tilted,
          root: Vector3.add(tilted.root, travel),
        };
        const lowered: IHumanPosture = resolveHumanPosture.lower(props.body, {
          ...moved,
          limbs: { ...moved.limbs, ...props.legs?.(seconds) },
        });
        return { ...moved, root: lowered.root };
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
