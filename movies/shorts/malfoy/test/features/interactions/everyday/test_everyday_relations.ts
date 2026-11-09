import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { StudentBody } from "../../../../src/entities/cast/student/StudentBody";
import { InvitationNote } from "../../../../src/entities/props/invitation-note/InvitationNote";
import { SideCourtyard } from "../../../../src/entities/sets/side-courtyard/SideCourtyard";
import { BodyFrame } from "../../../../src/laws/body/BodyFrame";
import { EverydayLaw } from "../../../../src/laws/everyday/EverydayLaw";
import { sameGap } from "../../../../src/interactions/everyday/sameGap";
import { StageMount } from "../../../../src/interactions/staging/StageMount";
import { StudentPose } from "../../../../src/interactions/staging/StudentPose";

/**
 * Resolves the everyday relations between two people and checks their
 * geometry: a sidestep into a walker's path stops both a hand's breadth
 * apart and the give-room after it never puts a hand into the other body;
 * a walk bends around a person standing in its line and the overlap audit
 * stays empty, while two people placed on one spot are reported; the chin
 * lifts 10°; a gaze on a hand looks lower than a gaze on the face; a
 * forehead touch laid over a walk reaches the forehead without lengthening
 * the walk; a seated hand lowered to the knee rests on it; open palms stand
 * in front of the chest; a walk to a seat behind goes forward.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves compositions and measures solved joints and floor points.
 * @evidence contracts/development/testing.md#independent-expectations Gaps and clearances from the walking record, the chin lift from Carina's record, the gesture targets from the body's measures.
 * @evidence contracts/development/testing.md#distinguishing-cases A clear line and a blocked one; a face and a hand; a walk with and without a gesture.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario.
 */
export function test_everyday_relations(): void {
  const yard: SideCourtyard = new SideCourtyard();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const note: InvitationNote = new InvitationNote();
  const bodies = { carina: new StudentBody(carina.measure), harry: new StudentBody(harry.measure) };
  const point = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const resolve = (...parts: AutoMovieComposition[]) => StageMount.resolve({ set: yard, students: [carina, harry], props: [note], composition: AutoMovieComposition.sequence(...parts) });
  const floor = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => Math.hypot(a.x - b.x, a.z - b.z);

  // A sidestep into her path: both stop a hand's breadth apart; his palms never reach into her as he gives room.
  const gap = resolve(
    AutoMovieComposition.parallel(carina.enter(point(4.5, 2.0), { facing: point(1, 2) }).hold(0.5), harry.enter(point(2.6, 2.4), { facing: point(5, 2.2) }).hold(0.5)),
    sameGap(carina, harry, { start: 1.0 }),
    AutoMovieComposition.parallel(harry.giveRoom(carina, { start: 4.0 }), carina.until(5.5)),
  );
  const apart: number = floor(gap.performance.position("carina", 3.9)!, gap.performance.position("harry", 3.9)!);
  TestValidator.predicate(`they stop a hand's breadth apart (${apart.toFixed(2)} m between pelvis points)`, Math.abs(apart - EverydayLaw.FACE_TO_FACE) <= 0.05);
  let reach: number = Infinity;
  for (let t = 1.0; t <= 5.5; t += 0.05) {
    const c: StudentBody.IJoints = bodies.carina.solve(gap.performance.posture("carina", t)!);
    const h: StudentBody.IJoints = bodies.harry.solve(gap.performance.posture("harry", t)!);
    for (const [arms, trunk] of [[h.arms, c], [c.arms, h]] as const)
      for (const side of ["left", "right"] as const) reach = Math.min(reach, toSegment(arms[side].hand, trunk.pelvis, trunk.chest));
  }
  TestValidator.predicate(`no hand enters the other body (closest hand ${reach.toFixed(2)} m from the other trunk's axis)`, reach >= 0.12);

  // A walk bends around a person standing in its line; the overlap audit stays empty.
  const around = resolve(AutoMovieComposition.parallel(harry.enter(point(3.0, 2.0), { heading: 0 }).until(6), carina.enter(point(1.0, 2.0), { heading: Math.PI / 2 }).walkTo(point(5.0, 2.0), { start: 0.5 }).until(6)));
  let closest: number = Infinity;
  for (let t = 0.5; t < 6; t += 0.05) closest = Math.min(closest, floor(around.performance.position("carina", t)!, around.performance.position("harry", t)!));
  TestValidator.predicate(`the walk passes him at 0.6 m (closest ${closest.toFixed(2)} m)`, closest >= 0.55);
  TestValidator.equals("nobody overlaps on the bent walk", StageMount.collisions(around.performance, 6), []);
  const together = resolve(AutoMovieComposition.parallel(harry.enter(point(3.0, 2.0)).until(1), carina.enter(point(3.1, 2.0)).until(1)));
  TestValidator.predicate("two people on one spot are reported", StageMount.collisions(together.performance, 1).length === 1);

  // The chin lifts 10°; a gaze on a hand looks lower than one on the face.
  const chin = resolve(AutoMovieComposition.parallel(carina.enter(point(3.0, 2.0), { facing: point(3, 4) }).liftChin({ start: 0.5 }), harry.enter(point(1, 1)).until(2)));
  const lifted: number = chin.performance.posture("carina", 0.2)!.headPitch - chin.performance.posture("carina", 1.0)!.headPitch;
  TestValidator.predicate(`the chin lifts 10° (${((lifted * 180) / Math.PI).toFixed(1)}°)`, Math.abs(lifted - EverydayLaw.CHIN_LIFT) <= 0.02);
  const look = (part: "head" | "rightHand") =>
    resolve(AutoMovieComposition.parallel(harry.enter(point(3.0, 2.0), { facing: point(3, 3), holds: { right: note.id } }).offer(note, carina).until(3), carina.enter(point(3.0, 3.0), { facing: point(3, 2) }).lookAt(harry, { part, start: 1.5 }).until(3)));
  const face: number = look("head").performance.posture("carina", 2.5)!.headPitch;
  const hand: number = look("rightHand").performance.posture("carina", 2.5)!.headPitch;
  TestValidator.predicate("a gaze on his offering hand looks lower than one on his face", hand > face + 0.2);

  // A forehead touch laid over a walk reaches the forehead and leaves the walk's length alone.
  const walk = (gesture: boolean) =>
    resolve(AutoMovieComposition.parallel(carina.enter(point(1.0, 2.0), { heading: Math.PI / 2 }).walkTo(point(5.0, 2.0), gesture ? { gesture: { kind: "touchForehead" } } : {}).until(6), harry.enter(point(3, 4.5)).until(6)));
  const plain = walk(false);
  const touched = walk(true);
  const span = (r: ReturnType<typeof resolve>): number => r.schedule.entries.find((e) => e.subject === "carina" && e.intent.capability === "walk")!.end;
  TestValidator.predicate("the gesture leaves the walk's length alone", Math.abs(span(plain) - span(touched)) < 1e-9);
  const midTouch = touched.performance.posture("carina", 1.1)!;
  const forehead: IAutoMovieVector3 = StudentPose.onTrunk(midTouch, 0.11, 0, carina.measure.head - carina.measure.hip + 0.03);
  const fingers: number = distance(bodies.carina.solve(midTouch).arms.left.hand, forehead);
  TestValidator.predicate(`the walking hand reaches the forehead (${fingers.toFixed(2)} m)`, fingers <= 0.05);

  // A seated hand lowered to the knee rests on it.
  const knee = resolve(AutoMovieComposition.parallel(harry.enter("bench.centre", { seat: true, holds: { right: note.id } }).lowerHand("right", { to: "knee" }).until(2), carina.enter(point(4, 3)).until(2)));
  const seated: StudentBody.IJoints = bodies.harry.solve(knee.performance.posture("harry", 1.8)!);
  const onKnee: number = distance(seated.arms.right.hand, seated.legs.right.knee);
  TestValidator.predicate(`the hand rests on the knee (${onKnee.toFixed(2)} m from it)`, onKnee <= 0.15);

  // Open palms stand in front of the chest, elbows below the hands.
  const palms = resolve(AutoMovieComposition.parallel(harry.enter(point(3.0, 3.0), { facing: point(3, 2) }).giveRoom(carina).until(2.5), carina.enter(point(3.0, 2.0), { facing: point(3, 3) }).until(2.5)));
  const open = palms.performance.posture("harry", 2.4)!;
  const opened: StudentBody.IJoints = bodies.harry.solve(open);
  for (const side of ["left", "right"] as const) {
    const ahead: number = (opened.arms[side].hand.x - opened.chest.x) * Math.sin(open.heading) + (opened.arms[side].hand.z - opened.chest.z) * Math.cos(open.heading);
    TestValidator.predicate(`the ${side} palm is in front of the chest (${ahead.toFixed(2)} m)`, ahead >= 0.15 && opened.arms[side].elbow.y < opened.arms[side].hand.y);
  }

  // A walk to a seat behind goes forward and turns at the end.
  const bench = resolve(AutoMovieComposition.parallel(harry.enter("startingPlace").walkTo("bench.centre").sit("bench.centre"), carina.enter(point(5, 3)).until(6)));
  const mid: number = bench.performance.posture("harry", 0.8)!.heading;
  TestValidator.predicate(`he walks forward toward the bench (${((BodyFrame.turn(Math.PI, mid) * 180) / Math.PI).toFixed(0)}° off)`, Math.abs(BodyFrame.turn(Math.PI, mid)) <= (35 * Math.PI) / 180);
}

function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Distance from a point to a segment. */
function toSegment(p: IAutoMovieVector3, a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const l: number = d.x * d.x + d.y * d.y + d.z * d.z;
  const t: number = l < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * d.x + (p.y - a.y) * d.y + (p.z - a.z) * d.z) / l));
  return distance(p, { x: a.x + d.x * t, y: a.y + d.y * t, z: a.z + d.z * t });
}
