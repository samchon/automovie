import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContact,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The contact audit on a real body: a foot that skates along the floor
 * where no contact is declared, and a declared plant whose foot is not at
 * rest or not on the floor.
 *
 * The body is the average man in his quiet stance, carried rigidly by a
 * translation the test writes, for 1 s read at 24 instants per second. One
 * action named `stand` spans the film and declares the windows a scenario
 * states. Speeds are compared within 1e-9 m/s of the translation's own.
 *
 * Scenarios:
 * 1. Standing still with nothing declared, nothing skates and no plant is
 *    read: every reading is zero at `none`.
 * 2. Sliding along x at 60 mm/s with nothing declared, a sole socket of a
 *    foot skates at 60 mm/s in every step, so the share is 1; with only a
 *    hand's window declared the feet are read the same.
 * 3. Sliding at 30 mm/s the skate reads 30 mm/s and the share is 0: slower
 *    than the rest threshold.
 * 4. Rising at 30 mm/s nothing skates: a skate is horizontal.
 * 5. Sliding at 60 mm/s while raised 26 mm above the contact height nothing
 *    skates, and raised to 1 mm under it the skate is read: the foot must be
 *    on the floor.
 * 6. Sliding at 60 mm/s with the left foot planted throughout and the right
 *    from 0.5 s, the declared plant reads loose at 60 mm/s on `stand
 *    leftFoot`, and the skate is the right foot's alone, in the 12 of 24
 *    steps before its window.
 * 7. Raised 50 mm and raised 100 mm with both feet planted, the afloat
 *    readings differ by exactly 50 mm and nothing skates, the feet being
 *    declared.
 * 8. With both feet in a pivot, or planted on a prop, a slide reads neither
 *    a skate nor a loose plant: the contact is declared and not a ground
 *    plant.
 * 9. A rate of zero is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public readings; a skate read in the air or inside a declared window, a share that counts slow steps, a loose plant missed, or a height read on a prop fails.
 * @evidence contracts/development/testing.md#independent-expectations Every speed is the translation the test wrote, every share a count of the film's steps, and the stance's own sole height cancels in the difference of two raises.
 * @evidence contracts/development/testing.md#distinguishing-cases Still, sliding fast and slow, rising, in the air and just on the floor, declared and undeclared feet, plant, pivot, prop and hand windows, and a bad rate.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the film and lists the 9 scenarios with their numbers.
 */
export function test_human_motion_audit_contact(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  type Move = (
    bone: AutoMovieHumanoidBone,
    seconds: number,
  ) => IAutoMovieVector3;
  const body: IHumanBody = motionHumanBody("m-average");
  const stance: Bones = motionHumanStance(body);
  const ground: IHumanContactWindow["support"] = { kind: "ground" };
  const contact = (
    part: IHumanContactWindow["part"],
    from: number,
    to: number,
    kind: IHumanContactWindow["kind"] = "plant",
    support: IHumanContactWindow["support"] = ground,
  ): IHumanContactWindow => ({ part, kind, from, to, support });
  const read = (
    move: Move,
    contacts: IHumanContactWindow[],
  ): AutoMovieMotionHumanAuditContact.IResult =>
    AutoMovieMotionHumanAuditContact.measure(
      motionAuditMoved(stance, 1, move, [
        {
          name: "stand",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: { duration: 1, contacts },
        },
      ]) satisfies IAutoMovieMotionHumanAuditMotion,
      "a",
      body,
    );
  const carried =
    (x: number, y: number, lift: number = 0): Move =>
    (_bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => ({
      x: x * t,
      y: lift + y * t,
      z: 0,
    });
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const both: IHumanContactWindow[] = [
    contact("leftFoot", 0, 1),
    contact("rightFoot", 0, 1),
  ];

  // 1. Still.
  const still: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0, 0),
    [],
  );
  TestValidator.equals(
    "a still body with nothing declared reads nothing",
    [still.skate, still.share, still.loose, still.afloat],
    [
      { value: 0, seconds: 0, where: "none" },
      0,
      { value: 0, seconds: 0, where: "none" },
      { value: 0, seconds: 0, where: "none" },
    ],
  );

  // 2. An undeclared slide.
  const slid: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.06, 0),
    [],
  );
  TestValidator.predicate(
    `an undeclared slide skates at its speed in every step, got ${slid.skate.value} m/s on ${slid.skate.where} over a share of ${slid.share}`,
    near(slid.skate.value, 0.06) &&
      /^(left|right)Foot (heel|ball|toe)$/u.test(slid.skate.where) &&
      slid.share === 1 &&
      slid.loose.where === "none" &&
      slid.afloat.where === "none",
  );
  const handed: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.06, 0),
    [contact("leftHand", 0, 1)],
  );
  TestValidator.predicate(
    "a hand's window declares no foot",
    near(handed.skate.value, 0.06) && handed.share === 1,
  );

  // 3. Slower than rest, and 4. rising.
  const slow: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.03, 0),
    [],
  );
  TestValidator.predicate(
    `a slide under the rest speed is read and not counted, got ${slow.skate.value} m/s over a share of ${slow.share}`,
    near(slow.skate.value, 0.03) && slow.share === 0,
  );
  const rising: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0, 0.03),
    [],
  );
  TestValidator.predicate(
    "a rising foot does not skate",
    rising.skate.value <= 1e-12 && rising.share === 0,
  );

  // 5. In the air and just on the floor.
  const sole: number = read(carried(0, 0), both).afloat.value;
  const air: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.06, 0, AutoMovieMotionHumanAuditContact.HEIGHT - sole + 0.026),
    [],
  );
  const grazing: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.06, 0, AutoMovieMotionHumanAuditContact.HEIGHT - sole - 0.001),
    [],
  );
  TestValidator.predicate(
    `a foot above the contact height does not skate and one just under it does, the standing sole at ${(sole * 1000).toFixed(2)} mm`,
    sole <= 0.005 &&
      air.skate.where === "none" &&
      air.share === 0 &&
      near(grazing.skate.value, 0.06) &&
      grazing.share > 0,
  );

  // 6. A declared plant that slides.
  const planted: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0.06, 0),
    [contact("leftFoot", 0, 1), contact("rightFoot", 0.5, 1)],
  );
  TestValidator.predicate(
    `a sliding plant is loose, got ${planted.loose.value} m/s on ${planted.loose.where}; the undeclared half skates on ${planted.skate.where} over a share of ${planted.share}`,
    near(planted.loose.value, 0.06) &&
      planted.loose.where === "stand leftFoot" &&
      near(planted.skate.value, 0.06) &&
      planted.skate.where.startsWith("rightFoot ") &&
      planted.skate.seconds <= 0.5 + 1e-9 &&
      planted.share === 0.5,
  );

  // 7. A declared plant off the floor.
  const high: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0, 0, 0.1),
    both,
  );
  const low: AutoMovieMotionHumanAuditContact.IResult = read(
    carried(0, 0, 0.05),
    both,
  );
  TestValidator.predicate(
    `a plant off the floor is afloat by its height, got ${(high.afloat.value * 1000).toFixed(2)} and ${(low.afloat.value * 1000).toFixed(2)} mm`,
    near(high.afloat.value - low.afloat.value, 0.05) &&
      low.afloat.value >= 0.045 &&
      /^stand (left|right)Foot$/u.test(high.afloat.where) &&
      high.skate.where === "none" &&
      high.loose.value <= 1e-12,
  );

  // 8. Declared contacts that are not ground plants.
  for (const [title, contacts] of [
    [
      "a pivot",
      [contact("leftFoot", 0, 1, "pivot"), contact("rightFoot", 0, 1, "pivot")],
    ],
    [
      "a plant on a prop",
      [
        contact("leftFoot", 0, 1, "plant", { kind: "prop", subject: "box" }),
        contact("rightFoot", 0, 1, "plant", { kind: "prop", subject: "box" }),
      ],
    ],
  ] as const) {
    const other: AutoMovieMotionHumanAuditContact.IResult = read(
      carried(0.06, 0, 0.02),
      [...contacts],
    );
    TestValidator.predicate(
      `${title} is neither a skate nor a ground plant`,
      other.skate.where === "none" &&
        other.share === 0 &&
        other.loose.where === "none" &&
        other.afloat.where === "none",
    );
  }

  // 9. A bad rate.
  TestValidator.error("a rate of zero is refused", (): void => {
    AutoMovieMotionHumanAuditContact.measure(
      motionAuditMoved(stance, 1, carried(0, 0), []),
      "a",
      body,
      0,
    );
  });
}
