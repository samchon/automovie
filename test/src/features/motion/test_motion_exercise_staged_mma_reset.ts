import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanCoupled,
  HumanPerformance,
  HumanSignature,
  KickboxingRing,
  grapple,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/** Contact, skin and clearance allowance of the maintained grapple specs, metres. */
const SKIN: number = 0.01;

/** Display continuity allowance of the planted support checks, metres. */
const JOIN: number = 0.005;

/** Neighbouring samples on either side of the next beat's start, seconds. */
const OFFSET: number = 0.0001;

/** Initiator heading on its mark, degrees. */
const ACTOR_YAW: number = 8;

/** Receiver heading on its mark, degrees. */
const RECEIVER_YAW: number = 188;

/** The initiator's mark, metres. */
const ACTOR_MARK: IAutoMovieVector3 = { x: 0, y: 0, z: -0.27 };

/** The initiator's facing, the line the receiver's mark lies on. */
const FACING: IAutoMovieVector3 = {
  x: Math.sin((ACTOR_YAW * Math.PI) / 180),
  y: 0,
  z: Math.cos((ACTOR_YAW * Math.PI) / 180),
};

/** The receiver's mark, metres: ahead of the initiator's along its facing by a spacing. */
const receiverMark = (along: number): IAutoMovieVector3 =>
  Vector3.add(ACTOR_MARK, Vector3.scale(FACING, along));

/** A trunk part read as a sphere: its bone, its centre's height on the body and its radius. */
interface IBall {
  /** The bone carrying it. */
  bone: "head" | "chest";

  /** The centre's standing height, metres. */
  height: number;

  /** The radius, metres. */
  radius: number;
}

/**
 * The least spacing of the marks at which the two fighters' heads and chests
 * never meet over a played scene, metres: each a sphere (the head by its
 * radius, the chest by half its depth) carried by its displayed bone. The
 * receiver's whole motion is its own on its mark, the stances read nothing
 * of the initiator, so moving its mark by s along the facing moves every
 * sphere of it by s. For two spheres whose centres lie `along` apart on the
 * facing and `lateral` across it, they clear by `skin` once
 * `along + s >= sqrt((r1 + r2 + skin)^2 - lateral^2)`; the spacing is the
 * played one plus the greatest such s over the scene's instants, the closest
 * approach of the two bodies' solved stances.
 */
const spacing = (
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  played: number,
  from: number,
  to: number,
): number => {
  const balls: IBall[] = [
    {
      bone: "head",
      height: body.measure.headHeight,
      radius: body.measure.headRadius,
    },
    {
      bone: "chest",
      height: body.measure.chestHeight,
      radius: body.measure.chestDepth / 2,
    },
  ];
  const centre = (
    subject: string,
    ball: IBall,
    seconds: number,
  ): IAutoMovieVector3 => {
    const bone: IAutoMovieResolvedBone = film
      .bones(subject, seconds)
      .get(ball.bone)!;
    return Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, {
        x: 0,
        y: ball.height - body.rest.get(ball.bone)!.y,
        z: 0,
      }),
    );
  };
  let more: number = -Infinity;
  for (let t: number = from; t <= to + 1e-9; t += 1 / 24)
    for (const a of balls)
      for (const b of balls) {
        const gap: IAutoMovieVector3 = Vector3.subtract(
          centre("b", b, t),
          centre("a", a, t),
        );
        const along: number = Vector3.dot(gap, FACING);
        const lateral: number = Math.sqrt(
          Math.max(0, Vector3.dot(gap, gap) - along * along),
        );
        const reach: number = a.radius + b.radius + SKIN;
        if (lateral >= reach) continue;
        more = Math.max(
          more,
          Math.sqrt(reach * reach - lateral * lateral) - along,
        );
      }
  return played + Math.max(0, more);
};

/**
 * The matted fighting area at floor level: a square of 7.3 m between its
 * bounds, the largest ring the GLORY rules allow, centred on the scene.
 */
const MAT: IAutoMovieMotionHumanKickboxingRing.IRing = {
  centre: { x: 0, y: 0, z: 0 },
  size: 7.3,
  yaw: 0,
};

/**
 * An MMA clinch on the mat: the fighters tie up at the shoulders, the
 * referee's break comes at the release, they separate standing and the
 * next beat follows on the shared clock.
 *
 * Scenarios:
 * 1. The completed clinch grips both shoulders over a named window that
 *    closes at the release, the referee's break cue, and ends `separated`.
 * 2. At the break and through the scene both fighters stay inside the mat
 *    and clear of each other, and both stand upright at its end.
 * 3. A following beat joins each fighter's displayed joints continuously.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clinch, the referee's break, the mat bound, the separation and the join.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public coupled scene with a following beat, reads the planned grips and events and the displayed poses, colliders and joints at the break, the samples and the join.
 * @evidence contracts/development/testing.md#independent-expectations The mat is the GLORY rules' largest ring at floor level. The grapple specs supply the 1 cm skin bound and the 30 percent of stature upright criterion, and the planted support checks the 5 mm continuity bound.
 * @evidence contracts/development/testing.md#distinguishing-cases The completed clinch is read at the break, the separation and the join; the defended standing release and the stand-to-mat handback belong to the mat handback spec. The samples do not establish swept clearance.
 * @evidence contracts/development/testing.md#execution-ownership In-memory public placement and pose checks, without a capture or production host.
 */
export function test_motion_exercise_staged_mma_reset(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  try {
    scene(body, { kind: "mmaReset", outcome: "complete" }, complaints);
  } catch (error) {
    complaints.list.push(String(error));
  }
  complaints.assert("Staged MMA clinch and break");
}

/** Play the clinch, break and the next beat, and check what they show. */
function scene(
  body: IAutoMovieMotionHumanBody,
  setup: IAutoMovieMotionHumanGrapple.IScene,
  complaints: motionComplaints.IGatherer,
): void {
  const label: string = setup.outcome ?? "complete";
  const initiator = HumanChain.subject("a");
  const receiver = HumanChain.subject("b");
  const pair = HumanChain.mutual(
    HumanCoupled.grappling,
    {
      initiator: initiator.stand({ seconds: 0.3, sway: 0 }),
      receiver: receiver.stand({ seconds: 0.3, sway: 0 }),
    },
    setup,
    "clinch",
  );
  // The marks are set by the two bodies' own solved stances: played once at
  // the spacing their entry lean gives (`grapple.spacing`), then at the
  // closest-approach spacing that play reads (`spacing`).
  const played = (along: number): HumanPerformance =>
    new HumanPerformance({
      seed: "mma-clinch",
      laws: [grapple],
      performers: [
        {
          subject: "a",
          body,
          at: ACTOR_MARK,
          yaw: ACTOR_YAW,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at: receiverMark(along),
          yaw: RECEIVER_YAW,
          proficiency: { level: "trained" },
        },
      ],
      composition: {
        kind: "sequence",
        parts: [
          pair.node,
          {
            kind: "parallel",
            parts: [
              initiator.stand({ seconds: 0.4, sway: 0 }, "nextA").node,
              receiver.stand({ seconds: 0.4, sway: 0 }, "nextB").node,
            ],
          },
        ],
      },
    });
  const first: number = grapple.spacing("mmaReset", body, body);
  const trial: HumanPerformance = played(first);
  const film: HumanPerformance = played(
    spacing(trial, body, first, 0, trial.duration),
  );
  assertTakeClean(`staged_mma_reset ${film.duration}`, film);
  const entry = (anchor: string): IAutoMovieScheduleEntry =>
    film.schedule.entries.find((row): boolean => row.intent.anchor === anchor)!;
  const lead: IAutoMovieScheduleEntry = entry("clinch.initiator");
  const next: IAutoMovieScheduleEntry = entry("nextA");
  const one: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    ACTOR_YAW,
  );
  const other: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "b",
    body,
    RECEIVER_YAW,
  );

  // 1. The shoulder tie-up closes at the referee's break.
  const event = (name: string): number | undefined =>
    lead.events?.find((row): boolean => row.name === name)?.seconds;
  const brk: number | undefined = event("release");
  const segment: IAutoMovieMotionHumanSegment = film.segments("a").at(-2)!;
  const grips: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (contact): boolean =>
        contact.kind === "grip" && contact.support.kind === "person",
    );
  complaints.check(
    `${label}: two shoulder grips close at the break, before the next beat`,
    brk !== undefined &&
      brk > lead.start &&
      brk < next.start &&
      grips.length === 2 &&
      grips.every(
        (grip): boolean =>
          "region" in grip.support &&
          grip.support.region.startsWith("shoulder") &&
          nclose(lead.start + grip.to * segment.plan.duration, brk),
      ) &&
      event("separated") !== undefined,
  );

  // 2. Inside the mat and clear of each other, upright at the end.
  const samples: number[] = [0, 0.25, 0.5, 0.75, 1].map(
    (share: number): number => lead.start + (lead.end - lead.start) * share,
  );
  if (brk !== undefined) samples.push(brk);
  const clearance: number = Math.min(
    ...samples.map((seconds: number): number =>
      HumanSignature.apart(one, other, seconds),
    ),
  );
  complaints.check(
    (): string =>
      `${label}: body clearance ${clearance} m through the scene and at the break; ${overlap(one, other, samples)}`,
    clearance >= -SKIN,
  );
  for (const reader of [one, other]) {
    complaints.check(
      `${label}: ${reader.subject} stays inside the mat`,
      samples.every((seconds: number): boolean =>
        (["leftFoot", "rightFoot"] as const).every((bone): boolean =>
          KickboxingRing.inside(
            MAT,
            HumanSignature.joint(reader, seconds, bone),
          ),
        ),
      ),
    );
    const height: number =
      HumanSignature.joint(reader, lead.end, "head").y -
      HumanSignature.joint(reader, lead.end, "hips").y;
    complaints.check(
      `${label}: ${reader.subject} stands upright at the separation`,
      height > 0.3 * body.measure.stature,
    );
  }
  const floor: readonly IAutoMovieMotionHumanContactWindow[] = film
    .segments("b")
    .at(-2)!
    .plan.contacts.filter(
      (contact): boolean =>
        contact.support.kind === "ground" &&
        (contact.part === "seat" ||
          contact.part === "back" ||
          contact.part.endsWith("Knee")),
    );
  complaints.check(
    `${label}: the receiver takes no floor support`,
    floor.length === 0,
  );

  // 3. The next beat joins continuously.
  for (const reader of [one, other])
    for (const bone of ["hips", "chest", "leftFoot", "rightFoot"] as const) {
      const joined: number = Vector3.distance(
        HumanSignature.joint(reader, next.start - OFFSET, bone),
        HumanSignature.joint(reader, next.start + OFFSET, bone),
      );
      complaints.check(
        `${label}: ${reader.subject} ${bone} moves ${joined} m across the join`,
        joined <= JOIN,
      );
    }
}

/** Name the pair of collider parts that limits a failed clearance read. */
function overlap(
  one: IAutoMovieMotionHumanSignature.IReader,
  other: IAutoMovieMotionHumanSignature.IReader,
  samples: readonly number[],
): string {
  let distance: number = Infinity;
  let witness: string = "no joint sampled";
  for (const seconds of samples)
    for (const [left, right] of [
      [one, other],
      [other, one],
    ] as const) {
      const targets: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(right, seconds);
      for (const [bone, source] of HumanSignature.bones(left, seconds)) {
        const nearest: IAutoMovieMotionHumanColliders.IDistance =
          HumanColliders.distance(right.body, targets, source.worldPosition);
        if (nearest.distance < distance) {
          distance = nearest.distance;
          witness = `${left.subject}.${bone} and ${right.subject}.${nearest.bone} at ${seconds} s`;
        }
      }
    }
  return witness;
}
