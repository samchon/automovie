import type { IAutoMovieSchedule } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { composeSnitchBeforeYou } from "../../../../src/composition/films/composeSnitchBeforeYou";
import { snitchBeforeYou } from "../../../../src/composition/films/snitchBeforeYou";
import { PitchStage } from "../../../../src/composition/scenes/snitch-before-you/PitchStage";
import { StageMount } from "../../../../src/interactions/staging/StageMount";
import { StageAction } from "../../../../src/laws/staging/StageAction";

/**
 * The resolved `snitch-before-you` film keeps the screenplay's order, length
 * and anchors.
 *
 * Scenarios: the film is 60 s at 24 fps on 720 × 1280, a whole number of
 * frames; the seven scene markers fall in screenplay order at 0, 8, 15, 24,
 * 32, 35 and 43 s; Harry's slip lands at 30.000 and his first grip on
 * Carina's broom at 38.000, the transfer admitted by the broom-riding
 * conditions Carina's offer meets, so his one-handed hang (with the at most 1 s
 * second phase) stays under the 10 s the broom-riding study allows; the six
 * lines are spoken in screenplay order by their speakers; no camera cut
 * falls inside the transfer shot from 35 to 43 s; all fourteen riders are on
 * the stage for the whole film; resolving twice gives the same schedule.
 *
 * @evidence docs/body/screenplay/snitch-before-you.md Scene order and the 60 s length.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b02 The slip at 30.000.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b02 The first grip at 38.000.
 * @evidence docs/body/screenplay/snitch-before-you.md#s06-b01 One unbroken shot from 35 s through the transfer.
 * @evidence docs/research/flight/broom-riding.md#hanging One-handed for no more than 10 s.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the film's actual composition through the stage laws and reads the schedule and performance.
 * @evidence contracts/development/testing.md#independent-expectations Times and lines are the screenplay's; the hang limit is the study's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory resolution, no browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation States every scenario.
 */
export function test_snitch_before_you_schedule(): void {
  const film = snitchBeforeYou();
  TestValidator.equals("duration", film.durationSeconds, 60);
  TestValidator.equals("fps", film.fps, 24);
  TestValidator.equals("raster", [film.width, film.height], [720, 1280]);
  TestValidator.predicate("whole frames", Number.isInteger(film.durationSeconds * film.fps));

  const stage: PitchStage = new PitchStage();
  const resolve = () =>
    StageMount.resolve({ set: stage.pitch, students: stage.students(), props: stage.props(), composition: composeSnitchBeforeYou(stage) });
  const { schedule, performance } = resolve();
  const anchored = (id: string): IAutoMovieSchedule.IEntry | undefined => schedule.entries.find((e) => e.intent.anchor === id);
  const near = (title: string, value: number | undefined, expected: number): void =>
    TestValidator.predicate(`${title}: ${value} ~ ${expected}`, value !== undefined && Math.abs(value - expected) < 1e-6);

  const starts: number[] = [0, 8, 15, 24, 32, 35, 43];
  starts.forEach((second: number, k: number) => near(`scene s0${k + 1} starts`, anchored(`scene:s0${k + 1}`)?.end, second));

  const slip: number | undefined = anchored("s04-b02/slip")?.contact;
  const grip: number | undefined = anchored("s06-b02/grip")?.contact;
  near("slip", slip, 30);
  near("first grip", grip, 38);
  TestValidator.equals("the transfer is admitted", anchored("s06-b02/grip")?.outcome, "transferred");
  TestValidator.predicate("one-handed hang under 10 s", slip !== undefined && grip !== undefined && grip - slip + 1 <= 10);

  const lines: [string, string][] = schedule.entries
    .filter((e) => e.intent.capability === "say")
    .sort((a, b) => a.end - b.end)
    .map((e) => [e.subject, (StageAction.read(e.intent) as Extract<StageAction.Action, { kind: "say" }>).words]);
  TestValidator.equals("lines in order", lines, [
    ["carina", "Try to keep up, Potter."],
    ["harry", "Already am."],
    ["carina", "Take the back, Potter."],
    ["harry", "You had it."],
    ["carina", "Don't make a habit of it."],
    ["harry", "No promises."],
  ]);

  const cuts: number[] = schedule.entries
    .filter((e) => e.intent.capability === "shot" && (StageAction.read(e.intent) as Extract<StageAction.Action, { kind: "shot" }>).shot.cut)
    .map((e) => e.end);
  TestValidator.predicate("no cut inside the transfer shot", !cuts.some((t: number) => t > 35 + 1e-9 && t < 43 - 1e-9));

  for (const student of stage.students())
    for (let t = 0; t < 60; t += 0.5)
      TestValidator.predicate(`${student.id} on stage at ${t}`, performance.position(student.id, t) !== undefined);

  const hash = (s: IAutoMovieSchedule): string => createHash("sha256").update(JSON.stringify(s.entries.map((e) => [e.subject, e.intent.capability, e.start, e.end]))).digest("hex");
  TestValidator.equals("deterministic", hash(resolve().schedule), hash(schedule));
}
