import type { IAutoMovieVector3 } from "@automovie/interface";
import { KneeForm, KneeReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/** A hip 1 m up, a 0.45 m thigh, a 0.05 m patella, a 0.4 m shank. */
const solve = (target: IAutoMovieVector3): ReturnType<typeof KneeReach.solve> =>
  KneeReach.solve({ x: 0, y: 1, z: 0 }, target, 0.45, 0.05, 0.4, 0.1, {
    x: 0,
    y: 0,
    z: 1,
  });

/**
 * A knee strike's reach (`KneeReach.solve`, `swing`, `foot`): the thigh rises
 * to the target's elevation within the hip's range (up to `HIP_FLEXION - 90 +
 * LEAN`, down to `LOWEST`), the hip thrusts along the level heading within the
 * travel to close the rest, and the shank folds `FLEXION` below the thigh; the
 * swing turns one direction toward another on their great circle; the foot
 * points `PLANTAR` down from the level heading across the shank.
 *
 * Scenarios:
 *
 * 1. A target 0.5 m ahead at hip height is reached without thrust: the knee at (0,
 *    1, 0.45), the ankle 0.4 m on along (0, -sin 45, -cos 45).
 * 2. One 0.8 m ahead is short, thrust the whole 0.1 m travel; one 0.3 m ahead is
 *    jammed; one rising 40 degrees, beyond the hip's 28, is short.
 * 3. Halfway from +X to +Y swings to (sqrt ½, sqrt ½, 0); a parallel swing is its
 *    end.
 * 4. A shank down -Y heading +Z points the toes (0, -sqrt ½, sqrt ½) and the
 *    instep (0, sqrt ½, sqrt ½).
 */
export function test_motions_striking_knee_reach(): void {
  const r: number = Math.SQRT1_2;
  const reached = solve({ x: 0, y: 1, z: 0.5 });
  TestValidator.predicate(
    "reached",
    KneeForm.FLEXION === 135 &&
      KneeForm.HIP_FLEXION - 90 + KneeForm.LEAN === 28 &&
      reached.status === "reached" &&
      vclose(reached.thrust, { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(reached.knee, { x: 0, y: 1, z: 0.45 }, 1e-12) &&
      vclose(reached.ankle, { x: 0, y: 1 - 0.4 * r, z: 0.45 - 0.4 * r }, 1e-12),
  );
  const far = solve({ x: 0, y: 1, z: 0.8 });
  TestValidator.predicate(
    "short, jammed and too high",
    far.status === "short" &&
      vclose(far.thrust, { x: 0, y: 0, z: 0.1 }, 1e-12) &&
      vclose(far.knee, { x: 0, y: 1, z: 0.55 }, 1e-12) &&
      solve({ x: 0, y: 1, z: 0.3 }).status === "jammed" &&
      solve({
        x: 0,
        y: 1 + 0.5 * Math.sin((40 * Math.PI) / 180),
        z: 0.5 * Math.cos((40 * Math.PI) / 180),
      }).status === "short",
  );
  TestValidator.predicate(
    "the swing",
    vclose(
      KneeReach.swing({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, 0.5),
      { x: r, y: r, z: 0 },
      1e-12,
    ) &&
      vclose(
        KneeReach.swing({ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, 0.5),
        { x: 2, y: 0, z: 0 },
        1e-12,
      ),
  );
  const foot = KneeReach.foot({ x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 });
  TestValidator.predicate(
    "the foot",
    KneeForm.PLANTAR === 45 &&
      vclose(foot.toes, { x: 0, y: -r, z: r }, 1e-12) &&
      vclose(foot.instep, { x: 0, y: r, z: r }, 1e-12),
  );
}
