import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBikeTransfer,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/**
 * The race line a bicycle transfer meets (World Triathlon Competition Rules
 * §7.1(h, j)): a mount counts a sole wholly on the floor, within `FLOOR`, past
 * the mount line along its heading; a dismount one wholly on the floor short of
 * the dismount line.
 *
 * @param line The line's place and heading on the course.
 * @param mount Whether the transfer mounts.
 * @returns Whether a sole's points qualify.
 */
export function humanBikeTransferLine(
  line: IAutoMovieMotionHumanBikeTransfer["line"],
  mount: boolean,
): (sole: readonly IAutoMovieVector3[]) => boolean {
  const onward: IAutoMovieVector3 = Quaternion.rotateVector(
    HumanFrame.turn(line.heading),
    { x: 0, y: 0, z: 1 },
  );
  const origin: IAutoMovieVector3 = { x: line.x, y: 0, z: line.z };
  return (sole: readonly IAutoMovieVector3[]): boolean =>
    sole.every(
      (point: IAutoMovieVector3): boolean =>
        Math.abs(point.y) <= humanBikeTransferLine.FLOOR &&
        (mount ? 1 : -1) *
          Vector3.dot(Vector3.subtract(point, origin), onward) >
          0,
    );
}

/** The race line and the stopped bicycle. */
export namespace humanBikeTransferLine {
  /** Contact tolerance in metres for the stage's floor. */
  export const FLOOR: number = 0.01;

  /**
   * Frame comparison tolerance during the stopped transfer, in metres or
   * unit-vector length.
   */
  export const STILL: number = 1e-6;

  /** Two independent axes exposed by the bicycle's rigid frame. */
  export const AXES: readonly IAutoMovieVector3[] = [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];

  /**
   * Whether the bicycle still stands as it stopped: its frame's place and two
   * axes, and both pedals, within `STILL` of the stop.
   *
   * @param stopped The frame at the stop.
   * @param frame The frame now.
   * @param from The pedals at the stop.
   * @param now The pedals now; a missing pedal is not still.
   * @returns Whether nothing has moved.
   */
  export function still(
    stopped: IAutoMovieRigidTransform,
    frame: IAutoMovieRigidTransform,
    from: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    now: Readonly<Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>>,
  ): boolean {
    return (
      Vector3.length(Vector3.subtract(frame.position, stopped.position)) <=
        STILL &&
      AXES.every(
        (axis: IAutoMovieVector3): boolean =>
          Vector3.length(
            Vector3.subtract(
              Quaternion.rotateVector(frame.rotation, axis),
              Quaternion.rotateVector(stopped.rotation, axis),
            ),
          ) <= STILL,
      ) &&
      (["left", "right"] as const).every(
        (side: AutoMovieHumanSide): boolean => {
          const pedal: IAutoMovieVector3 | undefined = now[side];
          return (
            pedal !== undefined &&
            Vector3.length(Vector3.subtract(pedal, from[side])) <= STILL
          );
        },
      )
    );
  }
}
