import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { footStrikeChamber } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** A hip 1 m up, the strike line along +Z, a 0.8 m reach. */
const BASE: footStrikeChamber.IPrepared = {
  technique: "side",
  hip: { x: 0, y: 1, z: 0 },
  ankle: { x: 0, y: 0.1, z: 0.1 },
  line: { x: 0, y: 0, z: 1 },
  travel: { x: 0, y: 0, z: 1 },
  reach: 0.8,
};

/**
 * A foot strike's chamber (`footStrikeChamber`): a straight kick chambers 0.45
 * reaches below the hip and 0.25 along the line; an axe 0.6 above and 0.3
 * along; a hook or crescent at the straight fold's length from the hip, toward
 * the ankle drawn back half a reach against the travel.
 *
 * Scenarios:
 *
 * 1. A side kick chambers at (0, 0.64, 0.2). An axe chambers at (0, 1.48, 0.24).
 * 2. A hook chambers 0.8 sqrt(0.265) m from the hip along (0, -0.9, -0.3).
 */
export function test_motions_striking_foot_strike_chamber(): void {
  TestValidator.predicate(
    "straight and axe",
    vclose(footStrikeChamber(BASE), { x: 0, y: 0.64, z: 0.2 }, 1e-12) &&
      vclose(
        footStrikeChamber({ ...BASE, technique: "axe" }),
        { x: 0, y: 1.48, z: 0.24 },
        1e-12,
      ),
  );
  const hook: IAutoMovieVector3 = Vector3.subtract(
    footStrikeChamber({ ...BASE, technique: "hook" }),
    BASE.hip,
  );
  TestValidator.predicate(
    "across",
    nclose(Vector3.length(hook), 0.8 * Math.sqrt(0.265), 1e-12) &&
      vclose(
        Vector3.normalize(hook),
        Vector3.normalize({ x: 0, y: -0.9, z: -0.3 }),
        1e-12,
      ),
  );
}
