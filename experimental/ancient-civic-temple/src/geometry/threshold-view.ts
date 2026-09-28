/** A door threshold looks straight inward, clear of its opened hinge leaves. */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { DoorPassage } from "./spatial-cells";

export const templeThresholdTarget = (door: DoorPassage, position: IAutoMovieVector3): IAutoMovieVector3 => {
  const middle = (door.wallLow + door.wallHigh) / 2;
  const across = door.axis === "x" ? position.z : position.x;
  const direction = Math.sign(across - middle);
  if (direction === 0) throw new Error(`${door.id}: threshold eye is on the wall centre plane`);
  return door.axis === "x" ? { ...position, z: position.z + direction } : { ...position, x: position.x + direction };
};
