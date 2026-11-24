import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanPostureRotation } from "../posture/createHumanPostureRotation";

/** The record of `IHumanPerformanceFlightRotationProps`'s site. */
type IHumanPerformanceFlightRotationProps = {
  start: number;
  t0: number;
  t1: number;
  step: number;
  times: readonly number[];
  table: readonly IPropsTableItem[];
  orientation: (
    seconds: number,
    root: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion;
};

/** The record of `IPropsTableItem`'s site. */
type IPropsTableItem = { about: IAutoMovieVector3; root: IAutoMovieQuaternion };

/**
 * Playback of a flight's supplied orientation about its composed centre,
 * constructed outside the performance's shape-evaluation scope.
 */
export function HumanPerformanceFlightRotation(
  props: IHumanPerformanceFlightRotationProps,
): (seconds: number) => IAutoMovieHumanPostureRotation {
  const roots: (IRootInterpolation | undefined)[] = [];
  return (seconds: number): IAutoMovieHumanPostureRotation => {
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
    if (
      root === undefined ||
      !sameQuaternion(root.from, from) ||
      !sameQuaternion(root.to, to)
    ) {
      const before: IAutoMovieQuaternion = {
        x: from.x,
        y: from.y,
        z: from.z,
        w: from.w,
      };
      const after: IAutoMovieQuaternion = {
        x: to.x,
        y: to.y,
        z: to.z,
        w: to.w,
      };
      root = {
        from: before,
        to: after,
        read: Quaternion.prepareSlerp(before, after),
      };
      roots[i] = root;
    }
    const unturned: IAutoMovieQuaternion = root.read(u);
    return createHumanPostureRotation(
      Vector3.lerp(props.table[i]!.about, props.table[i + 1]!.about, u),
      Quaternion.normalize(
        Quaternion.multiply(
          props.orientation(t, unturned),
          Quaternion.inverse(unturned),
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
function sameQuaternion(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): boolean {
  return (
    Object.is(a.x, b.x) &&
    Object.is(a.y, b.y) &&
    Object.is(a.z, b.z) &&
    Object.is(a.w, b.w)
  );
}
