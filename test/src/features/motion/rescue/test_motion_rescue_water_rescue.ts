import { createPoolEdge } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The pool's water surface, world metres. */
const WATER: number = 0;

/** The edge the tow heads for: the wall face under the deck, world metres. */
const EDGE: IAutoMovieVector3 = { x: 0, y: WATER, z: 0 };

/** A head site the test reads. */
type HeadSite = "mouth" | "crown";

/** The rescue band of tow speeds, metres per second (Red Cross Lifeguarding). */
const BAND: readonly [number, number] = [0.4, 1];

/**
 * Distress, rescue and exit from the water, for two canonical bodies.
 *
 * Scenarios:
 *
 * 1. A swimmer in the instinctive drowning response keeps the mouth within the
 *    band of the surface and the hands pressing under it, then goes under.
 * 2. A rescuer swims to the struggling victim, takes a cross-chest hold and tows
 *    it toward the edge inside the rescue band with its face clear.
 * 3. A victim beyond a rescuer's swim in the time allowed is refused with the
 *    distance.
 * 4. A swimmer at the pool wall loads both palms on the deck before rising, climbs
 *    out without entering the wall and stands on the deck; a deck too high
 *    above the water is refused.
 * 5. A rescuer on the deck grips a victim's wrists, lifts its hips to the deck and
 *    lets go; the victim lies on the deck without entering the wall, and the
 *    rescuer's feet stay planted on it; a deck too high to lift onto is
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the four acts, both bodies, the bounds and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered aquatic kinds over a real pool edge and reads displayed head, hand, chest, hip and foot sites.
 * @evidence contracts/development/testing.md#independent-expectations Pia's drowning response bounds the mouth at the surface and the hands under it; the Red Cross tow band bounds the tow speed; the pool edge's own deck and wall face bound the exit.
 * @evidence contracts/development/testing.md#distinguishing-cases A reachable and an unreachable victim, an ordinary and a too-high deck, and two body sizes.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of generated bodies and one archetype.
 */
export function test_motion_rescue_water_rescue(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const profile of ["m-average", "f-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
      try {
        distress(checks, body);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} distress: ${everydayTake.describe(error)}`,
          false,
        );
      }
      try {
        rescue(checks, body);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} rescue: ${everydayTake.describe(error)}`,
          false,
        );
      }
      try {
        exit(checks, body);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} exit: ${everydayTake.describe(error)}`,
          false,
        );
      }
      try {
        liftOut(checks, body);
      } catch (error: unknown) {
        checks.check(
          `${String(profile)} liftOut: ${everydayTake.describe(error)}`,
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
  checks.assert("rescue water rescue");
}

/** The struggle keeps the mouth at the surface until it goes under. */
function distress(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
): void {
  const film: HumanPerformance = new HumanPerformance({
    seed: "distress",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: [swimmer(body, "victim", { x: 0, y: WATER - 1.4, z: 3 }, 0)],
    composition: HumanChain.subject("victim").registered("aquatic", {
      kind: "distress",
      water: WATER,
      duration: 20,
    }).node,
  });
  const segment: IAutoMovieMotionHumanSegment = film.segments("victim")[0]!;
  const submerge: number = at(segment, "submerge");
  checks.check(
    "the struggle starts submerging at the authored seconds",
    Math.abs(submerge - 20) < 1e-6,
  );
  verdict(checks, "the struggle passes the generic audit", film);
  let mouth: number = 0;
  let hands: number = -Infinity;
  for (let i: number = 1; i <= 60; ++i) {
    const seconds: number = (submerge * i) / 61;
    mouth = Math.max(
      mouth,
      Math.abs(site(film, body, "victim", "mouth", seconds).y - WATER),
    );
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "victim",
      seconds,
    );
    hands = Math.max(
      hands,
      bones.get("leftHand")!.worldPosition.y,
      bones.get("rightHand")!.worldPosition.y,
    );
  }
  checks.check(
    `the mouth stays within the band of the surface (${mouth.toFixed(4)} m)`,
    mouth <= AutoMovieMotionHumanSwim.AquaticDistress.BAND + 0.01,
  );
  checks.check("the hands press under the surface", hands < WATER);
  checks.check(
    "the head goes under at the end",
    site(film, body, "victim", "crown", film.duration).y < WATER,
  );
}

/** The rescuer reaches the victim and tows it toward the edge. */
function rescue(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
): void {
  const take = (from: IAutoMovieVector3, seconds: number): HumanPerformance =>
    new HumanPerformance({
      seed: "rescue",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      performers: [
        swimmer(body, "victim", { x: 0, y: WATER - 1.4, z: 3 }, 0),
        swimmer(body, "rescuer", from, 180),
      ],
      composition: {
        kind: "parallel",
        parts: [
          // The rescuer's anchor is composed before the victim waits on it.
          HumanChain.subject("rescuer").registered(
            "aquatic",
            {
              kind: "rescueTow",
              water: WATER,
              partner: "victim",
              at: EDGE,
              seconds,
            },
            "rescue",
          ).node,
          HumanChain.subject("victim")
            .registered("aquatic", {
              kind: "distress",
              water: WATER,
              duration: 40,
            })
            .registered("aquatic", {
              kind: "towed",
              water: WATER,
              partner: "rescuer",
              at: EDGE,
            })
            .sync({ of: "rescue", event: "hold" }).node,
        ],
      },
    });
  const film: HumanPerformance = take({ x: 1.5, y: WATER - 1.4, z: 6 }, 20);
  const tow: IAutoMovieMotionHumanSegment = film.segments("victim")[1]!;
  verdict(checks, "the rescue passes the generic audit", film);
  const begin: number = tow.start;
  const end: number = tow.start + tow.plan.duration;
  let clear: number = Infinity;
  let hold: number = 0;
  for (let i: number = 0; i <= 30; ++i) {
    const seconds: number = begin + ((end - begin) * i) / 30;
    clear = Math.min(
      clear,
      site(film, body, "victim", "mouth", seconds).y - WATER,
    );
    hold = Math.max(
      hold,
      Vector3.distance(
        HumanHand.frame(body, film.bones("rescuer", seconds), "left", "palm")
          .point,
        film.bones("victim", seconds).get("chest")!.worldPosition,
      ),
    );
  }
  const travel: number = Vector3.distance(
    film.bones("victim", end).get("hips")!.worldPosition,
    film.bones("victim", begin).get("hips")!.worldPosition,
  );
  const speed: number = travel / (end - begin);
  checks.check(
    `the towed face stays clear of the water (${clear.toFixed(4)} m)`,
    clear > 0,
  );
  checks.check(
    `the rescuer's arm lies across the victim's chest (${hold.toFixed(4)} m)`,
    hold < 0.2,
  );
  checks.check(
    `the pair advances toward the edge inside the rescue band (${speed.toFixed(3)} m/s)`,
    speed >= BAND[0] &&
      speed <= BAND[1] &&
      film.bones("victim", end).get("hips")!.worldPosition.z <
        film.bones("victim", begin).get("hips")!.worldPosition.z,
  );

  let refusal: unknown;
  try {
    take({ x: 1.5, y: WATER - 1.4, z: 30 }, 5);
  } catch (error: unknown) {
    refusal = error;
  }
  checks.check(
    "a victim beyond the rescuer's swim is refused with the distance",
    refusal instanceof HumanRefusal &&
      refusal.axis === "partner" &&
      refusal.reason.includes(" m away"),
  );
}

/** The unaided exit loads the palms first and stands on the deck. */
function exit(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
): void {
  const deck: number = WATER + 0.3;
  const edge: IAutoMovieMotionHumanProp = HumanObject.prop(
    "edge",
    createPoolEdge({ kind: "deckEdge" }, 1),
    { at: { x: 0, y: deck, z: 0 }, yaw: 0, fixed: true },
  );
  const take = (water: number): HumanPerformance =>
    new HumanPerformance({
      seed: "edge-exit",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      props: [edge],
      performers: [
        swimmer(body, "swimmer", { x: 0, y: water - 1.35, z: 0.4 }, 180),
      ],
      composition: HumanChain.subject("swimmer").registered("aquatic", {
        kind: "edgeExit",
        water,
        support: "edge",
      }).node,
    });
  const film: HumanPerformance = take(WATER);
  const segment: IAutoMovieMotionHumanSegment = film.segments("swimmer")[0]!;
  verdict(checks, "the exit passes the generic audit", film);
  const hands: number = at(segment, "hands");
  const start: number = film.bones("swimmer", 0).get("hips")!.worldPosition.y;
  const palms: number = Math.max(
    ...(["left", "right"] as const).map((side): number =>
      Math.abs(
        HumanHand.frame(body, film.bones("swimmer", hands), side, "palm").point
          .y - deck,
      ),
    ),
  );
  checks.check(
    `both palms are on the deck before the body rises (${palms.toFixed(4)} m)`,
    palms < 0.03 &&
      Math.abs(
        film.bones("swimmer", hands).get("hips")!.worldPosition.y - start,
      ) < 0.05,
  );
  let inside: number = 0;
  for (let i: number = 0; i <= 40; ++i) {
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "swimmer",
      (film.duration * i) / 40,
    );
    for (const bone of [
      "hips",
      "leftLowerLeg",
      "rightLowerLeg",
      "leftFoot",
      "rightFoot",
    ] as const) {
      const p: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
      if (p.y < deck - 0.02) inside = Math.max(inside, -p.z);
    }
  }
  checks.check(
    `no joint below the deck enters the wall (${inside.toFixed(4)} m)`,
    inside < 0.02,
  );
  const last: ReturnType<HumanPerformance["bones"]> = film.bones(
    "swimmer",
    film.duration,
  );
  const sole: number = Math.max(
    ...(["left", "right"] as const).map((side): number =>
      Math.abs(HumanFoot.sockets(body, last, side)[1]!.point.y - deck),
    ),
  );
  checks.check(
    `the swimmer stands on the deck behind the edge (${sole.toFixed(4)} m)`,
    sole < 0.03 && last.get("hips")!.worldPosition.z < 0,
  );

  let refusal: unknown;
  try {
    take(deck - 0.7);
  } catch (error: unknown) {
    refusal = error;
  }
  checks.check(
    "a deck too high above the water is refused",
    refusal instanceof HumanRefusal && refusal.axis === "support",
  );
}

/**
 * The assisted removal: wrists held before the hips rise, the victim laid on
 * the deck.
 */
function liftOut(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
): void {
  const deck: number = WATER + 0.3;
  const edge: IAutoMovieMotionHumanProp = HumanObject.prop(
    "edge",
    createPoolEdge({ kind: "deckEdge" }, 1),
    { at: { x: 0, y: deck, z: 0 }, yaw: 0, fixed: true },
  );
  const take = (water: number): HumanPerformance =>
    new HumanPerformance({
      seed: "lift-out",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      props: [edge],
      performers: [
        swimmer(body, "victim", { x: 0, y: water - 1.35, z: 0.4 }, 180),
        // On the deck beside the victim's line, turned toward it and the water.
        swimmer(body, "rescuer", { x: 0.5, y: deck, z: -0.15 }, -45),
      ],
      composition: {
        kind: "parallel",
        parts: [
          HumanChain.subject("victim").registered("aquatic", {
            kind: "liftedOut",
            water,
            support: "edge",
            partner: "rescuer",
          }).node,
          HumanChain.subject("rescuer").registered("aquatic", {
            kind: "liftOut",
            water,
            support: "edge",
            partner: "victim",
          }).node,
        ],
      },
    });
  const film: HumanPerformance = take(WATER);
  verdict(checks, "the lift-out passes the generic audit", film);
  const rescuer: IAutoMovieMotionHumanSegment = film.segments("rescuer")[0]!;
  const victim: IAutoMovieMotionHumanSegment = film.segments("victim")[0]!;
  const grip: number = at(rescuer, "grip");
  const released: number = at(rescuer, "released");

  // The rescuer's hands are on the victim's wrists from the grip to the
  // release, before and while the victim's hips rise.
  let held: number = 0;
  for (let i: number = 0; i <= 20; ++i) {
    const seconds: number = grip + ((released - grip) * i) / 20;
    const own: ReturnType<HumanPerformance["bones"]> = film.bones(
      "rescuer",
      seconds,
    );
    const other: ReturnType<HumanPerformance["bones"]> = film.bones(
      "victim",
      seconds,
    );
    for (const side of ["left", "right"] as const)
      held = Math.max(
        held,
        Math.min(
          ...(["leftHand", "rightHand"] as const).map((wrist): number =>
            Vector3.distance(
              HumanHand.frame(body, own, side, "grip").point,
              other.get(wrist)!.worldPosition,
            ),
          ),
        ),
      );
  }
  const rose: number = film.bones("victim", grip).get("hips")!.worldPosition.y;
  checks.check(
    `the rescuer holds the wrists from the grip to the release (${held.toFixed(4)} m)`,
    held < 0.08 && rose < WATER,
  );
  checks.check(
    "the victim's hips reach the deck while held",
    film.bones("victim", at(victim, "lifted")).get("hips")!.worldPosition.y >
      deck,
  );

  // No joint below the deck enters the wall, the rescuer's soles stay on
  // the deck, and the victim ends lying on it.
  let inside: number = 0;
  let sole: number = 0;
  for (let i: number = 0; i <= 40; ++i) {
    const seconds: number = (film.duration * i) / 40;
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "victim",
      seconds,
    );
    for (const bone of [
      "hips",
      "spine",
      "leftLowerLeg",
      "rightLowerLeg",
      "leftFoot",
      "rightFoot",
    ] as const) {
      const p: IAutoMovieVector3 = bones.get(bone)!.worldPosition;
      if (p.y < deck - 0.02) inside = Math.max(inside, -p.z);
    }
    const own: ReturnType<HumanPerformance["bones"]> = film.bones(
      "rescuer",
      seconds,
    );
    for (const side of ["left", "right"] as const)
      sole = Math.max(
        sole,
        Math.abs(HumanFoot.sockets(body, own, side)[1]!.point.y - deck),
      );
  }
  checks.check(
    `no victim joint below the deck enters the wall (${inside.toFixed(4)} m)`,
    inside < 0.02,
  );
  checks.check(
    `the rescuer's soles stay on the deck (${sole.toFixed(4)} m)`,
    sole < 0.03,
  );
  const last: ReturnType<HumanPerformance["bones"]> = film.bones(
    "victim",
    film.duration,
  );
  const chest: IAutoMovieVector3 = last.get("chest")!.worldPosition;
  checks.check(
    "the victim lies on the deck behind the edge",
    chest.z < 0 &&
      chest.y > deck &&
      chest.y < deck + 0.3 &&
      last.get("hips")!.worldPosition.y > deck,
  );

  let refusal: unknown;
  try {
    take(deck - 0.9);
  } catch (error: unknown) {
    refusal = error;
  }
  checks.check(
    "a deck too high to lift a victim onto is refused",
    refusal instanceof HumanRefusal && refusal.axis === "support",
  );
}
/** A trained swimmer placed at a point, facing a heading. */
function swimmer(
  body: IAutoMovieMotionHumanBody,
  subject: string,
  where: IAutoMovieVector3,
  yaw: number,
): IAutoMovieMotionHumanPerformer {
  return { subject, body, at: where, yaw, proficiency: { level: "trained" } };
}

/** A displayed head region's world point. */
function site(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  subject: string,
  region: HeadSite,
  seconds: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = film
    .bones(subject, seconds)
    .get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
}

/** The film second of a segment's event. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((event): boolean => event.name === name)!.share
  );
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
