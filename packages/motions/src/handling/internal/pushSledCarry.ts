import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Carry the two grips of a floor load by one already resolved chest frame. Only
 * heading turns the load; its grip and elbow points keep their original heights
 * while the walk's chest translates and turns across the floor.
 */
export namespace pushSledCarry {
  /*
   * The wrist and elbow hint a hand takes at a load's handle.
   */
  export interface IHold {
    /*
     * World wrist position in metres and rest-relative hand rotation.
     */
    wrist: IAutoMovieMotionHumanHand.IWrist;

    /*
     * World elbow hint, metres.
     */
    bend: IAutoMovieVector3;
  }

  /*
   * One current chest's yaw-only transform of the fixed arrival frame.
   */
  export interface IFrame {
    /*
     * The shared floor turn from the arrival, around world +Y.
     */
    turn: IAutoMovieQuaternion;

    /*
     * Carry the arrival wrist/elbow by this actual chest frame, returning fresh
     * world-metre wrist/hint records with their original point heights.
     */
    hold: (hold: pushSledCarry.IHold) => pushSledCarry.IHold;
  }

  /*
   * Prepare the arrival frame for all grasp samples and runtime hands.
   * Parameter arrived: The fixed chest frame at grip closure.
   * Returns: A carrier of a hold onto an actual current chest frame and its yaw
   * turn.
   */
  export function prepare(
    arrived: IAutoMovieResolvedBone,
  ): (chest: IAutoMovieResolvedBone) => IFrame {
    const facing: number = heading(arrived.worldRotation);
    return (chest: IAutoMovieResolvedBone): IFrame => {
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        heading(chest.worldRotation) - facing,
      );
      const moved: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 => {
        const carried: IAutoMovieVector3 = Vector3.add(
          chest.worldPosition,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(point, arrived.worldPosition),
          ),
        );
        return { x: carried.x, y: point.y, z: carried.z };
      };
      return {
        hold: (hold: pushSledCarry.IHold): pushSledCarry.IHold => ({
          wrist: {
            point: moved(hold.wrist.point),
            rotation: Quaternion.normalize(
              Quaternion.multiply(turn, hold.wrist.rotation),
            ),
          },
          bend: moved(hold.bend),
        }),
        turn,
      };
    };
  }
}

/*
 * Read a quaternion's world heading with the push's original +Z convention.
 */
function heading(rotation: IAutoMovieQuaternion): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
}
