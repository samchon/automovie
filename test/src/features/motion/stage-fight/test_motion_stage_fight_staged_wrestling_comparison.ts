import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanGrapple,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

/** Existing contact and body clearance tolerance in metres for the stage. */
const CONTACT: number = 0.01;

/** Display continuity allowance of the planted support checks, metres. */
const JOIN: number = 0.005;

/** Samples on either side of a phase boundary, seconds. */
const OFFSET: number = 0.0001;

/** The joints read across each phase boundary: trunk, hands and feet. */
const JOINTS: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "chest",
  "head",
  "leftHand",
  "rightHand",
  "leftFoot",
  "rightFoot",
];

/**
 * Cast pairs play two visually distinct upright-stage exchanges. Named contacts
 * coincide with the displayed surfaces and end before the final pose.
 *
 * Scenarios:
 *
 * 1. Each form uses its staged blocking on matched average and small casts. The
 *    two floor marks scale together with cast stature.
 * 2. The authored shoulder and lower-body poses show distinct height and contact
 *    patterns during their named partner cue.
 * 3. Both actors play the chosen reset to an upright final pose and the bodies
 *    stay clear at contact and release landmarks.
 * 4. Both roles cross every phase boundary continuously at the trunk, the hands
 *    and the feet.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the visible stage distinction, two cast sizes and shared reset.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public mutual performance with the production law; reads actual world joint and surface positions at named grip and release events and at the endpoints.
 * @evidence contracts/development/testing.md#independent-expectations The maintained staged grapple test establishes 1 cm clearance and contact bounds and 30 percent of stature between head and hips for upright carriage. The named surface families come from the choice of staged forms. A 2 cm chest-height contrast is twice the contact tolerance and reads through the stage turn. The planted support checks supply the 5 mm continuity bound across each phase boundary.
 * @evidence contracts/development/testing.md#distinguishing-cases A low single-contact form and an upright two-contact form use existing wider and closer stage layouts, respectively, and share timing and recovery requirements. Scaling the stage marks preserves the layout as the matched cast changes proportion. Continuity is read at every interior phase boundary of both roles; the geometry checks are discrete.
 * @evidence contracts/development/testing.md#execution-ownership The named pass uses the public in-memory performance and canonical digital bodies, without a render host.
 */
export function test_motion_stage_fight_staged_wrestling_comparison(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const reference: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const size of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(size);
    const scale: number = body.measure.stature / reference.measure.stature;
    const levels: number[] = [];
    for (const kind of ["singleLeg", "grecoRoman"] as const) {
      const label: string = `${size}/${kind}`;
      try {
        levels.push(observe(body, scale, kind, label, complaints));
      } catch (error) {
        complaints.list.push(`${label}: ${String(error)}`);
      }
    }
    if (levels.length === 2)
      complaints.check(
        `${size}: lower and upper chest levels ${levels.join(", ")} m`,
        levels[1]! - levels[0]! > 0.02,
      );
  }
  complaints.assert("Staged wrestling pose and recovery");
}

/** Place one digital stage case and observe its public contact and pose clocks. */
function observe(
  body: IAutoMovieMotionHumanBody,
  scale: number,
  kind: Extract<IAutoMovieMotionHumanGrapple.Kind, "singleLeg" | "grecoRoman">,
  label: string,
  complaints: motionComplaints.IGatherer,
): number {
  const low: boolean = kind === "singleLeg";
  const actorYaw: number = low ? 0 : 8;
  const partnerYaw: number = low ? 165 : 188;
  const film: HumanPerformance = new HumanPerformance({
    seed: "staged-wrestling-pose",
    laws: [AutoMovieMotionHumanGrapple.grapple],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: scale * (low ? -0.21 : -0.27) },
        yaw: actorYaw,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: {
          x: scale * (low ? -0.36 : 0.09),
          y: 0,
          z: scale * (low ? 0.66 : 0.27),
        },
        yaw: partnerYaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.mutual(
      AutoMovieMotionHumanCarryPerson.HumanCoupled.grappling,
      {
        initiator: HumanChain.subject("a").stand({ hold: 0.3, sway: 0 }),
        receiver: HumanChain.subject("b").stand({ hold: 0.3, sway: 0 }),
      },
      { kind, outcome: "denied" },
    ).node,
  });
  assertTakeClean(`staged_wrestling_comparison ${film.duration}`, film);
  const a: IAutoMovieMotionHumanSegment = film.segments("a").at(-1)!;
  const b: IAutoMovieMotionHumanSegment = film.segments("b").at(-1)!;
  const actor: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    actorYaw,
  );
  const partner: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "b",
    body,
    partnerYaw,
  );
  const release: number | undefined = a.plan.events.find(
    (event) => event.name === "release",
  )?.share;
  complaints.check(
    `${label} shared sequence ends after its release cue`,
    nclose(a.start, b.start) &&
      nclose(a.end, b.end) &&
      release !== undefined &&
      release > 0 &&
      release < 1,
  );

  const grip: readonly IAutoMovieMotionHumanContactWindow[] =
    a.plan.contacts.filter(
      (contact): boolean =>
        contact.kind === "grip" && contact.support.kind === "person",
    );
  const surface = kind === "singleLeg" ? "thigh" : "shoulder";
  const landmarks: Set<number> = new Set([a.start, a.end]);
  if (release !== undefined) landmarks.add(a.start + release * a.plan.duration);

  complaints.check(
    `${label} names the expected number of ${surface} contacts`,
    grip.length === (kind === "singleLeg" ? 1 : 2),
  );
  let lowest: number = Number.POSITIVE_INFINITY;
  for (const contact of grip) {
    if (contact.support.kind !== "person") continue;
    const partnerRegion: AutoMovieHumanoidRegion | undefined =
      "region" in contact.support ? contact.support.region : undefined;
    if (
      contact.support.subject !== "b" ||
      partnerRegion === undefined ||
      !partnerRegion.toLowerCase().includes(surface)
    ) {
      complaints.list.push(`${label}: unexpected region ${partnerRegion}`);
      continue;
    }
    complaints.check(
      `${label} ${partnerRegion} is held for an interval before reset`,
      contact.from < contact.to && contact.to < 1,
    );
    const palm = contact.part === "leftHand" ? "palmLeft" : "palmRight";
    for (const share of [
      contact.from,
      (contact.from + contact.to) / 2,
      contact.to,
    ]) {
      const seconds: number = a.start + share * a.plan.duration;
      landmarks.add(seconds);
      const gap: number = Vector3.distance(
        HumanSignature.region(actor, palm, seconds),
        HumanSignature.region(partner, partnerRegion, seconds),
      );
      complaints.check(
        `${label} ${partnerRegion} at ${seconds} s has gap ${gap} m`,
        gap <= CONTACT,
      );
      lowest = Math.min(
        lowest,
        HumanSignature.joint(actor, seconds, "chest").y,
      );
    }
  }

  const separation: number = Math.min(
    ...[...landmarks].map((seconds: number): number =>
      HumanSignature.apart(actor, partner, seconds),
    ),
  );
  complaints.check(
    (): string =>
      `${label} body clearance at ${landmarks.size} landmarks is ${separation} m. ${overlap(actor, partner, landmarks)}`,
    separation >= -CONTACT,
  );
  for (const reader of [actor, partner]) {
    const height: number =
      HumanSignature.joint(reader, a.end, "head").y -
      HumanSignature.joint(reader, a.end, "hips").y;
    complaints.check(
      `${label} ${reader.subject} returns upright`,
      height > 0.3 * reader.body.measure.stature,
    );
  }

  // Every phase boundary of both roles is crossed continuously: the joints
  // either side of it lie within the planted support checks' 5 mm.
  for (const [reader, segment] of [
    [actor, a],
    [partner, b],
  ] as const)
    for (const event of segment.plan.events) {
      if (!(event.share > 0 && event.share < 1)) continue;
      const seconds: number =
        segment.start + event.share * segment.plan.duration;
      for (const bone of JOINTS) {
        const jump: number = Vector3.distance(
          HumanSignature.joint(reader, seconds - OFFSET, bone),
          HumanSignature.joint(reader, seconds + OFFSET, bone),
        );
        complaints.check(
          `${label} ${reader.subject} ${bone} moves ${jump} m across ${event.name}`,
          jump <= JOIN,
        );
      }
    }
  return lowest;
}

/** Name the pair of digital collider parts that limits a failed clearance read. */
function overlap(
  actor: IAutoMovieMotionHumanSignature.IReader,
  partner: IAutoMovieMotionHumanSignature.IReader,
  samples: ReadonlySet<number>,
): string {
  let distance: number = Infinity;
  let witness: string = "No joint sampled.";
  for (const seconds of samples) {
    for (const [left, right] of [
      [actor, partner],
      [partner, actor],
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
  }
  return witness;
}
