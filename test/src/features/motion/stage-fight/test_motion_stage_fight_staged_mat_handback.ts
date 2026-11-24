import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanGrapple,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

/** Ground and body clearance allowance from the maintained staged take, metres. */
const SKIN: number = 0.01;

/** Display-pose continuity allowance from the planted support checks, metres. */
const JOIN: number = 0.005;

/** Neighboring samples on either side of the next action's start, seconds. */
const OFFSET: number = 0.0001;

/**
 * The declared mat and denied releases continue to the next scheduled beat with
 * different receiver supports and continuous displayed joints.
 *
 * Scenarios:
 *
 * 1. A completed take transfers its receiver support from seat to back. The next
 *    beat begins when both actors finish while the receiver remains low.
 * 2. The staged denied take also releases and hands back to the next beat. The
 *    receiver exits upright with neither seat nor back support.
 * 3. Named joint landmarks and body clearance are sampled before, at and after
 *    each handback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two declared outcomes, their distinct supports and a following stage beat.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public coupled action and a real appended stand on one schedule, checks the release against the handback time, and reads both displayed poses and colliders through the join.
 * @evidence contracts/development/testing.md#independent-expectations The authored "complete" and "denied" outcomes demand different support states. The existing grapple check supplies one centimetre clearance and thirty percent of stature for upright posture. Planted-support checks supply a five millimetre continuity allowance. Two samples bracketing the exact join also read continuity for the appended action.
 * @evidence contracts/development/testing.md#distinguishing-cases The same follow-up stand consumes the two preceding outcome families and must preserve each receiver's different pose on the same film clock. The samples verify the join and do not claim swept or whole-shot clearance.
 * @evidence contracts/development/testing.md#execution-ownership In-memory public placement and pose checks, without a capture or production host.
 */
export function test_motion_stage_fight_staged_mat_handback(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const scene of [
    { kind: "seoiNage", outcome: "complete" },
    { kind: "singleLeg", outcome: "denied" },
  ] as const satisfies readonly IAutoMovieMotionHumanGrapple.IScene[]) {
    try {
      handback(body, scene, complaints);
    } catch (error) {
      complaints.list.push(`${scene.outcome}: ${String(error)}`);
    }
  }
  complaints.assert("Staged mat handback");
}

/** Use the checked staged marks and join the pair to an authored next beat. */
function handback(
  body: IAutoMovieMotionHumanBody,
  scene: IAutoMovieMotionHumanGrapple.IScene,
  complaints: motionComplaints.IGatherer,
): void {
  const upright: boolean = scene.outcome === "denied";
  const actorYaw: number = upright ? 0 : 8;
  const receiverYaw: number = upright ? 165 : 188;
  const initiator = HumanChain.subject("a");
  const receiver = HumanChain.subject("b");
  const pair = HumanChain.mutual(
    AutoMovieMotionHumanCarryPerson.HumanCoupled.grappling,
    {
      initiator: initiator.stand({ hold: 0.3, sway: 0 }),
      receiver: receiver.stand({ hold: 0.3, sway: 0 }),
    },
    scene,
    "mat",
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "stage-mat-handback",
    laws: [AutoMovieMotionHumanGrapple.grapple],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: upright ? -0.21 : -0.27 },
        yaw: actorYaw,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: upright ? { x: -0.36, y: 0, z: 0.66 } : { x: 0.09, y: 0, z: 0.27 },
        yaw: receiverYaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: {
      kind: "sequence",
      parts: [pair.node, initiator.stand({ hold: 0.4, sway: 0 }, "next").node],
    },
  });
  assertTakeClean(`staged_mat_handback ${film.duration}`, film);
  const entry = (name: string): IAutoMovieScheduleEntry =>
    film.schedule.entries.find((span): boolean => span.intent.anchor === name)!;
  const lead: IAutoMovieScheduleEntry = entry("mat.initiator");
  const partner: IAutoMovieScheduleEntry = entry("mat.receiver");
  const next: IAutoMovieScheduleEntry = entry("next");
  const release: number | undefined = lead.events?.find(
    (event) => event.name === "release",
  )?.seconds;
  complaints.check(
    `${scene.outcome}: the named release precedes the shared handback`,
    release !== undefined &&
      release > lead.start &&
      release < next.start &&
      nclose(lead.end, next.start) &&
      nclose(partner.end, next.start),
  );

  const paired: IAutoMovieMotionHumanSegment = film.segments("b").at(-1)!;
  const floor: readonly IAutoMovieMotionHumanContactWindow[] =
    paired.plan.contacts.filter(
      (window): boolean =>
        window.support.kind === "ground" &&
        (window.part === "seat" || window.part === "back"),
    );
  const seat: IAutoMovieMotionHumanContactWindow | undefined = floor.find(
    (window): boolean => window.part === "seat",
  );
  const back: IAutoMovieMotionHumanContactWindow | undefined = floor.find(
    (window): boolean => window.part === "back",
  );
  complaints.check(
    `${scene.outcome}: receiver keeps the authored support through handback`,
    upright
      ? floor.length === 0
      : seat !== undefined &&
          back !== undefined &&
          seat.from < back.from &&
          back.from <= seat.to + 1e-9 &&
          nclose(back.to, 1),
  );

  const one: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    actorYaw,
  );
  const other: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "b",
    body,
    receiverYaw,
  );
  const samples: readonly number[] = [
    next.start - OFFSET,
    next.start,
    next.start + OFFSET,
  ];
  const clearance: number = Math.min(
    ...samples.map((seconds: number): number =>
      HumanSignature.apart(one, other, seconds),
    ),
  );
  complaints.check(
    `${scene.outcome}: body clearance ${clearance} m across the join`,
    clearance >= -SKIN,
  );

  for (const reader of [one, other])
    for (const bone of ["hips", "chest", "leftFoot", "rightFoot"] as const) {
      const joined: number = Vector3.distance(
        HumanSignature.joint(reader, samples[0]!, bone),
        HumanSignature.joint(reader, samples[2]!, bone),
      );
      complaints.check(
        `${scene.outcome}: ${reader.subject} ${bone} moves ${joined} m across the join`,
        joined <= JOIN,
      );
    }

  const height: number =
    HumanSignature.joint(other, next.end, "head").y -
    HumanSignature.joint(other, next.end, "hips").y;
  complaints.check(
    `${scene.outcome}: receiver's head-to-pelvis height at the next beat is ${height} m`,
    upright
      ? height > 0.3 * body.measure.stature
      : Math.abs(height) < 0.3 * body.measure.stature,
  );
}
