import { buildAutoMovieWall } from "@automovie/engine";
import assert from "node:assert/strict";
import { localCut } from "./localCut";
import { type Frame } from "./Frame";

/** Pure regression cases for the production's world-to-wall opening adapter.
 * They exercise the same exported adapter as facades and room linings, then
 * ask the public engine to accept bounded cuts and refuse cuts outside them.
 * Expected offsets come from the two measured wall ends, in metres. No test
 * changes engine tolerances or the production's dimensions. */
export function verifyWallOpeningCoordinates(): number {
  let checked = 0;
  for (const along of ["x", "z"] as const) {
    for (const normal of [-1, 1] as const) {
      const frame: Frame = {
        id: "test-wall", along, normal, plane: 0,
        a: 3.02, b: 5.26, floor: 3.2, top: 6.1,
        depth: 0.006, spaces: ["test-room"],
      };
      const positive = along === "x" ? normal === 1 : normal === -1;
      const build = (a: number, b: number, sill: number, head: number) => {
        const cut = localCut(frame, "opening", a, b, sill, head);
        return {
          cut, mesh: buildAutoMovieWall({
            width: frame.b - frame.a, height: frame.top - frame.floor,
            depth: frame.depth, openings: [cut],
          })
        };
      };
      const fullWidth = build(3.02, 5.26, 3.28, 6.04);
      assert.equal(fullWidth.cut.x, 0);
      assert.equal(fullWidth.cut.width, frame.b - frame.a);
      assert.ok(fullWidth.mesh.indices);
      assert.ok(fullWidth.mesh.indices.length > 0);
      checked++;

      const interior = build(3.5, 4.5, 3.5, 6.1);
      assert.ok(Math.abs(interior.cut.x - (positive ? 0.48 : 0.76)) < 1e-12);
      assert.equal(interior.cut.width, 1);
      assert.equal(interior.cut.y + interior.cut.height, frame.top - frame.floor);
      checked++;

      for (const bounds of [
        [3.019, 4.5, 3.5, 6], [3.5, 5.261, 3.5, 6],
        [3.5, 4.5, 3.199, 6], [3.5, 4.5, 3.5, 6.101],
      ] as const) {
        assert.throws(() => build(bounds[0], bounds[1], bounds[2], bounds[3]), /must stay inside the wall/);
        checked++;
      }
    }
  }
  return checked;
}
