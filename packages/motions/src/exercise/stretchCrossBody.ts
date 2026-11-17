import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * The arms of the cross-body shoulder stretch (`stretch`): the stretched
 * arm crosses the chest until its wrist stands 1.2 shoulder half-widths
 * across the midline at shoulder height, a little ahead of the chest
 * (provisional place), so the hand as a whole is past the other shoulder,
 * the palm facing back and the fingers pointing across; the other palm
 * presses the stretched arm a little short of half way from that wrist to
 * its shoulder, near its elbow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where each hand goes and why the wrist, not the palm, is placed.
 * @evidence contracts/development/design.md#principled-representation Two placed arms over the stretch's weight, as data for the placed-arm primitive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder, read by the stretch law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The palm's offset from the wrist is the hand owner's (`AutoMovieMotionHumanPlaced.wrist`), never a length typed here.
 */
export namespace stretchCrossBody {
  /**
   * The two arms' primitives.
   *
   * @param props The body, the stretched side, the stretch's seconds, each arm's resting angles, the weight over time and the heading's forward.
   * @returns The primitives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace gives the places.
   * @evidence contracts/development/implementation.md#principled-implementation The stretched palm is placed so that its wrist lands on the target: the palm point is moved by the palm's own offset from the wrist at that hand's turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target and two placed arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every place follows from the body's measure and the posture's root and heading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed reach/pressure geometry and the actual shoulder rest point prepare once. Each actual arm placement shares one current-yaw frame across its reach/shoulder/facing directions, retaining every current rigid transform and native wrist/arm solve instead of repeating yaw trigonometry per vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged body measures, side and entry-forward pressure establish fixed local geometry only; each posture's actual root/yaw still determines its fresh frame/targets. Native Placed.arm/wrist retain hand offset and actual arm-solving ownership.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The two arm rows retain bounded fixed reach/pressure vectors and the body-owned shoulder rest point until release. Each current frame and temporary target ends with its placement callback; no current pose, FK source, evaluated target or time history is retained.
   */
  export function arms(props: {
    body: IHumanBody;
    side: "left" | "right";
    duration: number;
    rest: (side: "left" | "right") => AutoMovieMotionHumanArm.IAngles;
    weight: (seconds: number) => number;
    forward: IAutoMovieVector3;
  }): IAutoMovieMotionHumanPrimitive[] {
    const { body, side, rest, weight, forward } = props;
    const m: IHumanBody["measure"] = body.measure;
    const other: "left" | "right" = side === "right" ? "left" : "right";
    const sign: number = side === "left" ? 1 : -1;
    const target: IAutoMovieVector3 = {
      x: -sign * 1.2 * m.shoulderHalfWidth,
      y: m.shoulderHeight,
      z: 0.35 * (m.upperArm + m.forearm),
    };
    const shoulderRest: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const pressure: IAutoMovieVector3 = Vector3.scale(
      forward,
      m.forearmRadius + m.upperArmRadius,
    );
    const frame: (
      posture: IHumanPosture,
    ) => ReturnType<typeof HumanFrame.prepare> = (
      posture: IHumanPosture,
    ): ReturnType<typeof HumanFrame.prepare> =>
      HumanFrame.prepare({ origin: posture.root, yaw: posture.yaw });
    const reach: (
      posture: IHumanPosture,
      floor: ReturnType<typeof HumanFrame.prepare>,
    ) => IAutoMovieVector3 = (
      posture: IHumanPosture,
      floor: ReturnType<typeof HumanFrame.prepare>,
    ): IAutoMovieVector3 =>
      floor.point(target, {
        x: posture.root.x,
        y: 0,
        z: posture.root.z,
      });
    return [
      ...AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: 0,
        to: props.duration,
        rest: rest(side),
        weight,
        // The wrist, not the palm, is carried past the other shoulder: the
        // palm lies a hand's own reach further across.
        place: (
          posture: IHumanPosture,
        ): ReturnType<AutoMovieMotionHumanPlaced.IArm["place"]> => {
          const floor: ReturnType<typeof HumanFrame.prepare> = frame(posture);
          const at: Parameters<typeof AutoMovieMotionHumanPlaced.wrist>[2] = {
            point: reach(posture, floor),
            facing: floor.direction({ x: 0, y: 0, z: -1 }),
            forward: floor.direction({ x: -sign, y: 0, z: 0 }),
          };
          const off: IAutoMovieVector3 = Vector3.subtract(
            at.point,
            AutoMovieMotionHumanPlaced.wrist(body, side, at),
          );
          return { ...at, point: Vector3.add(at.point, off) };
        },
        bend: "forward",
      }),
      ...AutoMovieMotionHumanPlaced.arm({
        body,
        side: other,
        from: 0,
        to: props.duration,
        rest: rest(other),
        weight,
        place: (
          posture: IHumanPosture,
        ): ReturnType<AutoMovieMotionHumanPlaced.IArm["place"]> => {
          const floor: ReturnType<typeof HumanFrame.prepare> = frame(posture);
          const shoulder: IAutoMovieVector3 = floor.point(shoulderRest);
          return {
            point: Vector3.add(
              Vector3.lerp(reach(posture, floor), shoulder, 0.45),
              pressure,
            ),
            facing: floor.direction({ x: 0, y: 0, z: -1 }),
          };
        },
        bend: "folded",
      }),
    ];
  }
}
