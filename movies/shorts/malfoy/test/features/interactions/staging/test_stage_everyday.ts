import { AutoMovieComposition } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { VerticalCamera } from "../../../../src/entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { InvitationNote } from "../../../../src/entities/props/invitation-note/InvitationNote";
import { SideCourtyard } from "../../../../src/entities/sets/side-courtyard/SideCourtyard";
import { StageMount } from "../../../../src/interactions/staging/StageMount";
import type { IStageWorld } from "../../../../src/interactions/staging/IStageWorld";
import { StageTime } from "../../../../src/interactions/staging/StageTime";

/**
 * Resolves small courtyard compositions through the stage laws and checks
 * what the everyday studies and settings require: a walk is a whole number
 * of steps at its pace's step period (from Voss et al.'s 102 and 115.4
 * steps/min, computed here from the study values, not from the code); an
 * absolute contact lands on its second and an unreachable one throws; the
 * note passes to Harry only when his grip closed before Carina's release,
 * and falls when she lets go first; Carina's first personal offer to Harry
 * in a scene is withdrawn and her second completes; a sit ends with the
 * pelvis at the seat. Finally the composition mounts in Node and seeks.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the schedule resolver, prop track, performance and mount and asserts their observable results.
 * @evidence contracts/development/testing.md#independent-expectations Step periods from the study's cadences; ownership from the stated rule; the seat height from the set's settings.
 * @evidence contracts/development/testing.md#distinguishing-cases Release after and before the grip; first and second offers; reachable and unreachable absolute seconds.
 * @evidence contracts/development/testing.md#execution-ownership In-memory composition, no browser or GPU; the mount builds Three objects only.
 * @evidence contracts/development/common.md#meaningful-documentation States every scenario and the behavior it pins.
 */
export function test_stage_everyday(): void {
  const yard: SideCourtyard = new SideCourtyard();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const note: InvitationNote = new InvitationNote();
  const resolve = (composition: AutoMovieComposition) => StageMount.resolve({ set: yard, students: [carina, harry], props: [note], composition });
  const steps = (schedule: ReturnType<typeof resolve>["schedule"], subject: string, kind: string) =>
    schedule.entries.filter((e) => e.subject === subject && e.intent.capability === kind);

  // A hesitant walk of whole steps at 102 steps/min.
  const walk = resolve(
    AutoMovieComposition.sequence(
      carina.enter("startingPlace", { facing: "bench.centre", holds: { right: "note" } }),
      carina.walkTo("bench.centreFront", { pace: "hesitant" }),
    ),
  );
  const w = steps(walk.schedule, "carina", "walk")[0]!;
  const period: number = 60 / 102;
  const stepsTaken: number = (w.end - w.start) / period;
  TestValidator.predicate("a walk is whole steps", Math.abs(stepsTaken - Math.round(stepsTaken)) < 1e-9 && Math.round(stepsTaken) >= 2);
  const end = (w.state as IStageWorld.IStudentStep).to.position;
  TestValidator.predicate("the walk ends at the bench front", Math.hypot(end.x - 2.2, end.z - 0.75) < 1e-6);

  // Ownership: Harry closes on the note at 9.0, Carina releases at 9.4.
  const handover = (releaseAt: number) =>
    resolve(
      AutoMovieComposition.parallel(
        carina.enter("benchFront", { facing: "clearPaving", holds: { right: "note" } }).offer(note, harry).release(note, { contact: releaseAt }),
        harry.enter("clearPaving", { facing: "benchFront" }).walkTo(carina, { distance: "handing" }).receive(note, carina, { contact: 9.0 }),
      ),
    );
  const given = handover(9.4);
  TestValidator.equals("the note is Carina's before the release", given.props.owner("note", 9.2), "carina");
  TestValidator.equals("the note is Harry's after the release", given.props.owner("note", 9.5), "harry");
  const dropped = handover(8.5);
  TestValidator.equals("an early release lets the note fall", dropped.props.owner("note", 9.5), null);
  TestValidator.equals("the receive contact lands on its second", steps(given.schedule, "harry", "receive")[0]!.contact, 9.0);

  // An absolute second the composition has passed throws.
  TestValidator.error("an unreachable contact throws", () =>
    resolve(AutoMovieComposition.sequence(carina.enter("startingPlace").walkTo("clearPaving").touchForehead({ contact: 0.2 }))),
  );

  // The first personal offer to Harry in a scene is withdrawn; the second completes.
  const offers = resolve(
    AutoMovieComposition.parallel(
      StageTime.scene(
        "s02",
        0,
        8,
        carina.enter("benchFront", { facing: "clearPaving", holds: { right: "note" } }).offer(note, harry).hold(0.5).offer(note, harry),
        harry.enter("clearPaving", { facing: "benchFront" }),
      ),
    ),
  );
  const made = steps(offers.schedule, "carina", "offer");
  TestValidator.equals("first offer withdrawn", made[0]!.outcome, "withdrawn");
  TestValidator.equals("second offer completes", made[1]!.outcome, undefined);

  // Sitting ends with the pelvis on the seat.
  const sat = resolve(AutoMovieComposition.sequence(harry.enter("benchFront").walkTo("bench.centre").sit("bench.centre")));
  const sit = steps(sat.schedule, "harry", "sit")[0]!;
  const posture = sat.performance.posture("harry", sit.end + 0.5)!;
  TestValidator.predicate("the pelvis rests on the seat", Math.abs(posture.pelvis.y - (0.45 + 0.09)) < 0.03);

  // The composition mounts and seeks in Node.
  const mounted = StageMount.mount({
    set: yard,
    students: [carina, harry],
    props: [note],
    camera: new VerticalCamera(),
    composition: AutoMovieComposition.sequence(harry.enter("benchFront").walkTo("bench.centre").sit("bench.centre")),
    duration: 8,
  });
  mounted.seek(3.3);
  TestValidator.predicate("the mounted scene has drawable objects", mounted.scene.children.length > 3);
  mounted.dispose();
}
