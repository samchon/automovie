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
import { createHumanPostureRotation } from "../posture/createHumanPostureRotation";

/**
 * Playback of a flight's solved turn about its composed centre, constructed
 * outside the performance's shape-evaluation scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Input times are film seconds, start is the action's film start, root orientations and centres are world values, and the returned callback reads action-local seconds.
 * @evidence contracts/development/implementation.md#principled-implementation Returns q(t) R(t)^-1 about the tabulated centre, with the existing linear centre and slerped unturned root; the physical trajectory reads its own dense extension.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp the action time to the flight, find its tabulated interval and form the relative rigid rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original playback arithmetic; no displayed pose or shape history is read after solving.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time table lookup plus the solved trajectory's lookup. Each visited interval lazily prepares its endpoint dot, shorter-arc branch and spherical constants once; each actual read still evaluates its own weights and normalization.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the solved trajectory and numeric centre/root table. Copied root endpoint coordinates are compared with Object.is before sharing a prepared slerp, so editing a caller-owned table entry invalidates that interval without relying on identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Captures only numeric table data, completed flight and at most one fixed-size endpoint interpolation per visited table interval; shrinking the table truncates old slots. Performance, body, action segment, history and right-hand side are outside this factory's scope.
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
  const roots: (IRootInterpolation | undefined)[] = [];
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
    roots.length = Math.min(roots.length, props.table.length);
    const from: IAutoMovieQuaternion = props.table[i]!.root;
    const to: IAutoMovieQuaternion = props.table[i + 1]!.root;
    let root: IRootInterpolation | undefined = roots[i];
    if (root === undefined || !sameQuaternion(root.from, from) || !sameQuaternion(root.to, to)) {
      const before: IAutoMovieQuaternion = { x: from.x, y: from.y, z: from.z, w: from.w };
      const after: IAutoMovieQuaternion = { x: to.x, y: to.y, z: to.z, w: to.w };
      root = { from: before, to: after, read: Quaternion.prepareSlerp(before, after) };
      roots[i] = root;
    }
    return createHumanPostureRotation(
      Vector3.lerp(props.table[i]!.about, props.table[i + 1]!.about, u),
      Quaternion.normalize(
        Quaternion.multiply(
          props.flight.orientation(t),
          Quaternion.inverse(root.read(u)),
        ),
      ),
    );
  };
}

/** One interval's copied keys and prepared scalar interpolation prerequisites. */
interface IRootInterpolation {
  /** Copied unturned root at the left table endpoint. */
  from: IAutoMovieQuaternion;

  /** Copied unturned root at the right table endpoint. */
  to: IAutoMovieQuaternion;

  /** Same endpoint slerp, with a fresh result at each requested share. */
  read: ReturnType<typeof Quaternion.prepareSlerp>;
}

/** Exact copied keys preserve table mutation and signed-zero behavior. */
function sameQuaternion(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  return Object.is(a.x, b.x) && Object.is(a.y, b.y) && Object.is(a.z, b.z) && Object.is(a.w, b.w);
}
