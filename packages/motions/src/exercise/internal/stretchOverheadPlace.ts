import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * Prepare the two overhead places carried along the chest in a side stretch.
 * The admitted motion keeps its entry chest and source grid fixed through reach
 * and return. The ordinary reader observes its borrowed entry anew. The change
 * of frame follows Lynch and Park, Modern Robotics, §3.3.1.
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
    /*
     * The overhead point in the standing body's grid.
     */
    const overhead = (): IAutoMovieVector3 =>
      AutoMovieMotionHumanPlaced.grid(body, entry, side, {
        height: "overhead",
        lateral: "inside",
        distance: "close",
      });
    /*
     * A second point one unit across toward the other hand.
     */
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

/*
 * A placed arm reads its world point and facing from the current posture.
 */
type Place = IAutoMovieMotionHumanPlaced.IArm["place"];
