import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { hookSetTip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A rod lying ahead: its +Y turned a quarter about +X onto +Z. */
const AHEAD: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
  { x: 1, y: 0, z: 0 },
  90,
);

/**
 * The hook set's own logic: the rod turns about the horizontal axis square to
 * it on a minimum-jerk course, its tip rising, the grip kept, then holds
 * `HOLD` (0.3 s).
 *
 * Scenarios:
 *
 * 1. A rod lying ahead set 60 degrees over 0.5 s points `(0, sin 60, cos 60)` at
 *    the set, the grip at (0, 1, 0.3) unmoved, and lasts 0.8 s with `set` at
 *    0.625 of it.
 * 2. At the start the grip is unturned.
 * 3. A lift past `LIFT` (90 degrees), or a set of no time, is refused.
 */
export function test_unit_motions_tasks_hook_set(): void {
  const grip: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0.3 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const tip: hookSetTip.ITip = hookSetTip(AHEAD, grip, {
    angle: 60,
    duration: 0.5,
  });
  const r: number = Math.PI / 3;
  TestValidator.predicate(
    "the tip raised at the set",
    vclose(
      Quaternion.rotateVector(tip.turned(0.5).rotation, { x: 0, y: 0, z: 1 }),
      { x: 0, y: Math.sin(r), z: Math.cos(r) },
      1e-12,
    ) &&
      vclose(tip.turned(0.5).position, grip.position, 0) &&
      vclose(
        Quaternion.rotateVector(tip.turned(0).rotation, { x: 0, y: 0, z: 1 }),
        { x: 0, y: 0, z: 1 },
        1e-12,
      ) &&
      nclose(tip.duration, 0.8, 1e-12) &&
      nclose(tip.events[0]!.share, 0.625, 1e-12),
  );
  TestValidator.predicate(
    "too far, or no time",
    throwsError(() => hookSetTip(AHEAD, grip, { angle: 100, duration: 0.5 })) &&
      throwsError(() => hookSetTip(AHEAD, grip, { angle: 60, duration: 0 })),
  );
}