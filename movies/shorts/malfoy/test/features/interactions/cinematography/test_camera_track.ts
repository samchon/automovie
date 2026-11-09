import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { VerticalCamera } from "../../../../src/entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { SchoolCorridor } from "../../../../src/entities/sets/school-corridor/SchoolCorridor";
import { SideCourtyard } from "../../../../src/entities/sets/side-courtyard/SideCourtyard";
import { CameraTrack } from "../../../../src/interactions/cinematography/CameraTrack";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * Resolves camera shots in the corridor bay and checks where the lens
 * stands: a shot from the station outside the window stays outside the wall
 * and at least 1.2 m from the person at the sill it looks in at; a lone
 * subject next to a wall whose kept bearing points into that wall gets a
 * bearing with room, so the lens stays inside the bay and at least 0.9 m
 * from her, and a cut between two samples jumps there with no lens in
 * between; a full two-shot from the courtyard's open south stands back over
 * the lawn at its fit distance instead of being pulled in by the recess's walls.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the camera track and measures the lens.
 * @evidence contracts/development/testing.md#independent-expectations The 0.9 m clearance and the bay's walls from the camera rules and the set record.
 * @evidence contracts/development/testing.md#distinguishing-cases A station outside the walls and a bearing blocked by a wall.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario.
 */
export function test_camera_track(): void {
  const bay: SchoolCorridor = new SchoolCorridor();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const camera: VerticalCamera = new VerticalCamera();
  const track = (shots: Parameters<typeof AutoMovieComposition.parallel>[number], at: IAutoMovieVector3): { resolved: ReturnType<typeof StageMount.resolve>; track: CameraTrack } => {
    const resolved = StageMount.resolve({
      set: bay,
      students: [carina, harry],
      props: [],
      composition: AutoMovieComposition.parallel(carina.enter(at, { heading: Math.PI }).until(4), harry.enter({ x: 1.0, y: 0, z: 3.5 }).until(4), shots),
    });
    return { resolved, track: CameraTrack.resolve(resolved.world, resolved.schedule, resolved.performance, 4) };
  };

  // From outside the window, looking in at her at the sill.
  const sill: IAutoMovieVector3 = { x: 4.0, y: 0, z: 0.55 };
  const outside = track(camera.shot([carina], { size: "full", from: "outsideWindow", start: 0 }), sill).track.at(2);
  TestValidator.predicate(`the lens stays outside the window wall (z ${outside.position.z.toFixed(2)})`, outside.position.z < -0.2);
  const back: number = Math.hypot(outside.position.x - sill.x, outside.position.z - sill.z);
  TestValidator.predicate(`it stands at least 1.2 m from her (${back.toFixed(2)} m)`, back >= 1.2);

  // A kept bearing into the right wall swings to where the bay has room.
  const wall: IAutoMovieVector3 = { x: 5.4, y: 0, z: 2.4 };
  const walled = track(camera.wide([carina], { from: "rightEnd", start: 0 }).next(camera.medium([carina], { start: 1.03 })), wall).track;
  const swung = walled.at(3);
  // The cut at 1.03 s falls between two samples: the lens jumps there and nothing in between is drawn.
  const same = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-9;
  TestValidator.predicate("before the cut the lens is the old shot's", same(walled.at(1.02).position, walled.at(1.0).position));
  TestValidator.predicate("after the cut the lens is the new shot's", same(walled.at(1.035).position, walled.at(25 / 24).position));
  const room: number = Math.hypot(swung.position.x - wall.x, swung.position.z - wall.z);
  TestValidator.predicate(`the lens keeps 0.9 m from her by the wall (${room.toFixed(2)} m)`, room >= 0.9);
  TestValidator.predicate(`the lens stays inside the bay (x ${swung.position.x.toFixed(2)})`, swung.position.x <= bay.lens.maxX + 1e-9);

  // A full two-shot from the open south of two people standing one behind the other in the recess.
  const yard: SideCourtyard = new SideCourtyard();
  const pair = StageMount.resolve({
    set: yard,
    students: [carina, harry],
    props: [],
    composition: AutoMovieComposition.parallel(
      carina.enter({ x: 1.2, y: 0, z: 1.8 }, { heading: 0 }).until(3),
      harry.enter({ x: 1.2, y: 0, z: 2.8 }, { heading: Math.PI }).until(3),
      camera.twoShot([harry, carina], { size: "full", from: "openSouth", start: 0 }),
    ),
  });
  const lawn = CameraTrack.resolve(pair.world, pair.schedule, pair.performance, 3).at(1.5);
  const stand: number = Math.hypot(lawn.position.x - lawn.target.x, lawn.position.z - lawn.target.z);
  TestValidator.predicate(`the two-shot from the open south stands back over the lawn (${stand.toFixed(2)} m, z ${lawn.position.z.toFixed(2)})`, stand >= 2.5 && lawn.position.z > 4.1);
}

