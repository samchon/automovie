import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../internal/assertTakeClean";
import { equineFordRider } from "../internal/equineFordRider";
import { equineRiderContacts } from "../internal/equineRiderContacts";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** How far a foot lifted out of its stirrup has left it: the ankle joint more than this from the stirrup's tread, metres, an authored bound beyond an ankle's height over a tread it stands on. */
const STIRRUP: number = 0.15;

/** Seconds the take follows the horse swimming after it floats: the swim's entry. */
const SWIMMING: number = 2.5;

/** The rider's head region kept over the water: the head bone's centre at least this far above it, metres, an authored margin for the jaw below the head joint. */
const HEAD: number = 0.12;

/**
 * A rider stays seated on a horse wading a ford and into its swim.
 *
 * Scenarios:
 * 1. While wading, the rider's seat socket stays within 10 mm of the saddle's seat, the left wrist holds the mane (within 0.7 hand lengths of it, slipping less than 10 mm, the vault spec's handle criterion) and the right palm stays within 10 mm of its rein's skin. While the horse swims, the seat and both holds stay, each ankle is more than 0.15 m from its stirrup's tread, and the head bone's centre is at least 0.12 m above the water. The figures change on the crossing's float second; the swim's first 2.5 s are read.
 * 2. The take passes the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 * The far bank's unreachable shelf is refused by the crossing itself, pinned by test_archetype_equine_ford; the floating crossing belongs to test_archetype_equine_ford_float and the mounted climb out with the lead-out to test_archetype_equine_ford_leadout.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted laws on the public crossing and reads the displayed seat, palms, feet and head against the horse's moving saddle, mane, rein, stirrups and the authored water; a rider left behind at a cut, a hand off its hold or a submerged head fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; contacts are the horse's own affordances on the posed horse; the water is the stage's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases Wading and swimming figures on one clock; the horse's own crossing belongs to test_archetype_equine_ford.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_ford_rider(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const staged: equineFordRider.IStage = equineFordRider.stage();
  const { float } = staged;
  const settled: number = equineFordRider.settled(staged, body);
  const film: HumanPerformance = equineFordRider.perform(
    staged,
    body,
    equineFordRider.mount(staged, [
      {
        seat: "entered",
        transfer: 0.4,
        seconds: float - settled - 0.4,
        supports: equineFordRider.WADING,
      },
      {
        seat: "entered",
        transfer: 0.6,
        seconds: SWIMMING - 0.6,
        supports: equineFordRider.SWIMMING,
      },
    ]),
  );  const issues: string[] = [];

  // 1. Seated through the crossing.
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  let grasped: IAutoMovieVector3 | undefined;
  const instants: readonly [number, string][] = [
    [float - 1.5, "wading"],
    [float + 1, "swimming"],
    [float + SWIMMING - 0.2, "swimming"],
  ];
  for (const [at, phase] of instants) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const saddle: IAutoMovieTransform = staged.part("seat", at);
    const seat: number = Math.abs(
      Quaternion.rotateVector(
        Quaternion.inverse(saddle.rotation),
        Vector3.subtract(
          HumanSignature.region(reader, "seat", at),
          saddle.translation,
        ),
      ).y,
    );
    if (!(seat <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: seat ${(seat * 1000).toFixed(1)} mm from the saddle`,
      );
    // The mane is held as the vault spec holds a handle: the wrist within 0.7 hand lengths of it, not slipping.
    const mane: IAutoMovieTransform = staged.part("mane", at);
    const wrist: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(mane.rotation),
      Vector3.subtract(bones.get("leftHand")!.worldPosition, mane.translation),
    );
    grasped ??= wrist;
    const slip: number =
      Vector3.length(wrist) > 0.7 * body.measure.hand
        ? Infinity
        : Vector3.distance(wrist, grasped);
    if (!(slip <= TOLERANCE))
      issues.push(`${phase} ${at.toFixed(2)}: left hand ${slip} m off the mane`);
    const held: number = equineRiderContacts.rein(
      body,
      bones,
      "right",
      staged.part("rightRein", at),
      equineFordRider.affordance(staged, "rightRein"),
    );
    if (!(held <= TOLERANCE))
      issues.push(
        `${phase} ${at.toFixed(2)}: right palm ${(held * 1000).toFixed(1)} mm from rightRein`,
      );
    if (phase !== "swimming") continue;
    for (const side of ["left", "right"] as const) {
      const foot: number = Vector3.distance(
        bones.get(`${side}Foot`)!.worldPosition,
        staged.part(`${side}Stirrup`, at).translation,
      );
      if (!(foot > STIRRUP))
        issues.push(
          `${phase} ${at.toFixed(2)}: the ${side} foot stays ${foot} m from its stirrup`,
        );
    }
    const head: number =
      bones.get("head")!.worldPosition.y - equineFordRider.WATER;
    if (!(head >= HEAD))
      issues.push(
        `${phase} ${at.toFixed(2)}: head only ${head} m above the water`,
      );
  }

  TestValidator.equals(
    "the rider crosses seated with the head out of the water",
    issues,
    [],
  );

  // 2. The take's verdicts.
  assertTakeClean("the seated crossing", film);
}
