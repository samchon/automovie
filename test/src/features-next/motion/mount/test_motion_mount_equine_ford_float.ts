import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFloatBeside,
  IAutoMovieMotionHumanMounted,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  type HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { equineFordRider } from "../../../features/internal/equineFordRider";
import { equineRiderContacts } from "../../../features/internal/equineRiderContacts";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The contact tolerance of the seated rider specs, metres. */
const TOLERANCE: number = 0.01;

/** Seconds the slide off the saddle into the float takes. */
const SLIDE: number = 1.2;

/** Seconds read afloat after the slide. */
const AFLOAT: number = 2.5;

/** The floating rider's trunk and leg bones, which must stay outside the horse's barrel; the near arm reaches in to the mane. */
const TRAILING: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
];

/**
 * A rider slides off a swimming horse to its upstream side and floats beside it, holding the mane and kicking, with the mouth out of the water.
 *
 * Scenarios:
 * 1. At the float the rider slides off to the upstream right side: the hips start over the saddle, within the barrel's half width (its girth over 2π) of the horse's midline, and end outside it on the horse's right.
 * 2. Afloat, the left palm's skin (the body's own palm socket) lies within 10 mm of the mane's skin, the mouth region stays above the water, the trunk and legs stay outside the barrel on the right, and the knees alternate above each other, a flutter kick.
 * 3. A float on a blocked side is refused on `side`; a float whose water lies 1.5 m below the swimming horse's, leaving the mane beyond the arm's reach from the surface, is refused on `hold`.
 * 4. The take passes the shipped take verdicts: no tangle, jump, turn, reversal, skate, floor or unloaded fault.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted and float laws on the public crossing and reads the displayed hips, palm, mouth, trunk and legs against the horse's moving mane, barrel and the authored water; a rider sliding off the wrong side or into the horse, a hand off the mane, a submerged mouth, still legs or an admitted blocked side fails.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm tolerance is the seated rider specs'; the mane is the horse's own affordance on the posed horse; the barrel is the horse's declared girth; the water is the stage's authored height.
 * @evidence contracts/development/testing.md#distinguishing-cases The slide, the float, a blocked side and an unreachable hold; the seated crossing and the lead-out belong to test_archetype_equine_ford_rider.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_motion_mount_equine_ford_float(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const staged: equineFordRider.IStage = equineFordRider.stage();
  const { float } = staged;
  const end: number = float + SLIDE + AFLOAT;
  const wading: IAutoMovieMotionHumanMounted.IFigure = {
    seat: "entered",
    transfer: 0.4,
    hold: float - equineFordRider.settled(staged, body) - 0.4,
    supports: equineFordRider.WADING,
  };
  const take = (
    change: Partial<IAutoMovieMotionHumanFloatBeside>,
  ): HumanPerformance =>
    equineFordRider.perform(
      staged,
      body,
      equineFordRider.mount(staged, [wading]).registered("floatBeside", {
        on: "horse",
        side: "right",
        hold: "mane",
        water: equineFordRider.WATER,
        blocked: ["left"],
        duration: SLIDE + AFLOAT,
        transition: SLIDE,
        ...change,
      } satisfies IAutoMovieMotionHumanFloatBeside),
    );
  const film: HumanPerformance = take({});
  const reader: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "rider",
    body,
    0,
  );
  const barrel: number = staged.horse.dimensions.girth! / (2 * Math.PI);
  const across = (bone: AutoMovieHumanoidBone, at: number): number =>
    equineFordRider.local(
      staged,
      film.bones("rider", at).get(bone)!.worldPosition,
      at,
    ).x;
  const issues: string[] = [];

  // 1. The slide off to the right.
  if (!(Math.abs(across("hips", float)) < barrel))
    issues.push(
      `slide ${float.toFixed(2)}: the hips start ${across("hips", float)} m off the saddle`,
    );
  if (!(across("hips", float + SLIDE) < -barrel))
    issues.push(
      `slide ${(float + SLIDE).toFixed(2)}: the hips end ${across("hips", float + SLIDE)} m across, inside the barrel's ${barrel} m`,
    );

  // 2. The float.
  for (const at of [float + SLIDE + 0.5, float + SLIDE + 1.5, end - 0.2]) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", at);
    const gap: number = equineRiderContacts.bar(
      body,
      bones,
      "left",
      staged.part("mane", at),
      equineFordRider.affordance(staged, "mane"),
    );
    if (!(Math.abs(gap) <= TOLERANCE))
      issues.push(
        `float ${at.toFixed(2)}: the left palm's skin ${(gap * 1000).toFixed(1)} mm from the mane's`,
      );
    const mouth: number =
      HumanSignature.region(reader, "mouth", at).y - equineFordRider.WATER;
    if (!(mouth > 0))
      issues.push(`float ${at.toFixed(2)}: mouth ${mouth} m under the water`);
    for (const bone of TRAILING) {
      const x: number = equineFordRider.local(
        staged,
        bones.get(bone)!.worldPosition,
        at,
      ).x;
      if (!(x < -barrel))
        issues.push(
          `float ${at.toFixed(2)}: ${bone} ${x} m across, inside the barrel's ${barrel} m`,
        );
    }
  }
  const kicks: number[] = [];
  for (let i: number = 0; i < 6; i++) {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("rider", float + SLIDE + 0.9 + 0.2 * i);
    kicks.push(
      bones.get("leftLowerLeg")!.worldPosition.y -
        bones.get("rightLowerLeg")!.worldPosition.y,
    );
  }
  if (
    !(
      kicks.some((d: number): boolean => d > 0) &&
      kicks.some((d: number): boolean => d < 0)
    )
  )
    issues.push(`float: the knees never alternate (${kicks.join(", ")})`);

  // 3. Refusals.
  const refuses = (
    label: string,
    axis: string,
    change: Partial<IAutoMovieMotionHumanFloatBeside>,
  ): void => {
    let refusal: unknown = null;
    try {
      take(change).bones("rider", float + SLIDE + 0.5);
    } catch (error) {
      refusal = error;
    }
    if (!(refusal instanceof HumanRefusal && refusal.axis === axis))
      issues.push(`${label} must refuse on ${axis}; got ${String(refusal)}`);
  };
  refuses("a float on the blocked left", "side", {
    side: "left",
    blocked: ["left"],
  });
  refuses("a float 1.5 m under the horse's water", "hold", {
    water: equineFordRider.WATER - 1.5,
  });
  TestValidator.equals(
    "the rider slides off upstream and floats beside the horse holding the mane",
    issues,
    [],
  );

  // 4. The take's verdicts.
  assertTakeClean("the floating crossing", film);
}
