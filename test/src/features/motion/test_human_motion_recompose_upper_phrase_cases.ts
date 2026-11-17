import type { IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment, AutoMovieHumanoidRegion, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";

import { HumanHand, HumanRefusal, HumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionUpperPhrase } from "../internal/motionUpperPhrase";

/**
 * The upper-body phrase rows with the left hand, and the phrase's refusals
 * (#3361).
 *
 * Scenarios:
 *
 * 1. Every one-hand row of `HumanUpperRows` performed with the left hand on
 *    the smallest and the largest body of `EXTREMES` plans under its own
 *    name, and handOnHip, chinOnFist and cheekInHand put the left hand's
 *    surface within the verdicts' skin (`HumanVerdicts.SKIN`, the issue's
 *    10 mm self-touch bound) of the mirrored region (hipLeft, chin,
 *    cheekLeft): the rows are written for the right hand.
 * 2. Refused with a `HumanRefusal`, never planned: a working point with no
 *    held prop, a held prop named by both hands, a held prop the hand does
 *    not hold, and a point the held prop lacks.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each row with the left hand through the public chain and measures the displayed hand surface at the phrase's stroke; performs each refused request and reads the refusal's type.
 * @evidence contracts/development/testing.md#independent-expectations The issue's self-touch bound as the verdicts' skin, the mirror of a paired region, and the law's documented refusals.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, every one-hand row, mirrored and midline regions, and four refusals each missing a different fact.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and their bounds.
 */
export function test_human_motion_recompose_upper_phrase_cases(): void {
  const complaints: string[] = [];
  const rows: IAutoMovieMotionHumanActionLaw<never>[] = motionUpperPhrase.ROWS;
  const open: Record<string, AutoMovieHumanoidRegion> = motionUpperPhrase.OPEN;
  const held: readonly string[] = motionUpperPhrase.HELD;
  const perform: typeof motionUpperPhrase.perform = motionUpperPhrase.perform;
  // The left hand: every one-hand row performed with `side: "left"` on the
  // smallest and the largest body plans under its own name, and a self-touch
  // row puts the left hand's surface on the mirrored region (the rows are
  // written for the right hand).
  const mirroredTouches: Record<
    string,
    [AutoMovieHumanoidRegion, IAutoMovieMotionHumanHand.Surface]
  > = {
    handOnHip: ["hipLeft", "palm"],
    chinOnFist: ["chin", "fist"],
    cheekInHand: ["cheekLeft", "palm"],
  };
  const both: readonly string[] = [
    "clapHands",
    "rubPalms",
    "handsTogetherFront",
    "handsClaspedBehind",
    "cheerHands",
    "foldArms",
  ];
  for (const name of [
    motionHumanBody.EXTREMES[0]!,
    motionHumanBody.EXTREMES.at(-1)!,
  ]) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const row of rows) {
      if (both.includes(row.name)) continue;
      const given: object =
        open[row.name] === undefined
          ? row.name === "armPhrase"
            ? { phrase: "visit", target: { kind: "self", region: "hipLeft" } }
            : {}
          : { target: { kind: "self", region: open[row.name] } };
      // An open target is given for the right hand, so it is mirrored; a
      // row that fixes its own target fixes its mirror too.
      const params: object = {
        ...given,
        side: "left",
        ...(open[row.name] === undefined ? {} : { mirror: true }),
        ...(held.includes(row.name)
          ? {
              held: "stick",
              ...(row.name === "eatWith" ? { point: "face" } : {}),
            }
          : {}),
      };
      try {
        const p: IAutoMovieMotionHumanPerformance = perform(
          body,
          row.name,
          params,
          held.includes(row.name),
          "left",
        );
        const s: IAutoMovieMotionHumanSegment.ISegment = p.segments("a").at(-1)!;
        if (s.name !== row.name) {
          complaints.push(`${name} left ${row.name}: placed as ${s.name}`);
          continue;
        }
        const touch: [AutoMovieHumanoidRegion, IAutoMovieMotionHumanHand.Surface] | undefined =
          mirroredTouches[row.name];
        if (touch === undefined) continue;
        const t: number =
          s.start +
          (s.plan.events.find((e) => e.name === "stroke")?.share ?? NaN) *
            s.plan.duration;
        const bones = p.bones("a", t);
        const region: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[touch[0]];
        const goal: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          region,
          bones.get(region.bone)!,
        ).point;
        const hand: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          "left",
          touch[1],
          touch[1] === "fist" ? "fist" : "flat",
        ).point;
        const miss: number = Vector3.length(Vector3.subtract(hand, goal));
        if (!(miss <= HumanVerdicts.SKIN))
          complaints.push(
            `${name} left ${row.name}: the left ${touch[1]} lies ${(miss * 1000).toFixed(1)} mm from ${touch[0]}, within ${(HumanVerdicts.SKIN * 1000).toFixed(0)} mm expected`,
          );
      } catch (error) {
        complaints.push(
          `${name} left ${row.name}: expected to plan, got ${(error as Error).message}`,
        );
      }
    }
  }

  // The refusals, on the first body: a working point with no held prop, a
  // held prop named by both hands, and a point the held prop lacks.
  const first: IAutoMovieMotionHumanBody = motionHumanBody(motionHumanBody.EXTREMES[0]!);
  for (const [label, law, params, pick] of [
    [
      "a point with no held prop",
      "armPhrase",
      {
        phrase: "visit",
        target: { kind: "self", region: "mouth" },
        point: "lip",
      },
      false,
    ],
    [
      "a held prop named by both hands",
      "armPhrase",
      {
        phrase: "visit",
        side: "both",
        target: { kind: "self", region: "sternum" },
        held: "stick",
      },
      true,
    ],
    [
      "a held prop the hand does not hold",
      "hammerStrokes",
      { target: { kind: "self", region: "thighFrontRight" }, held: "stick" },
      false,
    ],
    [
      "a point the held prop lacks",
      "eatWith",
      { held: "stick", point: "spout" },
      true,
    ],
  ] as const) {
    try {
      perform(first, law, params, pick).segments("a");
      complaints.push(`${label}: expected a refusal, got a plan`);
    } catch (error) {
      if (!(error instanceof HumanRefusal))
        complaints.push(
          `${label}: expected a refusal, got ${(error as Error).message}`,
        );
    }
  }
  TestValidator.equals(
    "the upper-body rows with the left hand, and the phrase's refusals",
    complaints,
    [],
  );
}
