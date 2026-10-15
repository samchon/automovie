import { DoorPassage } from "./DoorPassage";
import type { PlanRectangle } from "./PlanRectangle";

/** Derives the threshold plan from the real wall-depth and passage width. */

export const passageRectangle = (door: DoorPassage, includeFrame: boolean): PlanRectangle => {
  const halfWidth = door.width / 2 + (includeFrame ? door.frame : 0);
  return door.axis === "x"
    ? {
      west: door.center - halfWidth, east: door.center + halfWidth,
      north: door.wallLow, south: door.wallHigh
    }
    : {
      west: door.wallLow, east: door.wallHigh,
      north: door.center - halfWidth, south: door.center + halfWidth
    };
};
