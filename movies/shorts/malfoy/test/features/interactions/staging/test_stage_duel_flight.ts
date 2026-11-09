import { AutoMovieComposition } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { carinaMalfoy } from "../../../../src/entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { Student } from "../../../../src/entities/cast/student/Student";
import { FallingMasonry } from "../../../../src/entities/props/falling-masonry/FallingMasonry";
import { QuidditchPitch } from "../../../../src/entities/sets/quidditch-pitch/QuidditchPitch";
import { TrainingCourt } from "../../../../src/entities/sets/training-court/TrainingCourt";
import { SpellTrack } from "../../../../src/interactions/duelling/SpellTrack";
import { BroomTrack } from "../../../../src/interactions/flight/BroomTrack";
import { MasonryTrack } from "../../../../src/interactions/physics/MasonryTrack";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * Resolves a duel and a flight through the stage laws and checks the
 * outcomes their studies decide: a watched jinx at casting distance is
 * deflected when the defender sweeps, blocked when a shield stands, and hits
 * when nobody answers; a deflection sent into the cracked fillet starts the
 * cap's failure at the impact, and it lands after the 1.2 s tipping plus the
 * 0.742 s fall, with the clearance audit naming a duellist left under it and
 * nobody once he has stepped clear; a hanging rider who transfers rides 0.5 m
 * behind the host's live broom afterwards, and the released broom slows.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves compositions and asserts outcome classes, times and positions.
 * @evidence contracts/development/testing.md#independent-expectations Outcome classes from the duel study's table; times from the fall law's formula; spacing from the tandem settings.
 * @evidence contracts/development/testing.md#distinguishing-cases Deflect, shield and no answer; staying and leaving the danger region.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario.
 */
export function test_stage_duel_flight(): void {
  const court: TrainingCourt = new TrainingCourt();
  const carina: Student = new Student(carinaMalfoy);
  const harry: Student = new Student(harryPotter);
  const cap: FallingMasonry = new FallingMasonry();
  const duel = (answer: "deflect" | "shield" | "none", leave: boolean) => {
    const h = harry.enter("underCap", { facing: carina, holds: { right: "wand-harry" } }).onGuard(carina);
    const resolved = StageMount.resolve({
      set: court,
      students: [carina, harry],
      props: [cap],
      composition: AutoMovieComposition.parallel(
        carina.enter("centre.farSouthWest", { facing: harry, holds: { right: "wand-carina" } }).onGuard(harry).jinx(harry, { aim: "wand-shoulder", contact: 2.0 }),
        answer === "deflect" ? h.deflect("crackedFillet").hold(0.2).step("left", leave ? 1.6 : 0.01, { quick: true }) : answer === "shield" ? h.shield(2) : h.hold(3),
      ),
    });
    return { resolved, spells: SpellTrack.resolve(resolved.world, resolved.schedule) };
  };
  TestValidator.equals("a swept jinx is deflected", duel("deflect", true).spells.impacts[0]!.outcome, "deflected");
  TestValidator.equals("a shield blocks", duel("shield", true).spells.impacts[0]!.outcome, "blocked");
  TestValidator.equals("an unanswered jinx hits", duel("none", true).spells.impacts[0]!.outcome, "hit");

  const left = duel("deflect", true);
  const fails: MasonryTrack = MasonryTrack.resolve(court, left.resolved.schedule, left.spells, "test");
  const impact: number = left.spells.impacts[0]!.at;
  TestValidator.predicate("the deflected jinx starts the failure", Math.abs(fails.struck - impact) < 1e-9);
  TestValidator.predicate("the cap lands after tipping and the fall", Math.abs(fails.landing - (impact + 1.2 + Math.sqrt((2 * 2.7) / 9.80665))) < 1e-9);
  TestValidator.equals("a duellist who stepped clear is clear", fails.audit(left.resolved.performance, ["carina", "harry"]), []);
  const stayed = duel("deflect", false);
  const stays: MasonryTrack = MasonryTrack.resolve(court, stayed.resolved.schedule, stayed.spells, "test");
  TestValidator.equals("a duellist left under the cap is named", stays.audit(stayed.resolved.performance, ["carina", "harry"]).length, 1);

  // Flight: Harry hangs, Carina comes alongside, Harry transfers.
  const pitch: QuidditchPitch = new QuidditchPitch();
  const flight = StageMount.resolve({
    set: pitch,
    students: [carina, harry],
    props: [],
    composition: AutoMovieComposition.parallel(
      harry.enter("eastSouthGap.south", { riding: "broom-harry", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).slip({ start: 5 }).hold(2.5).transfer(carina, { start: 8.2 }).hold(3),
      carina.enter("eastSouthGap.north", { riding: "broom-carina", heading: Math.PI / 2 }).fly(["eastRunoff.chase"], { speed: 12 }).offerRear(harry, { start: 5.5 }).hold(6),
    ),
  });
  const host = flight.performance.broom("carina", 13)!;
  const rear = flight.performance.broom("harry", 13)!;
  TestValidator.predicate("the rear rider rides the host's broom", Math.hypot(host.position.x - rear.position.x, host.position.z - rear.position.z) < 1e-6);
  const posture = flight.performance.posture("harry", 13)!;
  const behind: number = Math.hypot(posture.pelvis.x - host.position.x, posture.pelvis.z - host.position.z);
  TestValidator.predicate("the rear seat is 0.45-0.55 m behind", behind > 0.4 && behind < 0.6);
  const brooms: BroomTrack = BroomTrack.resolve(flight.performance, flight.schedule);
  const early = brooms.at("broom-harry", 9.0)!;
  const late = brooms.at("broom-harry", 11.0)!;
  TestValidator.predicate("the released broom slows", late.speed < early.speed);
}
