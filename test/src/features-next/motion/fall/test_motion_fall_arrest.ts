import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import {
  HUMAN_LEXICON,
  HumanHand,
  HumanPropFrame,
} from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { performanceAimFrame } from "../../../features/internal/performanceAimFrame";

/** The regions a pat-down visits from behind, in order: the shoulder blades, then each shoulder; the hands clasped at the small of the back keep the pats above them. */
const FRISK: readonly AutoMovieHumanoidRegion[] = [
  "upperBack",
  "shoulderRight",
  "shoulderLeft",
];
/** A pat lands within this of its region's surface point, metres: a palm's half width. */
const PAT: number = 0.05;
/** The handcuffs' chain: the most the cuffed wrists part, metres. */
const CHAIN: number = 0.08;
/** The wrist bones' spread across one cuff ring each, metres: two cuff radii. */
const RINGS: number = 0.07;
/** A worn cuff rides its wrist rigidly within this, metres: the worn-prop bound. */
const RIGID: number = 0.001;
/** How long the subject may hold the parade rest, seconds: longer than the officer's frisk, pick-up and cuffing, so the walk synced to the cuffing's end cuts it. */
const HELD: number = 30;

/**
 * An arrest of a standing subject: the hands clasped behind the back and
 * held still through a pat-down from behind, handcuffs closed on the right
 * forearm above the wrist and linked to the left, then an escort walk.
 *
 * Scenarios:
 * 1. The officer's palm reaches each frisked region of the subject at the
 *    pat's stroke, in the authored order.
 * 2. The handcuffs ride the subject's right wrist rigidly from their
 *    closure, and the two wrists stay within the chain's length through the
 *    walk that follows.
 * 3. The take passes the shipped verdict report: no interpenetration, no
 *    contact slip, no pop and no range overshoot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the arrest's beats and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered rows and bindPartner through HumanPerformance and reads hands, regions' bones, cuffs and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The pat bound is a limb radius and a palm; the chain and ring sizes are the handcuffs' own; the worn bound is the worn-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Each frisked region, standing still against walking bound.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_arrest(): void {
  const officer: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const subject: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    let frisk: IAutoMovieMotionHumanChain = HumanChain.subject("o")
      .stand({ hold: 1.2, sway: 0 })
      .walk({ to: { x: 0, y: 0, z: -0.5 } });
    FRISK.forEach((region: AutoMovieHumanoidRegion, k: number): void => {
      frisk = frisk.act(
        "touch",
        {
          target: { kind: "person", subject: "s", region },
          kind: "pat",
          hand: region.endsWith("Left") ? "left" : "right",
        },
        `pat${k}`,
      );
    });
    const officerChain: IAutoMovieMotionHumanChain = frisk
      .pickUp({ prop: "cuffs", handle: "hold", hand: "right" })
      .registered(
        AutoMovieMotionHumanGetDressed.bindPartner.name,
        {
          prop: "cuffs",
          partner: "s",
          region: "forearmRight",
          link: { region: "forearmLeft", slack: CHAIN },
        },
        "cuff",
      );
    // The subject keeps the hands clasped behind until the cuffs are on, and
    // walks off bound when the cuffing ends.
    const subjectChain: IAutoMovieMotionHumanChain = HumanChain.subject("s")
      .registered("paradeRest", { hold: HELD })
      .walk({ to: { x: 0, y: 0, z: 1.5 } })
      .sync({ of: "cuff", event: "end" });
    const film: HumanPerformance = new HumanPerformance({
      seed: "arrest",
      performers: [
        {
          subject: "o",
          body: officer,
          at: { x: 0, y: 0, z: -1.6 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "s",
          body: subject,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [
        ...Object.values(HUMAN_LEXICON).flat(),
        AutoMovieMotionHumanGetDressed.bindPartner,
      ],
      props: [cuffs(officer)],
      composition: officerChain.with(subjectChain).node,
    });

    // The pats, in order, each reaching its region.
    let last: number = -Infinity;
    FRISK.forEach((region: AutoMovieHumanoidRegion, k: number): void => {
      const pat: IAutoMovieMotionHumanSegment = film
        .segments("o")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.id === `pat${k}`,
        )!;
      const at: number =
        pat.start + (pat.plan.contact ?? pat.plan.duration / 2);
      const side: "left" | "right" = region.endsWith("Left") ? "left" : "right";
      const palm: IAutoMovieVector3 = HumanHand.frame(
        officer,
        film.bones("o", at),
        side,
        "palm",
        "flat",
      ).point;
      // The region's own surface point, as the pat aims at it.
      const target: IAutoMovieVector3 = film.aim(
        { kind: "person", subject: "s", region },
        at,
        performanceAimFrame(film, "o", officer, at),
      ).point;
      checks.check(
        `the pat reaches ${region} (${Vector3.distance(palm, target).toFixed(3)} m) in order`,
        Vector3.distance(palm, target) <= PAT && at > last,
      );
      last = at;
    });

    // The cuffs ride the right wrist, and the wrists stay chained, from the closure on.
    const cuffed: IAutoMovieMotionHumanSegment = film
      .segments("o")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.id === "cuff",
      )!;
    const closed: number =
      cuffed.start +
      cuffed.plan.duration *
        cuffed.plan.events.find((e): boolean => e.name === "stroke")!.share;
    const wrist = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      film.bones("s", t).get(`${side}Hand`)!.worldPosition;
    const on = (t: number): IAutoMovieRigidTransform =>
      HumanPropFrame.relative(
        HumanPropFrame.bone(
          film.bones("s", t).get(subject.surfaces.regions.forearmRight.bone)!,
        ),
        film.prop("cuffs", t),
      );
    const rest: IAutoMovieRigidTransform = on(closed + 0.05);
    for (let i: number = 1; i <= 12; ++i) {
      const t: number =
        closed + 0.05 + ((film.duration - closed - 0.05) * i) / 12;
      const apart: number = Vector3.distance(
        wrist("left", t),
        wrist("right", t),
      );
      checks.check(
        `the wrists stay chained at ${t.toFixed(2)} (${apart.toFixed(3)} m)`,
        apart <= CHAIN + RINGS,
      );
      checks.check(
        `the cuffs ride the right wrist at ${t.toFixed(2)}`,
        Vector3.distance(on(t).position, rest.position) <= RIGID,
      );
    }
    assertTakeClean("arrest", film);
  } catch (error: unknown) {
    checks.check("arrest refused: " + String(error), false);
  }
  checks.assert("arrest");
}

/** Coarse rigid handcuffs carried on the officer's belt, held by their `hold`. */
function cuffs(officer: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanProp {
  const hold: IAutoMovieAffordance = {
    id: "hold",
    kind: "handle",
    frame: Transform.of({ x: 0, y: 0.03, z: 0 }, Quaternion.identity()),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: 0.02,
  };
  const ring = (id: string, x: number): IAutoMoviePhysicalShape => ({
    id,
    kind: "sphere",
    radius: 0.035,
    material: "steel",
    transform: { position: { x, y: 0, z: 0 }, rotation: Quaternion.identity() },
  });
  return {
    subject: "cuffs",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {
      hold: { point: hold.frame.translation, normal: { x: 0, y: 1, z: 0 } },
    },
    affordances: [hold],
    shapes: [ring("cuffRight", 0), ring("cuffLeft", -0.07)],
    worn: {
      subject: "o",
      bone: "hips",
      offset: {
        // A cuff case at the front of the right hip, so the hand carries
        // the cuffs forward to the subject's wrists, away from the body,
        // rather than along the hip's side from behind it.
        position: {
          x: -0.16 * (officer.measure.stature / 1.75),
          y: 0,
          z: 0.12,
        },
        rotation: Quaternion.identity(),
      },
    },
  };
}
