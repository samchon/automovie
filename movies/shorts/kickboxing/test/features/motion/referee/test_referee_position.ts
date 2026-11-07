import assert from "node:assert/strict";

import { Blocking } from "../../../../src/motion/defense/Blocking";
import { BoutRing } from "../../../../src/motion/footwork/BoutRing";
import { RefereePosition } from "../../../../src/motion/referee/RefereePosition";
import { FilmVector as V } from "../../../../src/motion/rig/FilmVector";
import { BoutScript } from "../../../../src/shots/kickboxing/ring-bout/BoutScript";

/**
 * The referee keeps a side view across the fighters' line, as far out as the
 * ring allows, closes in on the ropes and in the clinch, and walks.
 *
 * Scenarios:
 * 1. In open ring his desired point lies across the line at the far distance; in a clinch or on the ropes at the near one.
 * 2. A desired point that jumps is reached no faster than walking speed.
 * 3. Over the composed bout he holds a side view at least 90% of the time, never stands between the fighters, stays inside the ropes and walks at least a metre in every fifteen-second group.
 */
export function test_referee_position(): void {
  const open: RefereePosition.IPair = { a: [-0.9, 0, 0], b: [0.9, 0, 0], clinch: false };
  const wide: V.Value = RefereePosition.desired(open, 1);
  assert.ok(Math.abs(wide[0]) < 1e-9 && Math.abs(Math.abs(wide[2]) - RefereePosition.FAR) < 1e-9, "far, across the line");
  const near: V.Value = RefereePosition.desired({ ...open, clinch: true }, 1);
  assert.ok(Math.abs(Math.abs(near[2]) - RefereePosition.NEAR) < 1e-9, "close in the clinch");
  const roped: RefereePosition.IPair = { a: [1.0, 0, 0], b: [2.6, 0, 0], clinch: false };
  assert.ok(Math.abs(V.distance(RefereePosition.desired(roped, 1), [1.8, 0, 0]) - RefereePosition.NEAR) < 1e-9, "close on the ropes");

  // 2. Walking speed bound.
  const track: V.Value[] = RefereePosition.simulate([open, open, open], [0, 0, -2.6]);
  assert.ok(V.distance(track[1]!, track[0]!) <= RefereePosition.WALK * BoutRing.STEP + 1e-12);

  // 3. The composed bout.
  let side: number = 0;
  let samples: number = 0;
  const walked: number[] = [];
  let previous: V.Value | undefined;
  for (let t: number = BoutScript.TOUCHED; t < BoutScript.KNOCKOUT; t += BoutRing.STEP) {
    const pair: Blocking.Pair = Blocking.pair(t);
    const at: V.Value = RefereePosition.at(t);
    const a: V.Value = [pair.a.origin[0], 0, pair.a.origin[1]];
    const b: V.Value = [pair.b.origin[0], 0, pair.b.origin[1]];
    const centre: V.Value = V.lerp(a, b, 0.5);
    const line: V.Value = V.normalize(V.sub(b, a));
    const away: V.Value = V.sub(at, centre);
    if (Math.abs(V.dot(V.normalize(away), line)) <= 0.5) side++;
    samples++;
    // Distance from the segment between the fighters.
    const u: number = Math.max(0, Math.min(1, V.dot(V.sub(at, a), V.sub(b, a)) / V.dot(V.sub(b, a), V.sub(b, a))));
    assert.ok(V.distance(at, V.lerp(a, b, u)) > 0.5, `between the fighters at ${t.toFixed(2)}`);
    assert.ok(BoutRing.room(at) >= RefereePosition.MARGIN - 1e-9, "inside the ropes");
    const group: number = Math.floor(t / 15);
    if (previous) walked[group] = (walked[group] ?? 0) + V.distance(at, previous);
    previous = at;
  }
  assert.ok(side / samples >= 0.9, `side view ${(side / samples).toFixed(3)}`);
  walked.forEach((metres: number, group: number): void => assert.ok(metres >= 1, `walked ${metres.toFixed(2)} m in ${group * 15}–${group * 15 + 15}`));
}
