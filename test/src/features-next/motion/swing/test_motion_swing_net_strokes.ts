import { createRacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A tennis forehand steps before racket contact, and a volleyball spike
 * hits overhead in flight and settles onto the original support.
 *
 * Scenarios:
 * 1. Pick up a tennis racket and cross a stage mark with its hitting face.
 *    The ready stance lifts one foot at a time with lateral pelvis transfer.
 *    Read the stepping and supporting foot from displayed bones and check
 *    that the racket stays in the hand through recovery and an airborne split step.
 * 2. Strike a separate overhead mark with the volleyball palm. Read the
 *    approach, both soles off the floor and the landing and recovery.
 *
 * A stage mark may miss its recorded hand or face by up to 60 mm, the
 * equipment contact inspection allowance. The 5 mm fixed support band is
 * the established ground-lock test tolerance. Minimum travel and height
 * changes distinguish the stroke phases from these numerical tolerances.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the stroke cases, independent stage marks, support and contact bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Samples the displayed racket and palm, hand frames, foot bones and sole sockets on a performance.
 * @evidence contracts/development/testing.md#independent-expectations The two contact marks are given in world metres and read from neither action nor profile. A fixed racket-to-hand transform and stable foot support are tested as relations.
 * @evidence contracts/development/testing.md#distinguishing-cases The supported ready steps each have one fixed foot before a two-foot airborne split step. The held forehand and the airborne single-palm spike retain their distinct contact checks.
 * @evidence contracts/development/testing.md#execution-ownership Uses one standard polygon body and two short deterministic public performances in memory.
 */
export function test_motion_swing_net_strokes(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  for (const check of [tennisForehand, volleyballSpike] as const)
    try {
      check(body, complaints);
    } catch (error) {
      complaints.push(
        `${check.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals(
    "displayed approaches, contacts and recoveries",
    complaints,
    [],
  );
}

/** Read a name on the stroke segment's clock and return a film second. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((instant) => instant.name === name)!.share
  );
}

/** The playable body in a level court frame. */
function player(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformance.IInput["performers"][number] {
  return {
    subject: "a",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

/** Check a held forehand's actual racket and support frames. */
function tennisForehand(
  body: IAutoMovieMotionHumanBody,
  complaints: string[],
): void {
  const height: number = body.measure.stature;
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  // The face passes outside and in front of the player on this forehand.
  const mark: IAutoMovieVector3 = {
    x: -0.54 * height,
    y: 0.71 * height,
    z: 0.39 * height,
  };
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "tennis-shadow-contact",
    performers: [player(body)],
    props: [
      HumanObject.prop("racket", racket, {
        position: { x: -0.1 * height, y: 0.6 * height, z: 0.18 * height },
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      }),
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .pickUp({
        prop: "racket",
        handle: "grip",
        use: { tip: "sweetSpot", line: "oblique" },
      })
      .racket({ kind: "readyPosition", implement: "racket" })
      .racket({ kind: "tennisForehand", implement: "racket", contactAt: mark })
      .racket({ kind: "splitStep", implement: "racket" }).node,
  });
  const [stance, segment, split]: IAutoMovieMotionHumanSegment[] = film
    .segments("a")
    .filter(
      (item: IAutoMovieMotionHumanSegment): boolean => item.name === "racket",
    );
  if (stance === undefined || segment === undefined || split === undefined)
    throw new Error(
      "The ready, forehand and split phases must all be present.",
    );
  const start: number = segment.start;
  const plant: number = event(segment, "plant");
  const ready: number = event(segment, "ready");
  const strike: number = event(segment, "stroke");
  const end: number = start + segment.plan.duration;
  const ankle = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 => joint(film, seconds, `${side}Foot`);
  const readySpan: number = event(stance, "ready") - stance.start;
  const first: number = stance.start + 0.3 * readySpan;
  const transfer: number = stance.start + 0.5 * readySpan;
  const second: number = stance.start + 0.7 * readySpan;
  const standing: IAutoMovieVector3 = joint(film, stance.start, "hips");
  const leftLock: number = Vector3.distance(
    ankle("left", stance.start),
    ankle("left", first),
  );
  const rightLock: number = Vector3.distance(
    ankle("right", transfer),
    ankle("right", second),
  );
  const sole = (side: AutoMovieHumanSide, seconds: number): number =>
    Math.min(
      ...HumanFoot.sockets(body, film.bones("a", seconds), side).map(
        (site) => site.point.y,
      ),
    );
  if (
    !(
      leftLock <= 0.005 &&
      rightLock <= 0.005 &&
      sole("right", first) > 0.02 &&
      sole("left", second) > 0.02
    )
  )
    complaints.push(
      `ready foot drift ${leftLock}/${rightLock} m, swing clearance ${sole("right", first)}/${sole("left", second)} m`,
    );
  const firstLoad: number = joint(film, first, "hips").x - standing.x;
  const secondLoad: number = joint(film, second, "hips").x - standing.x;
  if (!(firstLoad > 0.015 && secondLoad < -0.015))
    complaints.push(`ready pelvis loads ${firstLoad}/${secondLoad} m`);
  const apex: number =
    (event(split, "strokeStart") + event(split, "stroke")) / 2;
  if (!(sole("left", apex) > 0.005 && sole("right", apex) > 0.005))
    complaints.push(
      `split soles at hop apex ${sole("left", apex)}/${sole("right", apex)} m`,
    );

  const face = (seconds: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = film.prop("racket", seconds);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        racket.affordance("face").frame.translation,
      ),
    );
  };
  const gripToHead = (seconds: number): IAutoMovieVector3 => {
    const hand = HumanHand.frame(
      body,
      film.bones("a", seconds),
      "right",
      "grip",
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(
        film.bones("a", seconds).get("rightHand")!.worldRotation,
      ),
      Vector3.subtract(face(seconds), hand.point),
    );
  };
  const step: number = Vector3.distance(
    ankle("right", start),
    ankle("right", plant),
  );
  const support: number = Vector3.distance(
    ankle("left", start),
    ankle("left", strike),
  );
  const miss: number = Vector3.distance(face(strike), mark);
  const travel: number = Vector3.distance(face(ready), face(strike));
  const surfaceNormal: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(
      film.prop("racket", strike).rotation,
      racket.affordance("face").frame.rotation,
    ),
    { x: 0, y: 1, z: 0 },
  );
  const returnStep: number = Vector3.distance(
    ankle("right", start),
    ankle("right", end),
  );
  const gripSlip: number = Vector3.distance(
    gripToHead(strike),
    gripToHead(end),
  );
  if (!(step >= 0.12 && support <= 0.005))
    complaints.push(`forehand step ${step} m, support drift ${support} m`);
  if (!(miss <= 0.06 && travel >= 0.1 && surfaceNormal.z > 0.75))
    complaints.push(
      `forehand face misses its mark by ${miss} m after ${travel} m of travel, with forward normal component ${surfaceNormal.z}`,
    );
  if (!(returnStep <= 0.02 && gripSlip <= 0.005))
    complaints.push(
      `forehand return step error ${returnStep} m, grip-to-head drift ${gripSlip} m`,
    );
}

/** Check a grounded approach, aerial palm strike and two-foot recovery. */
function volleyballSpike(
  body: IAutoMovieMotionHumanBody,
  complaints: string[],
): void {
  const mark: IAutoMovieVector3 = {
    x: -0.26,
    y: 1.2 * body.measure.stature,
    z: 0.38,
  };
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "volleyball-spike-contact",
    performers: [player(body)],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .ballSport({ kind: "volleyballSpike", contactAt: mark }).node,
  });
  const segment: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (item: IAutoMovieMotionHumanSegment): boolean =>
        item.name === "ballSport",
    )!;
  const start: number = segment.start;
  const takeoff: number = event(segment, "takeoff");
  const strike: number = event(segment, "stroke");
  const landing: number = event(segment, "landing");
  const end: number = start + segment.plan.duration;
  const palm = (seconds: number): IAutoMovieVector3 =>
    HumanHand.frame(body, film.bones("a", seconds), "right", "palm", "flat")
      .point;
  const sole = (side: AutoMovieHumanSide, seconds: number): number =>
    Math.min(
      ...HumanFoot.sockets(body, film.bones("a", seconds), side).map(
        (socket) => socket.point.y,
      ),
    );
  const approach: number =
    joint(film, takeoff, "leftFoot").z - joint(film, start, "leftFoot").z;
  const miss: number = Vector3.distance(palm(strike), mark);
  const descent: number = palm(strike).y - palm(end).y;
  if (!(takeoff < strike && strike < landing && approach >= 0.12))
    complaints.push(`spike approaches ${approach} m before the aerial strike`);
  if (!(miss <= 0.06 && descent >= 0.25))
    complaints.push(
      `spike palm misses its mark by ${miss} m and descends ${descent} m by recovery`,
    );
  for (const side of ["left", "right"] as const) {
    const floor: number = sole(side, start);
    const rise: number = sole(side, strike) - floor;
    const landingGap: number = Math.abs(sole(side, landing) - floor);
    const returnGap: number = Vector3.distance(
      joint(film, start, `${side}Foot`),
      joint(film, end, `${side}Foot`),
    );
    if (!(rise >= 0.1 && landingGap <= 0.035 && returnGap <= 0.02))
      complaints.push(
        `spike ${side} sole rises ${rise} m, lands ${landingGap} m from its floor and returns ${returnGap} m from its footprint`,
      );
  }
}

/** Read the named joint independently from the displayed skeleton. */
function joint(
  film: IAutoMovieMotionHumanPerformance,
  seconds: number,
  name: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  return film.bones("a", seconds).get(name)!.worldPosition;
}
