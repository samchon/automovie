import { validateBuiltEnvironment, Vector3, Quaternion } from "@automovie/engine";
import assert from "node:assert/strict";
import { Assembly } from "./Assembly";
import { front } from "./envelope/front";
import { initialState } from "./initialState";
import { sharedWalls } from "./sharedWalls";
import { portals } from "./portals";
import { topology } from "./topology";
import { doorway } from "./doorway";
import { doorCuts } from "./doorCuts";
import { cutWall } from "./cutWall";
import { wallFrame } from "./wallFrame";

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
