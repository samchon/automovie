import {
  Quaternion,
  Vector3,
  type integrateAirborneRotation,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Playback of a flight's solved turn about its composed centre, constructed
 * outside the performance's shape-evaluation scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Input times are film seconds, start is the action's film start, root orientations and centres are world values, and the returned callback reads action-local seconds.
 * @evidence contracts/development/implementation.md#principled-implementation Returns q(t) R(t)^-1 about the tabulated centre, with the existing linear centre and slerped unturned root; the physical trajectory reads its own dense extension.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp the action time to the flight, find its tabulated interval and form the relative rigid rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original playback arithmetic; no displayed pose or shape history is read after solving.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time table lookup plus the solved trajectory's lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the solved trajectory and precomputed numeric centre/root table.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Captures only numeric table data and the completed flight. Performance, body, action segment, history and right-hand side are outside this factory's scope.
 */
export function HumanPerformanceFlightRotation(props: {
  start: number;
  t0: number;
  t1: number;
  step: number;
  times: readonly number[];
  table: readonly { about: IAutoMovieVector3; root: IAutoMovieQuaternion }[];
  flight: integrateAirborneRotation.IFlight;
}): (seconds: number) => IHumanPosture.IRotation {
  return (seconds: number): IHumanPosture.IRotation => {
    const t: number = Math.max(
      props.t0,
      Math.min(props.t1, props.start + seconds),
    );
    const i: number = Math.min(
      props.times.length - 2,
      Math.floor((t - props.t0) / props.step),
    );
    const a: number = props.times[i]!;
    const u: number = (t - a) / (props.times[i + 1]! - a);
    return {
      about: Vector3.add(
        props.table[i]!.about,
        Vector3.scale(
          Vector3.subtract(props.table[i + 1]!.about, props.table[i]!.about),
          u,
        ),
      ),
      turn: Quaternion.normalize(
        Quaternion.multiply(
          props.flight.orientation(t),
          Quaternion.inverse(
            Quaternion.slerp(props.table[i]!.root, props.table[i + 1]!.root, u),
          ),
        ),
      ),
    };
  };
}
