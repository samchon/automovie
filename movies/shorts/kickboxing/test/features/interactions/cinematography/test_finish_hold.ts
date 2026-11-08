import assert from "node:assert/strict";

import { FinishHold } from "../../../../src/interactions/cinematography/FinishHold";
import type { SightLaw } from "../../../../src/laws/cinematography/SightLaw";

/**
 * The finish view's hold after the blow.
 *
 * Scenarios: a bearing that frames every man is kept; one that no longer
 * does turns to the nearest framing bearing of the open half; a bearing
 * outside the open half is never kept even when it frames; with nothing
 * framing, the open bearing is wanted; a lens frames a man whose whole
 * sphere lies in its view, and not one beside it or behind it.
 */
export function test_finish_hold(): void {
  const open: number = 0.4;
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-12, `${x} != ${y}`);
  near(FinishHold.bearing({ open, current: 0.5, frames: () => true }), 0.5);
  near(
    FinishHold.bearing({
      open,
      current: open,
      frames: (b) => b >= open + 2 * FinishHold.SPACING - 1e-9,
    }),
    open + 2 * FinishHold.SPACING,
  );
  const behind: number = open + Math.PI;
  const kept: number = FinishHold.bearing({
    open,
    current: behind,
    frames: () => true,
  });
  assert.ok(
    Math.abs(Math.atan2(Math.sin(kept - open), Math.cos(kept - open))) <=
      Math.PI / 2 + 1e-9,
  );
  near(FinishHold.bearing({ open, current: 1, frames: () => false }), open);

  const scene = {
    seconds: 150,
    watched: [],
  } as unknown as SightLaw.IScene;
  const lens = {
    position: { x: 0, y: 1.5, z: -6 },
    target: { x: 0, y: 1, z: 0 },
  };
  const man = { center: { x: 0, y: 0.9, z: 0 }, radius: 1 };
  assert.equal(FinishHold.frames(lens, [man], scene), true);
  assert.equal(
    FinishHold.frames(
      lens,
      [man, { ...man, center: { x: 20, y: 0.9, z: 0 } }],
      scene,
    ),
    false,
  );
  assert.equal(
    FinishHold.frames(
      lens,
      [{ ...man, center: { x: 0, y: 0.9, z: -9 } }],
      scene,
    ),
    false,
  );
}
