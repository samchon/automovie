import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanQueueAdvance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { vclose } from "../../internal/vclose";

/**
 * Three people advance from uneven marks on one release, preserving order
 * and headway. A later cue shifts the full sequence while keeping delays.
 * A short exit, an off-axis mark and a reversed rank each refuse with the
 * affected performer.
 *
 * Scenarios:
 * 1. A release traverses authored marks in order with a minimum headway.
 * 2. Translating the cue shifts each walk and preserves its midpoint. Identical
 *    inputs reproduce held and moving roots exactly at named times.
 * 3. A short exit, off-axis mark and reversed rank report their performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the people, cue change, spacing and refusal measured in the test.
 * @evidence contracts/development/testing.md#behavioral-verification Checks scheduled boundaries and samples the roots during active walks at 24 Hz for headway and the path envelope. The initial and pre-entry hold roots agree, as do the arrival and final hold roots. Displayed ankle midpoints locate the starting stance relative to its floor mark and the walk's final footfall. An independently built performance reproduces named held and moving samples.
 * @evidence contracts/development/testing.md#independent-expectations The 0.25 s wait and authored marks determine each start relative to the predecessor's fitted end and each spatial endpoint. The opening stance adds the body's rest ankle displacement to its entry floor mark, while the walk ends with the ankles centered at its destination. Both positions are checked within 1 cm. The 10 cm active path envelope allows gait sway and small overshoots. Changing only the cue translates the walk clock, and repeating the same inputs gives the same root components.
 * @evidence contracts/development/testing.md#distinguishing-cases Unequal gaps expose wrong slot selection. Shifted and identical cues distinguish clock translation from exact replay. A 1 cm exit, off-axis mark and reversed rank check distinct refusals.
 * @evidence contracts/development/testing.md#execution-ownership A motions feature test, discovered by its exported name, that builds a real performance on the prepared polygon-man bodies with no host.
 */
export function test_motion_ensemble_service_queue(): void {
  const marks: readonly number[] = [0, -1.1, -2.6];
  const wait: number = 0.25;
  const bodies: readonly IAutoMovieMotionHumanBody[] = [
    motionHumanBody("f-small"),
    motionHumanBody("m-average"),
    motionHumanBody("m-tall"),
  ];
  const drawn: IAutoMovieMotionHumanEnsemble.IEnsemble =
    AutoMovieMotionHumanEnsemble.HumanEnsemble({
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

  const composition: IAutoMovieComposition =
    AutoMovieMotionHumanEnsemble.humanQueueAdvance(ensemble, request);

  /** Build the same performance at the supplied release second. */
  const build = (release: number): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "queue",
      performers:
        AutoMovieMotionHumanEnsemble.HumanEnsemble.performers(ensemble),
      cues: { counter: [{ name: "release", seconds: release }] },
      composition,
    });
  const release: number = 2;
  const later: number = 0.75;
  const film: IAutoMovieMotionHumanPerformance = build(release);
  const delayed: IAutoMovieMotionHumanPerformance = build(release + later);
  const replay: IAutoMovieMotionHumanPerformance = build(release);
  const destinations: readonly number[] = [1.3, 0, -1.1];
  let previousEnd: number = release;
  const walks: IAutoMovieMotionHumanSegment[] = [];
  const held: { before: IAutoMovieVector3; end: IAutoMovieVector3 }[] = [];

  for (const [rank, member] of ensemble.members.entries()) {
    const walk: IAutoMovieMotionHumanSegment = film.segments(
      member.subject,
    )[0]!;
    const laterWalk: IAutoMovieMotionHumanSegment = delayed.segments(
      member.subject,
    )[0]!;
    TestValidator.predicate(
      `rank ${rank} starts on its release or after the preceding walk ends`,
      Math.abs(walk.entryTime - (rank === 0 ? release : previousEnd + wait)) <=
        1e-9,
    );
    TestValidator.predicate(
      `rank ${rank} follows the later cue`,
      Math.abs(laterWalk.entryTime - walk.entryTime - later) <= 1e-9 &&
        Math.abs(laterWalk.end - walk.end - later) <= 1e-9,
    );
    const hold: number = Math.max(0, walk.entryTime - 1 / 24);
    const before: IAutoMovieVector3 = film.posture(member.subject, hold).root;
    const end: IAutoMovieVector3 = film.posture(
      member.subject,
      film.duration,
    ).root;
    const opening: IAutoMovieVector3 = film.posture(member.subject, 0).root;
    const arrival: IAutoMovieVector3 =
      walk.end === film.duration
        ? end
        : film.posture(member.subject, walk.end).root;
    TestValidator.predicate(
      `rank ${rank} holds its initial and final postures`,
      vclose(before, opening, 1e-9) && vclose(end, arrival, 1e-9),
    );
    const leftRest: IAutoMovieVector3 = member.body.rest.get("leftFoot")!;
    const rightRest: IAutoMovieVector3 = member.body.rest.get("rightFoot")!;
    const expectedStartX: number = (leftRest.x + rightRest.x) / 2;
    const expectedStartZ: number =
      marks[rank]! + (leftRest.z + rightRest.z) / 2;
    const startMark: IAutoMovieVector3 = ankleMidpoint(
      film,
      member.subject,
      hold,
    );
    const endMark: IAutoMovieVector3 = ankleMidpoint(
      film,
      member.subject,
      film.duration,
    );
    TestValidator.predicate(
      `rank ${rank} starts at ${startMark.z} m and arrives at ${endMark.z} m, expected ankle midpoints ${expectedStartZ} m and ${destinations[rank]} m`,
      Math.hypot(startMark.x - expectedStartX, startMark.z - expectedStartZ) <=
        0.01 && Math.hypot(endMark.x, endMark.z - destinations[rank]!) <= 0.01,
    );
    const middle: number = (walk.entryTime + walk.end) / 2;
    const midRoot: IAutoMovieVector3 = film.posture(
      member.subject,
      middle,
    ).root;
    TestValidator.predicate(
      `rank ${rank} keeps its seeded path when the cue shifts`,
      vclose(
        midRoot,
        delayed.posture(member.subject, middle + later).root,
        1e-9,
      ),
    );
    for (const [seconds, expected] of [
      [hold, before],
      [middle, midRoot],
      [film.duration, end],
    ] as const) {
      const repeated: IAutoMovieVector3 = replay.posture(
        member.subject,
        seconds,
      ).root;
      TestValidator.predicate(
        `rank ${rank} replays its root at ${seconds} s`,
        repeated.x === expected.x &&
          repeated.y === expected.y &&
          repeated.z === expected.z,
      );
    }
    walks.push(walk);
    held.push({ before, end });
    previousEnd = walk.end;
  }

  let closest: number = Infinity;
  let criticalRank: number = 0;
  let criticalSecond: number = 0;
  let pathError: number = 0;
  for (let t: number = 0; t <= film.duration; t += 1 / 24) {
    let predecessor: number = Infinity;
    for (const [rank, member] of ensemble.members.entries()) {
      const walk: IAutoMovieMotionHumanSegment = walks[rank]!;
      // A single-action performance holds its initial root before entry
      // and its clamped endpoint after the walk.
      const root: IAutoMovieVector3 =
        t < walk.entryTime - 1e-12
          ? held[rank]!.before
          : t >= walk.end
            ? held[rank]!.end
            : film.posture(member.subject, t).root;
      const gap: number = Number.isFinite(root.z)
        ? predecessor - root.z
        : -Infinity;
      if (gap < closest) {
        closest = gap;
        criticalRank = rank;
        criticalSecond = t;
      }
      predecessor = root.z;
      pathError = Math.max(
        pathError,
        Math.abs(root.x),
        marks[rank]! - root.z,
        root.z - destinations[rank]!,
      );
    }
  }
  TestValidator.predicate(
    `rank ${criticalRank} has ${closest.toFixed(3)} m of headway at ${criticalSecond.toFixed(3)} s, expected at least 1 m`,
    closest >= 1,
  );
  TestValidator.predicate(
    "the queue stays within 10 cm of each straight mark-to-mark path",
    pathError <= 0.1,
  );

  let refusal: unknown;
  try {
    AutoMovieMotionHumanEnsemble.humanQueueAdvance(ensemble, {
      ...request,
      exit: { x: 0, y: 0, z: 0.01 },
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an exit that crowds the new head reports the affected rank",
    refusal instanceof HumanRefusal &&
      refusal.axis === "queue" &&
      refusal.performer === ensemble.members[1]!.subject,
  );

  const misplaced: readonly [string, IAutoMovieVector3][] = [
    ["off the line", { x: 0.4, y: 0, z: -1.1 }],
    ["ahead of the head", { x: 0, y: 0, z: 1 }],
  ];
  for (const [label, at] of misplaced) {
    const second: IAutoMovieMotionHumanEnsemble.IMember = ensemble.members[1]!;
    const invalid: IAutoMovieMotionHumanEnsemble.IEnsemble = {
      ...ensemble,
      members: [
        ensemble.members[0]!,
        { ...second, place: { ...second.place, at } },
        ensemble.members[2]!,
      ],
    };
    let placementRefusal: unknown;
    try {
      AutoMovieMotionHumanEnsemble.humanQueueAdvance(invalid, request);
    } catch (error) {
      placementRefusal = error;
    }
    TestValidator.predicate(
      `a rank standing ${label} is identified in the refusal`,
      placementRefusal instanceof HumanRefusal &&
        placementRefusal.kind === "participant" &&
        placementRefusal.axis === "queue" &&
        placementRefusal.performer === second.subject,
    );
  }
}

/** Read the midpoint between the displayed ankle joints. */
function ankleMidpoint(
  film: IAutoMovieMotionHumanPerformance,
  subject: string,
  seconds: number,
): IAutoMovieVector3 {
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    film.bones(subject, seconds);
  const left: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
  const right: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
}
