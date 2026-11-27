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
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFrame } from "../posture/HumanFrame";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/internal/lowerHumanPosture";

/**
 * Trunk lean primitives: the whole body above the feet tipped about the hips,
 * with the hips moved back so the centre of mass stays over the feet.
 *
 * A standing person who tips the trunk forward moves the hips back by the same
 * movement, or falls forward (the counter-movement of a bow, a reach to the
 * floor, a look under a table). The planted legs keep their goals and are
 * solved again when the posture is resolved.
 */
export namespace AutoMovieMotionHumanLean {
  /**
   * The body tilted about its root without a balance shift: the small leans a
   * standing body makes inside its base of support (a recoil, a sway, a lean
   * toward a listener).
   *
   * @param props The window and the tilt.
   * @returns The primitive, on the trunk.
   */
  export function tilt(
    props: IAutoMovieMotionHumanLean.ITilt,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["trunk"],
      reads: ["trunk"],
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
   * A posture tilted about its hip joint: the pitch and the roll are added and
   * the root is moved so the hips stay where they were. A standing body leans
   * from the hips up while its legs stay on their feet; a tilt about the root,
   * which lies on the floor, would swing the hips away by their height times
   * the tilt's sine and pull the feet off their plants.
   *
   * @param body The body.
   * @param posture The posture.
   * @param more The pitch and the roll added, degrees.
   * @returns The tilted posture.
   */
  export function pivot(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    more: IAutoMovieMotionHumanLean.IAngles,
  ): IAutoMovieMotionHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const held: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(humanPostureHeading(posture), hips),
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
        Quaternion.rotateVector(humanPostureHeading(tilted), hips),
      ),
    };
  }

  /**
   * A posture turned rigidly about a world point: the pitch and the roll are
   * added and the root is moved so the point keeps its place in the body's own
   * frame. A body tipped about its ankles (a broken base, a lean against a
   * pull) turns so, its planted legs then solved again at the ankles.
   *
   * @param posture The posture.
   * @param point The point turned about, world metres.
   * @param more The pitch and the roll added, degrees.
   * @returns The turned posture; the posture's own root and heading when
   *   nothing is added.
   */
  export function about(
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    more: IAutoMovieMotionHumanLean.IAngles,
  ): IAutoMovieMotionHumanPosture {
    const own: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(humanPostureHeading(posture)),
      Vector3.subtract(point, posture.root),
    );
    const tilted: IAutoMovieMotionHumanPosture = {
      ...posture,
      pitch: posture.pitch + more.pitch,
      roll: posture.roll + more.roll,
    };
    return {
      ...tilted,
      root: Vector3.subtract(
        point,
        Quaternion.rotateVector(humanPostureHeading(tilted), own),
      ),
    };
  }

  /**
   * The body swayed over its feet: tilted about the hips, the hips carried over
   * the floor, and the root lowered until both planted legs reach their feet.
   * This is the lean of a body that keeps its feet where they are (a recoil, a
   * push taken, a weight shift).
   *
   * @param props The window, the tilt, the travel and the legs.
   * @returns The primitive, on the root and the trunk.
   */
  export function sway(
    props: IAutoMovieMotionHumanLean.ISway,
  ): IAutoMovieMotionHumanPrimitive {
    return {
      channels: ["root", "trunk"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<typeof lowerHumanPosture>[3],
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
        const lowered: IAutoMovieMotionHumanPosture = lowerHumanPosture(
          props.body,
          {
            ...moved,
            limbs: { ...moved.limbs, ...props.legs?.(seconds) },
          },
          undefined,
          resolution,
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
      humanPostureHeading(tipped),
      hips,
    );
    return { ...tipped, root: Vector3.subtract(target, offset) };
  }

  /**
   * A bow: the trunk pitched by a share of a peak, and with the balance option
   * (`IAutoMovieMotionHumanBalance`, off by default) the hips moved back by the
   * balance shift solved once at the peak ({@link HumanBalance.shift}) and
   * scaled between by the pitch's sine, the lever of the trunk's weight ahead
   * of the hips.
   *
   * @param props The body, the standing posture, the peak and the window.
   * @returns The primitive, on the root and the trunk.
   * @throws {Error} When the peak is not positive.
   */
  export function bow(
    props: IAutoMovieMotionHumanLean.IBow,
    window: HumanPhysics.Window = HumanPhysics.prepare(
      props,
      { balance: { by: "hips" } },
      0,
      { duration: props.to, events: [] },
    ),
  ): IAutoMovieMotionHumanPrimitive {
    if (!(props.peak > 0)) throw new Error("A bow's peak pitch is positive");
    if (window?.by === "trunk")
      HumanPhysics.unsupported(
        window.by,
        "the bow prescribes the trunk pitch and counterbalances with the hips",
      );
    const sine = (degrees: number): number =>
      Math.sin((degrees * Math.PI) / 180);
    // Without the balance option the hips stay where they stand: no centre
    // of mass is read. With it, the hips' shift per unit of the pitch's sine
    // is solved once, at the peak, with the plan.
    const lean: number =
      window === null
        ? 0
        : HumanBalance.shift(
            props.body,
            (back: number): IAutoMovieMotionHumanPosture =>
              tip(props.body, props.standing, props.peak, back),
          ) / sine(props.peak);
    return {
      channels: ["root", "trunk"],
      reads: ["root", "trunk"],
      from: props.from,
      to: props.to,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const pitch: number =
          props.peak * Math.min(1, Math.max(0, props.weight(seconds)));
        const weight: number = HumanPhysics.weightAt(window, seconds);
        if (weight === 0 || pitch === 0)
          return tip(props.body, posture, pitch, 0);
        return tip(props.body, posture, pitch, lean * sine(pitch) * weight);
      },
    };
  }
}
