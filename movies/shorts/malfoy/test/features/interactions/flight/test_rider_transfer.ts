import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { StudentBody } from "../../../../src/entities/cast/student/StudentBody";
import { QuidditchPitch } from "../../../../src/entities/sets/quidditch-pitch/QuidditchPitch";
import { BodyFrame } from "../../../../src/laws/body/BodyFrame";
import { BroomLaw } from "../../../../src/laws/flight/BroomLaw";
import type { RiderMotion } from "../../../../src/interactions/flight/RiderMotion";
import type { StagePerformance } from "../../../../src/interactions/staging/StagePerformance";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * Resolves a hanging rider, a rider who comes alongside with `offerRear` and
 * a `transfer` placed with a lead, and checks the clearances the transfer
 * conditions need: alongside, the two bodies (trunks, heads and legs) stay
 * apart by at least two body radii, the host's shaft passes beside the
 * hanging torso, and the rear section is within the 0.5 m reach of the
 * hanging rider's free left hand; through the lead and the first phase he
 * still hangs below his own broom; his left hand is on the host's shaft at
 * the first phase's end and his right by the swing's end. Without a host
 * alongside the same transfer is not admitted: he keeps hanging from his own
 * broom, which is never released.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the composition and measures solved joints against the live brooms.
 * @evidence contracts/development/testing.md#independent-expectations Reach and phase times from the broom-riding study; body radii from the measures.
 * @evidence contracts/development/testing.md#distinguishing-cases Alongside before the transfer, its lead, its first phase and its swing; a host alongside and none.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and each clearance.
 */
export function test_rider_transfer(): void {
  const pitch: QuidditchPitch = new QuidditchPitch();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const resolved = StageMount.resolve({
    set: pitch,
    students: [carina, harry],
    props: [],
    composition: AutoMovieComposition.parallel(
      harry.enter("eastSouthGap.south", { riding: "broom-harry", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).slip({ start: 5 }).transfer(carina, { contact: 9.0 }).hold(3),
      carina.enter("eastSouthGap.north", { riding: "broom-carina", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).offerRear(harry, { start: 5.5 }).hold(8),
    ),
  });
  const performance: StagePerformance = resolved.performance;
  const bodies = { carina: carina.body(), harry: harry.body() };
  const joints = (who: "carina" | "harry", t: number): StudentBody.IJoints => bodies[who].solve(performance.posture(who, t)!);
  const begins: number = 9.0 - BroomLaw.TRANSFER_PHASES[0]!;
  const transfer = resolved.schedule.entries.find((e) => e.subject === "harry" && e.intent.capability === "transfer")!;
  TestValidator.equals("with the host alongside the transfer is admitted", transfer.outcome, "transferred");

  // Alongside, after the approach and before the transfer begins.
  for (const t of [7.6, 8.0, begins - 0.05]) {
    const c: StudentBody.IJoints = joints("carina", t);
    const h: StudentBody.IJoints = joints("harry", t);
    const apart: number = closest(core(c), core(h));
    TestValidator.predicate(`alongside at ${t} s the bodies stay apart (closest ${apart.toFixed(2)} m)`, apart >= 0.2);
    const host: RiderMotion.IBroom = performance.broom("carina", t)!;
    const shaft: number = Math.min(...segment(h.pelvis, h.chest).map((p) => toShaft(host, p)));
    TestValidator.predicate(`alongside at ${t} s her shaft passes beside his torso (${shaft.toFixed(2)} m)`, shaft >= 0.15);
    const rear: IAutoMovieVector3 = BodyFrame.toWorld(host.position, host.heading, { forward: -BroomLaw.TANDEM_SPACING, left: 0, up: 0 });
    const reach: number = distance(h.arms.left.hand, rear);
    TestValidator.predicate(`alongside at ${t} s the rear section is within his free hand's reach (${reach.toFixed(2)} m)`, reach <= 0.5);
  }

  // Through the lead and the first phase he hangs below his own broom.
  for (const t of [begins - 0.5, begins + 0.2]) {
    const h: StudentBody.IJoints = joints("harry", t);
    const own: RiderMotion.IBroom = performance.broom("harry", t)!;
    TestValidator.predicate(`at ${t} s he still hangs below his broom (pelvis ${(own.position.y - h.pelvis.y).toFixed(2)} m below)`, own.position.y - h.pelvis.y > 0.8);
  }

  // The new grip: the left hand on her shaft at the first phase's end, the right by the swing's end.
  const host = (t: number): RiderMotion.IBroom => performance.broom("carina", t)!;
  const left: number = toShaft(host(9.0), joints("harry", 9.0).arms.left.hand);
  TestValidator.predicate(`the left hand closes on her shaft at the contact (${left.toFixed(2)} m)`, left <= 0.12);
  const swing: number = 9.0 + BroomLaw.TRANSFER_PHASES[1]!;
  const right: number = toShaft(host(swing), joints("harry", swing).arms.right.hand);
  TestValidator.predicate(`the right hand joins by the swing's end (${right.toFixed(2)} m)`, right <= 0.12);
  const seat: number = closest([joints("harry", 12.0).pelvis], [BodyFrame.toWorld(host(12.0).position, host(12.0).heading, { forward: -BroomLaw.TANDEM_SPACING, left: 0, up: BroomLaw.SEAT_HEIGHT })]);
  TestValidator.predicate(`he is astride the rear seat once steady (${seat.toFixed(2)} m)`, seat <= 0.1);

  // No host alongside: not admitted, and he keeps hanging from his own broom.
  const alone = StageMount.resolve({
    set: pitch,
    students: [carina, harry],
    props: [],
    composition: AutoMovieComposition.parallel(
      harry.enter("eastSouthGap.south", { riding: "broom-harry", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).slip({ start: 5 }).transfer(carina, { contact: 9.0 }).hold(3),
      carina.enter("eastSouthGap.north", { riding: "broom-carina", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).hold(8),
    ),
  });
  const refused = alone.schedule.entries.find((e) => e.subject === "harry" && e.intent.capability === "transfer")!;
  TestValidator.equals("without a host alongside the transfer is not admitted", refused.outcome, "not-admitted");
  const still: StudentBody.IJoints = bodies.harry.solve(alone.performance.posture("harry", 11.0)!);
  const own: RiderMotion.IBroom = alone.performance.broom("harry", 11.0)!;
  TestValidator.predicate(`refused, he still hangs below his own broom (${(own.position.y - still.pelvis.y).toFixed(2)} m below)`, own.position.y - still.pelvis.y > 0.8);
}

/** Points along a body's trunk, head and legs. */
function core(j: StudentBody.IJoints): IAutoMovieVector3[] {
  return [
    ...segment(j.pelvis, j.chest),
    ...segment(j.chest, j.headCentre),
    ...(["left", "right"] as const).flatMap((s) => [...segment(j.legs[s].hip, j.legs[s].knee), ...segment(j.legs[s].knee, j.legs[s].ankle)]),
  ];
}

function segment(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3[] {
  return [0, 0.25, 0.5, 0.75, 1].map((k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k }));
}

function closest(a: IAutoMovieVector3[], b: IAutoMovieVector3[]): number {
  return Math.min(...a.flatMap((p) => b.map((q) => distance(p, q))));
}

function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** Distance from a point to the shaft: the broom's line from 1.0 m behind its seat point to 1.0 m ahead. */
function toShaft(broom: RiderMotion.IBroom, p: IAutoMovieVector3): number {
  const f: StudentBody.IFrame = StudentBody.frame(broom.heading, broom.pitch, broom.roll);
  const d = { x: p.x - broom.position.x, y: p.y - broom.position.y, z: p.z - broom.position.z };
  const along: number = Math.max(-1.0, Math.min(1.0, d.x * f.forward.x + d.y * f.forward.y + d.z * f.forward.z));
  return distance(p, { x: broom.position.x + f.forward.x * along, y: broom.position.y + f.forward.y * along, z: broom.position.z + f.forward.z * along });
}
