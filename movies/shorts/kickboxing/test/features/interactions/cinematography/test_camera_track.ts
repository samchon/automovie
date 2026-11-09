import assert from "node:assert/strict";

import { CameraTrack } from "../../../../src/interactions/cinematography/CameraTrack";
import { CountCoverage } from "../../../../src/interactions/cinematography/CountCoverage";
import { RopeLens } from "../../../../src/interactions/cinematography/RopeLens";
import { BoutLaws } from "../../../../src/interactions/kickboxing/BoutLaws";
import { RefereeTrack } from "../../../../src/interactions/officiating/RefereeTrack";
import { CoverageLaw } from "../../../../src/laws/cinematography/CoverageLaw";
import { polygonFilm } from "../../../internal/polygonFilm";

/**
 * The camera's resolved path meets the coverage targets.
 *
 * Scenarios, with the study's thresholds (docs/research/cinematography/
 * fight-coverage.md#targets): the camera moves for at least 60% of the film;
 * the mean interval between size changes before the finish lies between 2
 * and 8 s; the lens never stands inside the ropes nor beyond the wide
 * camera's distance; from 143 s the size is the finish view to the end, but
 * for the count, covered at medium. No rope fills the frame: the wide
 * camera's lens stands at least the law's height over the top rope, and a
 * lens on the rope line keeps the law's gap from every rope. Within one
 * camera's shot the lens never jumps across the ring, so the screen
 * direction holds; only a cut between cameras changes the standpoint. Every
 * man the shot frames, the referee during the count among them, has his
 * whole bounding sphere inside the delivered frame at every frame.
 */
export function test_camera_track(): void {
  const { camera, cast, schedule, referee } = polygonFilm();
  const count = CountCoverage.window(schedule, cast.referee.id);
  const top: number = Math.max(...cast.ring.ropes);
  const far = (size: CoverageLaw.Size): boolean =>
    size === "wide" || size === "finish";
  const centre = (id: string, t: number) => {
    const floor =
      id === cast.referee.id
        ? RefereeTrack.at(referee, t).point
        : BoutLaws.origin(schedule, id, t, cast).point;
    const measure =
      id === cast.referee.id
        ? cast.referee.body.measure
        : id === cast.a.id
          ? cast.a.body.measure
          : cast.b.body.measure;
    // The camera's own bounding sphere of a standing man.
    const s = CameraTrack.sphere(measure, floor);
    return { ...s.center, radius: s.radius };
  };
  const shot = CountCoverage.shot(schedule, cast);
  const counted = (t: number): string[] | undefined =>
    count && shot && t >= count.start && t < count.end
      ? shot.subjects
      : undefined;
  let moving = 0;
  const changes: number[] = [];
  const unframed: string[] = [];
  for (let k = 1; k < camera.length; k++) {
    const a = camera[k - 1]!;
    const b = camera[k]!;
    const t: number = k * CameraTrack.STEP;
    const step: number = Math.hypot(
      b.position.x - a.position.x,
      b.position.y - a.position.y,
      b.position.z - a.position.z,
    );
    if (step > 1e-4) moving++;
    if (b.size !== a.size && t < 143) changes.push(t);
    const out: number = Math.max(
      Math.abs(b.position.x),
      Math.abs(b.position.z),
    );
    assert.ok(
      out >= cast.ring.half - 1e-9 && out <= CoverageLaw.WIDE_DISTANCE + 1e-9,
      `lens inside the ropes or beyond the wide camera at ${t}`,
    );
    if (count && t >= count.start && t < count.end)
      assert.equal(b.size, "medium", `count covered at medium at ${t}`);
    else if (t >= 143.1) assert.equal(b.size, "finish");
    // No rope fills the frame.
    if (far(b.size))
      assert.ok(
        b.position.y >= top + RopeLens.OVER_TOP - 1e-9,
        `wide lens ${b.position.y} m under the top rope's clearance at ${t}`,
      );
    else if (out - cast.ring.half < 0.02)
      for (const rope of cast.ring.ropes)
        assert.ok(
          Math.abs(b.position.y - rope) >= RopeLens.ROPE_GAP - 1e-9,
          `lens at ${b.position.y} m against the ${rope} m rope at ${t}`,
        );
    // One camera's shot never jumps: only a change of camera cuts.
    if (far(a.size) === far(b.size))
      assert.ok(step < 1, `lens jumps ${step} m within a shot at ${t}`);
    // Every framed man's centre is inside the delivered frame.
    const men: string[] =
      counted(t) ??
      (far(b.size)
        ? [cast.a.id, cast.b.id, cast.referee.id]
        : [cast.a.id, cast.b.id]);
    const fx = b.target.x - b.position.x;
    const fy = b.target.y - b.position.y;
    const fz = b.target.z - b.position.z;
    const fl = Math.hypot(fx, fy, fz);
    const f = { x: fx / fl, y: fy / fl, z: fz / fl };
    const rl = Math.hypot(f.z, f.x);
    const r = { x: -f.z / rl, y: 0, z: f.x / rl };
    const u = {
      x: r.y * f.z - r.z * f.y,
      y: r.z * f.x - r.x * f.z,
      z: r.x * f.y - r.y * f.x,
    };
    const tanV: number = Math.tan(b.fieldOfView / 2);
    for (const id of men) {
      const c = centre(id, t);
      const v = {
        x: c.x - b.position.x,
        y: c.y - b.position.y,
        z: c.z - b.position.z,
      };
      const depth: number = v.x * f.x + v.y * f.y + v.z * f.z;
      const across: number = Math.abs(v.x * r.x + v.y * r.y + v.z * r.z);
      const up: number = Math.abs(v.x * u.x + v.y * u.y + v.z * u.z);
      if (
        !(
          depth > c.radius &&
          (across + c.radius) / depth <= tanV * CoverageLaw.ASPECT + 1e-6 &&
          (up + c.radius) / depth <= tanV + 1e-6
        )
      )
        unframed.push(
          `${id}@${t.toFixed(2)} ${b.size} lens ${[b.position.x, b.position.y, b.position.z].map((n) => n.toFixed(1))} at ${[b.target.x, b.target.y, b.target.z].map((n) => n.toFixed(1))} man ${[c.x, c.z].map((n) => n.toFixed(1))} fov ${((b.fieldOfView * 180) / Math.PI).toFixed(0)}`,
        );
    }
  }
  assert.deepEqual(unframed.slice(0, 12), [], `${unframed.length} unframed`);
  assert.ok(moving / camera.length >= 0.6, `moving ${moving / camera.length}`);
  const mean =
    (changes[changes.length - 1]! - changes[0]!) / (changes.length - 1);
  assert.ok(mean >= 2 && mean <= 8, `mean size interval ${mean}`);
}
