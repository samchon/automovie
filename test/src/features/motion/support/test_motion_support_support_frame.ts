import { createCart } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSupport,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  AutoMovieMotionHumanSupport,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditBalance,
  AutoMovieMotionHumanAuditMotion,
} from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A standing support is retained through sitting, shifting and rising.
 * Elevating that same stationary support translates the whole motion.
 *
 * Scenarios on the average man and small woman, at floor heights 0, 0.3 and
 * -0.2 m, sitting on a seat one popliteal height above that floor:
 *
 * 1. Every foot and seat contact retains the cart's prop frame across a stand,
 *    sit, seated shift, rise and a final stand without restating on.
 * 2. Translating the floor translates every displayed joint by the same vector at
 *    the start, middle and end of each action, within 10 microns; action
 *    durations are unchanged within a microsecond. These numerical bounds check
 *    rigid translation, rather than a clinical motion bound.
 *
 * Scenarios:
 *
 * 1. Observe the supplied action through the phases identified above.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public action chain and reads declared contacts and displayed joints; losing the prop identity or resetting a world height fails.
 * @evidence contracts/development/testing.md#independent-expectations A rigid translation preserves an action's geometry and duration, and a plant stays on the support it continues.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite body builds and floors above and below ground, with both seated and standing transitions.
 * @evidence contracts/development/testing.md#execution-ownership Uses the existing prepared bodies and an in-memory cart, without a host or capture.
 * @evidence contracts/development/common.md#meaningful-documentation States both scenarios, the sampled instants and the numerical bounds.
 */
export function test_motion_support_support_frame(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const frame = (seconds: number): IAutoMovieRigidTransform =>
    HumanObject.frame({
      at: { x: 2 * seconds, y: 0.3, z: 1 },
      yaw: 90 * seconds,
    });
  const carry = AutoMovieMotionHumanSupport.carry(frame, 0, 1);
  const localStep = { x: 0.2, y: 0.3, z: 2 };
  const deckBody = motionHumanBody("m-average");
  const kneePole = deckBody.rest.get("leftLowerLeg")!;
  const elbowPole = deckBody.rest.get("rightLowerArm")!;
  const carried = AutoMovieMotionHumanSupport.carry.posture(carry, {
    root: { x: 0, y: 0.3, z: 1 },
    yaw: 10,
    pitch: 0,
    roll: 0,
    joints: { head: [5, 0, 0] },
    limbs: {
      leftLeg: { point: localStep, bend: kneePole },
      rightArm: {
        point: { x: 0, y: 0.8, z: 2 },
        bend: elbowPole,
      },
    },
  });
  checks.check(
    "stance, stepping foot and inert object attachment share the moving support frame",
    vclose(carried.root, { x: 2, y: 0.3, z: 1 }, 1e-9) &&
      nclose(carried.yaw, 100, 1e-9) &&
      vclose(carried.limbs.leftLeg!.point, { x: 3, y: 0.3, z: 0.8 }, 1e-9) &&
      vclose(carried.limbs.rightArm!.point, { x: 3, y: 0.8, z: 1 }, 1e-9) &&
      carried.joints.head![0] === 5,
  );
  const pickup = { x: 0, y: 1, z: 2 };
  checks.check(
    "a released inert object takes the support frame at its event",
    vclose(
      AutoMovieMotionHumanSupport.carry(frame, 0, 1).point(pickup),
      { x: 3, y: 1, z: 1 },
      1e-9,
    ) &&
      vclose(
        AutoMovieMotionHumanSupport.carry(frame, 0, 0).point(pickup),
        pickup,
        1e-9,
      ),
  );
  const findings: string[] = [];
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  const deck = (speed: number): IAutoMovieMotionHumanPerformance => {
    const placement = (t: number) => ({
      at: { x: 0, y: 0.3, z: speed * t },
      yaw: 0,
    });
    return new HumanPerformance({
      seed: "wagon",
      props: [HumanObject.prop("cart", cart, placement(0), placement)],
      performers: [
        {
          subject: "a",
          body: deckBody,
          at: { x: 0, y: 0.3, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.5, on: { prop: "cart" } })
        .walk({
          to: { x: 0, y: 0.3, z: 3 + speed * 0.5 },
          on: { prop: "cart" },
        }).node,
    });
  };
  const stationary = deck(0),
    moving = deck(2);
  const feet: IAutoMovieMotionHumanSupport.IContact[] = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ];
  for (const hand of [true, false]) {
    try {
      const stances: IAutoMovieMotionHumanSupport.IStance[] = [
        { contacts: feet },
        {
          contacts: [
            feet[0]!,
            { part: hand ? "rightHand" : "rightKnee", kind: "bear" },
          ],
        },
      ];
      const transition = new HumanPerformance({
        seed: "support",
        performers: [...stationary.performers],
        composition: HumanChain.subject("a").support({ stances }).node,
      });
      const contacts = transition.segments("a")[0]!.plan.contacts;
      const loaded = contacts.find(
          (c) => c.part === (hand ? "rightHand" : "rightLowerLeg"),
        )!,
        released = contacts.find((c) => c.part === "rightFoot")!;
      checks.check(
        "transfer clocks agree with hand-first or knee-after-release support",
        hand
          ? loaded.from <= released.to && released.to < 1
          : released.to <= loaded.from,
      );
    } catch (error: unknown) {
      checks.check(`${String(hand)}: ${everydayTake.describe(error)}`, false);
    }
  }
  const span = Math.min(moving.duration, stationary.duration);
  for (const side of ["left", "right"] as const) {
    try {
      for (const t of [0.25, span / 3, (span * 2) / 3]) {
        const observed = moving.bones("a", t).get(`${side}Toes`)!.worldPosition;
        const reference = stationary
          .bones("a", t)
          .get(`${side}Toes`)!.worldPosition;
        checks.check(
          "displayed foot follows identical local path on a moving deck",
          Vector3.length(
            Vector3.subtract({ ...observed, z: observed.z - 2 * t }, reference),
          ) <= 0.01,
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(side)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "walking and standing declare the deck",
    moving
      .segments("a")
      .every((s) =>
        s.plan.contacts
          .filter((c) => c.kind === "plant")
          .every(
            (c) => c.support.kind === "prop" && c.support.subject === "cart",
          ),
      ),
  );
  for (const name of ["f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const perform: (floor: number) => IAutoMovieMotionHumanPerformance = (
        floor: number,
      ): IAutoMovieMotionHumanPerformance => {
        const seat: IAutoMovieMotionHumanSeated.ISeat = {
          at: {
            x: 0,
            y: floor + AutoMovieMotionHumanSeat.seated.popliteal(body),
            z: body.rest.get("leftFoot")!.z - 0.1,
          },
          yaw: 0,
          depth: 0.45,
        };
        return new HumanPerformance({
          seed: "seated-support-frame",
          props: [
            HumanObject.prop("cart", cart, {
              at: { x: 0, y: floor, z: 0 },
              yaw: 0,
            }),
          ],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: floor, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ hold: 0.3, sway: 0, on: { prop: "cart" } })
            .sit({ seat, hold: 0.2 })
            .handToFace({ kind: "drink", hold: 0.3 })
            .shift({ by: 0.01, hold: 0.1 })
            .rise({})
            .stand({ hold: 0.3, sway: 0 }).node,
        });
      };
      const reference: IAutoMovieMotionHumanPerformance = perform(0);
      const drinking = reference
        .segments("a")
        .find((s) => s.name === "handToFace")!;
      const windows = AutoMovieMotionHumanAuditMotion.windows(reference, "a");
      const first = reference.bones("a", drinking.entryTime);
      for (const t of [
        drinking.entryTime,
        (drinking.entryTime + drinking.end) / 2,
        drinking.end - 1e-6,
      ]) {
        const bones = reference.bones("a", t);
        checks.check(
          "seated overlay carries the seat and both feet",
          ["seat", "leftFoot", "rightFoot"].every((name) =>
            drinking.plan.contacts.some(
              (c) => c.part === name && c.from === 0 && c.to === 1,
            ),
          ) && !AutoMovieMotionHumanAuditBalance.standing(windows, t),
        );
        for (const part of ["hips", "leftFoot", "rightFoot"] as const)
          checks.check(
            "seat and ankle stay at their loaded anchors",
            Vector3.distance(
              first.get(part)!.worldPosition,
              bones.get(part)!.worldPosition,
            ) <= (part === "hips" ? 0.01 : 0.005),
          );
      }
      for (const floor of [0, 0.3, -0.2]) {
        const moved: IAutoMovieMotionHumanPerformance =
          floor === 0 ? reference : perform(floor);
        const expected: readonly IAutoMovieMotionHumanSegment[] =
          reference.segments("a");
        moved
          .segments("a")
          .forEach((segment: IAutoMovieMotionHumanSegment, i: number): void => {
            const original: IAutoMovieMotionHumanSegment = expected[i]!;
            const cell: string = `${name} at ${floor} m ${segment.name}`;
            for (const contact of segment.plan.contacts)
              if (contact.part.endsWith("Foot") || contact.part === "seat")
                if (
                  contact.support.kind !== "prop" ||
                  contact.support.subject !== "cart"
                )
                  findings.push(
                    `${cell}: ${contact.part} lost its cart support`,
                  );
            if (Math.abs(segment.plan.duration - original.plan.duration) > 1e-6)
              findings.push(`${cell}: rigid translation changed the duration`);
            for (const share of [0, 0.5, 1]) {
              const a: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
                reference.bones(
                  "a",
                  original.start + share * original.plan.duration,
                );
              const b: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
                moved.bones("a", segment.start + share * segment.plan.duration);
              let worst: number = 0;
              for (const [bone, posed] of b) {
                const before: IAutoMovieResolvedBone = a.get(bone)!;
                worst = Math.max(
                  worst,
                  Vector3.length(
                    Vector3.subtract(
                      posed.worldPosition,
                      Vector3.add(before.worldPosition, {
                        x: 0,
                        y: floor,
                        z: 0,
                      }),
                    ),
                  ),
                );
              }
              if (worst > 1e-5)
                findings.push(
                  `${cell} at share ${share}: a joint misses the translated motion by ${worst} m`,
                );
            }
          });
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.equals("seated transitions retain their support frame", findings, []);
  checks.assert("support support frame");
}
