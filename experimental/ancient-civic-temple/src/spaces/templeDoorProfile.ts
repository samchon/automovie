import type { IAutoMovieOpeningProfile } from "@automovie/interface";
import type { DoorPassage } from "../geometry/DoorPassage";
import { templeLevels as y } from "./templeLevels";

/**
 * Profile with host origin at length coordinate 0, Y=0, and local +X along increasing length.
 */
export const templeDoorProfile = (door: DoorPassage): IAutoMovieOpeningProfile => {
  const half = door.width / 2 + door.frame;
  return {
    outline: [
      { x: door.center - half, y: y.floor },
      { x: door.center + half, y: y.floor },
      { x: door.center + half, y: y.floor + door.height + door.frame },
      { x: door.center - half, y: y.floor + door.height + door.frame },
    ]
  };
};
