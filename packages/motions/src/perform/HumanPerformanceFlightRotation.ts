import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanPostureRotation } from "../posture/createHumanPostureRotation";

/**
 * Playback of a flight's supplied orientation about its composed centre,
 * constructed outside the performance's shape-evaluation scope: each table
 * interval's slerp of the unturned root is prepared here, and a read takes the
 * interval its second falls in, the centre lerped across it and the turn the
 * orientation gives over the unturned root there.
 *
 * @param props The flight's clock, its table of centres and unturned roots, and
 *   its orientation.
 * @returns The rotation at a second since the flight's start.
 */
export function HumanPerformanceFlightRotation(
  props: HumanPerformanceFlightRotation.IProps,
): (seconds: number) => IAutoMovieHumanPostureRotation {
  const reads: ReturnType<typeof Quaternion.prepareSlerp>[] = props.table
    .slice(0, -1)
    .map(
      (
        row: HumanPerformanceFlightRotation.IRow,
        i: number,
      ): ReturnType<typeof Quaternion.prepareSlerp> =>
        Quaternion.prepareSlerp(row.root, props.table[i + 1]!.root),
    );
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
    const unturned: IAutoMovieQuaternion = reads[i]!(u);
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

/** The inputs of {@link HumanPerformanceFlightRotation}. */
export namespace HumanPerformanceFlightRotation {
  /** A flight's clock, table and orientation. */
  export interface IProps {
    /** The flight's start, film seconds. */
    start: number;
    /** The table's first second. */
    t0: number;
    /** Its last second. */
    t1: number;
    /** Its spacing, seconds. */
    step: number;
    /** Its seconds, `t0` to `t1` a step apart. */
    times: readonly number[];
    /** Each second's composed centre and unturned root. */
    table: readonly IRow[];
    /**
     * The flight's orientation at a second over its unturned root.
     *
     * @param seconds Film seconds.
     * @param root The unturned root there.
     * @returns The orientation.
     */
    orientation: (
      seconds: number,
      root: IAutoMovieQuaternion,
    ) => IAutoMovieQuaternion;
  }

  /** One second of a flight's table. */
  export interface IRow {
    /** The composed centre the body turns about. */
    about: IAutoMovieVector3;
    /** The unturned root. */
    root: IAutoMovieQuaternion;
  }
}
