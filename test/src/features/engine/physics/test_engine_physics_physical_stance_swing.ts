import {
  AutoMoviePhysicalBalance,
  Quaternion,
  physicalStanceBalance,
  physicalStanceSwing,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * The recovery's contact and timing rules match their closed forms without a
 * simulation:
 *
 * 1. Lift-off: a limb about to swing lifts once its share has ramped out and its
 *    measured load is under `RELEASE` of the weight; never while its share is
 *    still ramping, and never while the floor still carries it, however long it
 *    has waited (Pratt et al., M2V2, Section VII-A; Feng et al. 2015, Figure
 *    2).
 * 2. Early touchdown: a lifted foot pressed with 800 N, above `TOUCH` of the
 *    weight, rejoins the support on the second successive substep, an aborted
 *    lift; one substep's load does not, and a load under it restarts the count
 *    (Stephens 2011, Figure 4.6; Feng et al. 2015, Section III-A4). A foot
 *    reloaded before it has cleared the floor stays swinging however long it is
 *    pressed: its load is the floor it never left, not a landing
 *    (design-4017-verdicts, C17). A toe scraping the floor while the cleared
 *    foot still rises is a scuff and is ignored; the same contact while it
 *    comes down lands (Stephens 2011, Figure 4.6; Feng et al. 2015, Section
 *    III-A4).
 * 3. Second step: none while a landed foot ramps in, and then only after the
 *    capture point has stayed outside for `DWELL` (Pratt et al., M2V2, Section
 *    IX-C).
 * 4. Tilt guard: the tilt plus the body's rotation rate |k_h| / I_h over omega
 *    against the range, the vertical momentum left out.
 * 5. Saturation: an orientation error within the limit is kept; a larger one is
 *    shortened to the limit about the same axis.
 * 6. Swing drive: the path's feed-forward alone, m (g y + a), carried by the
 *    limb's effective mass; at rest on its path the leg is held against its
 *    weight, and no position error enters it.
 * 7. Bounds: the swing's acceleration bound is the hip's torque over `m_eff l`,
 *    160 / (2 x 0.8); a swing lasts at least 0.3 s, and over 0.5 m at 10 m/s^2
 *    `sqrt(MINIMUM_JERK 0.5 / 10)`; the clearance a stance can carry is `min(h,
 *    LIFT_SHARE m g T^2 / CLEARANCE)`; angular momentum k shifts the capture
 *    point by `omega / (m g) k x y`.
 */
export function test_engine_physics_physical_stance_swing(): void {
  const failures: string[] = [];
  const check = (name: string, actual: boolean, expected: boolean): void => {
    if (actual !== expected) failures.push(`${name}: ${actual}`);
  };
  const W: number = 700;
  const { RELEASE, TOUCH, DWELL, TORSO_ERROR }: typeof physicalStanceBalance =
    physicalStanceBalance;
  const dt: number = 1 / 960;

  // 1. Lift-off on the measured load alone.
  const release = (bearing: number, load: number): boolean =>
    physicalStanceBalance.release({ bearing, load, weight: W });
  check("ramping limb", release(0.4, 0), false);
  check("loaded limb", release(0, 1.5 * RELEASE * W), false);
  check("unloaded limb", release(0, 0.5 * RELEASE * W), true);

  // 2. Early touchdown on the second successive substep.
  const first = physicalStanceBalance.touchdown({
    load: 800,
    weight: W,
    cleared: true,
    descending: true,
    since: undefined,
    seconds: 1,
    dt,
  });
  check("touch starts", first.since === 1 && !first.landed, true);
  const held = physicalStanceBalance.touchdown({
    load: 800,
    weight: W,
    cleared: true,
    descending: true,
    since: first.since,
    seconds: 1 + dt,
    dt,
  });
  check("held touch rejoins", held.landed, true);
  const scuff = physicalStanceBalance.touchdown({
    load: 0.5 * TOUCH * W,
    weight: W,
    cleared: true,
    descending: true,
    since: first.since,
    seconds: 1 + dt,
    dt,
  });
  check("scuff restarts", scuff.since === undefined && !scuff.landed, true);
  const pressing = (
    cleared: boolean,
    descending: boolean,
  ): { since?: number; landed: boolean } => {
    let since: number | undefined = undefined;
    let landed: boolean = false;
    for (let i: number = 0; i < 8; i++) {
      const pressed: { since?: number; landed: boolean } =
        physicalStanceBalance.touchdown({
          load: 800,
          weight: W,
          cleared,
          descending,
          since,
          seconds: 1 + i * dt,
          dt,
        });
      since = pressed.since;
      landed ||= pressed.landed;
    }
    return { ...(since !== undefined ? { since } : {}), landed };
  };
  const reloaded: { since?: number; landed: boolean } = pressing(false, true);
  check(
    "reloaded before clearing stays swinging",
    reloaded.landed || reloaded.since !== undefined,
    false,
  );
  const scraping: { since?: number; landed: boolean } = pressing(true, false);
  check(
    "a toe scraping while the foot rises is ignored",
    scraping.landed || scraping.since !== undefined,
    false,
  );
  check(
    "a contact coming down after clearing lands",
    pressing(true, true).landed,
    true,
  );

  // 3. The second step waits for the landing ramp and the dwell.
  check(
    "ramping landing",
    physicalStanceBalance.ready({ landing: 0.5, outside: 0, seconds: 1 }),
    false,
  );
  check(
    "fresh excursion",
    physicalStanceBalance.ready({ outside: 1, seconds: 1 + DWELL / 2 }),
    false,
  );
  check(
    "held excursion",
    physicalStanceBalance.ready({ landing: 1, outside: 1, seconds: 1 + DWELL }),
    true,
  );
  check(
    "inside",
    physicalStanceBalance.ready({ outside: undefined, seconds: 1 }),
    false,
  );

  // 4. Tilt guard: 0.3 rad tilt, rate |k_h| / I_h = 2 rad/s, omega 4: 0.8.
  const tipping = (momentum: { x: number; y: number; z: number }): boolean =>
    physicalStanceBalance.tipping({
      tilt: 0.3,
      momentum,
      inertia: 10,
      omega: 4,
      range: 0.5,
    });
  check("horizontal spin tips", tipping({ x: 12, y: 0, z: 16 }), true);
  check("vertical spin does not", tipping({ x: 0, y: 100, z: 0 }), false);
  check("slow spin does not", tipping({ x: 3, y: 0, z: 4 }), false);

  // 5. Saturation keeps a small error and shortens a large one.
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const angleOf = (q: { x: number; y: number; z: number; w: number }) =>
    2 * Math.atan2(Math.hypot(q.x, q.y, q.z), Math.abs(q.w));
  const small = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    ((TORSO_ERROR / 2) * 180) / Math.PI,
  );
  const kept = physicalStanceBalance.saturate(identity, small, TORSO_ERROR);
  if (
    !(Math.abs(angleOf(kept) - TORSO_ERROR / 2) < PhysicalTolerance.ACCUMULATED)
  )
    failures.push(`a small error became ${angleOf(kept)}`);
  const large = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 60);
  const cut = physicalStanceBalance.saturate(identity, large, TORSO_ERROR);
  if (
    !(Math.abs(angleOf(cut) - TORSO_ERROR) < PhysicalTolerance.ACCUMULATED) ||
    !(cut.z > 0)
  )
    failures.push(`a large error became ${angleOf(cut)} about ${cut.z}`);

  // 6. The swing's drive: 6.2 kg at rest, then accelerating.
  const rest = physicalStanceSwing.swingForce({
    mass: 6.2,
    gravity: 9.81,
    acceleration: { x: 0, y: 0, z: 0 },
  });
  if (
    !(Math.abs(rest.y - 6.2 * 9.81) < PhysicalTolerance.ACCUMULATED) ||
    rest.x !== 0 ||
    rest.z !== 0
  )
    failures.push(`a resting swing is driven by ${JSON.stringify(rest)}`);
  const moving = physicalStanceSwing.swingForce({
    mass: 6.2,
    gravity: 9.81,
    acceleration: { x: 1, y: -2, z: 3 },
  });
  if (
    !(Math.abs(moving.x - 6.2) < PhysicalTolerance.ACCUMULATED) ||
    !(Math.abs(moving.y - 6.2 * 7.81) < PhysicalTolerance.ACCUMULATED) ||
    !(Math.abs(moving.z - 6.2 * 3) < PhysicalTolerance.ACCUMULATED)
  )
    failures.push(
      `an accelerating swing is driven by ${JSON.stringify(moving)}`,
    );

  // 7. Bounds.
  const near = (name: string, actual: number, expected: number): void => {
    if (
      !(
        Math.abs(actual - expected) <=
        PhysicalTolerance.ACCUMULATED * Math.max(1, Math.abs(expected))
      )
    )
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  near(
    "hip-bound swing",
    physicalStanceSwing.swingBound({ effective: 2, length: 0.8, torque: 160 }),
    160 / (2 * 0.8),
  );
  near("shortest swing", AutoMoviePhysicalBalance.duration(0.01, 0, 100), 0.3);
  near(
    "distance-bound swing",
    AutoMoviePhysicalBalance.duration(0.5, 0, 10),
    Math.sqrt((AutoMoviePhysicalBalance.MINIMUM_JERK * 0.5) / 10),
  );
  near(
    "lowered clearance",
    physicalStanceSwing.clearance(0.3, 8, 1, 9.81, 0.1),
    (physicalStanceSwing.LIFT_SHARE * 8 * 9.81 * 0.09) /
      AutoMoviePhysicalBalance.CLEARANCE,
  );
  near(
    "kept clearance",
    physicalStanceSwing.clearance(1, 8, 1, 9.81, 0.1),
    0.1,
  );
  const shifted: IAutoMovieVector3 = physicalStanceSwing.spin(
    { x: 2, y: 0, z: -1 },
    3,
    80,
    9.81,
  );
  near("spin x", shifted.x, (1 * 3) / (80 * 9.81));
  near("spin z", shifted.z, (2 * 3) / (80 * 9.81));
  TestValidator.equals("recovery timing", failures, []);
}
