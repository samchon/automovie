import { createSeat } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** One binding: its rope and the wrist it ties to the chair's back. */
type IBinding = readonly [prop: string, region: AutoMovieHumanoidRegion];

/** The bindings in order. */
const BINDINGS: readonly IBinding[] = [["ropeLeft", "wristLeft"]];
/** The rope's free length from the chair's back, metres. */
const SLACK: number = 0.1;
/** The wrist bone sits this far inside its rope's loop, metres: a wrist's radius. */
const LOOP: number = 0.05;
/** A worn binding rides its bone rigidly within this, metres: the worn-prop bound. */
const RIGID: number = 0.001;

/**
 * A captive tied to a chair: seated, the captor beside the chair ties the
 * left wrist to the chair's back, then takes the rope off again.
 *
 * Scenarios:
 * 1. The rope rides its wrist rigidly from its tie, and the wrist stays
 *    within the rope's slack of the chair's back while it is tied.
 * 2. Taking the rope off frees the wrist: the rope leaves it with the
 *    captor's hand.
 * 3. The captive stays seated through the binding.
 * 4. The take passes the shipped verdict report: no pose jump at the tie
 *    or the release, no hand through the trunk or the chair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the beats and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans sitting, bindPartner and a pick-up through HumanPerformance and reads the ropes, the captive's bones, the chair's back, and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The slack and loop are the rope's; the worn bound is the worn-prop bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Each wrist, tied against freed.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_hostage_captive(): void {
  const captor: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const captive: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    const chair = createSeat({ id: "chair", kind: "dining" });
    const placement = {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      fixed: true,
    } as const;
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      chair,
      placement,
    );
    let captorChain: IAutoMovieMotionHumanChain = HumanChain.subject("c").stand(
      {
        hold: 1.5,
        sway: 0,
      },
    );
    for (const [prop, region] of BINDINGS)
      captorChain = captorChain
        .pickUp({ prop, handle: "hold", hand: "right" })
        .registered(
          AutoMovieMotionHumanGetDressed.bindPartner.name,
          {
            prop,
            partner: "s",
            region,
            link: {
              target: { kind: "prop", subject: "chair", point: "back" },
              slack: SLACK,
            },
          },
          prop,
        );
    captorChain = captorChain
      .stand({ hold: 1, sway: 0 })
      .pickUp({ prop: "ropeLeft", handle: "hold", hand: "right" }, "release");
    const captiveChain: IAutoMovieMotionHumanChain = HumanChain.subject(
      "s",
    ).sit({ seat, hold: 14 });
    const film: HumanPerformance = new HumanPerformance({
      seed: "captive",
      performers: [
        {
          subject: "c",
          body: captor,
          // Beside the captive's lap, where the left wrist rests, so the
          // right hand reaches it ahead rather than across the captor's own
          // trunk.
          at: { x: 0.6, y: 0, z: 0.4 },
          yaw: -90,
          proficiency: { level: "trained" },
        },
        {
          subject: "s",
          body: captive,
          at: { x: 0, y: 0, z: 0.4 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [
        ...Object.values(HUMAN_LEXICON).flat(),
        AutoMovieMotionHumanGetDressed.bindPartner,
      ],
      props: [
        HumanObject.prop("chair", chair, placement),
        ...BINDINGS.map(
          ([prop]: IBinding, k: number): IAutoMovieMotionHumanProp =>
            binding(prop, k),
        ),
      ],
      composition: captorChain.with(captiveChain).node,
    });
    const released: number = film.schedule.entries.find(
      (row: IAutoMovieScheduleEntry): boolean =>
        row.intent?.anchor === "release",
    )!.start;
    const back = (t: number): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = film.prop("chair", t);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          chair.affordance("back").frame.translation,
        ),
      );
    };
    for (const [prop, region] of BINDINGS) {
      const tied: IAutoMovieMotionHumanSegment = film
        .segments("c")
        .find(
          (segment: IAutoMovieMotionHumanSegment): boolean =>
            segment.id === prop,
        )!;
      const on: number =
        tied.start +
        tied.plan.duration *
          tied.plan.events.find((e): boolean => e.name === "stroke")!.share +
        0.05;
      const until: number = released;
      const bone: AutoMovieHumanoidBone = captive.surfaces.regions[region].bone;
      const local = (t: number): IAutoMovieRigidTransform =>
        HumanPropFrame.relative(
          HumanPropFrame.bone(film.bones("s", t).get(bone)!),
          film.prop(prop, t),
        );
      const rest: IAutoMovieRigidTransform = local(on);
      for (let i: number = 1; i <= 8; ++i) {
        const t: number = on + ((until - on) * i) / 8 - 1e-3;
        // The wrist joint is the hand bone's origin.
        const wrist: IAutoMovieVector3 = film
          .bones("s", t)
          .get(
            region === "wristLeft" ? "leftHand" : "rightHand",
          )!.worldPosition;
        const gap: number = Vector3.distance(wrist, back(t));
        checks.check(
          `${prop} ties the ${region} to the chair at ${t.toFixed(2)} (${gap.toFixed(3)} m)`,
          Vector3.distance(local(t).position, rest.position) <= RIGID &&
            gap <= SLACK + LOOP,
        );
      }
    }
    const later: number = (released + film.duration) / 2;
    checks.check(
      "the rope leaves the freed wrist with the captor's hand",
      Vector3.distance(
        film.prop("ropeLeft", later).position,
        film.bones("c", later).get("rightHand")!.worldPosition,
      ) <= 0.15,
    );
    assertTakeClean("captive", film);
  } catch (error: unknown) {
    checks.check(
      "captive refused: " +
        (error instanceof TypeError ? String(error.stack) : String(error)),
      false,
    );
  }
  checks.assert("captive");
}

/** One binding coiled at the captor's belt, held by its `hold`. */
function binding(subject: string, k: number): IAutoMovieMotionHumanProp {
  const hold: IAutoMovieAffordance = {
    id: "hold",
    kind: "handle",
    frame: Transform.of({ x: 0, y: 0.02, z: 0 }, Quaternion.identity()),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: 0.02,
  };
  return {
    subject,
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {
      hold: { point: hold.frame.translation, normal: { x: 0, y: 1, z: 0 } },
    },
    affordances: [hold],
    shapes: [
      {
        id: "coil",
        kind: "sphere",
        radius: 0.03,
        material: "cloth",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    ],
    // Coiled at the captor's belt until it is taken up.
    worn: {
      subject: "c",
      bone: "hips",
      offset: {
        position: { x: -0.16 - 0.06 * k, y: 0, z: 0.1 },
        rotation: Quaternion.identity(),
      },
    },
  };
}
