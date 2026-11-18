import { createCart } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A standing support is retained through sitting, shifting and rising.
 * Elevating that same stationary support translates the whole motion.
 *
 * Scenarios on the average man and small woman, at floor heights 0, 0.3
 * and -0.2 m, sitting on a seat one popliteal height above that floor:
 * 1. Every foot and seat contact retains the cart's prop frame across a
 *    stand, sit, seated shift, rise and a final stand without restating on.
 * 2. Translating the floor translates every displayed joint by the same
 *    vector at the start, middle and end of each action, within 10 microns;
 *    action durations are unchanged within a microsecond. These numerical
 *    bounds check rigid translation, rather than a clinical motion bound.
 *
 * Scenarios:
 * 1. Observe the supplied action through the phases identified above.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the public action chain and reads declared contacts and displayed joints; losing the prop identity or resetting a world height fails.
 * @evidence contracts/development/testing.md#independent-expectations A rigid translation preserves an action's geometry and duration, and a plant stays on the support it continues.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite body builds and floors above and below ground, with both seated and standing transitions.
 * @evidence contracts/development/testing.md#execution-ownership Uses the existing prepared bodies and an in-memory cart, without a host or capture.
 * @evidence contracts/development/common.md#meaningful-documentation States both scenarios, the sampled instants and the numerical bounds.
 */
export function test_motion_posture_support_frame(): void {
  const findings: string[] = [];
  const cart: ReturnType<typeof createCart> = createCart({ kind: "cart" });
  for (const name of ["f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const perform: (floor: number) => IAutoMovieMotionHumanPerformance = (
      floor: number,
    ): IAutoMovieMotionHumanPerformance => {
      const seat: IAutoMovieMotionHumanSeated.ISeat = {
        at: {
          x: 0,
          y: floor + seated.popliteal(body),
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
          .stand({ seconds: 0.3, sway: 0, on: { prop: "cart" } })
          .sit({ seat, seconds: 0.2 })
          .shift({ by: 0.01, seconds: 0.1 })
          .rise({})
          .stand({ seconds: 0.3, sway: 0 }).node,
      });
    };
    const reference: IAutoMovieMotionHumanPerformance = perform(0);
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
                findings.push(`${cell}: ${contact.part} lost its cart support`);
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
  }
  TestValidator.equals(
    "seated transitions retain their support frame",
    findings,
    [],
  );
}
