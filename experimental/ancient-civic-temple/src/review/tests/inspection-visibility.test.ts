/** Roof-off inspection covers independent coverings and preserves the shell. */
import assert from "node:assert/strict";
import test from "node:test";
import { isTempleRoofCovering } from "../../viewer/inspection-visibility.mjs";

void test("roof-off recognizes slab, ceiling, tile and exposed roof timber families", () => {
  for (const id of ["model.roof.sanctuary", "model.ceilings", "tile.roof", "tile.ridge.22", "rafter.north", "truss.sanctuary", "joist.low"])
    assert.equal(isTempleRoofCovering(id), true, id);
});

void test("roof-off retains walls, columns, opening frames and unrelated model identities", () => {
  for (const id of ["model.wall", "column.colonnade.12", "frame.door-entry", "beam.colonnade.north", "fixture.fountain", "roof", "tile", ""])
    assert.equal(isTempleRoofCovering(id), false, id);
});
