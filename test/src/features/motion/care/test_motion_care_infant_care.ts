import {
  createCrib,
  createFeedingBottle,
  createInfant,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHoldInfant,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLabour,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { HumanLabour } = AutoMovieMotionHumanLabour;

/** Where the crib stands, world metres. */
const CRIB: IAutoMovieVector3 = { x: 0, y: 0, z: 0.6 };

/** The rocking authored for the cradle. */
const ROCK: IAutoMovieMotionHumanHoldInfant.IRock = {
  amplitude: 0.03,
  frequency: 0.8,
};

/**
 * An infant lying face up, its head away from the carer: `+Y` to `+Z`, `+Z` to
 * `+Y`.
 */
const LYING: ReturnType<typeof Quaternion.fromAxisAngle> =
  Quaternion.fromAxisAngle({ x: 0, y: Math.SQRT1_2, z: Math.SQRT1_2 }, 180);

/**
 * Infant care, for two canonical adult bodies.
 *
 * Scenarios:
 *
 * 1. A carer lifts an infant from a crib, cradles and rocks it, raises it to the
 *    shoulder and pats its back, and lays it back in the crib: in the cradle
 *    the holding forearm stays under the nape, the rocking stays within its
 *    amplitude, each pat meets the back, and the infant lies on the crib's
 *    surface after it is laid down.
 * 2. A cradled infant is fed from a bottle: the teat stays at its mouth.
 * 3. Laying the infant down on a point out of reach is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the sequence, the bodies, the readings and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, the infant rows and putDown over real crib, infant and bottle archetypes and reads displayed bones and prop sites.
 * @evidence contracts/development/testing.md#independent-expectations The infant's own sites, the crib's surface and the authored amplitude bound the readings.
 * @evidence contracts/development/testing.md#distinguishing-cases Three holds, a reachable and an unreachable placement, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of generated bodies and archetypes.
 */
export function test_motion_care_infant_care(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const profile of ["m-average", "f-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
      try {
        care(checks, body, profile);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} care: ${everydayTake.describe(error)}`,
          false,
        );
      }
      try {
        feed(checks, body, profile);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} feed: ${everydayTake.describe(error)}`,
          false,
        );
      }
    } catch (error: unknown) {
      checks.check(
        `${String(profile)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("care infant care");
}

/** Lift, cradle and rock, burp and lay down. */
function care(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
  profile: string,
): void {
  const crib: ReturnType<typeof createCrib> = createCrib({}, 1);
  const infant: ReturnType<typeof createInfant> = createInfant({}, 1);
  const surface: IAutoMovieVector3 = Vector3.add(
    CRIB,
    crib.affordances.find((a): boolean => a.id === "surface")!.frame
      .translation,
  );
  const take: (at: IAutoMovieVector3) => HumanPerformance = (
    at: IAutoMovieVector3,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "infant-care",
      laws: [HumanLabour.cradleInfant, HumanLabour.burpInfant],
      performers: [carer(body)],
      props: [
        HumanObject.prop("crib", crib, { at: CRIB, yaw: 0, fixed: true }),
        HumanObject.prop("infant", infant, {
          position: Vector3.add(surface, { x: 0, y: 0.06, z: -0.2 }),
          rotation: LYING,
        }),
      ],
      composition: HumanChain.subject("carer")
        .stand({ hold: 0.3 })
        .pickUp({ prop: "infant", handle: "seat", hand: "right" })
        .registered("cradleInfant", { prop: "infant", rock: ROCK, hold: 3 })
        .registered("burpInfant", { prop: "infant", hold: 2 })
        // The crib lies below the reach of the standing arm: bend to it.
        .bend({ target: { kind: "prop", subject: "crib", point: "surface" } })
        .until({ event: "deepest" })
        .putDown({ prop: "infant", to: at, yaw: 0, hand: "right" }).node,
    });
  const film: HumanPerformance = take(
    Vector3.add(surface, { x: 0, y: 0.06, z: 0 }),
  );
  verdict(checks, `${profile} infant care`, film);
  const cradle: IAutoMovieMotionHumanSegment = segment(film, "cradleInfant");
  const burp: IAutoMovieMotionHumanSegment = segment(film, "burpInfant");
  const held: number = at(cradle, "held");
  const end: number = cradle.start + cradle.plan.duration;

  // The holding forearm stays under the nape; the rocking within its amplitude.
  let nape: number = 0;
  let sway: number = 0;
  const first: IAutoMovieVector3 = site(film, infant, "seat", held);
  for (let i: number = 0; i <= 20; ++i) {
    const seconds: number = held + ((end - held) * i) / 20;
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "carer",
      seconds,
    );
    nape = Math.max(
      nape,
      segmentDistance(
        site(film, infant, "nape", seconds),
        bones.get("rightLowerArm")!.worldPosition,
        bones.get("rightHand")!.worldPosition,
      ),
    );
    sway = Math.max(
      sway,
      Vector3.distance(site(film, infant, "seat", seconds), first),
    );
  }
  checks.check(
    `${profile}: the holding forearm stays under the nape (${nape.toFixed(4)} m)`,
    nape < 0.08,
  );
  checks.check(
    `${profile}: the rocking stays within its amplitude (${sway.toFixed(4)} m)`,
    sway <= 2 * ROCK.amplitude + 0.01,
  );

  // Each pat meets the back.
  let pat: number = 0;
  for (const event of burp.plan.events.filter((e): boolean =>
    e.name.startsWith("pat"),
  ))
    pat = Math.max(
      pat,
      Vector3.distance(
        HumanHand.frame(
          body,
          film.bones("carer", burp.start + event.share * burp.plan.duration),
          "left",
          "palm",
        ).point,
        site(
          film,
          infant,
          "back",
          burp.start + event.share * burp.plan.duration,
        ),
      ),
    );
  checks.check(
    `${profile}: each pat meets the infant's back (${pat.toFixed(4)} m)`,
    pat < 0.03,
  );

  // Laid down, the infant lies on the crib's surface.
  const lying: IAutoMovieVector3 = site(film, infant, "back", film.duration);
  checks.check(
    `${profile}: the infant lies on the crib's surface (${(lying.y - surface.y).toFixed(4)} m)`,
    Math.abs(lying.y - surface.y) < 0.03,
  );

  let refusal: unknown;
  try {
    take({ x: 0, y: surface.y, z: 3 });
  } catch (error: unknown) {
    refusal = error;
  }
  checks.check(
    `${profile}: laying the infant down out of reach is refused`,
    refusal instanceof HumanRefusal,
  );
}

/** A cradled infant fed from a bottle in the other hand. */
function feed(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
  profile: string,
): void {
  const crib: ReturnType<typeof createCrib> = createCrib({}, 1);
  const infant: ReturnType<typeof createInfant> = createInfant({}, 1);
  const bottle: ReturnType<typeof createFeedingBottle> = createFeedingBottle(
    {},
    1,
  );
  const surface: IAutoMovieVector3 = Vector3.add(
    CRIB,
    crib.affordances.find((a): boolean => a.id === "surface")!.frame
      .translation,
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "infant-feed",
    laws: [HumanLabour.feedInfant],
    performers: [carer(body)],
    props: [
      HumanObject.prop("crib", crib, { at: CRIB, yaw: 0, fixed: true }),
      HumanObject.prop("infant", infant, {
        position: Vector3.add(surface, { x: 0, y: 0.06, z: -0.2 }),
        rotation: LYING,
      }),
      HumanObject.prop("bottle", bottle, {
        position: Vector3.add(surface, { x: 0.3, y: 0, z: -0.2 }),
        rotation: Quaternion.identity(),
      }),
    ],
    composition: HumanChain.subject("carer")
      .stand({ hold: 0.3 })
      .pickUp({ prop: "bottle", handle: "grip", hand: "left" })
      .pickUp({ prop: "infant", handle: "seat", hand: "right" })
      .registered("feedInfant", {
        prop: "infant",
        bottle: "bottle",
        hold: 3,
      }).node,
  });
  verdict(checks, `${profile} infant feed`, film);
  const feeding: IAutoMovieMotionHumanSegment = segment(film, "feedInfant");
  const held: number = at(feeding, "held");
  let gap: number = 0;
  for (let i: number = 0; i <= 10; ++i) {
    const seconds: number =
      held + ((feeding.start + feeding.plan.duration - held) * i) / 10;
    gap = Math.max(
      gap,
      Vector3.distance(
        site(film, bottle, "teat", seconds, "bottle"),
        site(film, infant, "mouth", seconds),
      ),
    );
  }
  checks.check(
    `${profile}: the teat stays at the infant's mouth (${gap.toFixed(4)} m)`,
    gap < 0.03,
  );
}

/** A carer standing before the crib. */
function carer(
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPerformer {
  return {
    subject: "carer",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

/** A named segment of the carer. */
function segment(
  film: HumanPerformance,
  name: string,
): IAutoMovieMotionHumanSegment {
  return film
    .segments("carer")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === name)!;
}

/** The film second of a segment's event. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((e): boolean => e.name === name)!.share
  );
}

/** A prop's site in the world at a second. */
function site(
  film: HumanPerformance,
  model: IAutoMovieMotionHumanObject.IModel,
  id: string,
  seconds: number,
  subject: string = "infant",
): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = film.prop(subject, seconds);
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      model.affordances!.find((a): boolean => a.id === id)!.frame.translation,
    ),
  );
}

/** A point's distance from a segment. */
function segmentDistance(
  point: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const t: number = Math.max(
    0,
    Math.min(
      1,
      Vector3.dot(Vector3.subtract(point, a), ab) / Vector3.dot(ab, ab),
    ),
  );
  return Vector3.distance(point, Vector3.add(a, Vector3.scale(ab, t)));
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
