import typia, { IValidation } from "typia";

import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanMeasurements } from "./IAutoMovieHumanMeasurements";
import { resolveAutoMovieHumanMeasurements } from "./resolveAutoMovieHumanMeasurements";

/**
 * Lowest admitted sitting height over stature. Adult population means range from about 0.47 to 0.56 (Bogin and Varela-Silva 2010, Int J Environ Res Public Health 7(3):1047-1075), so 0.45 lies below every population mean. Grade: conventional bound around measured means.
 */
const MIN_SITTING_RATIO: number = 0.45;

/**
 * Highest admitted sitting height over stature. The ratio is about 0.59 at age 2 in the 1977 US child survey (Snyder et al. 1977, UM-HSRI-77-17) and higher in infancy, where no measured value was read; 0.70 leaves room for newborns. Grade: conventional bound around measured means.
 */
const MAX_SITTING_RATIO: number = 0.7;

/**
 * Lowest admitted stature over head height. At birth head length is about a quarter of body length (as stated by Bogin and Varela-Silva 2010), so 3.5 lies below every age. Grade: conventional.
 */
const MIN_HEADS_PER_STATURE: number = 3.5;

/**
 * Highest admitted stature over head height. The 1977 US child survey measures 8.03 for boys and 7.95 for girls at 17 to 18 years, and the ratio rises with stature in adults; 10 lies above any surveyed mean. Grade: conventional bound around measured means.
 */
const MAX_HEADS_PER_STATURE: number = 10;

/**
 * Admit a detailed identity: its static type and bounds, then every bound that depends on other measurements.
 *
 * Static checks are typia's `validateEquals`, which also refuses unknown properties so a misspelt measurement is not silently ignored. Dependent bounds run on the resolved measurements, the same derived values modeling reads, and each finding names the field, the bound and its cause. The function never mutates its input; on success it returns a private copy.
 *
 * The dependent bounds are anatomical orderings and geometric limits rather than population percentiles, so they refuse only bodies that cannot exist:
 *
 * - sitting height and head height against stature, within bounds wider than every measured age and population;
 * - the acromion and the jugular notch below the seventh cervical spinous process, and all three below the vertex;
 * - each greater trochanter above the seat and below the acromion;
 * - span shorter than shoulder breadth plus both hanging arms and longer than without the upper arms;
 * - a hand and a foot longer than broad, a palm shorter than the hand and a thumb shorter than the middle finger, and a limb girth that tapers from muscle bellies to the tendons at wrist and ankle;
 * - soft-tissue hip breadth wider than the bony iliac crests it covers;
 * - the chest, waist and buttock breadths and depths each under half their circumference, and the circumference within the rectangle they bound; the underbust no larger than the chest;
 * - a head circumference between twice the head length and the perimeter of the rectangle bounding head length and breadth, the limits for any convex outline a tape can follow;
 * - the face inside the head: face height below head height, and mandibular and frontal widths narrower than the zygomatic arches;
 * - each ear shorter than the head is high, longer than broad, and standing off the scalp by less than its breadth.
 *
 * @param input Candidate identity, of any shape
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanIdentity(
  input: unknown,
): IValidation<IAutoMovieHumanIdentity> {
  const typed: IValidation<IAutoMovieHumanIdentity> =
    typia.validateEquals<IAutoMovieHumanIdentity>(input);
  if (typed.success === false) return typed;

  const measurements: IAutoMovieHumanMeasurements =
    resolveAutoMovieHumanMeasurements(typed.data);
  const { body, head }: IAutoMovieHumanIdentity = measurements.identity;
  const errors: IValidation.IError[] = [];
  const check: (
    holds: boolean,
    path: string,
    value: number,
    expected: string,
    cause: string,
  ) => void = (
    holds: boolean,
    path: string,
    value: number,
    expected: string,
    cause: string,
  ): void => {
    if (holds === false)
      errors.push({ path, value, expected, description: cause });
  };

  // trunk and head against stature
  check(
    body.sittingHeight >= MIN_SITTING_RATIO * body.stature &&
      body.sittingHeight <= MAX_SITTING_RATIO * body.stature,
    "$input.body.sittingHeight",
    body.sittingHeight,
    `between ${MIN_SITTING_RATIO} and ${MAX_SITTING_RATIO} times stature (${millimetres(MIN_SITTING_RATIO * body.stature)} to ${millimetres(MAX_SITTING_RATIO * body.stature)})`,
    "sitting height over stature lies near 0.47 to 0.56 in adult populations and near 0.59 at age 2; the bound is wider than every measured age",
  );
  check(
    body.stature >= MIN_HEADS_PER_STATURE * head.headHeight &&
      body.stature <= MAX_HEADS_PER_STATURE * head.headHeight,
    "$input.head.headHeight",
    head.headHeight,
    `between stature over ${MAX_HEADS_PER_STATURE} and stature over ${MIN_HEADS_PER_STATURE} (${millimetres(body.stature / MAX_HEADS_PER_STATURE)} to ${millimetres(body.stature / MIN_HEADS_PER_STATURE)})`,
    "stature is about 4 head heights at birth and about 8 at the end of growth; the bound is wider than every measured age",
  );
  check(
    body.cervicaleHeight < body.stature,
    "$input.body.cervicaleHeight",
    body.cervicaleHeight,
    `below stature (${millimetres(body.stature)})`,
    "the seventh cervical vertebra lies below the vertex of the head",
  );
  check(
    body.acromialHeight < body.cervicaleHeight,
    "$input.body.acromialHeight",
    body.acromialHeight,
    `below cervicale height (${millimetres(body.cervicaleHeight)})`,
    "standing with the arms hanging, the acromion lies below the seventh cervical spinous process",
  );
  check(
    body.suprasternaleHeight < body.cervicaleHeight,
    "$input.body.suprasternaleHeight",
    body.suprasternaleHeight,
    `below cervicale height (${millimetres(body.cervicaleHeight)})`,
    "the first rib and the thoracic inlet slope down from the spine to the sternum, so the jugular notch lies below the seventh cervical spinous process",
  );
  check(
    body.bicristalBreadth < body.hipBreadth,
    "$input.body.bicristalBreadth",
    body.bicristalBreadth,
    `narrower than hip breadth (${millimetres(body.hipBreadth)})`,
    "hip breadth spans the greater trochanters and the soft tissue over the bony pelvis, which the compressed iliac crest breadth excludes",
  );

  // trunk sections: a closed outline is at most half its perimeter across and fits inside its bounding rectangle
  const sections: Array<[string, number, string, number, string, number]> = [
    ["chestBreadth", body.chestBreadth, "chestDepth", body.chestDepth, "chestCircumference", body.chestCircumference],
    ["waistBreadth", body.waistBreadth, "waistDepth", body.waistDepth, "waistCircumference", body.waistCircumference],
    ["hipBreadth", body.hipBreadth, "buttockDepth", body.buttockDepth, "buttockCircumference", body.buttockCircumference],
  ];
  for (const [bKey, breadth, dKey, depth, cKey, circumference] of sections) {
    for (const [key, value] of [
      [bKey, breadth],
      [dKey, depth],
    ] as const)
      check(
        value < circumference / 2,
        `$input.body.${key}`,
        value,
        `under half the ${cKey} (${millimetres(circumference / 2)})`,
        "a closed outline is never wider in any direction than half its perimeter",
      );
    check(
      circumference <= 2 * (breadth + depth),
      `$input.body.${cKey}`,
      circumference,
      `at most twice ${bKey} plus ${dKey} (${millimetres(2 * (breadth + depth))})`,
      "a tape around a convex section is no longer than the rectangle bounding its breadth and depth",
    );
  }
  check(
    body.underbustCircumference <= body.chestCircumference,
    "$input.body.underbustCircumference",
    body.underbustCircumference,
    `at most the chest circumference (${millimetres(body.chestCircumference)})`,
    "the chest circumference passes over the breasts, which only add girth to the rib cage below them",
  );

  // span between the outstretched reach the upper arms allow and the hanging length of both arms
  const hanging: (arm: IAutoMovieHumanIdentity.IArm) => number = (
    arm: IAutoMovieHumanIdentity.IArm,
  ): number => arm.upperArmLength + arm.forearmLength + arm.handLength;
  const longest: number =
    body.biacromialBreadth + hanging(body.leftArm) + hanging(body.rightArm);
  const shortest: number = longest - body.leftArm.upperArmLength - body.rightArm.upperArmLength;
  check(
    body.span > shortest && body.span < longest,
    "$input.body.span",
    body.span,
    `between biacromial breadth plus both forearms and hands (${millimetres(shortest)}) and biacromial breadth plus both whole arms (${millimetres(longest)})`,
    "outstretched, an arm reaches less far from the acromion than it hangs, because the acromion comes closer to the radiale, but the upper arm cannot vanish into the shoulder",
  );

  // limbs
  for (const side of ["left", "right"] as const) {
    const arm: IAutoMovieHumanIdentity.IArm =
      side === "left" ? body.leftArm : body.rightArm;
    const leg: IAutoMovieHumanIdentity.ILeg =
      side === "left" ? body.leftLeg : body.rightLeg;
    const trochanterion: number =
      side === "left"
        ? measurements.leftTrochanterionHeight
        : measurements.rightTrochanterionHeight;
    const armPath: string = `$input.body.${side}Arm`;
    const legPath: string = `$input.body.${side}Leg`;
    check(
      arm.handBreadth < arm.handLength,
      `${armPath}.handBreadth`,
      arm.handBreadth,
      `narrower than hand length (${millimetres(arm.handLength)})`,
      "hand length spans the palm and the middle finger, while breadth spans only the metacarpal heads",
    );
    check(
      arm.palmLength < arm.handLength,
      `${armPath}.palmLength`,
      arm.palmLength,
      `shorter than hand length (${millimetres(arm.handLength)})`,
      "hand length runs on from the palm's crease to the tip of the middle finger",
    );
    check(
      arm.thumbLength < arm.handLength - arm.palmLength,
      `${armPath}.thumbLength`,
      arm.thumbLength,
      `shorter than the middle finger beyond its crease, hand length minus palm length (${millimetres(arm.handLength - arm.palmLength)})`,
      "the thumb's two phalanges are shorter than the middle finger's three",
    );
    check(
      arm.wristCircumference < arm.forearmCircumference,
      `${armPath}.wristCircumference`,
      arm.wristCircumference,
      `smaller than forearm circumference (${millimetres(arm.forearmCircumference)})`,
      "the forearm muscle bellies lie below the elbow and only their tendons cross the wrist",
    );
    check(
      trochanterion > body.stature - body.sittingHeight &&
        trochanterion < body.acromialHeight,
      `${legPath}.thighLength`,
      leg.thighLength,
      `a trochanterion height (thigh, shank and ankle height, now ${millimetres(trochanterion)}) above stature minus sitting height (${millimetres(body.stature - body.sittingHeight)}) and below acromial height (${millimetres(body.acromialHeight)})`,
      "the greater trochanter lies above the ischial tuberosities that carry the seated body and below the shoulder",
    );
    check(
      leg.footBreadth < leg.footLength,
      `${legPath}.footBreadth`,
      leg.footBreadth,
      `narrower than foot length (${millimetres(leg.footLength)})`,
      "foot length spans heel to toe tip, while breadth spans only the metatarsal heads",
    );
    check(
      leg.navicularHeight < leg.ankleHeight,
      `${legPath}.navicularHeight`,
      leg.navicularHeight,
      `below lateral malleolus height (${millimetres(leg.ankleHeight)})`,
      "the navicular articulates with the head of the talus, in front of and below the talar body that the malleoli clasp",
    );
    check(
      leg.calfCircumference < leg.thighCircumference,
      `${legPath}.calfCircumference`,
      leg.calfCircumference,
      `smaller than thigh circumference (${millimetres(leg.thighCircumference)})`,
      "the thigh at the gluteal furrow holds the femur, the quadriceps, the hamstrings and the adductors, more than the calf holds",
    );
    check(
      leg.lowerThighCircumference < leg.thighCircumference,
      `${legPath}.lowerThighCircumference`,
      leg.lowerThighCircumference,
      `smaller than thigh circumference (${millimetres(leg.thighCircumference)})`,
      "the thigh tapers from the gluteal furrow to the knee as its muscle bellies give way to their tendons",
    );
    check(
      leg.ankleCircumference < leg.calfCircumference,
      `${legPath}.ankleCircumference`,
      leg.ankleCircumference,
      `smaller than calf circumference (${millimetres(leg.calfCircumference)})`,
      "the calf muscle bellies end above the ankle, where only tendons and bone remain",
    );
  }

  // head
  const breadth: number = measurements.headBreadth;
  check(
    head.headCircumference >= 2 * head.headLength &&
      head.headCircumference <= 2 * (head.headLength + breadth),
    "$input.head.headCircumference",
    head.headCircumference,
    `between twice head length (${millimetres(2 * head.headLength)}) and twice head length plus head breadth (${millimetres(2 * (head.headLength + breadth))}), with breadth from the cephalic index`,
    "a closed outline spanning the head length is at least twice that length, and a convex outline inside the rectangle of head length and breadth is at most that rectangle's perimeter",
  );
  check(
    head.faceHeight < head.headHeight,
    "$input.head.faceHeight",
    head.faceHeight,
    `below head height (${millimetres(head.headHeight)})`,
    "nasion and gnathion lie between the vertex and menton",
  );
  check(
    head.mandibularWidth < head.faceWidth,
    "$input.head.mandibularWidth",
    head.mandibularWidth,
    `narrower than face width (${millimetres(head.faceWidth)})`,
    "the zygomatic arches are the widest points of the face, wider than the angles of the mandible",
  );
  check(
    head.minimumFrontalWidth < head.faceWidth,
    "$input.head.minimumFrontalWidth",
    head.minimumFrontalWidth,
    `narrower than face width (${millimetres(head.faceWidth)})`,
    "the zygomatic arches project beyond the temporal crests of the frontal bone",
  );
  for (const side of ["left", "right"] as const) {
    const ear: IAutoMovieHumanIdentity.IEar = head[`${side}Ear`];
    const path: string = `$input.head.${side}Ear`;
    check(
      ear.earLength < head.headHeight,
      `${path}.earLength`,
      ear.earLength,
      `below head height (${millimetres(head.headHeight)})`,
      "the auricle hangs on the side of the head, between the vertex and the jaw",
    );
    check(
      ear.earBreadth < ear.earLength,
      `${path}.earBreadth`,
      ear.earBreadth,
      `below ear length (${millimetres(ear.earLength)})`,
      "the auricle is an oval longer than broad at every age",
    );
    check(
      ear.earProtrusion < ear.earBreadth,
      `${path}.earProtrusion`,
      ear.earProtrusion,
      `below ear breadth (${millimetres(ear.earBreadth)})`,
      "the helix stands off the scalp on the auricular plate, which is no longer than the ear is broad",
    );
  }

  if (errors.length !== 0) return { success: false, data: input, errors };
  return { success: true, data: measurements.identity };
}

/**
 * Format a length for a refusal message.
 *
 * @param value Length in millimetres
 * @returns The length to one decimal with its unit
 */
function millimetres(value: number): string {
  return `${value.toFixed(1)} mm`;
}
