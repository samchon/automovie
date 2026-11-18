import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { HumanFrame } from "../posture/HumanFrame";

/** A placed arm reads its world point and facing from the current posture. */
type Place = IAutoMovieMotionHumanPlaced.IArm["place"];

/**
 * Prepare the two overhead places carried along the chest in a side stretch.
 * The admitted motion keeps its entry chest and source grid fixed through
 * reach and return. The ordinary reader observes its borrowed entry anew.
 * The change of frame follows Lynch and Park, Modern Robotics, §3.3.1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the overhead places, the actual moving chest and the admitted entry premise.
 * @evidence contracts/development/implementation.md#principled-implementation Express the two source points in the standing chest frame and carry both by its current rigid transform. Their world difference is the palm's facing.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Construct one source transform per admitted stretch, then select the per-side source landmarks and current reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the stretch's guarded entry admits fixed coordinates. Every evaluated chest retains its actual pose and exact FK.
 * @evidence contracts/development/implementation.md#efficient-algorithms One source chest transform per admitted plan and one current transform per arm observation. Each observation carries two points instead of solving the same current and source frames for each point separately.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both arm places share the fixed entry frame. Current data and its synchronous FK loan are used only on their actual posture, including along the continuation course.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The place readers own one entry frame and two source points per arm for the action lifetime. Current transforms and FK loans end with each evaluation.
 */
export function stretchOverheadPlace(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  prepared: boolean,
): (side: AutoMovieHumanSide) => Place {
  const carry:
    | ReturnType<typeof AutoMovieMotionHumanPlaced.carryFrom>
    | undefined = prepared
    ? AutoMovieMotionHumanPlaced.carryFrom(body, entry)
    : undefined;
  return (side: AutoMovieHumanSide): Place => {
    /** The overhead point in the standing body's grid. */
    const overhead = (): IAutoMovieVector3 =>
      AutoMovieMotionHumanPlaced.grid(body, entry, side, {
        height: "overhead",
        lateral: "inside",
        distance: "close",
      });
    /** A second point one unit across toward the other hand. */
    const acrossFrom = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        point,
        HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
          { x: side === "left" ? -1 : 1, y: 0, z: 0 },
        ),
      );
    if (carry === undefined)
      return (posture, _seconds, resolution) => {
        const point: IAutoMovieVector3 = overhead();
        const ride = (x: IAutoMovieVector3): IAutoMovieVector3 =>
          AutoMovieMotionHumanPlaced.carried(
            body,
            entry,
            posture,
            x,
            resolution,
          );
        return {
          point: ride(point),
          facing: Vector3.subtract(ride(acrossFrom(point)), ride(point)),
        };
      };
    const point: IAutoMovieVector3 = overhead();
    const across: IAutoMovieVector3 = acrossFrom(point);
    return (posture, _seconds, resolution) => {
      const ride: ReturnType<typeof carry> = carry(posture, resolution);
      const placed: IAutoMovieVector3 = ride(point);
      return { point: placed, facing: Vector3.subtract(ride(across), placed) };
    };
  };
}
