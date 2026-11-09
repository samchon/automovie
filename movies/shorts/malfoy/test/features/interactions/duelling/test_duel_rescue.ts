import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { practicePlayers } from "../../../../src/entities/cast/student/practicePlayers";
import { Student } from "../../../../src/entities/cast/student/Student";
import { FallingMasonry } from "../../../../src/entities/props/falling-masonry/FallingMasonry";
import { TrainingCourt } from "../../../../src/entities/sets/training-court/TrainingCourt";
import { BodyFrame } from "../../../../src/laws/body/BodyFrame";
import { DuelLaw } from "../../../../src/laws/duelling/DuelLaw";
import { FallLaw } from "../../../../src/laws/physics/FallLaw";
import { ShieldTrack } from "../../../../src/interactions/duelling/ShieldTrack";
import { SpellTrack } from "../../../../src/interactions/duelling/SpellTrack";
import { MasonryTrack } from "../../../../src/interactions/physics/MasonryTrack";
import type { IStageWorld } from "../../../../src/interactions/staging/IStageWorld";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * Resolves the duel's rescue at the studies' fast ends and checks it: a
 * sprinting run-in covers ground at 3 m/s and a quick guided step 0.7 m in
 * 0.35 s; an unpinned `fail` lets the deflected jinx's impact on the cracked
 * fillet start the cap's failure; the three fragments, flying 2–4 m/s, stop
 * on a shield that finishes forming after the landing but before they
 * arrive.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves compositions and reads entry times, the cap's track and the fragments' ends.
 * @evidence contracts/development/testing.md#independent-expectations Speeds and step times from the duel study's fast ends; the fall from the fall law's formula.
 * @evidence contracts/development/testing.md#distinguishing-cases A run and a sprint; a pinned and an unpinned failure.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario.
 */
export function test_duel_rescue(): void {
  const court: TrainingCourt = new TrainingCourt();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const cap: FallingMasonry = new FallingMasonry();

  // The sprint and the quick guide.
  const run = (pace: "run" | "sprint") =>
    StageMount.resolve({
      set: court,
      students: [carina, harry],
      props: [],
      composition: AutoMovieComposition.parallel(
        carina.enter("centre.southWest", { facing: harry }).runAt(harry, { pace, distance: 0.9 }).guideAside(harry, "centre.south", { quick: true, start: 4 }).until(6),
        harry.enter("underCap", { facing: carina }).guidedTo("centre.south", { quick: true, start: 4 }).until(6),
      ),
    });
  const sprint = run("sprint");
  const entry = sprint.schedule.entries.find((e) => e.subject === "carina" && e.intent.capability === "run")!;
  const from: IAutoMovieVector3 = sprint.world.set.places["centre.southWest"]!.point;
  const to: IAutoMovieVector3 = sprint.world.set.places.underCap!.point;
  const metres: number = Math.hypot(to.x - from.x, to.z - from.z) - 0.9;
  TestValidator.predicate("a sprint covers the run at 3 m/s", Math.abs(entry.end - entry.start - Math.max(0.6, metres / DuelLaw.RUN_SPRINT + 0.2)) < 1e-6);
  const ordinary = run("run").schedule.entries.find((e) => e.subject === "carina" && e.intent.capability === "run")!;
  TestValidator.predicate("an ordinary run-in is slower", ordinary.end - ordinary.start > entry.end - entry.start);
  const guide = sprint.schedule.entries.find((e) => e.subject === "harry" && e.intent.capability === "guide")!;
  TestValidator.predicate("two quick guided steps take 0.7 s after the lead", Math.abs((guide.state as IStageWorld.IStudentStep).natural - 2 * DuelLaw.GUIDE_QUICK.time) < 1e-6);

  // The unpinned failure starts at the deflected jinx's impact; a shield standing when the fragments arrive stops them.
  const land: IAutoMovieVector3 = MasonryTrack.rest(court);
  const bearing: number = (25 * Math.PI) / 180;
  const spot: IAutoMovieVector3 = { x: land.x + Math.sin(bearing) * 1.9, y: 0, z: land.z + Math.cos(bearing) * 1.9 };
  // A third student stands beside the landing and raises the shield; the duel is the one the stage test resolves.
  const keeper: Student = new Student(practicePlayers["G-C1"]!);
  const duel = (shieldAt: number | undefined) => {
    const resolved = StageMount.resolve({
      set: court,
      students: [carina, harry, keeper],
      props: [cap],
      composition: AutoMovieComposition.parallel(
        cap.fail({ tipping: 1.5 }),
        harry.enter("underCap", { facing: carina, holds: { right: "wand-harry" } }).onGuard(carina).deflect("crackedFillet").hold(0.2).step("left", 1.6, { quick: true }).until(9),
        carina.enter("centre.farSouthWest", { facing: harry, holds: { right: "wand-carina" } }).onGuard(harry).jinx(harry, { aim: "wand-shoulder", contact: 2.0 }).until(9),
        shieldAt === undefined ? keeper.enter(spot, { facing: land }).until(9) : keeper.enter(spot, { facing: land, holds: { right: "wand-keeper" } }).shield(2, { contact: shieldAt }).until(9),
      ),
    });
    const spells = SpellTrack.resolve(resolved.world, resolved.schedule);
    return { resolved, spells, masonry: MasonryTrack.resolve(court, resolved.schedule, spells, "0123456789abcdef") };
  };
  const first = duel(undefined);
  const fillet: IAutoMovieVector3 = court.places.crackedFillet!.point;
  const onFillet = first.spells.impacts.find((i) => i.spell === "jinx" && Math.hypot(i.point.x - fillet.x, i.point.y - fillet.y, i.point.z - fillet.z) < 0.35);
  TestValidator.predicate("the deflected jinx strikes the cracked fillet", onFillet !== undefined);
  const impact: number = onFillet!.at;
  TestValidator.predicate("an unpinned fail starts at the deflected jinx's impact", Math.abs(first.masonry.struck - impact) < 1e-9 && first.masonry.struck > 1);
  const landing: number = impact + 1.5 + FallLaw.fallTime(court.cap.bottom);
  TestValidator.predicate("the cap lands after the chosen tipping and the fall", Math.abs(first.masonry.landing - landing) < 1e-9);
  const late = duel(landing + 0.1);
  const shield = ShieldTrack.resolve(late.resolved.schedule)[0]!;
  TestValidator.predicate("the shield finishes forming after the landing", shield.full > late.masonry.landing);
  for (const [k, fragment] of late.masonry.fragments.entries()) {
    // Stopped on the shield's surface: on its plane, within its oval's width of its centre.
    const plane: number = Math.abs((fragment.to.x - shield.centre.x) * Math.sin(shield.facing) + (fragment.to.z - shield.centre.z) * Math.cos(shield.facing));
    const off: number = Math.hypot(fragment.to.x - shield.centre.x, fragment.to.z - shield.centre.z);
    TestValidator.predicate(`fragment ${k} stops on the shield (${plane.toFixed(2)} m off its plane, ${off.toFixed(2)} m from its centre)`, plane <= 0.05 && off <= 1.5 && fragment.end >= shield.full);

    const heading: number = Math.atan2(fragment.to.x - land.x, fragment.to.z - land.z);
    TestValidator.predicate(`fragment ${k} leaves within 40° of away from the upright`, Math.abs(BodyFrame.turn(0, heading)) <= FallLaw.FRAGMENTS.cone + 1e-6);
  }
}
