import assert from "node:assert/strict";

import { KickboxingTechnique } from "../../../../src/laws/kickboxing/KickboxingTechnique";
import { KickboxingTiming } from "../../../../src/laws/kickboxing/KickboxingTiming";
import { PunchShape } from "../../../../src/laws/kickboxing/PunchShape";
import { StanceShape } from "../../../../src/laws/kickboxing/StanceShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The fist reaches the measured peak speed on its own path.
 *
 * Scenarios: a cross from the guard to the receiver's face has a path a
 * little longer than the straight line; its extension is timed from that
 * path so the fist's fastest travel equals the measured peak; a longer
 * path extends for longer; the extension never outlasts the delivery; the
 * startup shows the load share, contact shows the whole punch and the
 * return ends at the guard.
 */
export function test_punch_shape(): void {
  const { a } = polygonCast();
  const measure = a.body.measure;
  const guard = StanceShape.guard(measure);
  const cross = KickboxingTechnique.table.cross;
  const target = { x: 0.7, y: measure.head - guard.drop, z: 0 };
  const input = { measure, guard, target };
  const path: number = PunchShape.path(input, cross);
  const start = guard.hands.right.point;
  assert.ok(
    path >=
      Math.hypot(target.x - start.x, target.y - start.y, target.z - start.z) -
        measure.gloveRadius,
  );
  const delivery: number = KickboxingTiming.delivery("cross", "jab");
  const extension: number = PunchShape.extension(delivery, path);
  assert.ok(extension > 0 && extension <= delivery);
  // The fastest step of the fist along its path at the measured peak.
  const steps: number = 2000;
  let fastest: number = 0;
  for (let k = 1; k <= steps; k++) {
    const t0 = ((k - 1) / steps) * delivery;
    const t1 = (k / steps) * delivery;
    const d =
      (PunchShape.amount(t1, delivery, path) -
        PunchShape.amount(t0, delivery, path)) *
      path;
    fastest = Math.max(fastest, d / (t1 - t0));
  }
  assert.ok(Math.abs(fastest - PunchShape.PEAK_SPEED) < 0.05, `${fastest}`);
  assert.ok(PunchShape.extension(delivery, 2 * path) > extension);
  assert.equal(PunchShape.extension(0.05, 10), 0.05);
  const load: number = delivery - extension;
  assert.ok(
    Math.abs(PunchShape.amount(load, delivery, path) - PunchShape.LOAD) < 1e-12,
  );
  assert.equal(PunchShape.amount(delivery, delivery, path), 1);
  assert.equal(
    PunchShape.amount(
      delivery + KickboxingTiming.HAND_RECOVERY,
      delivery,
      path,
    ),
    0,
  );
}
