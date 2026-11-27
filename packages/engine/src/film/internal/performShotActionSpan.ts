import { IAutoMovieActionCall } from "@automovie/interface";

/*
 * The shot-local interval one action occupies, `[start, end]` in seconds.
 *
 * An `"auto"` duration fills to the shot's end; a numeric one ends at `start +
 * duration`, clipped to the shot's end. The action's timing is assumed already
 * gated, so `start` lies inside the shot.
 * Parameter action: The gated action.
 * Parameter shotDuration: The shot's length in seconds.
 * Returns: The action's start and end, shot-local seconds.
 */
export function performShotActionSpan(
  action: IAutoMovieActionCall,
  shotDuration: number,
): [number, number] {
  return [
    action.start,
    action.duration === "auto"
      ? shotDuration
      : Math.min(action.start + action.duration, shotDuration),
  ];
}
