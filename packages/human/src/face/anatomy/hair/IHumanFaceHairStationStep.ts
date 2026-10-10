import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One step of a hair lock: the next station and the travel that reached it.
 *
 * `launchHumanFaceHairCurve` returns the first step from the root and the
 * integrator's own step returns every later one. The integrator appends the
 * point and charges `distance` against the lock's metric length and station
 * budget; a step that does not exceed the contact epsilon refuses.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStationStep {
  /** The next station position. */
  point: IAutoMovieVector3;

  /** Chord length from the previous station to `point`, in metres. */
  distance: number;
}
