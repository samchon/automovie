import {
  Quaternion,
  physicalCaptureBand,
  physicalStanceBalance,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

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
 *    reloaded before it has cleared the floor stays swinging however long it
 *    is pressed: its load is the floor it never left, not a landing
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
 * 7. Band: a capture point parked 1.5 cm past the shrunken support, past a
 *    0.5 cm margin, steps 1 / omega after it entered; one converging inward
 *    as e^(-omega t) through the band never steps, nor one within the margin
 *    (Koolen et al., Corollary 3; design-4017-edge, E3). A parked one whose
 *    step would not capture holds, and steps as soon as a capturing step
 *    appears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and its closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceBalance.release`, `touchdown`, `ready`, `tipping`, `saturate` and `swingForce` and reads their values.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the stated thresholds and the closed-form rate, angle and force evaluated by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a loaded from an unloaded limb, a long-waiting loaded one from an unloaded one, a held load from a single substep's, a cleared foot's load from one that never left the floor, a rising foot's scrape from a descending foot's touchdown, a ramping landing from a settled one, horizontal from vertical momentum, a small error from a saturated one, a resting swing from an accelerating one, a parked capture point from a converging one, and a capturing step from one that does not capture.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_recovery_timing(): void {
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
  if (!(Math.abs(angleOf(kept) - TORSO_ERROR / 2) < 1e-9))
    failures.push(`a small error became ${angleOf(kept)}`);
  const large = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 60);
  const cut = physicalStanceBalance.saturate(identity, large, TORSO_ERROR);
  if (!(Math.abs(angleOf(cut) - TORSO_ERROR) < 1e-9) || !(cut.z > 0))
    failures.push(`a large error became ${angleOf(cut)} about ${cut.z}`);

  // 6. The swing's drive: 6.2 kg at rest, then accelerating.
  const rest = physicalStanceBalance.swingForce({
    mass: 6.2,
    gravity: 9.81,
    acceleration: { x: 0, y: 0, z: 0 },
  });
  if (
    !(Math.abs(rest.y - 6.2 * 9.81) < 1e-9) ||
    rest.x !== 0 ||
    rest.z !== 0
  )
    failures.push(`a resting swing is driven by ${JSON.stringify(rest)}`);
  const moving = physicalStanceBalance.swingForce({
    mass: 6.2,
    gravity: 9.81,
    acceleration: { x: 1, y: -2, z: 3 },
  });
  if (
    !(Math.abs(moving.x - 6.2) < 1e-9) ||
    !(Math.abs(moving.y - 6.2 * 7.81) < 1e-9) ||
    !(Math.abs(moving.z - 6.2 * 3) < 1e-9)
  )
    failures.push(`an accelerating swing is driven by ${JSON.stringify(moving)}`);

  // 7. The band past the shrunken support, omega 3.2 per second.
  const omega: number = 3.2;
  const band = (
    excess: (t: number) => number,
    seconds: number,
    viable: (t: number) => boolean = (): boolean => true,
  ): number | undefined => {
    let open: { since: number; excess: number } | undefined = undefined;
    for (let t: number = 0; t <= seconds + 1e-12; t += dt) {
      const step: { band?: { since: number; excess: number }; due: boolean } =
        physicalCaptureBand({
          ...(open ? { band: open } : {}),
          excess: excess(t),
          margin: 0.005,
          seconds: t,
          omega,
          viable: viable(t),
        });
      if (step.due) return t;
      open = step.band;
    }
    return undefined;
  };
  const parked: number | undefined = band(() => 0.015, 2);
  if (parked === undefined || Math.abs(parked - 1 / omega) > dt + 1e-9)
    failures.push(`a capture point parked 1 cm past the band steps at ${parked}`);
  const converging: number | undefined = band(
    (t: number) => 0.03 * Math.exp(-omega * t),
    2,
  );
  if (converging !== undefined)
    failures.push(`a converging capture point steps at ${converging}`);
  if (band(() => 0.004, 2) !== undefined)
    failures.push("a capture point within the margin steps");
  // A parked capture point whose step would not capture holds instead, and
  // steps at once when a capturing step appears.
  const hopeless: number | undefined = band(
    () => 0.015,
    2,
    (): boolean => false,
  );
  if (hopeless !== undefined)
    failures.push(`a parked capture point steps without a capturing step at ${hopeless}`);
  const later: number | undefined = band(
    () => 0.015,
    2,
    (t: number): boolean => t >= 1,
  );
  if (later === undefined || Math.abs(later - 1) > dt + 1e-9)
    failures.push(`a capturing step appearing at 1 s is taken at ${later}`);

  TestValidator.equals("recovery timing", failures, []);
}
