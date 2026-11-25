import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "./AutoMovieMotionHumanTouchForm";
import { AutoMovieMotionHumanTouchLaid } from "./AutoMovieMotionHumanTouchLaid";
import { AutoMovieMotionHumanTouchUpright } from "./AutoMovieMotionHumanTouchUpright";

/**
 * The goal a touch's arm is carried toward at each second: the effector laid on
 * the region, lifted along its normal by `lift sin^2(pi n u)` and moved along
 * its tangent by the clock's windowed wave of `n` cycles between `strokeStart`
 * and `strokeEnd`, and stood off along the normal by the share of the carry
 * still to go. Another arm that works with the same hand (a second hand on a
 * held tool) reads the same goal.
 *
 * @param props The touch.
 * @returns The goal at a posture and a second since the action's start.
 * @throws {Error} When the count is not a positive whole number.
 */
export function touchGoal(
  props: IAutoMovieMotionHumanTouch.ITouch,
): IAutoMovieMotionHumanArmCarry.ICarry["goal"] {
  HumanBound.whole("count", props.count);
  const { body, clock, side } = props;
  const form: IAutoMovieMotionHumanTouchForm.IForm =
    AutoMovieMotionHumanTouchForm.FORMS[props.kind];
  const hand: number = body.measure.hand * (props.extent ?? 1);
  const standoff: number =
    (props.standoff ?? 0) +
    AutoMovieMotionHumanTouchEffector.pad(body, side, props.effector);
  const held: IAutoMovieMotionHumanFrame = {
    origin: props.entry.root,
    yaw: props.entry.yaw,
  };
  const hint: IAutoMovieVector3 = HumanFrame.local(held, props.bend);
  const from: IAutoMovieVector3 | undefined =
    props.from === undefined ? undefined : HumanFrame.local(held, props.from);
  const oscillation: (seconds: number) => number =
    AutoMovieMotionClock.prepareWave(
      clock,
      ["strokeStart", "strokeEnd"],
      props.count,
    );
  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    resolution?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[2],
    projection?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[3],
  ): IAutoMovieHumanLimbGoal => {
    const place: ReturnType<IAutoMovieMotionHumanTouch.ITouch["region"]> =
      props.region(posture, seconds, resolution, projection);
    const normal: IAutoMovieVector3 = Vector3.normalize(place.normal);
    const along: IAutoMovieVector3 = AutoMovieMotionHumanTouchForm.tangent(
      normal,
      posture.yaw,
      props.tangent ?? "up",
      side,
    );
    const u: number = clock.linear("strokeStart", "strokeEnd", seconds);
    const lift: number =
      form.lift * hand * Math.sin(Math.PI * props.count * u) ** 2;
    const travel: number =
      form.travel === 0 ? 0 : form.travel * hand * oscillation(seconds);
    // The vessel as it is held at the lips: the arm is carried toward the
    // arm that holds it there, the one the drinking search admitted, and
    // the vessel's own tip on the way is the hand's attitude's (`TIP`,
    // `AutoMovieMotionHumanDrinkingArm.carried`).
    const lean: number = props.lean ?? 0;
    const at: IAutoMovieVector3 = Vector3.add(
      Vector3.add(place.point, Vector3.scale(normal, standoff + lift)),
      Vector3.scale(along, travel),
    );
    const frame: IAutoMovieMotionHumanFrame = {
      origin: posture.root,
      yaw: posture.yaw,
    };
    const laid: IAutoMovieHumanLimbGoal =
      AutoMovieMotionHumanTouchEffector.goal(
        body,
        side,
        props.effector,
        at,
        ...AutoMovieMotionHumanTouchLaid.lie(
          body,
          posture,
          side,
          props.lay,
          place.point,
          normal,
          along,
          props.facing,
          props.elbow,
          from === undefined ? undefined : HumanFrame.point(frame, from),
          lean,
        ),
        HumanFrame.point(frame, hint),
        props.lay === "reach",
      );

    // A held rotation turns with the heading and leans with the vessel.
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      posture.yaw - props.entry.yaw,
    );
    const rotation: IAutoMovieQuaternion | undefined =
      props.held === undefined
        ? undefined
        : Quaternion.normalize(
            Quaternion.multiply(
              AutoMovieMotionHumanTouchUpright.tip(normal, lean),
              Quaternion.multiply(turn, props.held),
            ),
          );
    return {
      ...laid,
      ...(rotation === undefined
        ? {}
        : {
            rotation,
            point: Vector3.subtract(
              at,
              Quaternion.rotateVector(
                rotation,
                laid.contact ?? { x: 0, y: 0, z: 0 },
              ),
            ),
          }),
      ...(props.reference === undefined ? {} : { reference: props.reference }),
      ...props.others?.(posture, seconds, resolution, projection),
    };
  };
}
