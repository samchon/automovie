import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBalance } from "../everyday/HumanBalance";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

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
  export function tilt(
    props: IAutoMovieMotionHumanLean.ITilt,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["trunk"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const more: IAutoMovieMotionHumanLean.IAngles = props.angles(seconds);
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    more: IAutoMovieMotionHumanLean.IAngles,
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const held: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), hips),
    );
    const tilted: IAutoMovieMotionHumanPosture = {
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
  export function sway(
    props: IAutoMovieMotionHumanLean.ISway,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["root", "trunk"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const tilted: IAutoMovieMotionHumanPosture = pivot(
          props.body,
          posture,
          props.angles(seconds),
        );
        const travel: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
          { ...(props.shift?.(seconds) ?? { x: 0, y: 0, z: 0 }), y: 0 },
        );
        const moved: IAutoMovieMotionHumanPosture = {
          ...tilted,
          root: Vector3.add(tilted.root, travel),
        };
        const lowered: IAutoMovieMotionHumanPosture = resolveHumanPosture.lower(
          props.body,
          {
            ...moved,
            limbs: { ...moved.limbs, ...props.legs?.(seconds) },
          },
        );
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
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    pitch: number,
    back: number,
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: posture.root,
      yaw: posture.yaw,
    };
    const target: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y,
      z: hips.z - back,
    });
    const tipped: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + pitch,
    };
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
  export function bow(
    props: IAutoMovieMotionHumanLean.IBow,
  ): IAutoMovieMotionHumanPrimitive {
    if (!(props.peak > 0)) throw new Error("A bow's peak pitch is positive");
    const sine = (degrees: number): number =>
      Math.sin((degrees * Math.PI) / 180);
    const lean: number =
      HumanBalance.shift(
        props.body,
        (back: number): IAutoMovieMotionHumanPosture =>
          tip(props.body, props.standing, props.peak, back),
      ) / sine(props.peak);
    return {
      channels: ["root", "trunk"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const pitch: number =
          props.peak * Math.min(1, Math.max(0, props.weight(seconds)));
        return tip(props.body, posture, pitch, lean * sine(pitch));
      },
    };
  }
}
