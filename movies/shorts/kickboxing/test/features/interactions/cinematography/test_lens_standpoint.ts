import assert from "node:assert/strict";

import { LensStandpoint } from "../../../../src/interactions/cinematography/LensStandpoint";
import { RopeLens } from "../../../../src/interactions/cinematography/RopeLens";
import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";
import { polygonCast } from "../../../internal/polygonCast";

/**
 * Where a size's lens stands and how a followed lens is delivered.
 *
 * Scenarios, on hand-placed spheres: a change between the wide camera's
 * sizes and the apron handheld's is a cut, a change within either camera is
 * not; a handheld point the follow carried inside the ropes is delivered on
 * the rope line, at a height in a rope gap the law's gap from every rope; a
 * handheld point out on the apron comes through the ropes to the rope line
 * on its sightline to the target; the wide camera's point is delivered at
 * least the law's height over the top rope.
 */
export function test_lens_standpoint(): void {
  assert.equal(LensStandpoint.cuts("wide", "medium"), true);
  assert.equal(LensStandpoint.cuts("close", "finish"), true);
  assert.equal(LensStandpoint.cuts("medium", "close"), false);
  assert.equal(LensStandpoint.cuts("wide", "finish"), false);

  const cast = polygonCast();
  const { half, ropes } = cast.ring;
  const top: number = Math.max(...ropes);
  const subjects = [
    { center: { x: 0.5, y: 0.9, z: 0 }, radius: 1 },
    { center: { x: -0.5, y: 0.9, z: 0.2 }, radius: 1 },
  ];
  const target = { x: 0, y: 0.9, z: 0.1 };
  const clearOfRopes = (y: number): void => {
    for (const rope of ropes)
      assert.ok(
        Math.abs(y - rope) >= RopeLens.ROPE_GAP - 1e-9,
        `lens at ${y} m against the ${rope} m rope`,
      );
  };

  // Carried inside the ropes at a rope's height: back on the rope line, in a gap.
  const inside = LensStandpoint.deliver(
    cast,
    "medium",
    { x: half - 0.4, y: ropes[2]!, z: 0.3 },
    target,
    subjects,
  );
  const out: number = Math.max(Math.abs(inside.x), Math.abs(inside.z));
  assert.ok(Math.abs(out - half) < 1e-9, `lens ${out} m out`);
  clearOfRopes(inside.y);

  // Out on the apron: brought through the ropes along its sightline.
  const apron = LensStandpoint.deliver(
    cast,
    "close",
    { x: half + 0.5, y: top, z: 0 },
    target,
    subjects,
  );
  assert.ok(Math.abs(apron.x - half) < 1e-9, `x ${apron.x}`);
  assert.ok(apron.z > 0 && apron.z < 0.1, `z ${apron.z}`);
  clearOfRopes(apron.y);

  // The wide camera looks down over the top rope.
  const wide = LensStandpoint.deliver(
    cast,
    "wide",
    { x: 9, y: 1, z: 2 },
    target,
    subjects,
  );
  assert.ok(wide.y >= top + RopeLens.OVER_TOP - 1e-9, `wide lens ${wide.y}`);
  assert.ok(wide.y <= CoverageLaw.WIDE_HEIGHT - cast.ring.platform + 1e-9);
}
