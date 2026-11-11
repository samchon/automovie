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
 */
export namespace AutoMovieMotionHumanLean {
  /** A lean over a window. */
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

  /** A tilt of the whole body about the root, degrees added to the posture. */
  export interface IAngles {
    /** Forward pitch added, degrees. */
    pitch: number;

    /** Roll added, degrees. */
    roll: number;
  }

  /** A tilt over a window. */
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
