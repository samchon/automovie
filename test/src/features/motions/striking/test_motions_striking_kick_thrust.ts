import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { KickForm, KickThrust } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** A leg of two 0.5 m segments. */
const LENGTHS: readonly [number, number] = [0.5, 0.5];

/** Hip at the origin, ankle 0.8 m below, knee bent forward along +Z. */
const BENT: KickThrust.ILeg = {
  thigh: { x: 0, y: -0.4, z: 0.3 },
  shank: { x: 0, y: -0.4, z: -0.3 },
};

/**
 * A push kick's leg (`KickThrust.planted`, `drawn`, `footed`, `thrusting`): the
 * two-bone leg from the hip to the ankle with its knee toward a hint (or the
 * forward when the hint is on the line), the leg drawn up level ahead with the
 * thigh raised no more than `PUSH_RAISE_MOST`, the foot turned to carry past
 * the ankle's give, and the thrust's leg along the hip-to-ankle travel within
 * the leg's longest reach.
 *
 * Scenarios:
 *
 * 1. An ankle 0.8 m below the hip with the knee read forward lays the 3-4-5 leg:
 *    the thigh (0, -0.4, 0.3), the shank (0, -0.4, -0.3); a knee on the line
 *    lays it toward the forward the same way.
 * 2. Beyond reach, the 1 m leg straightens along the line to 0.5 m.
 * 3. Drawn ahead with the reach 0.15 m up, the thigh rises asin 0.3; 0.4 m up it
 *    rises only 30 degrees; the shank folds the flexion below the thigh.
 * 4. A foot carried within its 20 degree give stays; carried 90 degrees it turns
 *    70.
 * 5. Thrust to a reach of 1.2 m, the leg ends straight at the 1 m longest.
 */
export function test_motions_striking_kick_thrust(): void {
  const hip: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const laid = KickThrust.planted(
    hip,
    { x: 0, y: -0.8, z: 0 },
    { x: 0, y: -0.4, z: 0.1 },
    LENGTHS,
    forward,
  );
  const online = KickThrust.planted(
    hip,
    { x: 0, y: -0.8, z: 0 },
    { x: 0, y: -0.4, z: 0 },
    LENGTHS,
    forward,
  );
  TestValidator.predicate(
    "planted",
    vclose(laid.thigh, BENT.thigh, 1e-12) &&
      vclose(laid.shank, BENT.shank, 1e-12) &&
      vclose(online.thigh, BENT.thigh, 1e-12),
  );
  const over = KickThrust.planted(
    hip,
    { x: 0, y: -1.2, z: 0 },
    { x: 0, y: -0.4, z: 0.1 },
    LENGTHS,
    forward,
  );
  TestValidator.predicate(
    "beyond reach",
    vclose(over.thigh, { x: 0, y: -0.5, z: 0 }, 1e-12),
  );
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const segment = (length: number, angle: number): IAutoMovieVector3 => ({
    x: 0,
    y: length * Math.sin(angle),
    z: length * Math.cos(angle),
  });
  const low: number = Math.asin(0.3);
  const lowDrawn = KickThrust.drawn(
    { thigh: { x: 0, y: 0.15, z: 0.3 }, shank: { x: 0, y: 0, z: 0.3 } },
    LENGTHS,
    90,
    up,
  );
  const highDrawn = KickThrust.drawn(
    { thigh: { x: 0, y: 0.4, z: 0.3 }, shank: { x: 0, y: 0, z: 0.3 } },
    LENGTHS,
    90,
    up,
  );
  const most: number = (KickForm.PUSH_RAISE_MOST * Math.PI) / 180;
  TestValidator.predicate(
    "drawn",
    KickForm.PUSH_RAISE_MOST === 30 &&
      vclose(lowDrawn.thigh, segment(0.5, low), 1e-12) &&
      vclose(lowDrawn.shank, segment(0.5, low - Math.PI / 2), 1e-12) &&
      vclose(highDrawn.thigh, segment(0.5, most), 1e-12),
  );
  const g: number = KickForm.PUSH_ANKLE_GIVE;
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(
    KickThrust.footed(forward, { x: 1, y: 0, z: 0 }),
    forward,
  );
  const a: number = ((90 - g) * Math.PI) / 180;
  TestValidator.predicate(
    "footed",
    g === 20 &&
      vclose(
        Quaternion.rotateVector(
          KickThrust.footed(forward, {
            x: Math.sin(0.2),
            y: 0,
            z: Math.cos(0.2),
          }),
          forward,
        ),
        forward,
        1e-12,
      ) &&
      vclose(turned, { x: Math.sin(a), y: 0, z: Math.cos(a) }, 1e-9),
  );
  const thrust = KickThrust.thrusting(
    BENT,
    { thigh: { x: 0, y: 0, z: 0.6 }, shank: { x: 0, y: 0, z: 0.6 } },
    LENGTHS,
    0,
  );
  TestValidator.predicate(
    "thrust within reach",
    vclose(thrust(0).thigh, BENT.thigh, 1e-12) &&
      vclose(thrust(1).thigh, { x: 0, y: 0, z: 0.5 }, 1e-12) &&
      vclose(thrust(1).shank, { x: 0, y: 0, z: 0.5 }, 1e-12),
  );
}
