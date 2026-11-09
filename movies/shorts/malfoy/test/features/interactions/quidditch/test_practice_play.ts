import { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { harryPotter } from "../../../../src/entities/cast/student/harryPotter";
import { practicePlayers } from "../../../../src/entities/cast/student/practicePlayers";
import { Student } from "../../../../src/entities/cast/student/Student";
import { QuidditchBall } from "../../../../src/entities/props/quidditch-ball/QuidditchBall";
import { QuidditchPitch } from "../../../../src/entities/sets/quidditch-pitch/QuidditchPitch";
import { StageAction } from "../../../../src/laws/staging/StageAction";
import { PracticePlay } from "../../../../src/interactions/quidditch/PracticePlay";
import { PropTrack } from "../../../../src/interactions/staging/PropTrack";
import { StageMount } from "../../../../src/interactions/staging/StageMount";

/**
 * Resolves the twelve players' practice play with the Quaffle and both
 * Bludgers and a stop of play, and checks what the practice-play study
 * requires: every Beater swing meets its Bludger at the bat, and the
 * Bludgers fly 8–12 m/s between swings; the named Beater strikes the named
 * Bludger at the stop's second, turns his head to the watched rider and has
 * his arm up within a second; everyone else turns the head to that rider at
 * once and hangs at rest by braking at 3 m/s²; the rescuer keeps station
 * 3.5 m beside the moving rider; the last Chaser to catch the Quaffle keeps
 * it at the chest.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the composition and measures balls, brooms and postures at their seconds.
 * @evidence contracts/development/testing.md#independent-expectations Speeds, the 3.5 m rescue distance and the 1 s and 2 s windows from the practice-play study; braking from the broom study.
 * @evidence contracts/development/testing.md#distinguishing-cases Ordinary swings and the stopping strike; the striker, the rescuer and everyone else.
 * @evidence contracts/development/testing.md#execution-ownership In-memory schedules only.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and each check.
 */
export function test_practice_play(): void {
  const pitch: QuidditchPitch = new QuidditchPitch();
  const players: Student[] = Object.values(practicePlayers).map((profile) => new Student(profile));
  const harry: Student = new Student(harryPotter);
  const balls = [new QuidditchBall("quaffle", "quaffle"), new QuidditchBall("B-1", "bludger"), new QuidditchBall("B-2", "bludger")];
  const stop: PracticePlay.IStop = { at: 10, by: "G-B1", strike: "B-2", toward: "middleThird", watch: "harry", rescuer: "G-K" };
  const resolved = StageMount.resolve({
    set: pitch,
    students: [...players, harry],
    props: balls,
    composition: AutoMovieComposition.parallel(
      PracticePlay.compose({ set: pitch, players, from: 0, to: 16, seed: "0123456789abcdef", quaffle: "quaffle", bludgers: ["B-1", "B-2"], stop }),
      harry.enter("seekersHeight.south", { riding: "broom-harry", heading: Math.PI / 2 }).fly(["seekersHeight", "eastGoalFront"], { speed: 6 }).until(16),
    ),
  });
  const { performance, props, schedule } = resolved;
  const ball = (id: string, t: number): IAutoMovieVector3 => PropTrack.point(props.at(id, t) as Exclude<PropTrack.ISegment, PropTrack.IHeld>, t);
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  // Every swing meets its Bludger at the bat.
  const swings = schedule.entries.filter((e) => e.intent.capability === "strike");
  TestValidator.predicate(`the Beaters swing at the Bludgers before the stop (${swings.length} swings)`, swings.filter((e) => (e.contact ?? e.start) < stop.at).length >= 4);
  for (const e of swings) {
    const action = StageAction.read(e.intent) as Extract<StageAction.Action, { kind: "strike" }>;
    const at: number = e.contact ?? e.start;
    const gap: number = distance(ball(action.ball, at), performance.broom(e.subject, at)!.position);
    TestValidator.predicate(`${e.subject}'s swing at ${at.toFixed(2)} s meets ${action.ball} within the reach of arm and bat (${gap.toFixed(2)} m from the seat)`, gap <= 1.0);
  }
  for (const id of ["B-1", "B-2"]) {
    let slowest: number = Infinity;
    let fastest: number = 0;
    const bats: number[] = swings.filter((e) => (StageAction.read(e.intent) as { ball?: string }).ball === id).map((e) => e.contact ?? e.start);
    for (let t = 0.5; t < stop.at - 0.2; t += 0.1) {
      if (bats.some((at) => at >= t - 1e-9 && at <= t + 0.1 + 1e-9)) continue;
      const v: number = distance(ball(id, t + 0.1), ball(id, t)) / 0.1;
      slowest = Math.min(slowest, v);
      fastest = Math.max(fastest, v);
    }
    TestValidator.predicate(`${id} flies 8–12 m/s between swings (${slowest.toFixed(1)}–${fastest.toFixed(1)} m/s)`, slowest >= 7.5 && fastest <= 12.5);
  }

  // The stopping strike, the striker's head and arm.
  const strike = swings.find((e) => e.subject === "G-B1" && Math.abs((e.contact ?? e.start) - stop.at) < 0.01);
  TestValidator.predicate("G-B1 strikes B-2 at the stop's second", strike !== undefined && (StageAction.read(strike.intent) as { ball: string }).ball === "B-2");
  const striker = performance.posture("G-B1", stop.at + 1.0)!;
  TestValidator.predicate("G-B1's arm is up within a second", striker.hands.right.point.y > striker.pelvis.y + 0.9);
  TestValidator.equals("G-B1 turns his head to the watched rider", performance.entry("G-B1", stop.at + 1.0)!.step.to.gaze, { kind: "subject", subject: "harry" });

  // Everyone else turns to the rider at once and comes to rest.
  for (const player of players) {
    if (player.id === "G-B1" || player.id === "G-K") continue;
    TestValidator.equals(`${player.id} looks at the watched rider within 2 s`, performance.entry(player.id, stop.at + 2.0)!.step.to.gaze, { kind: "subject", subject: "harry" });
    TestValidator.predicate(`${player.id} hangs at rest by ${stop.at + 4} s`, performance.broom(player.id, stop.at + 4)!.speed < 0.05);
  }

  // The rescuer keeps station beside the moving rider.
  const rescuer = performance.broom("G-K", 15.5)!;
  const rider = performance.broom("harry", 15.5)!;
  const off: number = Math.hypot(rescuer.position.x - rider.position.x, rescuer.position.z - rider.position.z);
  TestValidator.predicate(`G-K keeps 3.5 m beside the rider (${off.toFixed(2)} m)`, Math.abs(off - 3.5) <= 0.2);

  // The last receiver keeps the Quaffle.
  const holder = (t: number): number => Math.min(...players.filter((p) => p.id.includes("-C")).map((p) => distance(ball("quaffle", t), performance.broom(p.id, t)!.position)));
  TestValidator.predicate(`a Chaser holds the Quaffle at the chest after the stop (${holder(14).toFixed(2)} m)`, holder(14) <= 0.8 && holder(15.9) <= 0.8);
}
