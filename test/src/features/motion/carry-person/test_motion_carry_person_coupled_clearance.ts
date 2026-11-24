import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

type CarryFixture = "m-average" | "f-small";
type CarrySubject = "a" | "b";

interface ICarryPhases {
  lift?: number;
  setDown?: number;
}

interface ICarriedStage {
  film: IAutoMovieMotionHumanPerformance;
  bodies: Record<CarrySubject, IAutoMovieMotionHumanBody>;
}

/**
 * Carries a moving body at its declared support and releases it back to
 * standing. Scenarios:
 *
 * - Each carry declares its anatomical contact pair. A back carry, a side support
 *   and a low drag exercise the distinct placements.
 * - Both wrists leave free swing; the loaded trunk pitches while retaining its
 *   gait turn.
 * - An explicit lift raises both ankles and the set-down restores height and
 *   upright stance. A self-carrier is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Observes the independent region positions, displayed wrists, trunk orientation, ankle heights and refusal axis.
 * @evidence contracts/development/testing.md#independent-expectations The support pair must meet within 10 mm. The carried trunk pitches twenty degrees and returns both ankles within 15 mm of standing height.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares loaded and free swing, lift and set-down, valid and self-carriage.
 * @evidence contracts/development/testing.md#execution-ownership Uses one pair of bodies; geometry is sampled per placement branch and carry names are checked as data.
 * @evidence contracts/development/common.md#meaningful-documentation States the units, phases and compared body regions.
 */
export function test_motion_carry_person_coupled_clearance(): void {
  const RESTS: Readonly<
    Record<
      IAutoMovieMotionHumanCarried.Carry,
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
    waistLift: ["abdomen", "sternum"],
    overheadLift: ["abdomen", "nape"],
    shoulders: ["seat", "yoke"],
  };
  const stage = (
    names: readonly [CarryFixture, CarryFixture],
    carry: IAutoMovieMotionHumanCarried.Carry | null,
    by: string = "a",
    lean: boolean = false,
    phases: ICarryPhases = {},
  ): ICarriedStage => {
    const bodies: Record<CarrySubject, IAutoMovieMotionHumanBody> = {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
    const walk: IAutoMovieMotionHumanChain = HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .walk({ to: { x: 0, y: 0, z: 2 } });
    return {
      bodies,
      film: new HumanPerformance({
        seed: "carry",
        laws: [
          AutoMovieMotionHumanCarryPerson.carryPerson.borne,
          AutoMovieMotionHumanCarryPerson.carryPerson.bearing,
        ],
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : -0.3 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: (carry === null
          ? walk
          : walk.over((o) => o.registered("bearing", { carry, hold: 2 }))
        ).with(
          HumanChain.subject("b")
            .stand({ hold: 0.3 })
            .registered("borne", {
              partner: by,
              carry: carry ?? "piggyback",
              hold: 2,
              ...phases,
            }),
        ).node,
        // The lean against the load, scheduled over the carry.
        ...(lean && carry !== null
          ? {
              layers: {
                a: [
                  {
                    layer:
                      AutoMovieMotionHumanCarryPerson.HumanCarriedLean.layer(
                        carry,
                      ),
                    from: 0.3,
                    fade: AutoMovieMotionHumanCarryPerson.carryPerson.TAKE,
                  },
                ],
              },
            }
          : {}),
      }),
    };
  };

  for (const carry of Object.keys(
    RESTS,
  ) as IAutoMovieMotionHumanCarried.Carry[]) {
    const row = AutoMovieMotionHumanCarryPerson.carryPerson.CARRIES[carry];
    TestValidator.equals(
      carry + " anatomical support",
      [row.mine, row.theirs],
      [...RESTS[carry]],
    );
  }
  const pair: readonly [CarryFixture, CarryFixture] = ["m-average", "f-small"];
  const held = stage(pair, "piggyback");
  const reader = (s: ICarriedStage, id: CarrySubject) =>
    HumanSignature(s.film, id, s.bodies[id], 0);
  const loaded = reader(held, "a");
  const steady = 1.3;
  for (const carry of ["piggyback", "supported", "ankleDrag"] as const) {
    const s = carry === "piggyback" ? held : stage(pair, carry);
    const [mine, theirs] = RESTS[carry];
    const a = reader(s, "a"),
      b = reader(s, "b");
    for (const seconds of [0.8, 2.2])
      TestValidator.predicate(
        carry + " moving support contact",
        Vector3.distance(
          HumanSignature.region(b, mine, seconds),
          HumanSignature.region(a, theirs, seconds),
        ) <= 0.01,
      );
  }
  const free = reader(stage(pair, null), "a");
  const freeBones = HumanSignature.bones(free, steady),
    heldBones = HumanSignature.bones(loaded, steady);
  for (const side of ["leftHand", "rightHand"] as const)
    TestValidator.predicate(
      side + " takes the passenger",
      Vector3.distance(
        freeBones.get(side)!.worldPosition,
        heldBones.get(side)!.worldPosition,
      ) > 0.05,
    );
  const tipped = HumanSignature.bones(
    reader(stage(pair, "piggyback", "a", true), "a"),
    steady,
  );
  const direction = (bones: CarryBones) => {
    const chest = bones.get("chest")!.worldRotation,
      hips = bones.get("hips")!.worldRotation;
    const up = Quaternion.rotateVector(chest, { x: 0, y: 1, z: 0 });
    const side = Quaternion.rotateVector(
      Quaternion.multiply(Quaternion.inverse(hips), chest),
      { x: 1, y: 0, z: 0 },
    );
    return [
      (Math.atan2(up.z, up.y) * 180) / Math.PI,
      (Math.atan2(-side.z, side.x) * 180) / Math.PI,
    ] as const;
  };
  const [lean, yaw] = direction(tipped),
    [pitch, turn] = direction(heldBones);
  TestValidator.predicate(
    "load pitches the trunk by twenty degrees while preserving turn",
    Math.abs(lean - pitch - 20) <= 1 && Math.abs(yaw - turn) <= 1,
  );
  const phases = stage(pair, "piggyback", "a", false, {
    lift: 0.5,
    setDown: 0.5,
  });
  const passenger = reader(phases, "b"),
    stature = phases.bodies.b.measure.stature;
  const ankles = (bones: CarryBones) =>
    (bones.get("leftFoot")!.worldPosition.y +
      bones.get("rightFoot")!.worldPosition.y) /
    2;
  const standing = ankles(HumanSignature.bones(passenger, 0.3)),
    raised = ankles(HumanSignature.bones(passenger, steady));
  const released = HumanSignature.bones(passenger, 2.3);
  TestValidator.predicate(
    "lift clears standing height",
    raised - standing > stature / 10,
  );
  TestValidator.predicate(
    "released ankles return to standing",
    Math.abs(ankles(released) - standing) <= 0.015,
  );
  TestValidator.predicate(
    "release restores upright trunk",
    released.get("head")!.worldPosition.y -
      released.get("hips")!.worldPosition.y >
      0.3 * stature,
  );
  let refused: unknown;
  try {
    stage(pair, "piggyback", "b");
  } catch (error) {
    refused = error;
  }
  TestValidator.predicate(
    "carrying oneself is refused on partner",
    refused instanceof HumanRefusal && refused.axis === "partner",
  );
}
type CarryBones = ReturnType<typeof HumanSignature.bones>;
