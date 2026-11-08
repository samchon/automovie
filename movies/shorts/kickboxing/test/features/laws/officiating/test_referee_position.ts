import assert from "node:assert/strict";

import { KnockdownCount } from "../../../../src/laws/officiating/KnockdownCount";
import { RefereePosition } from "../../../../src/laws/officiating/RefereePosition";

/**
 * The referee stands side-on across the line, closes on the ropes, goes
 * around rather than between, walks no faster than 1.39 m/s, and counts one
 * number per second toward the farthest neutral corner.
 *
 * Scenarios: an open-ring goal is perpendicular to the line (a side view of
 * ninety degrees) and farther than a close goal; a side with no room flips;
 * a walk step never exceeds the speed; a point on the segment between the
 * fighters is "between" and one off its end is not; "Three!" lands three
 * seconds after the count's start, numbers outside one to ten are refused;
 * the farther neutral corner is chosen.
 */
export function test_referee_position(): void {
  const ring = { half: 3, margin: 0.4, step: 0.3 };
  const a = { x: -0.6, z: 0 };
  const b = { x: 0.6, z: 0 };
  const open = RefereePosition.goal({
    a,
    b,
    side: 1,
    close: false,
    ring,
    reach: 0.7,
  });
  const close = RefereePosition.goal({
    a,
    b,
    side: 1,
    close: true,
    ring,
    reach: 0.7,
  });
  assert.ok(
    Math.abs(RefereePosition.view(open.point, a, b) - Math.PI / 2) < 1e-9,
  );
  assert.ok(
    RefereePosition.view(open.point, a, b) >= RefereePosition.SIDE_VIEW,
  );
  assert.ok(
    Math.hypot(open.point.x, open.point.z) >
      Math.hypot(close.point.x, close.point.z),
  );
  const cornered = RefereePosition.goal({
    a: { x: -0.6, z: 2.4 },
    b: { x: 0.6, z: 2.4 },
    side: 1,
    close: false,
    ring,
    reach: 0.7,
  });
  assert.equal(cornered.side, -1);
  const next = RefereePosition.walk({ x: 0, z: 0 }, { x: 10, z: 0 }, 0.5);
  assert.ok(Math.abs(next.x - RefereePosition.SPEED * 0.5) < 1e-12);
  assert.ok(RefereePosition.between({ x: 0, z: 0.1 }, a, b, 0.4));
  assert.ok(!RefereePosition.between({ x: 1, z: 0 }, a, b, 0.4));
  assert.equal(KnockdownCount.number(157, 3), 160);
  assert.equal(KnockdownCount.number(157, KnockdownCount.TEN), 167);
  assert.throws(() => KnockdownCount.number(157, 11));
  assert.deepEqual(
    KnockdownCount.corner(
      [
        { x: 3, z: 3 },
        { x: -3, z: -3 },
      ],
      { x: -1, z: -1 },
    ),
    { x: 3, z: 3 },
  );
}
