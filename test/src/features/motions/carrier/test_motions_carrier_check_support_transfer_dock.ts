import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  checkSupportTransferDock
} from "../../../../../packages/motions/src/carrier/internal/checkSupportTransferDock";
import { TestValidator } from "@nestia/e2e";

/** A support rectangle and its prop's motion (`checkSupportTransferDock`). */
type Endpoint = Parameters<typeof checkSupportTransferDock>[0];

/**
 * Check docking geometry through a one-second support transfer.
 *
 * Scenarios:
 *
 * 1. With two level half-metre rectangles, admit still supports in both
 *    docking modes. Admit equal one-metre-per-second translation in co-moving
 *    mode and refuse it on `from` in stationary mode.
 * 2. Refuse the destination on `to` when it drifts 2 mm per second or is
 *    tilted five degrees.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios distinguish still and co-moving endpoints and identify the axes of motion and tilt refusals.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture exercises stationary and co-moving docking with explicit endpoint axes for movement and tilt.
 * @evidence contracts/development/testing.md#independent-expectations The frame callbacks prescribe zero, equal or different translations, making the relative drift and tilt independent of the docking reader.
 */
export function test_motions_carrier_check_support_transfer_dock(): void {
  const up: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity();
  const endpoint: (
    axis: "from" | "to",
    at: IAutoMovieVector3,
    move: (seconds: number) => IAutoMovieVector3,
    rotation?: IAutoMovieQuaternion,
  ) => Endpoint = (
    axis: "from" | "to",
    at: IAutoMovieVector3,
    move: (seconds: number) => IAutoMovieVector3,
    rotation: IAutoMovieQuaternion = up,
  ): Endpoint => ({
    axis,
    frame: (seconds: number): IAutoMovieRigidTransform => {
      const by: IAutoMovieVector3 = move(seconds);
      return {
        position: { x: at.x + by.x, y: at.y + by.y, z: at.z + by.z },
        rotation,
      };
    },
    propFrame: { position: at, rotation },
    origin: at,
    rotation,
    x: 0.25,
    z: 0.25,
  });
  const still: (
    seconds: number,
  ) => IAutoMovieVector3 = (): IAutoMovieVector3 => ({
    x: 0,
    y: 0,
    z: 0,
  });
  const sliding: (rate: number) => (seconds: number) => IAutoMovieVector3 =
    (rate: number): ((seconds: number) => IAutoMovieVector3) =>
    (seconds: number): IAutoMovieVector3 => ({ x: rate * seconds, y: 0, z: 0 });
  const platform: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const deck: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const refused: (from: Endpoint, to: Endpoint, coMoving: boolean) => string = (
    from: Endpoint,
    to: Endpoint,
    coMoving: boolean,
  ): string => {
    try {
      checkSupportTransferDock(from, to, 0, 1, coMoving);
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "the docks",
    [
      refused(
        endpoint("from", platform, still),
        endpoint("to", deck, still),
        false,
      ),
      refused(
        endpoint("from", platform, still),
        endpoint("to", deck, still),
        true,
      ),
      refused(
        endpoint("from", platform, sliding(1)),
        endpoint("to", deck, sliding(1)),
        true,
      ),
      refused(
        endpoint("from", platform, sliding(1)),
        endpoint("to", deck, sliding(1)),
        false,
      ),
      refused(
        endpoint("from", platform, sliding(1)),
        endpoint("to", deck, sliding(1.002)),
        true,
      ),
      refused(
        endpoint("from", platform, still),
        endpoint(
          "to",
          deck,
          still,
          AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 5),
        ),
        false,
      ),
    ],
    ["admitted", "admitted", "admitted", "from", "to", "to"],
  );
}
