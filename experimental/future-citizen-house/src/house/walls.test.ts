/** Pure regression cases for the production's world-to-wall opening adapter.
 * They exercise the same exported adapter as facades and room linings, then
 * ask the public engine to accept bounded cuts and refuse cuts outside them.
 * Expected offsets come from the two measured wall ends, in metres. No test
 * changes engine tolerances or the production's dimensions. */
import assert from "node:assert/strict";
import { buildAutoMovieWall, validateBuiltEnvironment, Quaternion, Vector3 } from "@automovie/engine";
import { cutWall, doorCuts, doorway, localCut, wallFrame, type Frame } from "./walls";
import { Assembly, initialState } from "./assembly";
import { topology } from "./topology";
import { front } from "./envelope/front";
import { portals, sharedWalls } from "./plan";

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
        return { cut, mesh: buildAutoMovieWall({
          width: frame.b - frame.a, height: frame.top - frame.floor,
          depth: frame.depth, openings: [cut],
        }) };
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

/** Every real door's rest rectangle must fit its own void. A centred origin
 * reproduces the rejected old adapter without changing the native validator. */
export function verifyDoorPanelFrames(): number {
  const assembly = new Assembly(initialState);
  topology(assembly);
  front(assembly);
  for (const wall of sharedWalls()) {
    const frame = wallFrame(wall);
    cutWall(assembly, frame, doorCuts(frame), "plaster");
    for (const portal of portals.filter((portal) => portal.wall === wall.id))
      doorway(assembly, frame, portal);
  }
  const environment = assembly.environment;
  const result = validateBuiltEnvironment({ environment });
  assert.ok(result.success);
  const panels = environment.openings.flatMap((opening) => opening.operation?.panels ?? []);
  assert.equal(panels.length, 10);
  assert.deepEqual([...new Set(panels.map((panel) => panel.motion.kind))].sort((a, b) => a.localeCompare(b)), ["prismatic", "revolute"]);
  assert.equal(environment.openings.filter((opening) => opening.kind === "passage").length, 1);

  const centred = structuredClone(environment);
  const panel = panels[0];
  const leaf = centred.elements.find((element) => element.id === panel.element)!;
  leaf.transform.translation = Vector3.add(leaf.transform.translation,
    Quaternion.rotateVector(leaf.transform.rotation, { x: panel.width / 2, y: panel.height / 2, z: 0 }));
  const invalid = validateBuiltEnvironment({ environment: centred });
  assert.equal(invalid.success, false);
  assert.ok(invalid.violations.some((violation) => violation.expected.includes("when it rests closed")));
  return panels.length;
}
