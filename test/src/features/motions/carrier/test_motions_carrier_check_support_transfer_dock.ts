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
 * `checkSupportTransferDock` admits stepping from one support onto another:
 * both rectangles level at the start, and through trailing touchdown either
 * both props still (stationary), or the deck carried with the platform's rigid
 * motion within a millimetre at its centre and corners and a tenth of a degree
 * (co-moving), sampled at 120 Hz.
 *
 * Scenarios, a platform at the origin and a deck 1 m ahead, each a 0.5 by 0.5 m
 * rectangle, over a 1 s transfer:
 *
 * 1. Two still props are admitted, stationary or co-moving.
 * 2. Both translating together along +X at 1 m/s are admitted co-moving, and
 *    refused stationary on `from`, the platform moving first.
 * 3. A deck drifting 2 mm a second off the platform is refused co-moving on `to`.
 * 4. A deck tilted 5 degrees about X is refused on `to`.
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
