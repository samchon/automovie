import assert from "node:assert/strict";

import { FinishHold } from "../../../../src/interactions/cinematography/FinishHold";
import type { SightLaw } from "../../../../src/laws/cinematography/SightLaw";

/**
 * The finish view's hold after the blow.
 *
 * Scenarios: a bearing that frames every man is kept; one that no longer
 * does turns to the nearest framing bearing of the open half; a bearing
 * outside the open half is never kept even when it frames; with nothing
 * framing, the open half's best-framing bearing is wanted; a lens frames a
 * man whose whole sphere lies in its view far enough away, and not one
 * beside it, behind it or so near the lens that it cannot hold him whole.
 */
export function test_finish_hold(): void {
  const open: number = 0.4;
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-12, `${x} != ${y}`);
  near(FinishHold.bearing({ open, current: 0.5, margin: () => 1 }), 0.5);
  near(
    FinishHold.bearing({
      open,
      current: open,
      margin: (b) => (b >= open + 2 * FinishHold.SPACING - 1e-9 ? 1 : -1),
    }),
    open + 2 * FinishHold.SPACING,
  );
  const kept: number = FinishHold.bearing({
    open,
    current: open + Math.PI,
    margin: () => 1,
  });
  assert.ok(
    Math.abs(Math.atan2(Math.sin(kept - open), Math.cos(kept - open))) <=
      Math.PI / 2 + 1e-9,
  );
  const best: number = open - 3 * FinishHold.SPACING;
  near(
    FinishHold.bearing({
      open,
      current: open,
      margin: (b) => -Math.abs(b - best) - 0.1,
    }),
    best,
  );

  const scene = { seconds: 150, watched: [] } as unknown as SightLaw.IScene;
  const lens = {
    position: { x: 0, y: 1.5, z: -6 },
    target: { x: 0, y: 1, z: 0 },
  };
  const man = { center: { x: 0, y: 0.9, z: 0 }, radius: 1 };
  assert.ok(FinishHold.margin(lens, [man], scene) > 0);
  assert.ok(
    FinishHold.margin(
      lens,
      [man, { ...man, center: { x: 20, y: 0.9, z: 0 } }],
      scene,
    ) < 0,
  );
  assert.ok(
    FinishHold.margin(
      lens,
      [{ ...man, center: { x: 0, y: 0.9, z: -9 } }],
      scene,
    ) < 0,
  );
  assert.ok(
    FinishHold.margin(
      lens,
      [{ ...man, center: { x: 0, y: 1.4, z: -4.5 } }],
      scene,
    ) < 0,
  );
}
