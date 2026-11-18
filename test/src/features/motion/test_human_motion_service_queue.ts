import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanQueueAdvance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanEnsemble,
  HumanPerformance,
  HumanRefusal,
  humanQueueAdvance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Three people advance from uneven marks on one release, preserving order
 * and headway. A later cue shifts the full sequence while keeping delays.
 * A too-short exit refuses with the rank that cannot reach the service mark.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the people, cue change, spacing and refusal measured in the test.
 * @evidence contracts/development/testing.md#behavioral-verification Checks scheduled onsets, roots at successive holds and arrivals, and headway over every 24 Hz sample.
 * @evidence contracts/development/testing.md#independent-expectations The cue, 0.25 s wait and the separate authored marks provide expectations without deriving them from the composition; the predecessor's fitted end is the timing reference for each follower. A 1 cm tolerance protects the root-to-mark endpoint assertion.
 * @evidence contracts/development/testing.md#distinguishing-cases Forward releases at two different cue times use the same three bodies, with unequal gaps that expose wrong-slot selection; a second same-seed run checks replay, and a 1 cm exit checks refusal.
 * @evidence contracts/development/testing.md#execution-ownership A motions feature test, discovered by its exported name, that builds a real performance on the prepared polygon-man bodies with no host.
 */
export function test_human_motion_service_queue(): void {
  const marks: readonly number[] = [0, -1.1, -2.6];
  const wait: number = 0.25;
  const bodies: readonly IAutoMovieMotionHumanBody[] = [
    motionHumanBody("f-small"),
    motionHumanBody("m-average"),
    motionHumanBody("m-tall"),
  ];
  const drawn: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
    id: "queue",
    count: 3,
    seed: "queue",
    bodies,
    places: (i: number): { at: IAutoMovieVector3; yaw: number } => ({
      at: { x: 0, y: 0, z: marks[i]! },
      yaw: 0,
    }),
  });

  // Give all three sizes a turn instead of relying on draws with replacement.
  const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble = {
    ...drawn,
    members: drawn.members.map(
      (
        member: IAutoMovieMotionHumanEnsemble.IMember,
      ): IAutoMovieMotionHumanEnsemble.IMember => ({
        ...member,
        body: bodies[member.index]!,
        pool: member.index,
      }),
    ),
  };
  const request: IAutoMovieMotionHumanQueueAdvance = {
    on: { of: "counter", event: "release" },
    exit: { x: 0, y: 0, z: 1.3 },
    wait,
  };

  /** Build the same performance at the supplied release second. */
  const build = (release: number): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "queue",
      performers: HumanEnsemble.performers(ensemble),
      cues: { counter: [{ name: "release", seconds: release }] },
      composition: humanQueueAdvance(ensemble, request),
    });
  const release: number = 2;
  const later: number = 0.75;
  const film: IAutoMovieMotionHumanPerformance = build(release);
  const replay: IAutoMovieMotionHumanPerformance = build(release);
  const delayed: IAutoMovieMotionHumanPerformance = build(release + later);
  const destinations: readonly number[] = [1.3, 0, -1.1];
  let previousEnd: number = release;

  for (const [rank, member] of ensemble.members.entries()) {
    const walk: IAutoMovieMotionHumanSegment = film.segments(member.subject)[0]!;
    const laterWalk: IAutoMovieMotionHumanSegment =
      delayed.segments(member.subject)[0]!;
    TestValidator.predicate(
      `rank ${rank} starts on its release or after the preceding walk ends`,
      Math.abs(walk.entryTime - (rank === 0 ? release : previousEnd + wait)) <=
        1e-9,
    );
    TestValidator.predicate(
      `rank ${rank} follows the later cue`,
      Math.abs(laterWalk.entryTime - walk.entryTime - later) <= 1e-9,
    );
    const hold: number = Math.max(0, walk.entryTime - 1 / 24);
    const before: IAutoMovieVector3 = film.posture(member.subject, hold).root;
    const end: IAutoMovieVector3 = film.posture(
      member.subject,
      film.duration,
    ).root;
    TestValidator.predicate(
      `rank ${rank} holds its own mark then arrives at the vacated mark`,
      Math.abs(before.z - marks[rank]!) <= 0.01 &&
        Math.abs(end.z - destinations[rank]!) <= 0.01 &&
        Math.abs(end.x) <= 0.01,
    );
    previousEnd = walk.end;
  }

  let closest: number = Infinity;
  let replays: boolean = true;
  for (let t: number = 0; t <= film.duration; t += 1 / 24) {
    let predecessor: number = Infinity;
    for (const member of ensemble.members) {
      const root: IAutoMovieVector3 = film.posture(member.subject, t).root;
      const again: IAutoMovieVector3 = replay.posture(member.subject, t).root;
      closest = Math.min(closest, predecessor - root.z);
      predecessor = root.z;
      replays &&= root.x === again.x && root.y === again.y && root.z === again.z;
    }
  }
  TestValidator.predicate(
    `single file keeps at least 1 m between ranks, measured ${closest.toFixed(3)} m`,
    closest >= 1,
  );
  TestValidator.predicate(
    "the same seed and cue replay every sampled root",
    replays,
  );

  let refusal: unknown;
  try {
    humanQueueAdvance(ensemble, { ...request, exit: { x: 0, y: 0, z: 0.01 } });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an exit that crowds the new head reports the affected rank",
    refusal instanceof HumanRefusal &&
      refusal.axis === "queue" &&
      refusal.performer === ensemble.members[1]!.subject,
  );
}
