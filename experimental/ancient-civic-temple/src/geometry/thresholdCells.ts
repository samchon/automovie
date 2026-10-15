/**
 * Builds the engine's convex cells from the plan, finished faces and real roof underside a space owner gives.
 * These are logical boundaries and do not guarantee floor or wall meshes, empty space or collision-free passage.
 * When the roof does not cover a room body, the gap is not filled with a box; an error is returned.
 */
import type { IAutoMovieConvexSpaceCell } from "@automovie/interface";
import { DoorPassage } from "./DoorPassage";
import { passageRectangle } from "./passageRectangle";
import { levelCell } from "./levelCell";

/** Builds only the clear passage volume, without the door frame, as an extra cell owned by that room. */
export const thresholdCells = (
  room: string, doors: readonly DoorPassage[], floor: number,
): IAutoMovieConvexSpaceCell[] => doors.filter((door) => door.room === room)
  .map((door) => levelCell(
    `${room}.threshold.${door.id}`, passageRectangle(door, false),
    floor, floor + door.height,
  ));

