import { Vector3 } from "@automovie/engine";
import assert from "node:assert/strict";

import { DefenseShape } from "../../../../src/laws/kickboxing/DefenseShape";
import { TurnoverShape } from "../../../../src/laws/kickboxing/TurnoverShape";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * The Brazilian kick's turnover lands from its own geometry.
 *
 * Scenarios (docs/research/kickboxing/brazilian-kick.md#law): within reach
 * the knee sits a thigh from the hip and the lower leg's reach from the
 * target, above the hip-to-target line, and the ankle, where the instep and
 * distal shin meet, lies on the target; out of reach the knee lies on
 * the line a thigh out; the apex holds the foot a shank above the knee; at
 * the turnover's range the highest knee clears the sunk receiver's shoulder
 * line while the fighters stand a leg apart rather than chest to chest.
 */
export function test_turnover_shape(): void {
  const { a, b } = polygonCast();
  const m = a.body.measure;
  const hip = { x: 0, y: TurnoverShape.hip(m), z: -m.hipHalfWidth };
  const target = { x: 0.6, y: 1.5, z: 0 };
  const { knee, point } = TurnoverShape.impact(hip, target, m);
  const near = (p: number, q: number, what: string): void =>
    assert.ok(Math.abs(p - q) < 1e-9, `${what}: ${p} vs ${q}`);
  near(Vector3.length(Vector3.subtract(knee, hip)), m.thigh, "thigh");
  near(
    Vector3.length(Vector3.subtract(target, knee)),
    TurnoverShape.lower(m),
    "lower leg",
  );
  near(Vector3.length(Vector3.subtract(target, point)), 0, "instep");
  const along: number = (knee.x - hip.x) / (target.x - hip.x);
  assert.ok(
    knee.y > hip.y + (target.y - hip.y) * along,
    "the knee rises above the hip-to-target line",
  );
  const far = { x: 2, y: 1.5, z: 0 };
  const out = TurnoverShape.impact(hip, far, m);
  near(Vector3.length(Vector3.subtract(out.knee, hip)), m.thigh, "far thigh");
  const top = TurnoverShape.apex(knee, target, m);
  near(Vector3.length(Vector3.subtract(top, knee)), m.shank, "apex shank");
  assert.ok(top.y > knee.y, "the foot rises over the knee before it drops");
  // At the range the shape lands from, the knee climbs over the guard.
  const r = b.body.measure;
  const range = TurnoverShape.range(m, r);
  assert.ok(range > TurnoverShape.lower(m), "a leg apart, not chest to chest");
  assert.ok(range < m.thigh + TurnoverShape.lower(m), "inside the leg's reach");
  const struck = {
    x: range,
    y: r.head - 1.5 * r.headRadius - DefenseShape.sink(r),
    z: 0,
  };
  const landed = TurnoverShape.impact(
    { x: 0, y: TurnoverShape.hip(m), z: 0 },
    struck,
    m,
  );
  assert.ok(
    landed.knee.y > r.shoulder - DefenseShape.sink(r),
    `knee ${landed.knee.y} above the sunk shoulder line`,
  );
}
