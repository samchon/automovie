import { poleVaultSwing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A plant 3 m behind and 3 m above the planted tip, at a run's speed. */
const plant = (
  forward: number,
  up: number,
  buckling: number,
): poleVaultSwing.IProps => ({
  radius: { forward: -3, up: 3 },
  velocity: { forward, up },
  mass: 70,
  buckling,
  gravity: 9.81,
  upright: 0,
  run: Math.hypot(forward, up),
});

/**
 * `poleVaultSwing.integrate` swings a vaulter on a bending pole from the plant
 * (the elastic-pole model of Linthorne 2000): at the plant the velocity's part
 * along the pole loses at most `F² / (2 · 250) cos² θ` of its energy (Eq. 1 and
 * 3), then the grip moves under the pole's compressive force and gravity at a
 * 10 ms step until the pole recoils to its length, or the swing fails.
 *
 * The grip stands 3 m behind and 3 m above the tip, `3 sqrt(2)` m of pole; the
 * 70 kg vaulter runs at 8 m/s along +forward, at 45 degrees to the pole.
 *
 * Scenarios:
 *
 * 1. On a 700 N pole the plant keeps `sqrt(64 - 2 · 490 / 70)` = `sqrt(50)` m/s,
 *    since `700² / 500 · cos² 45°` = 490 J is less than the 1120 J the velocity
 *    carries along the pole.
 * 2. That vault reaches the release: the last chord is the pole's length again.
 * 3. A plant moving away from the tip along the pole fails at once.
 * 4. A standing plant on a soft pole swings back before upright.
 */
export function test_unit_motions_sport_pole_vault_swing_integrate(): void {
  const vault: poleVaultSwing.IOutcome = poleVaultSwing.integrate(
    plant(8, 0, 700),
  );
  const first: poleVaultSwing.ISample = vault.samples[0]!;
  const last: poleVaultSwing.ISample = vault.samples[vault.samples.length - 1]!;
  TestValidator.predicate(
    "the plant's kept speed and the release",
    nclose(vault.length, 3 * Math.SQRT2, 1e-12) &&
      nclose(first.velocity.forward, Math.sqrt(50), 1e-12) &&
      first.velocity.up === 0 &&
      vault.failure === null &&
      Math.hypot(last.position.forward, last.position.up) >= vault.length,
  );
  TestValidator.equals(
    "carried away",
    poleVaultSwing.integrate(plant(-8, 8, 700)).failure,
    "the plant carries the body away from the planted pole",
  );
  TestValidator.predicate(
    "swung back",
    poleVaultSwing
      .integrate(plant(0, 0, 10))
      .failure?.startsWith("the body swings back") === true,
  );
}
