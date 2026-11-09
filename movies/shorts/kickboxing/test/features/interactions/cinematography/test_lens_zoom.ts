import assert from "node:assert/strict";

import { LensZoom } from "../../../../src/interactions/cinematography/LensZoom";
import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";

/**
 * The lens zooms so the subjects fill their share from where it stands.
 *
 * Scenarios: twice as far away, the field of view narrows so the man fills
 * the same share; the fill share is met exactly on the frame's height; a
 * lens too close opens no wider than its zoom's widest field; a lens very
 * far stops at its narrowest; the box zoom reaches narrower than the
 * portable one and both follow 2 atan(sensor / 2 focal).
 */
export function test_lens_zoom(): void {
  const man = [{ center: { x: 0, y: 1, z: 0 }, radius: 1 }];
  const range = CoverageLaw.zoom("wide");
  const at = (d: number) =>
    LensZoom.fieldOfView(
      { position: { x: 0, y: 1, z: -d }, target: { x: 0, y: 1, z: 0 } },
      man,
      0.75,
      CoverageLaw.ASPECT,
      range,
    );
  const near = (x: number, y: number): void =>
    assert.ok(Math.abs(x - y) < 1e-9, `${x} != ${y}`);
  near(Math.tan(at(10) / 2), 1 / 10 / 0.75);
  near(Math.tan(at(20) / 2), 1 / 20 / 0.75);
  near(at(0.5), range.widest);
  near(at(1e5), range.narrowest);
  const portable = CoverageLaw.zoom("medium");
  assert.ok(range.narrowest < portable.narrowest);
  near(
    portable.widest,
    2 * Math.atan(CoverageLaw.SENSOR_HEIGHT / (2 * CoverageLaw.PORTABLE_ZOOM[0])),
  );
}
