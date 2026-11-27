import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The point a two-handed touch turns the trunk toward: the middle of the two
 * hands' regions, when it lies off to one side beyond the shoulders. Two hands
 * on one thing beside the body, as a disarm's hands on a partner's armed wrist
 * and the weapon, are reached by turning the chest toward it, so each arm
 * reaches from the side the thing lies on and neither crosses the body. A
 * middle between the shoulders asks no turn.
 *
 * @param bones The performer's bones as the touch is entered.
 * @param entry The posture the touch is entered from.
 * @param first The first hand's region point, world metres.
 * @param second The other hand's region point, world metres.
 * @returns The middle of the two regions, or none when it lies between the
 *   shoulders.
 */
export function touchFaces(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  entry: IAutoMovieMotionHumanPosture,
  first: IAutoMovieVector3,
  second: IAutoMovieVector3,
): IAutoMovieVector3 | undefined {
  const left: IAutoMovieResolvedBone | undefined = bones.get("leftUpperArm");
  const right: IAutoMovieResolvedBone | undefined = bones.get("rightUpperArm");
  if (left === undefined || right === undefined) return undefined;
  const middle: IAutoMovieVector3 = Vector3.lerp(first, second, 0.5);
  const centre: IAutoMovieVector3 = Vector3.lerp(
    left.worldPosition,
    right.worldPosition,
    0.5,
  );
  const span: number =
    Math.hypot(
      left.worldPosition.x - right.worldPosition.x,
      left.worldPosition.z - right.worldPosition.z,
    ) / 2;
  const yaw: number = (entry.yaw * Math.PI) / 180;
  const aside: number =
    (middle.x - centre.x) * Math.cos(yaw) -
    (middle.z - centre.z) * Math.sin(yaw);
  return Math.abs(aside) > span ? middle : undefined;
}
