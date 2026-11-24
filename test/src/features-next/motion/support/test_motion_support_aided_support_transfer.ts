import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createBed,
  createCrutch,
  createMobilityAid,
  createSeat,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../features/internal/archetypeExtent";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose, vclose } from "../../../features/internal/predicates";

/** World floor datum for an upright actor. */
const FLOOR: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** The campaign's support and independent shape contact limits, metres. */
const SUPPORT: number = 0.01;
const MM: number = 0.001;

/** A configured native aid scene and independent expected station recipe. */
interface IAidCase {
  /** The controlled body and its actual course. */
  film: HumanPerformance;

  /** Track and actor use the same authored course and prop identity. */
  params: IAutoMovieMotionHumanAidWalk;

  /** The visible staged model. */
  model: AutoMovieArchetype;

  /** Polygon man used in the native motion. */
  body: IAutoMovieMotionHumanBody;

  /** Starting floor centre of the prop, world metres. */
  at: IAutoMovieVector3;
}

/**
 * A shaped aid advances with its user's steps, and a partner's actual palm
 * holds until the recipient is supported by the real destination seat.
 *
 * Scenarios:
 * 1. The forearm prop exposes a handle on its visible bar and a tip on its
 *    bottom face in the maker's measured fit band.
 * 2. A cane, walker and crutch start, turn and stop. The walker leaves the
 *    floor with both feet supported. A single-grip aid moves during a step.
 *    Sample each grip, planted tip, authored rotation and terminal floor.
 * 3. Two supported body fits move from the same placed dining chair to a
 *    named bed side. Inspect actual displayed palms and seat height through
 *    contact, and refuse a destination that has no seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independent geometry, different support orders, two body fits and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Runs normal named laws through HumanPerformance, reads actual bone and prop poses, and passes measured hand points and the model solids to the exact shape distance engine.
 * @evidence contracts/development/testing.md#independent-expectations The crutch dimensions derive from the maker. Authored route stations independently specify floor and turn endpoints. Material distance, seat height and shared palm separation are measured rather than taken from law output. One millimetre for ground and ten for skin contacts are the campaign's contact limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes both orders and all three floor aids, a stationary and moving prop, left and right grips, first and terminal contact, alternate actor proportions and invalid seat admission.
 * @evidence contracts/development/testing.md#execution-ownership Discovered named native SDK regression with generated polygon men and real archetypes, in memory.
 */
export function test_motion_support_aided_support_transfer(): void {
  const height: number = 0.86;
  const crutch: ReturnType<typeof createCrutch> = createCrutch({ height }, 0);
  const grip: ReturnType<typeof crutch.affordance> = crutch.affordance("grip");
  const tip: ReturnType<typeof crutch.affordance> = crutch.affordance("tip");
  const handle: ReturnType<typeof archetypeExtent> = archetypeExtent(
    crutch,
    "y",
    ["handle"],
  );
  TestValidator.predicate(
    "the grip and tip lie on the rendered forearm crutch",
    nclose(grip.frame.translation.y, height, MM) &&
      nclose(grip.frame.translation.y, (handle.low + handle.high) / 2, MM) &&
      nclose(grip.aperture!, 1.5 * AutoMovieArchetypeUnits.INCH, MM) &&
      nclose(grip.aperture!, handle.size, MM) &&
      nclose(tip.frame.translation.y, archetypeExtent(crutch, "y").low, MM) &&
      vclose(
        AutoMovieArchetypeFrame.axis(tip.frame, "y"),
        { x: 0, y: -1, z: 0 },
        MM,
      ) &&
      nclose(crutch.body.mass, 0.5528, MM),
  );
  TestValidator.error("a height below the measured range refuses", () =>
    createCrutch({ height: 0.6 }),
  );

  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const kind of ["cane", "walker", "crutch"] as const)
    try {
      verifyAid(checks, aid(kind));
    } catch (error) {
      checks.check(
        `${kind}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  TestValidator.error(
    "a walker beyond both arms refuses",
    (): HumanPerformance => aid("walker", 3).film,
  );
  for (const size of ["m-average", "f-small"] as const)
    try {
      verifyTransfer(checks, size);
    } catch (error) {
      checks.check(
        `${size}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  TestValidator.error(
    "a bed without the named side seat refuses",
    (): HumanPerformance => transfer("m-average", "missing-seat"),
  );
  checks.assert("the displayed support cues satisfy their physical bounds");
}

/** Create the aid's real prop through its ordinary rigid track input. */
function aid(
  kind: IAutoMovieMotionHumanAidWalk["kind"],
  distance?: number,
): IAidCase {
  const walker: boolean = kind === "walker";
  const body: IAutoMovieMotionHumanBody = motionHumanBody(
    kind === "crutch" ? "f-small" : "m-average",
  );
  const model: AutoMovieArchetype =
    kind === "walker"
      ? createMobilityAid({ kind, height: 0.86 })
      : kind === "cane"
        ? createMobilityAid({ kind, height: 0.9 })
        : createCrutch({ height: 0.78 });
  const at: IAutoMovieVector3 = {
    x: walker ? 0 : -0.29,
    y: 0,
    z: distance ?? (walker ? 0.12 : 0.16),
  };
  const params: IAutoMovieMotionHumanAidWalk = {
    kind,
    prop: "aid",
    stations: walker
      ? [
          { x: 0, z: 0.12, seconds: 0.84 },
          { x: 0.018, z: 0.24, turn: 8, seconds: 0.9 },
          { x: 0.049, z: 0.34, turn: 15, seconds: 1.05 },
        ]
      : [
          { x: 0, z: 0.18, seconds: 0.84 },
          { x: 0.035, z: 0.36, turn: 16, seconds: 0.9 },
          { x: 0.095, z: 0.51, turn: 25, seconds: 1.05 },
        ],
  };
  const motion: ReturnType<typeof AutoMovieMotionHumanGait.aidWalk.track> =
    AutoMovieMotionHumanGait.aidWalk.track(
      HumanObject.frame({ at, yaw: 0 }),
      params,
    );
  const film: HumanPerformance = new HumanPerformance({
    seed: "screen-aid",
    performers: [
      {
        subject: "actor",
        body,
        at: FLOOR,
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [HumanObject.prop(params.prop, model, { at, yaw: 0 }, motion)],
    laws: [AutoMovieMotionHumanGait.aidWalk],
    composition: HumanChain.subject("actor").registered(
      AutoMovieMotionHumanGait.aidWalk.name,
      params,
    ).node,
  });
  return { film, params, model, body, at };
}

/** Observe world prop samples and the actual foot and hand contacts during each cycle. */
function verifyAid(
  checks: motionComplaints.IGatherer,
  scenario: IAidCase,
): void {
  const { film, params, model, body, at }: IAidCase = scenario;
  const segment: IAutoMovieMotionHumanSegment = film.segments("actor")[0]!;
  const walker: boolean = params.kind === "walker";
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "actor",
    body,
    0,
  );
  const events: ReadonlyMap<string, number> = new Map(
    segment.plan.events.map(({ name, share }): [string, number] => [
      name,
      share * segment.plan.duration,
    ]),
  );
  const hands: readonly ("left" | "right")[] = walker
    ? ["left", "right"]
    : ["right"];
  const shapes: IAutoMoviePhysicalShape[] = model.shapes();
  const bottom: number = archetypeExtent(shapes, "y").low;
  let clock: number = params.stations[0]!.seconds / 4;
  for (const [index, station] of params.stations.entries()) {
    const plant: number = events.get(`aidPlant${index + 1}`)!;
    const middle: number = (clock + plant) / 2;
    const airborne: IAutoMovieRigidTransform = film.prop(params.prop, middle);
    const grounded: IAutoMovieRigidTransform = film.prop(params.prop, plant);
    const feet: IAutoMovieMotionHumanContactWindow[] =
      segment.plan.contacts.filter(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.kind === "plant" &&
          window.part.endsWith("Foot") &&
          window.from * segment.plan.duration < middle &&
          window.to * segment.plan.duration > middle,
      );
    checks.check(
      `${params.kind} cycle ${index + 1} has the prescribed aid and foot order`,
      feet.length === (walker ? 2 : 1) &&
        feet.every((window: IAutoMovieMotionHumanContactWindow): boolean => {
          const side: AutoMovieHumanSide =
            window.part === "leftFoot" ? "left" : "right";
          const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
            "actor",
            middle,
          );
          const sole: readonly IAutoMovieMotionHumanFoot.ISocket[] =
            HumanFoot.sockets(body, bones, side);
          return nclose(
            Math.min(...sole.map(({ point }): number => point.y)),
            0,
            SUPPORT,
          );
        }) &&
        airborne.position.y + bottom > MM &&
        nclose(grounded.position.y + bottom, 0, MM) &&
        nclose(grounded.position.x, at.x + station.x, MM) &&
        nclose(grounded.position.z, at.z + station.z, MM) &&
        Quaternion.angle(
          grounded.rotation,
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, station.turn ?? 0),
        ) < 0.1,
    );
    for (const time of [clock, middle, plant, clock + station.seconds]) {
      const placement: IAutoMovieRigidTransform = film.prop(params.prop, time);
      for (const hand of hands) {
        const target: string = walker ? `${hand}Grip` : "handle";
        const bar: IAutoMoviePhysicalShape = shapes.find(
          (shape: IAutoMoviePhysicalShape): boolean => shape.id === target,
        )!;
        const palm: IAutoMovieVector3 = HumanSignature.region(
          reader,
          hand === "left" ? "palmLeft" : "palmRight",
          time,
        );
        const gap: number = physicalShapeSegmentDistance(
          placement,
          bar,
          palm,
          palm,
        );
        checks.check(
          `${params.kind} ${hand} hand contacts its visible grip at ${time.toFixed(3)} s. Gap ${(gap * 1000).toFixed(1)} mm`,
          Math.abs(gap) <= SUPPORT,
        );
      }
    }
    clock += station.seconds;
  }
  const last: IAutoMovieRigidTransform = film.prop(params.prop, segment.end);
  const after: IAutoMovieRigidTransform = film.prop(
    params.prop,
    segment.end + 0.1,
  );
  checks.check(
    `${params.kind} stays grounded and stationary after the stop`,
    nclose(last.position.y + bottom, 0, MM) &&
      vclose(last.position, after.position, MM) &&
      Quaternion.angle(last.rotation, after.rotation) < 0.1,
  );
}

/** Chair and bed transfer through the public mutual chain with actual model seats. */
function transfer(
  size: motionHumanBody.Name,
  destination: string = "rightSide",
): HumanPerformance {
  const helper: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const recipient: IAutoMovieMotionHumanBody = motionHumanBody(size);
  const chair: ReturnType<typeof createSeat> = createSeat({ kind: "dining" });
  const bed: ReturnType<typeof createBed> = createBed({
    kind: "single",
    height: 0.49,
  });
  const chairAt: IAutoMovieMotionHumanObject.Placement = {
    at: { x: 0.22, y: 0, z: -0.72 },
    yaw: -90,
  };
  const bedAt: IAutoMovieMotionHumanObject.Placement = {
    at: { x: 0.45, y: 0, z: 0.5 },
    yaw: 0,
  };
  return new HumanPerformance({
    seed: "screen-transfer",
    performers: [
      {
        subject: "recipient",
        body: recipient,
        at: { x: -0.2, y: 0, z: -0.72 },
        yaw: -90,
        proficiency: { level: "trained" },
      },
      {
        subject: "helper",
        body: helper,
        at: { x: -0.14, y: 0, z: -0.36 },
        yaw: 160,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("chair", chair, chairAt),
      HumanObject.prop("bed", bed, bedAt),
    ],
    laws: [AutoMovieMotionHumanCarryPerson.HumanAssistedTransfer],
    composition: HumanChain.mutual(
      AutoMovieMotionHumanCarryPerson.HumanAssistedTransfer.mutual,
      {
        helper: HumanChain.subject("helper").stand({ hold: 0.25 }),
        helped: HumanChain.subject("recipient").sit({
          seat: HumanObject.seat(chair, chairAt, "seat"),
          hold: 0.25,
        }),
      },
      {
        clasp: { x: -0.2, y: 0.88, z: -0.43 },
        from: { prop: "chair", point: "seat" },
        to: { prop: "bed", point: destination, along: -0.62 },
        seconds: 0.55,
      },
    ).node,
  });
}

/** Check both posed bodies, the shared clasp and the destination bearing before release. */
function verifyTransfer(
  checks: motionComplaints.IGatherer,
  size: motionHumanBody.Name,
): void {
  const film: HumanPerformance = transfer(size);
  const helped: IAutoMovieMotionHumanSegment = film
    .segments("recipient")
    .at(-1)!;
  const helper: IAutoMovieMotionHumanSegment = film.segments("helper").at(-1)!;
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "recipient",
    motionHumanBody(size),
    -90,
  );
  const bearer: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "helper",
    motionHumanBody("m-average"),
    160,
  );
  const source: IAutoMovieMotionHumanContactWindow = helped.plan.contacts.find(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.part === "seat" &&
      window.support.kind === "prop" &&
      window.support.subject === "chair",
  )!;
  const target: IAutoMovieMotionHumanContactWindow = helped.plan.contacts.find(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.part === "seat" &&
      window.support.kind === "prop" &&
      window.support.subject === "bed",
  )!;
  const patient: IAutoMovieMotionHumanContactWindow = helped.plan.contacts.find(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.kind === "grip" &&
      window.support.kind === "person" &&
      window.support.subject === "helper",
  )!;
  const hand: IAutoMovieMotionHumanContactWindow = helper.plan.contacts.find(
    (window: IAutoMovieMotionHumanContactWindow): boolean =>
      window.kind === "grip" &&
      window.support.kind === "person" &&
      window.support.subject === "recipient",
  )!;
  const start: number = helped.start + patient.from * helped.plan.duration;
  const release: number = helped.start + patient.to * helped.plan.duration;
  checks.check(
    `${size} holds from the chair until the bed bears`,
    source.to < target.from &&
      patient.from < source.to &&
      target.from < patient.to &&
      nclose(start, helper.start + hand.from * helper.plan.duration, 1e-7) &&
      nclose(release, helper.start + hand.to * helper.plan.duration, 1e-7),
  );
  const times: readonly number[] = [
    start,
    ...HumanSignature.times(start, release, 12),
    release,
  ];
  for (const time of times) {
    const palm: IAutoMovieVector3 = HumanSignature.region(
      reader,
      "palmRight",
      time,
    );
    const held: IAutoMovieVector3 = HumanSignature.region(
      bearer,
      "palmRight",
      time,
    );
    const gap: number = Vector3.distance(palm, held);
    checks.check(
      `${size} displayed palms at ${time.toFixed(3)} s are ${(gap * 1000).toFixed(1)} mm apart`,
      gap <= SUPPORT,
    );
  }
  for (const share of [target.from + MM, patient.to, 1]) {
    const time: number = helped.start + share * helped.plan.duration;
    const seat: IAutoMovieVector3 = HumanSignature.region(reader, "seat", time);
    checks.check(
      `${size} bears on the named bed side at ${time.toFixed(3)} s`,
      nclose(seat.y, 0.49, SUPPORT) &&
        seat.x > 0 &&
        seat.x < 0.9 &&
        seat.z > -0.45 &&
        seat.z < 1.45,
    );
  }
}
