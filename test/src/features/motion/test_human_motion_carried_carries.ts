import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCarried,
  HumanCarriedLean,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person carried in a named carry rests on the carrier: the region of
 * their body the carry rests on stays on the carrier's region it rests on,
 * through whatever the carrier does, and the carrier's holding hands leave
 * where they hung.
 *
 * The bound is the motion campaign's: a contact stays within 10 mm through
 * its hold (#3349: "carrier and carried within 10 mm at every declared
 * contact"). The resting regions are each carry's own, stated by
 * `HumanCarried.CARRIES` and repeated here from the carries' common
 * descriptions: piggyback, the chest on the upper back; cradle, the side on
 * the chest; over the shoulder, the belly on the shoulder; supported, side
 * to side.
 *
 * Scenarios, the carrier walking 2 m, read at five instants 0.35 s apart
 * from 0.5 s after the carry is taken up (the lift into a carry is not
 * planned yet, so the take-up is a transition and not part of the hold;
 * the carried root is solved onto the carrier at every instant by one
 * rule, so a fault is systematic and five instants across more than a
 * stride show it, which keeps ten films near a minute):
 * 1. Each of the eight carries (the four, a second helper's side of a
 *    supported walk, and the armpit, collar and ankle drags' holds while
 *    the carrier walks forward; the drags' regions are a first-aid manual's:
 *    the neck before the dragger's thigh, a calf before the other thigh),
 *    the average man carrying the small woman:
 *    the carried person's resting region is within 10 mm of the carrier's.
 * 2. Piggyback and the supported walk with the small woman carrying the
 *    average man: the same bound.
 * 3. In the piggyback the carrier's wrists, 1 s into the carry, are more
 *    than 50 mm from where they are in the same walk without the hold.
 * 4. A person named as their own carrier is refused on `by`.
 * 6. A piggyback with a lift and a set-down of 0.5 s each: 1 s into the
 *    carry the carried ankles are more than a tenth of the stature above
 *    where they stood, and at the carry's end they are back at their
 *    standing height within 15 mm (the campaign's contact bound) under a
 *    head more than 0.3 of the stature above the hips: the body is set
 *    down standing.
 * 5. With the lean layer scheduled over the piggyback (`HumanCarriedLean`,
 *    20 degrees forward, the family's stated provisional size), the
 *    carrier's chest tips 20 degrees farther forward than without it,
 *    within 1 degree, at three instants of the walk, and its turn about the
 *    vertical, the walk's counter-rotation, differs by at most 1 degree:
 *    the lean is summed onto the walk's trunk and takes nothing from it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and overlay and reads both displayed bodies; a carried body that drifts off the carrier, a carrier whose hands do not hold, or an accepted self-carry fails.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the campaign's hold bound and the regions are the carries' descriptions; both bodies are read as displayed, never from a plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight carries, both orders of two bodies of opposite build for the two carries a small carrier performs, the carrier's hands with and without the hold, one refusal.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds ten short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bound with its source and the 6 scenarios.
 */
export function test_human_motion_carried_carries(): void {
  const RESTS: Readonly<
    Record<
      HumanCarried.Carry,
      readonly [AutoMovieHumanoidRegion, AutoMovieHumanoidRegion]
    >
  > = {
    piggyback: ["sternum", "upperBack"],
    cradle: ["ribsLeft", "sternum"],
    overShoulder: ["abdomen", "shoulderRight"],
    supported: ["ribsLeft", "ribsRight"],
    supportedLeft: ["ribsRight", "ribsLeft"],
    armpitDrag: ["upperBack", "abdomen"],
    collarDrag: ["nape", "thighFrontLeft"],
    ankleDrag: ["calfLeft", "thighFrontRight"],
  };
  const complaints: string[] = [];
  const stage = (
    names: readonly ["m-average" | "f-small", "m-average" | "f-small"],
    carry: HumanCarried.Carry | null,
    by: string = "a",
    lean: boolean = false,
    phases: { lift?: number; setDown?: number } = {},
  ): { film: HumanPerformance; bodies: Record<"a" | "b", IHumanBody> } => {
    const bodies: Record<"a" | "b", IHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const walk: HumanChain = HumanChain.subject("a")
      .stand({ seconds: 0.3 })
      .walk({ to: { x: 0, y: 0, z: 2 } });
    return {
      bodies,
      film: new HumanPerformance({
        seed: "carry",
        laws: [HumanCarried.borne, HumanCarried.bearing],
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : -0.3 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: (carry === null
          ? walk
          : walk.over((o) => o.registered("bearing", { carry, seconds: 2 }))
        ).with(
          HumanChain.subject("b")
            .stand({ seconds: 0.3 })
            .registered("borne", {
              by,
              carry: carry ?? "piggyback",
              seconds: 2,
              ...phases,
            }),
        ).node,
        // The lean against the load, scheduled over the carry.
        ...(lean && carry !== null
          ? {
              layers: {
                a: [
                  {
                    layer: HumanCarriedLean.layer(carry),
                    from: 0.3,
                    fade: HumanCarried.TAKE,
                  },
                ],
              },
            }
          : {}),
      }),
    };
  };

  // 1 and 2. The resting region stays on the carrier.
  for (const [names, carries] of [
    [
      ["m-average", "f-small"],
      [
        "piggyback",
        "cradle",
        "overShoulder",
        "supported",
        "supportedLeft",
        "armpitDrag",
        "collarDrag",
        "ankleDrag",
      ],
    ],
    [
      ["f-small", "m-average"],
      ["piggyback", "supported"],
    ],
  ] as const)
    for (const carry of carries) {
      const { film, bodies }: ReturnType<typeof stage> = stage(names, carry);
      const carrier: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        bodies.a,
        0,
      );
      const carried: HumanSignature.IReader = HumanSignature.of(
        film,
        "b",
        bodies.b,
        0,
      );
      let worst: number = 0;
      let when: number = 0;
      for (const seconds of [0.8, 1.15, 1.5, 1.85, 2.2]) {
        const gap: number = Vector3.length(
          Vector3.subtract(
            HumanSignature.region(carried, RESTS[carry][0], seconds),
            HumanSignature.region(carrier, RESTS[carry][1], seconds),
          ),
        );
        if (gap > worst) {
          worst = gap;
          when = seconds;
        }
      }
      if (!(worst <= 0.01))
        complaints.push(
          `${carry}, ${names[0]} carrying ${names[1]}: the carried ${RESTS[carry][0]} is ${(worst * 1000).toFixed(1)} mm from the carrier's ${RESTS[carry][1]} at ${when.toFixed(1)} s, 10 mm at most expected`,
        );
    }

  // 3. The carrier's hands hold.
  const pair: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  const held: ReturnType<typeof stage> = stage(pair, "piggyback");
  const free: ReturnType<typeof stage> = stage(pair, null);
  for (const side of ["left", "right"] as const) {
    const wrist = (film: HumanPerformance): IAutoMovieVector3 =>
      HumanSignature.joint(
        HumanSignature.of(film, "a", held.bodies.a, 0),
        1.3,
        `${side}Hand`,
      );
    const moved: number = Vector3.length(
      Vector3.subtract(wrist(held.film), wrist(free.film)),
    );
    if (!(moved > 0.05))
      complaints.push(
        `piggyback: the carrier's ${side} wrist is ${(moved * 1000).toFixed(0)} mm from where it swings in the same walk without the hold, more than 50 mm expected`,
      );
  }

  // 5. The lean against the load is summed onto the walk's own trunk.
  const leaned: ReturnType<typeof stage> = stage(pair, "piggyback", "a", true);
  const chest = (
    film: HumanPerformance,
    seconds: number,
    axis: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      HumanSignature.bones(
        HumanSignature.of(film, "a", held.bodies.a, 0),
        seconds,
      ).get("chest")!.worldRotation,
      axis,
    );
  for (const seconds of [1.3, 1.6, 1.9]) {
    const tip = (film: HumanPerformance): number => {
      const up: IAutoMovieVector3 = chest(film, seconds, { x: 0, y: 1, z: 0 });
      return (Math.atan2(up.z, up.y) * 180) / Math.PI;
    };
    const turn = (film: HumanPerformance): number => {
      const side: IAutoMovieVector3 = chest(film, seconds, {
        x: 1,
        y: 0,
        z: 0,
      });
      return (Math.atan2(-side.z, side.x) * 180) / Math.PI;
    };
    const forward: number = tip(leaned.film) - tip(held.film);
    if (!(Math.abs(forward - 20) <= 1))
      complaints.push(
        `piggyback: at ${seconds} s the leaning carrier's chest tips ${forward.toFixed(1)} degrees farther forward than without the lean, 20 within 1 expected`,
      );
    const kept: number = Math.abs(turn(leaned.film) - turn(held.film));
    if (!(kept <= 1))
      complaints.push(
        `piggyback: at ${seconds} s the lean changes the chest's turn in the walk by ${kept.toFixed(1)} degrees, 1 at most expected`,
      );
  }

  // 6. The lift into the carry and the set-down out of it.
  const lifted: ReturnType<typeof stage> = stage(
    pair,
    "piggyback",
    "a",
    false,
    {
      lift: 0.5,
      setDown: 0.5,
    },
  );
  const borne: HumanSignature.IReader = HumanSignature.of(
    lifted.film,
    "b",
    lifted.bodies.b,
    0,
  );
  const ankles = (seconds: number): number =>
    (HumanSignature.joint(borne, seconds, "leftFoot").y +
      HumanSignature.joint(borne, seconds, "rightFoot").y) /
    2;
  const stood: number = ankles(0.3);
  const raised: number = ankles(1.3) - stood;
  if (!(raised > 0.1 * lifted.bodies.b.measure.stature))
    complaints.push(
      `piggyback with a lift: 1 s into the carry the carried ankles are ${(raised * 1000).toFixed(0)} mm above where they stood, more than a tenth of the stature expected`,
    );
  const down: number = Math.abs(ankles(2.3) - stood);
  if (!(down <= 0.015))
    complaints.push(
      `piggyback with a set-down: at the carry's end the carried ankles are ${(down * 1000).toFixed(1)} mm from their standing height, 15 mm at most expected`,
    );
  const upright: number =
    HumanSignature.joint(borne, 2.3, "head").y -
    HumanSignature.joint(borne, 2.3, "hips").y;
  if (!(upright > 0.3 * lifted.bodies.b.measure.stature))
    complaints.push(
      `piggyback with a set-down: at the carry's end the carried head is ${upright.toFixed(3)} m above the hips, more than 0.3 of the stature expected`,
    );

  // 4. Nobody carries themselves.
  let refused: unknown = null;
  try {
    stage(pair, "piggyback", "b");
  } catch (error) {
    refused = error;
  }
  if (!(refused instanceof HumanRefusal && refused.axis === "by"))
    complaints.push(
      `a person named as their own carrier: a refusal on by expected, got ${refused instanceof Error ? refused.message : String(refused)}`,
    );
  TestValidator.equals("a carried person rests on the carrier", complaints, []);
}
