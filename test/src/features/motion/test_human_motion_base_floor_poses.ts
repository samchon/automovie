import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A body that sits or lies down on the floor ends on the floor: lying, the
 * trunk and the head are down; sitting, the hips are down and the head is
 * up, and folded legs lie on the floor.
 *
 * Scenarios, each row performed after 0.3 s of standing and read at its
 * end, on the average man or the small woman, alternating down the rows.
 * One body a row is enough because both builds meet a sitting and the
 * claims scale with the stature; the end is the instant each claim is
 * about:
 * 1. `lieStill` ends with the hip joints, the neck and the head all within
 *    0.15 statures of the floor (a lying trunk is one body depth thick; the
 *    share is provisional).
 * 2. `sitOnFloor`, `sitCrossLegged` and `sitSideways` end with the hip
 *    joints within that share of the floor and the head above 0.35
 *    statures: seated, not lying (an adult's sitting height is about half
 *    the stature; the share is a provisional floor).
 * 3. `sitCrossLegged` and `sitSideways` end with both knees flexed 120 to
 *    155 degrees (Hemmerich et al. 2006 measure 130 to 150 in cross-legged
 *    sitting; the 10 and 5 beyond are a provisional reading margin) and
 *    both ankle joints within 0.06 statures of the floor.
 * 4. Cross-legged, the left ankle lies to the right of the right one.
 * 5. Side-sitting, the left wrist is within a quarter of the hand's length
 *    plus 15 mm of the floor: the hand leant on (a flat hand holds its
 *    wrist about its own thickness up; the quarter is provisional and the
 *    15 mm is the campaign's bound for a contact at its event).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the floor rows through the public input, performs each on a real body and reads the displayed hips, head, knees, ankles and wrist; a body left squatting on its feet, legs that stay ahead, or a hand in the air fails.
 * @evidence contracts/development/testing.md#independent-expectations Where each row ends is what its name states; the stature shares are provisional readings of "on the floor", stated as such, and the knee range is the cited measurement. None is taken from the law's tables.
 * @evidence contracts/development/testing.md#distinguishing-cases Lying against three sittings, legs ahead against folded, crossed against folded aside, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory, reading two instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds and which are provisional.
 */
export function test_human_motion_base_floor_poses(): void {
  const complaints: string[] = [];
  const rows: readonly string[] = [
    "lieStill",
    "sitOnFloor",
    "sitCrossLegged",
    "sitSideways",
  ];
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  rows.forEach((row: string, r: number): void => {
    const name: "m-average" | "f-small" = names[r % 2]!;
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const label: string = `${name} ${row}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "poses",
        laws: [...HUMAN_LEXICON.pose!],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered(row).node,
      });
    } catch (error) {
      complaints.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
    const reader: HumanSignature.IReader = HumanSignature.of(
      performance,
      "a",
      body,
      0,
    );
    const end: number = segment.end;
    const y = (bone: Parameters<typeof HumanSignature.joint>[2]): number =>
      HumanSignature.joint(reader, end, bone).y;
    const hips: number = (y("leftUpperLeg") + y("rightUpperLeg")) / 2;

    // 1. Lying on the floor.
    if (row === "lieStill") {
      const heights: readonly (readonly [string, number])[] = [
        ["hips", hips],
        ["neck", y("neck")],
        ["head", y("head")],
      ];
      for (const [part, height] of heights)
        if (height > 0.15 * stature)
          complaints.push(
            `${label}: the ${part} ends ${height.toFixed(3)} m above the floor, within ${(0.15 * stature).toFixed(3)} m expected`,
          );
      return;
    }

    // 2. Seated on the floor: the hips down, the head up.
    if (hips > 0.15 * stature || y("head") < 0.35 * stature)
      complaints.push(
        `${label}: the hips end ${hips.toFixed(3)} m and the head ${y("head").toFixed(3)} m above the floor; the hips within ${(0.15 * stature).toFixed(3)} m and the head above ${(0.35 * stature).toFixed(3)} m expected`,
      );
    if (row === "sitOnFloor") return;

    // 3. Folded legs lie on the floor.
    for (const side of ["left", "right"] as const) {
      const knee: number = HumanSignature.knee(reader, end, side);
      const ankle: number = y(`${side}Foot`);
      if (knee < 120 || knee > 155 || ankle > 0.06 * stature)
        complaints.push(
          `${label}: the ${side} knee ends flexed ${knee.toFixed(1)} degrees with its ankle ${ankle.toFixed(3)} m above the floor; 120 to 155 degrees and within ${(0.06 * stature).toFixed(3)} m expected`,
        );
    }

    // 4. Crossed.
    const across: number =
      HumanSignature.joint(reader, end, "leftFoot").x -
      HumanSignature.joint(reader, end, "rightFoot").x;
    if (row === "sitCrossLegged" && across >= 0)
      complaints.push(
        `${label}: the left ankle ends ${across.toFixed(3)} m to the left of the right one, to its right expected: the legs are not crossed`,
      );

    // 5. Leant on the hand.
    const wrist: number = y("leftHand");
    if (row === "sitSideways" && wrist > 0.25 * body.measure.hand + 0.015)
      complaints.push(
        `${label}: the left wrist ends ${wrist.toFixed(3)} m above the floor, within ${(0.25 * body.measure.hand + 0.015).toFixed(3)} m expected for a hand it leans on`,
      );
  });
  TestValidator.equals("floor poses end on the floor", complaints, []);
}
