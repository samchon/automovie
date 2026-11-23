import { Quaternion, physicalStanceBalance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The recovery's contact and timing rules match their closed forms without a
 * simulation:
 *
 * 1. Lift-off: a limb about to swing lifts once its share has ramped out and its
 *    measured load is under `RELEASE` of the weight, or after `UNLOAD`; never
 *    while its share is still ramping (Pratt et al., M2V2, Section VII-A).
 * 2. Early touchdown: a lifted foot's load above `TOUCH` of the weight lands it
 *    only once held for `DWELL`; a load under it restarts the count (Stephens
 *    2011, Figure 4.6).
 * 3. Second step: none while a landed foot ramps in, and then only after the
 *    capture point has stayed outside for `DWELL` (Pratt et al., M2V2, Section
 *    IX-C).
 * 4. Tilt guard: the tilt plus the body's rotation rate |k_h| / I_h over omega
 *    against the range, the vertical momentum left out.
 * 5. Saturation: an orientation error within the limit is kept; a larger one is
 *    shortened to the limit about the same axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceBalance.release`, `touchdown`, `ready`, `tipping` and `saturate` and reads their values.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the stated thresholds and the closed-form rate and angle evaluated by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a loaded from an unloaded limb, a waited one from a fresh one, a held load from a scuff, a ramping landing from a settled one, horizontal from vertical momentum, and a small error from a saturated one.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_recovery_timing(): void {
  const failures: string[] = [];
  const check = (name: string, actual: boolean, expected: boolean): void => {
    if (actual !== expected) failures.push(`${name}: ${actual}`);
  };
  const W: number = 700;
  const {
    RELEASE,
    TOUCH,
    DWELL,
    UNLOAD,
    TORSO_ERROR,
  }: typeof physicalStanceBalance = physicalStanceBalance;

  // 1. Lift-off on the measured load.
  const release = (bearing: number, load: number, waited: number): boolean =>
    physicalStanceBalance.release({ bearing, load, weight: W, waited });
  check("ramping limb", release(0.4, 0, 0), false);
  check("loaded limb", release(0, 1.5 * RELEASE * W, 0.05), false);
  check("unloaded limb", release(0, 0.5 * RELEASE * W, 0.05), true);
  check("waited limb", release(0, 1.5 * RELEASE * W, UNLOAD), true);

  // 2. Early touchdown held for DWELL.
  const first = physicalStanceBalance.touchdown({
    load: 2 * TOUCH * W,
    weight: W,
    since: undefined,
    seconds: 1,
  });
  check("touch starts", first.since === 1 && !first.landed, true);
  const held = physicalStanceBalance.touchdown({
    load: 2 * TOUCH * W,
    weight: W,
    since: first.since,
    seconds: 1 + DWELL,
  });
  check("held touch lands", held.landed, true);
  const scuff = physicalStanceBalance.touchdown({
    load: 0.5 * TOUCH * W,
    weight: W,
    since: first.since,
    seconds: 1 + DWELL,
  });
  check("scuff restarts", scuff.since === undefined && !scuff.landed, true);

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
  if (!(Math.abs(angleOf(kept) - TORSO_ERROR / 2) < 1e-9))
    failures.push(`a small error became ${angleOf(kept)}`);
  const large = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 60);
  const cut = physicalStanceBalance.saturate(identity, large, TORSO_ERROR);
  if (!(Math.abs(angleOf(cut) - TORSO_ERROR) < 1e-9) || !(cut.z > 0))
    failures.push(`a large error became ${angleOf(cut)} about ${cut.z}`);

  TestValidator.equals("recovery timing", failures, []);
}
