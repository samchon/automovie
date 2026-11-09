import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import assert from "node:assert/strict";

import { CameraTrack } from "../../../../src/interactions/cinematography/CameraTrack";
import { CountCoverage } from "../../../../src/interactions/cinematography/CountCoverage";
import { FinishVolumes } from "../../../../src/interactions/cinematography/FinishVolumes";
import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { FighterPosture } from "../../../../src/interactions/kickboxing/FighterPosture";
import { RefereeTrack } from "../../../../src/interactions/officiating/RefereeTrack";
import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";
import { SightLaw } from "../../../../src/laws/cinematography/SightLaw";
import { TurnoverShape } from "../../../../src/laws/kickboxing/TurnoverShape";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The finishing strike stays visible from the delivered camera.
 *
 * Scenarios (docs/research/cinematography/fight-coverage.md#targets,
 * docs/research/kickboxing/brazilian-kick.md#law): the striker's commanded
 * leg reaches the struck region from a knee over the receiver's sunk
 * shoulder line, at the turnover's range, with the instep coming down; the
 * finish view keeps that leg (knee, shin and ankle over the descent) and
 * the struck region clear of every body and inside the frame from the lens
 * the track delivers at the contact, and holds the wide view on that side
 * with all three men in frame through the fall and the celebration, the
 * count being covered at medium from the neutral corner; the lens stands on the
 * open side of the attacker–receiver line; the same
 * lens mirrored onto the closed side is occluded by the receiver, so the
 * measurement can fail; the open side lies where the contact is and views
 * are ordered nearest it first.
 */
export function test_finish_sight(): void {
  const { cast, schedule, referee, camera } = polygonFilm();
  const finishing = CameraTrack.strike(schedule);
  assert.ok(finishing, "the finish view names its strike");
  assert.ok(Math.abs(finishing.contact! - 150) < 1e-9, "contact at 150");
  const scene = FinishVolumes.volumes(cast, schedule, referee)(finishing);
  // The kick reads as a Brazilian kick: the striker's leg reaches the
  // region from a knee raised over the receiver's sunk shoulder line, at a
  // leg's range rather than chest to chest, and the instep comes down.
  const ma = cast.a.body.measure;
  const mb = cast.b.body.measure;
  const leg = FinishVolumes.leg(cast, schedule, finishing, scene.seconds);
  const length = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(p, q));
  const lens = CameraTrack.at(camera, scene.seconds);
  // Two computations of one length agree within a pixel of the delivered
  // frame at the lens's distance from the contact.
  const pixel: number =
    (2 *
      length(lens.position, scene.contact) *
      Math.tan(lens.fieldOfView / 2)) /
    FRAME_LINES;
  assert.ok(
    length(leg.knee, leg.hip) <= ma.thigh + pixel,
    `knee ${length(leg.knee, leg.hip)} m from the hip, beyond the thigh`,
  );
  assert.ok(
    length(leg.ankle, scene.contact) < mb.headRadius,
    `instep ${length(leg.ankle, scene.contact)} m off the region`,
  );
  const sunk = FighterPosture.at(cast, schedule, cast.b.id, scene.seconds, null)
    .posture.drop;
  assert.ok(leg.knee.y > mb.shoulder - sunk, "knee over the shoulder line");
  assert.ok(
    Math.hypot(
      scene.attacker.x - scene.receiver.x,
      scene.attacker.z - scene.receiver.z,
    ) >=
      TurnoverShape.range(ma, mb) - pixel,
    "a leg apart at the contact",
  );
  const before = FinishVolumes.leg(
    cast,
    schedule,
    finishing,
    scene.seconds - CameraTrack.STEP,
  );
  assert.ok(before.ankle.y > leg.ankle.y, "the instep comes down");
  const clearance = CameraTrack.clearance(camera, scene);
  assert.ok(clearance > 0, `finish occluded by ${-clearance} m`);
  const framing = CameraTrack.framing(camera, scene);
  assert.ok(framing > 0, `finish outside the frame by ${-framing}`);
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
  const count = CountCoverage.window(schedule, cast.referee.id);
  for (let t = scene.seconds; t <= 180; t += 0.5) {
    // The count is covered at medium from the neutral corner (CountCoverage).
    // After it, the orbit takes the lens back to the open side at its rate.
    if (
      count &&
      t >= count.start &&
      t < count.end + Math.PI / CoverageLaw.ORBIT
    )
      continue;
    const s = CameraTrack.at(camera, t);
    assert.equal(s.size, "finish", `finish size at ${t}`);
    assert.ok(side(s.position) * side(scene.contact) > 0, `open side at ${t}`);
    // ... and keeps all three men inside the delivered frame.
    const men = [
      ...[cast.a, cast.b].map((f) => ({
        ...BoutLaws.origin(schedule, f.id, t, cast).point,
        y: f.body.measure.head / 2,
      })),
      { ...RefereeTrack.at(referee, t).point, y: ma.head / 2 },
    ].map((p) => ({
      point: { x: p.x, y: p.y, z: p.z },
      seconds: t,
      carriers: [],
    }));
    assert.ok(
      SightLaw.framed(
        s.position,
        s.target,
        { ...scene, watched: men },
        s.fieldOfView,
        CoverageLaw.ASPECT,
      ) > 0,
      `all three men in frame at ${t}`,
    );
  }
  const open = SightLaw.open({ x: -1, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 1 });
  assert.ok(Math.abs(open) < 1e-12, "contact on +z gives the +z bearing");
  const views = SightLaw.views(0, 0.1, 0.05, 0.2);
  assert.deepEqual(views[0], { bearing: 0, elevation: 0.1 });
  assert.ok(views.every((v) => v.elevation <= 0.2 + 1e-12));
}

/** Lines of the 1280x720 delivery frame. */
const FRAME_LINES: number = 720;
