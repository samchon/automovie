import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/** The record of `IArmsProps`'s site. */
type IArmsProps = {
  body: IAutoMovieMotionHumanBody;
  side: AutoMovieHumanSide;
  duration: number;
  rest: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanArmAngles.IAngles;
  weight: (seconds: number) => number;
  forward: IAutoMovieVector3;
};

/**
 * The arms of the cross-body shoulder stretch (`stretch`): the stretched arm
 * crosses the chest until its wrist stands 1.2 shoulder half-widths across the
 * midline at shoulder height, a little ahead of the chest (provisional place),
 * so the hand as a whole is past the other shoulder, the palm facing back and
 * the fingers pointing across; the other palm presses the stretched arm a
 * little short of half way from that wrist to its shoulder, near its elbow.
 */
export namespace stretchCrossBody {
  /**
   * The two arms' primitives.
   *
   * @param props The body, the stretched side, the stretch's seconds, each
   *   arm's resting angles, the weight over time and the heading's forward.
   * @returns The primitives.
   */
  export function arms(props: IArmsProps): IAutoMovieMotionHumanPrimitive[] {
    const { body, side, rest, weight, forward } = props;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
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
      posture: IAutoMovieMotionHumanPosture,
    ) => ReturnType<typeof HumanFrame.prepare> = (
      posture: IAutoMovieMotionHumanPosture,
    ): ReturnType<typeof HumanFrame.prepare> =>
      HumanFrame.prepare({ origin: posture.root, yaw: posture.yaw });
    const reach: (
      posture: IAutoMovieMotionHumanPosture,
      floor: ReturnType<typeof HumanFrame.prepare>,
    ) => IAutoMovieVector3 = (
      posture: IAutoMovieMotionHumanPosture,
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
          posture: IAutoMovieMotionHumanPosture,
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
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
          posture: IAutoMovieMotionHumanPosture,
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
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
