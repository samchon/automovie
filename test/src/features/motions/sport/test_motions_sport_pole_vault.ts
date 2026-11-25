import type { IAutoMovieAffordance, IAutoMovieVector3 } from "@automovie/interface";
import { poleVaultBend, poleVaultOnLine, poleVaultSwing, poleVaultTakeoffAngle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A pole hinge at a height along the pole from its tip. */
const hinge = (id: string, y: number): IAutoMovieAffordance => ({
  id,
  kind: "hinge",
  frame: {
    translation: { x: 0, y, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

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
 * The pole vault: the take-off angle, the elastic-pole swing (Linthorne 2000),
 * its reading, the jointed pole's bend and the grip's place on the pole.
 *
 * A 70 kg vaulter plants 3 m behind and 3 m above the tip, `3 sqrt(2)` m of
 * pole, running 8 m/s along +forward at 45 degrees to it.
 *
 * Scenarios:
 *
 * 1. At 9 m/s the take-off angle is 48.8 - 3.51 · 9 = 17.21 degrees.
 * 2. On a 700 N pole the plant keeps `sqrt(64 - 2 · 490 / 70)` = `sqrt(50)` m/s
 *    (`700² / 500 · cos² 45°` = 490 J lost, Eq. 1 and 3) and the vault reaches
 *    the release; a plant moving away from the tip fails at once.
 * 3. Read 4 ms into an interval, the swing is that interval's uniformly
 *    accelerated motion.
 * 4. The pole hinged at 1 m and 2 m is straight at the plant, spanning the whole
 *    pole, and bent mid-swing.
 * 5. A `sqrt(2)` m sphere about a grip 1 m above x = 2 meets a 4 m segment along
 *    +X farthest at (3, 0, 0); a 0.5 m one misses it.
 */
export function test_motions_sport_pole_vault(): void {
  // 1. The take-off angle.
  TestValidator.predicate(
    "the take-off angle",
    nclose(poleVaultTakeoffAngle(9), 17.21, 1e-12),
  );

  // 2. The swing.
  const vault: poleVaultSwing.IOutcome = poleVaultSwing.integrate(
    plant(8, 0, 700),
  );
  const last: poleVaultSwing.ISample = vault.samples[vault.samples.length - 1]!;
  TestValidator.predicate(
    "the plant's kept speed and the release",
    nclose(vault.samples[0]!.velocity.forward, Math.sqrt(50), 1e-12) &&
      vault.failure === null &&
      Math.hypot(last.position.forward, last.position.up) >= vault.length &&
      poleVaultSwing.integrate(plant(-8, 8, 700)).failure !== null,
  );

  // 3. The swing's reading.
  const swing: poleVaultSwing.ISwing = poleVaultSwing(plant(8, 0, 700));
  const k: poleVaultSwing.ISample = swing.samples[5]!;
  const inside: poleVaultSwing.ISample = swing.at(k.seconds + 0.004);
  TestValidator.predicate(
    "the interval's closed form",
    nclose(
      inside.position.forward,
      k.position.forward +
        k.velocity.forward * 0.004 +
        0.5 * k.acceleration.forward * 0.004 ** 2,
      1e-12,
    ),
  );

  // 4. The bend.
  const bend: poleVaultBend.IBend = poleVaultBend(swing, [
    hinge("upper", 2),
    hinge("lower", 1),
  ]);
  TestValidator.predicate(
    "straight at the plant, bent mid-swing",
    nclose(bend.turn(0, 0), 0, 1e-6) &&
      nclose(bend.chain(0).chord, swing.length, 1e-6) &&
      bend.chain(swing.duration / 2).chord < swing.length - 0.01,
  );

  // 5. The grip on the pole.
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const slide: IAutoMovieVector3 = { x: 4, y: 0, z: 0 };
  const grip: IAutoMovieVector3 = { x: 2, y: 1, z: 0 };
  TestValidator.predicate(
    "the farther crossing, or none",
    vclose(
      poleVaultOnLine(from, slide, grip, Math.SQRT2)!,
      { x: 3, y: 0, z: 0 },
      1e-12,
    ) && poleVaultOnLine(from, slide, grip, 0.5) === undefined,
  );
}
