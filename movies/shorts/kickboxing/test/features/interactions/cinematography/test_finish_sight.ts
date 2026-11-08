import assert from "node:assert/strict";

import { CameraTrack } from "../../../../src/interactions/cinematography/CameraTrack";
import { FinishSight } from "../../../../src/interactions/cinematography/FinishSight";
import { SightLaw } from "../../../../src/laws/cinematography/SightLaw";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The finishing strike stays visible from the delivered camera.
 *
 * Scenarios (docs/research/cinematography/fight-coverage.md#targets): the
 * finish view keeps the Brazilian kick's struck region and its descending
 * striking surface clear of every body from the lens the track delivers at
 * the contact, and holds the wide view on that side through the fall, the
 * count and the celebration; the
 * lens stands on the open side of the attacker–receiver line; the same
 * lens mirrored onto the closed side is occluded by the receiver, so the
 * measurement can fail; the open side lies where the contact is and views
 * are ordered nearest it first.
 */
export function test_finish_sight(): void {
  const { cast, schedule, referee, camera } = polygonFilm();
  const finishing = CameraTrack.strike(schedule);
  assert.ok(finishing, "the finish view names its strike");
  assert.ok(Math.abs(finishing.contact! - 150) < 1e-9, "contact at 150");
  const scene = FinishSight.volumes(cast, schedule, referee)(finishing);
  const lens = CameraTrack.at(camera, scene.seconds);
  const clearance = CameraTrack.clearance(camera, scene);
  assert.ok(clearance > 0, `finish occluded by ${-clearance} m`);
  // The lens is on the contact's side of the line.
  const side = (p: { x: number; z: number }): number =>
    (scene.receiver.x - scene.attacker.x) * (p.z - scene.attacker.z) -
    (scene.receiver.z - scene.attacker.z) * (p.x - scene.attacker.x);
  assert.ok(side(lens.position) * side(scene.contact) > 0, "open side");
  // Mirrored onto the closed side, the receiver's own head and torso hide the contact.
  const mid = {
    x: (scene.attacker.x + scene.receiver.x) / 2,
    z: (scene.attacker.z + scene.receiver.z) / 2,
  };
  const ux = scene.receiver.x - scene.attacker.x;
  const uz = scene.receiver.z - scene.attacker.z;
  const l2 = ux * ux + uz * uz;
  const along =
    ((lens.position.x - mid.x) * ux + (lens.position.z - mid.z) * uz) / l2;
  const foot = { x: mid.x + ux * along, z: mid.z + uz * along };
  const closed = {
    x: 2 * foot.x - lens.position.x,
    y: lens.position.y,
    z: 2 * foot.z - lens.position.z,
  };
  assert.ok(SightLaw.clearance(closed, scene) <= 0, "closed side is occluded");
  // The wide view holds on the open side through the fall, the count and the end.
  for (let t = scene.seconds; t <= 180; t += 0.5) {
    const s = CameraTrack.at(camera, t);
    assert.equal(s.size, "finish", `finish size at ${t}`);
    assert.ok(side(s.position) * side(scene.contact) > 0, `open side at ${t}`);
  }
  const open = SightLaw.open({ x: -1, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 1 });
  assert.ok(Math.abs(open) < 1e-12, "contact on +z gives the +z bearing");
  const views = SightLaw.views(0, 0.1, 0.05, 0.2);
  assert.deepEqual(views[0], { bearing: 0, elevation: 0.1 });
  assert.ok(views.every((v) => v.elevation <= 0.2 + 1e-12));
}
