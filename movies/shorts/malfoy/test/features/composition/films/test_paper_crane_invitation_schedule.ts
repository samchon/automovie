import type { IAutoMovieSchedule } from "@automovie/engine";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { paperCraneInvitation } from "../../../../src/composition/films/paperCraneInvitation";
import { CorridorStage } from "../../../../src/composition/scenes/paper-crane-invitation/CorridorStage";

/**
 * The resolved paper-crane film keeps the screenplay's scene order, running
 * time, anchors and object ownership, and resolves the same every time.
 *
 * Scenarios: the four scene markers fall at 0, 15, 30 and 45 s in order and
 * nothing outlasts 60 s, a whole number of 24 fps frames; the crane leaves
 * Carina's fingertip at 5.000 and Harry's catch closes after it at a glide
 * no faster than the charm's 1.5 m/s bound allows over the distance between
 * their hands, so before 5.000 she owns it and after the catch he does; her
 * receive closes at 17.000 with the outcome `buckled`, so he still owns the
 * sheet at 17.0 and she owns it after his release; the folded note rests on
 * the sill (nobody holds it) from the end of scene 3; Harry's cup is
 * Carina's until her release at 51.000 and his after it, so it never falls;
 * both students are seated at the end with their pelvis centres 0.50–0.75 m
 * apart, the span the sitting table's 0.45–0.55 m per sitter and 0.05–0.20 m
 * between hips gives; resolving the same composition twice gives the same
 * schedule.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the film's actual composition through the library's stage and asserts the schedule, prop ownership and seated postures.
 * @evidence contracts/development/testing.md#independent-expectations Times from the screenplay's anchors and scene boundaries; ownership from the handover study's rule; seat spacing from the sitting study's outcome table; the glide bound from the crane's settings speed.
 * @evidence contracts/development/testing.md#distinguishing-cases Ownership is checked on both sides of each transfer (before and after the catch, the release and the put-down); the scene markers are checked for every scene, not only the first.
 * @evidence contracts/development/testing.md#execution-ownership In-memory resolution, no browser, Viewer or GPU; capture and playback belong to review.
 * @evidence contracts/development/common.md#meaningful-documentation States every scenario and the behavior it pins.
 */
export function test_paper_crane_invitation_schedule(): void {
  const stage: CorridorStage = new CorridorStage();
  const resolved = stage.resolve(paperCraneInvitation.compose(stage.cast));
  const { schedule, props, performance } = resolved;
  const near = (a: number | undefined, b: number, what: string): void =>
    assert.ok(a !== undefined && Math.abs(a - b) < 1e-6, `${what}: ${a} != ${b}`);
  const one = (subject: string, capability: string, k: number = 0): IAutoMovieSchedule.IEntry => {
    const found = schedule.entries.filter((e) => e.subject === subject && e.intent.capability === capability)[k];
    assert.ok(found !== undefined, `${subject} ${capability} #${k}`);
    return found;
  };

  // Scene order, boundaries and running time.
  const film = paperCraneInvitation();
  assert.equal(film.durationSeconds, 60);
  assert.equal(film.fps, 24);
  assert.equal(Number.isInteger(film.durationSeconds * film.fps), true);
  ["s01", "s02", "s03", "s04"].forEach((id: string, k: number) =>
    near(schedule.entries.find((e) => e.intent.anchor === `scene:${id}`)?.end, k * 15, `scene ${id}`),
  );
  const last: number = Math.max(...schedule.entries.map((e) => e.end));
  assert.ok(last <= 60 + 1e-6, `the composition ends at ${last}`);

  // The crane: launched at 5.000, caught after a lawful glide.
  const launch = one("carina", "launch");
  near(launch.contact, 5, "launch");
  const caught = one("harry", "catch");
  assert.ok(caught.contact !== undefined && caught.contact > 5, "the catch follows the launch");
  assert.equal(props.owner("crane", 4.9), "carina");
  assert.equal(props.owner("crane", caught.contact! + 0.05), "harry");
  const flight: number = caught.contact! - 5;
  const catcher = performance.position("harry", caught.contact!)!;
  const launcher = performance.position("carina", 5)!;
  const floor: number = Math.hypot(catcher.x - launcher.x, catcher.z - launcher.z);
  // The hands are within an arm's length of each body, so the glide covers at least the floor gap less two arms.
  assert.ok(flight >= Math.max(0, floor - 1.6) / 1.5 - 1e-6, `glide ${flight} s over ${floor} m`);

  // The tug: her grip closes and pulls at 17.000 while he still holds; his release passes it to her.
  const tug = one("carina", "receive");
  near(tug.contact, 17, "buckle");
  assert.equal(tug.outcome, "buckled");
  assert.equal(props.owner("crane", 17.0), "harry");
  // A pinned action's entry starts where its chain reached it; its own instant is the contact.
  const release = one("harry", "release");
  assert.ok(release.contact !== undefined && release.contact > 17, "he lets go after her grip closed");
  assert.equal(props.owner("crane", release.contact! - 0.05), "harry");
  assert.equal(props.owner("crane", release.contact! + 0.05), "carina");
  assert.equal(props.owner("crane", 40), "carina");
  assert.equal(props.owner("crane", 45.5), null);

  // The cup: hers until 51.000, his after; never dropped.
  const given = one("carina", "release");
  near(given.contact, 51, "cup release");
  assert.equal(props.owner("cupB", 50.9), "carina");
  assert.equal(props.owner("cupB", 51.1), "harry");
  assert.equal(props.owner("cupB", 59.9), "harry");
  assert.equal(props.owner("cupA", 59.9), "carina");

  // Side by side on the bench at the end.
  const h = performance.posture("harry", 59.5)!;
  const c = performance.posture("carina", 59.5)!;
  assert.ok(Math.abs(h.pelvis.y - 0.54) < 0.03 && Math.abs(c.pelvis.y - 0.54) < 0.03, "both seated");
  const apart: number = Math.hypot(h.pelvis.x - c.pelvis.x, h.pelvis.z - c.pelvis.z);
  assert.ok(apart >= 0.5 && apart <= 0.75, `pelvis centres ${apart} m apart`);

  // Deterministic resolution.
  const hash = (s: IAutoMovieSchedule): string => createHash("sha256").update(JSON.stringify(s)).digest("hex");
  assert.equal(hash(stage.resolve(paperCraneInvitation.compose(stage.cast)).schedule), hash(schedule));
}
