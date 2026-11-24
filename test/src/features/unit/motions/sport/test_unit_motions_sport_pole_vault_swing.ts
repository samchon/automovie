import { poleVaultSwing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `poleVaultSwing` admits a swing that reaches the release and reads it at any
 * second by each interval's uniformly accelerated motion, `x + v τ + a τ² / 2`
 * from the interval's start; a failing swing is refused.
 *
 * A 70 kg vaulter plants 3 m behind and 3 m above the tip at 8 m/s on a 700 N
 * pole, which reaches the release.
 *
 * Scenarios:
 *
 * 1. The swing lasts to its last sample and keeps the pole's length.
 * 2. Read on a sample, it is that sample; read 4 ms into an interval, it is the
 *    closed form from the interval's start.
 * 3. A plant moving away from the tip is refused.
 */
export function test_unit_motions_sport_pole_vault_swing(): void {
  const props: poleVaultSwing.IProps = {
    radius: { forward: -3, up: 3 },
    velocity: { forward: 8, up: 0 },
    mass: 70,
    buckling: 700,
    gravity: 9.81,
    upright: 0,
    run: 8,
  };
  const swing: poleVaultSwing.ISwing = poleVaultSwing(props);
  const k: poleVaultSwing.ISample = swing.samples[5]!;
  const tau: number = 0.004;
  const inside: poleVaultSwing.ISample = swing.at(k.seconds + tau);
  TestValidator.predicate(
    "its span and its reading",
    swing.duration === swing.samples[swing.samples.length - 1]!.seconds &&
      nclose(swing.length, 3 * Math.SQRT2, 1e-12) &&
      nclose(swing.at(k.seconds).position.up, k.position.up, 1e-12) &&
      nclose(
        inside.position.forward,
        k.position.forward +
          k.velocity.forward * tau +
          0.5 * k.acceleration.forward * tau * tau,
        1e-12,
      ) &&
      nclose(
        inside.velocity.up,
        k.velocity.up + k.acceleration.up * tau,
        1e-12,
      ),
  );
  TestValidator.predicate(
    "a failing plant refused",
    throwsError(() =>
      poleVaultSwing({ ...props, velocity: { forward: -8, up: 8 } }),
    ),
  );
}
