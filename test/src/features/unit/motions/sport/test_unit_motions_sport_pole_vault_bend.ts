import type { IAutoMovieAffordance } from "@automovie/interface";
import { poleVaultBend, poleVaultSwing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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

/**
 * `poleVaultBend` lays a jointed pole along the pinned elastica its swing's
 * chord asks (the bent pole's shape): each link's direction is the elastica's
 * slope at the link's middle, so the hinges turn between them, and the chain's
 * chord is what its links span.
 *
 * A 70 kg vaulter plants 3 m behind and 3 m above the tip at 8 m/s on a 700 N
 * pole, `3 sqrt(2)` m of it; the pole hinges at 2 m and 1 m from its tip.
 *
 * Scenarios:
 *
 * 1. The hinges are listed from the tip up.
 * 2. At the plant the pole is straight: no hinge turns and the chain spans the
 *    whole pole with its top along the chord.
 * 3. Mid-swing the pole is bent: its chain spans less than its length.
 */
export function test_unit_motions_sport_pole_vault_bend(): void {
  const swing: poleVaultSwing.ISwing = poleVaultSwing({
    radius: { forward: -3, up: 3 },
    velocity: { forward: 8, up: 0 },
    mass: 70,
    buckling: 700,
    gravity: 9.81,
    upright: 0,
    run: 8,
  });
  const bend: poleVaultBend.IBend = poleVaultBend(swing, [
    hinge("upper", 2),
    hinge("lower", 1),
  ]);
  const straight: poleVaultBend.IChain = bend.chain(0);
  TestValidator.equals("from the tip up", bend.hinges, ["lower", "upper"]);
  TestValidator.predicate(
    "straight at the plant",
    nclose(bend.turn(0, 0), 0, 1e-6) &&
      nclose(bend.turn(1, 0), 0, 1e-6) &&
      nclose(straight.chord, swing.length, 1e-6) &&
      nclose(straight.top, 0, 1e-6),
  );
  TestValidator.predicate(
    "bent mid-swing",
    bend.chain(swing.duration / 2).chord < swing.length - 0.01,
  );
}
