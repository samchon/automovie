import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One step of a hair lock: the next station and the travel that reached it.
 *
 * `launchHumanFaceHairCurve` returns the first step from the root and the
 * integrator's own step returns every later one. The integrator appends the
 * point and charges `distance` against the lock's metric length and station
 * budget; a step that does not exceed the contact epsilon refuses.
 *
 * @evidence contracts/common.md#principled-implementation Returns each station with the actual chord length the metric walk accounts for.
 * @evidence contracts/common.md#clear-and-simple-design One named step type serves the launch and every later step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The distance is the measured chord, never a nominal step.
 * @evidence contracts/common.md#meaningful-documentation States both producers, the consumer and how the travel is charged.
 * @evidence contracts/modeling.md#spatial-conventions The point and distance are current head-frame metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidence contracts/modeling.md#emitted-geometry The point becomes an emitted curve station.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The contact and exterior interval own the boundary proof.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStationStep {
  /** The next station position. */
  point: IAutoMovieVector3;

  /** Chord length from the previous station to `point`, in metres. */
  distance: number;
}
