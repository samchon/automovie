import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround,
  type IAutoMovieMotionHumanAuditMeasure,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The ground audit on a real body: how deep it sinks below the floor, and
 * how far a foot declared planted slides or leaves the floor.
 *
 * The body is the average man in his quiet stance, carried rigidly by a
 * translation the test writes, for 1 s. Unless stated, one action spans the
 * film and declares the left foot planted on the ground throughout and the
 * right foot from 0.5 s.
 *
 * Scenarios:
 * 1. Standing still, nothing sinks more than the 5 mm a sole may press into
 *    the floor, and the body raised 100 mm reads zero at `none`.
 * 2. Sunk 20 mm and sunk 50 mm, the floor readings differ by exactly 30 mm,
 *    the 20 mm one reads between 15 and 25 mm (the standing sole's lowest
 *    collider is within 5 mm of the floor, on either side of it), and what
 *    sinks is a foot.
 * 3. Sliding along x at 30 mm/s, the left foot slips 30 mm by 1 s and is
 *    the one reported; with only the right foot's window declared the slip
 *    is the 15 mm it slides from 0.5 s.
 * 4. Rising at 30 mm/s the feet do not slip: slip is horizontal.
 * 5. A foot in a pivot, and a planted hand, are not read for slip.
 * 6. Standing still the sole is within 5 mm of the floor. Raised by `0.02
 *    t` the lift reads 20 mm at 1 s, give or take that sole height; sunk and
 *    raised by the same 20 mm the two lifts add up to exactly 40 mm, since
 *    the sole's own height cancels.
 * 7. A foot planted on a prop is read for slip and not for lift: its
 *    support is not the floor.
 * 8. A lifted socket is free: with the foot bone raised 10 mm and carried
 *    40 mm sideways at 0.5 s while the toes bone stays, the contact passes to
 *    the toe, which has not moved, so nothing slips; when the toes then
 *    drift at 40 mm/s, the slip is the 20 mm they travel by 1 s.
 * 9. A window that ends between two frames is read at its end: with the
 *    plant declared to 0.98 s the 30 mm/s slide reads 29.4 mm at 0.98 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public floor, slip and lift measures; a sink read from the wrong shape, a slip that counts height, a lift read on a prop or a lifted heel counted as sliding fails.
 * @evidence contracts/development/testing.md#independent-expectations Every reading is the translation the test wrote times the time it lasted; the stance's own sole height cancels in the differences.
 * @evidence contracts/development/testing.md#distinguishing-cases Still, raised and sunk; sliding and rising; plant, pivot, hand and prop; a contact that changes socket; a window end off the grid.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; slow because preparing a body takes seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the film and lists the 9 scenarios with their numbers.
 */
export function test_human_motion_audit_ground(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
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
  const feet: IHumanContactWindow[] = [
    contact("leftFoot", 0, 1),
    contact("rightFoot", 0.5, 1),
  ];
  const film = (
    move: (bone: AutoMovieHumanoidBone, seconds: number) => IAutoMovieVector3,
    contacts: IHumanContactWindow[] = feet,
  ): IAutoMovieMotionHumanAuditMotion =>
    motionAuditMoved(stance, 1, move, [
      {
        name: "stand",
        start: 0,
        entryTime: 0,
        end: 1,
        plan: { duration: 1, contacts },
      },
    ]);
  const rigid =
    (
      x: number,
      y: number,
    ): ((bone: AutoMovieHumanoidBone, seconds: number) => IAutoMovieVector3) =>
    (_bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => ({
      x: x * t,
      y: y * t,
      z: 0,
    });
  const fixed =
    (
      y: number,
    ): ((bone: AutoMovieHumanoidBone, seconds: number) => IAutoMovieVector3) =>
    (): IAutoMovieVector3 => ({ x: 0, y, z: 0 });
  const floor = (y: number): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditGround.floor(film(fixed(y)), "a", body);
  const slip = (
    motion: IAutoMovieMotionHumanAuditMotion,
  ): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditGround.slip(motion, "a", body);
  const lift = (
    motion: IAutoMovieMotionHumanAuditMotion,
  ): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditGround.lift(motion, "a", body);
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;

  TestValidator.predicate(
    `a standing body does not sink, got ${(floor(0).value * 1000).toFixed(2)} mm`,
    floor(0).value <= 0.005,
  );
  const raised: IAutoMovieMotionHumanAuditMeasure = floor(0.1);
  TestValidator.predicate(
    "a raised body reads nothing",
    raised.value === 0 && raised.where === "none",
  );
  const sunk: IAutoMovieMotionHumanAuditMeasure = floor(-0.02);
  TestValidator.predicate(
    `a sunk body reads how far it sank, got ${(sunk.value * 1000).toFixed(2)} mm in ${sunk.where}`,
    near(floor(-0.05).value - sunk.value, 0.03) &&
      sunk.value >= 0.015 &&
      sunk.value <= 0.025 &&
      /(Foot|Toes)$/u.test(sunk.where),
  );

  const slid: IAutoMovieMotionHumanAuditMeasure = slip(film(rigid(0.03, 0)));
  TestValidator.predicate(
    "a sliding foot slips by its travel",
    near(slid.value, 0.03) &&
      near(slid.seconds, 1) &&
      slid.where === "stand leftFoot",
  );
  const half: IAutoMovieMotionHumanAuditMeasure = slip(
    film(rigid(0.03, 0), [contact("rightFoot", 0.5, 1)]),
  );
  TestValidator.predicate(
    "a slip is counted from the window's start",
    near(half.value, 0.015) && half.where === "stand rightFoot",
  );
  TestValidator.predicate(
    "a rising foot does not slip",
    slip(film(rigid(0, 0.03))).value <= 1e-12,
  );
  const unread: IAutoMovieMotionHumanAuditMeasure = slip(
    film(rigid(0.03, 0), [
      contact("leftFoot", 0, 1, "pivot"),
      contact("leftHand", 0, 1),
    ]),
  );
  TestValidator.predicate(
    "a pivot and a hand are not read",
    unread.value === 0 && unread.where === "none",
  );

  const still: number = lift(film(fixed(0))).value;
  const rising: IAutoMovieMotionHumanAuditMeasure = lift(film(rigid(0, 0.02)));
  TestValidator.predicate(
    `a rising foot lifts by its rise, got ${(rising.value * 1000).toFixed(2)} mm over a sole at ${(still * 1000).toFixed(2)} mm`,
    still <= 0.005 &&
      Math.abs(rising.value - 0.02) <= still + 1e-9 &&
      near(rising.seconds, 1),
  );
  TestValidator.predicate(
    "a sunk and a raised foot are equally far from the floor's two sides",
    near(lift(film(fixed(0.02))).value + lift(film(fixed(-0.02))).value, 0.04),
  );
  const box: IHumanContactWindow[] = [
    contact("leftFoot", 0, 1, "plant", { kind: "prop", subject: "box" }),
  ];
  const onProp: IAutoMovieMotionHumanAuditMeasure = lift(
    film(rigid(0.03, 0.02), box),
  );
  TestValidator.predicate(
    "a foot on a prop is read for slip, not for lift",
    onProp.value === 0 &&
      onProp.where === "none" &&
      near(slip(film(rigid(0.03, 0.02), box)).value, 0.03),
  );

  TestValidator.equals(
    "the toe socket rides the toes bone",
    body.surfaces.sockets.toeLeft.bone,
    "leftToes",
  );
  const rocker = (drift: number): IAutoMovieMotionHumanAuditMeasure =>
    slip(
      film(
        (bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 =>
          t < 0.5
            ? { x: 0, y: 0, z: 0 }
            : bone === "leftToes"
              ? { x: drift * (t - 0.5), y: 0, z: 0 }
              : bone === "leftFoot"
                ? { x: 0.04, y: 0.01, z: 0 }
                : { x: 0, y: 0, z: 0 },
        [contact("leftFoot", 0, 1)],
      ),
    );
  TestValidator.predicate(
    `a lifted heel is free to travel, got ${(rocker(0).value * 1000).toFixed(2)} mm`,
    rocker(0).value <= 1e-9,
  );
  TestValidator.predicate(
    `the socket that took the contact slips by its own travel, got ${(rocker(0.04).value * 1000).toFixed(2)} mm`,
    near(rocker(0.04).value, 0.02),
  );

  const ended: IAutoMovieMotionHumanAuditMeasure = slip(
    film(rigid(0.03, 0), [contact("leftFoot", 0, 0.98)]),
  );
  TestValidator.predicate(
    "a window is read at its end between frames",
    near(ended.value, 0.03 * 0.98) && near(ended.seconds, 0.98),
  );
}
