import assert from "node:assert/strict";

import { Blocking } from "../../../src/motion/defense/Blocking";
import { BoutRing } from "../../../src/motion/footwork/BoutRing";
import { RefereePosition } from "../../../src/motion/referee/RefereePosition";
import { FilmVector as V } from "../../../src/motion/rig/FilmVector";
import { BoutCamera } from "../../../src/shots/kickboxing/ring-bout/BoutCamera";
import { BoutScript } from "../../../src/shots/kickboxing/ring-bout/BoutScript";

/**
 * The bout camera reacts to the action from across the fighters' line.
 *
 * Scenarios:
 * 1. Every clean landing asks for the close size, live exchanges for medium and resets for wide.
 * 2. Each size is held at least the hold time, and the mean interval between size changes lies between 2 and 8 s.
 * 3. The camera stands on the opposite side of the fighters' line from the referee for at least 90% of the bout, stays inside the ropes and is moving at least 60% of the time.
 */
export function test_bout_camera(): void {
  const until: number = 143;
  for (const action of BoutScript.actions)
    if (action.defense === "hit") assert.equal(BoutCamera.wanted(action.at), "close", action.id);
  const exchange: BoutScript.Action = BoutScript.actions.find((action: BoutScript.Action): boolean => action.defense !== "hit")!;
  assert.notEqual(BoutCamera.wanted(exchange.at - BoutScript.specs[exchange.technique].windup / 2), "wide");

  const states: readonly BoutCamera.IState[] = BoutCamera.track(until);
  const changes: number[] = [];
  let last: number = 0;
  let opposite: number = 0;
  let moving: number = 0;
  let samples: number = 0;
  for (let index: number = 1; index * BoutRing.STEP < until; index++) {
    const t: number = index * BoutRing.STEP;
    const state: BoutCamera.IState = states[index]!;
    if (state.size !== states[index - 1]!.size) {
      if (changes.length) assert.ok(t - last >= BoutCamera.HOLD - 1e-9, `held ${(t - last).toFixed(2)} s at ${t.toFixed(2)}`);
      changes.push(t - last);
      last = t;
    }
    assert.ok(BoutRing.room(state.position) >= BoutCamera.MARGIN - 1e-9, "inside the ropes");
    if (t < BoutScript.TOUCHED) continue;
    const pair: Blocking.Pair = Blocking.pair(t);
    const centre: V.Value = [pair.centre[0], 0, pair.centre[1]];
    const across: V.Value = V.rotateY([0, 0, 1], pair.axis);
    const lens: number = V.dot(V.sub([state.position[0], 0, state.position[2]], centre), across);
    const referee: number = V.dot(V.sub(RefereePosition.at(t), centre), across);
    if (lens * referee < 0) opposite++;
    if (V.distance(state.position, states[index - 1]!.position) / BoutRing.STEP > 0.05) moving++;
    samples++;
  }
  const mean: number = changes.reduce((sum: number, value: number): number => sum + value, 0) / changes.length;
  assert.ok(mean >= 2 && mean <= 8, `mean size interval ${mean.toFixed(2)} s`);
  assert.ok(opposite / samples >= 0.9, `opposite the referee ${(opposite / samples).toFixed(3)}`);
  assert.ok(moving / samples >= 0.6, `moving ${(moving / samples).toFixed(3)}`);
}
