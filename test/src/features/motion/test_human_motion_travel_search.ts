import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanPursuit,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A searcher goes from place to place and stops at each to look both ways:
 * it stands at every place it was sent to, and during the stop its head
 * turns to one side and then to the other.
 *
 * Scenarios, the average man searching two places 3 m apart, 1.6 s at each:
 * 1. The search plans, with a walk and a stand per place.
 * 2. At the middle of each stop both feet bear and the pelvis stands within
 *    0.3 m of the place (a walk stops with the feet either side of its
 *    destination; the 0.3 m is a provisional reading of "at the place").
 * 3. At a quarter of each stop the head faces at least 20 degrees to the
 *    left of the pelvis's heading, and at three quarters at least 20
 *    degrees to its right (the sweep asks 60; the floor is provisional and
 *    leaves room for the eyes' share of a gaze shift).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Composes a search through the public helper and its layers and reads the displayed feet, pelvis and head; a searcher that walks past a place, never stops, or never turns its head fails.
 * @evidence contracts/development/testing.md#independent-expectations Standing at the place and looking to both sides is what the search is asked to do; the bounds are provisional readings of it, stated as such, and none comes from the helper's constants except the sides' order, which is its documented contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Two stops, each with a look to either side, against a walk that would pass straight through.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one performance in memory, reading six instants: one body, since the claim is about the order of stops and looks.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_human_motion_travel_search(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const places: readonly IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 3 },
    { x: 3, y: 0, z: 3 },
  ];
  const PAUSE: number = 1.6;
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "search",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanPursuit.search(
        HumanChain.subject("a").stand({ seconds: 0.3 }),
        places,
        "seek",
        PAUSE,
      ).node,
      layers: { a: HumanPursuit.sweeps(places.length, "seek", PAUSE) },
    });
  } catch (error) {
    TestValidator.equals(
      "a searcher stops and looks",
      [error instanceof Error ? error.message : String(error)],
      [],
    );
    return;
  }
  const reader: HumanSignature.IReader = HumanSignature.of(
    performance,
    "a",
    body,
    0,
  );
  const segments: readonly HumanSegment.ISegment[] = performance.segments("a");
  if (segments.length !== 1 + 2 * places.length)
    complaints.push(
      `the search places ${segments.length} actions, a stand and then a walk and a stand per place expected (${1 + 2 * places.length})`,
    );
  const heading = (
    bone: "hips" | "head",
    seconds: number,
  ): number => {
    const found: IAutoMovieResolvedBone = HumanSignature.bones(
      reader,
      seconds,
    ).get(bone)!;
    const q: IAutoMovieQuaternion = found.worldRotation;
    return (
      (Math.atan2(
        2 * (q.x * q.z + q.w * q.y),
        1 - 2 * (q.x * q.x + q.y * q.y),
      ) *
        180) /
      Math.PI
    );
  };

  // The head's facing to the left of the pelvis's, degrees: a heading grows toward +X, which is the left of a performer facing +Z, so left is the head's heading less the pelvis's.
  const left = (seconds: number): number =>
    ((heading("head", seconds) - heading("hips", seconds) + 540) % 360) - 180;
  places.forEach((place: IAutoMovieVector3, index: number): void => {
    const stop: HumanSegment.ISegment | undefined = segments[2 + 2 * index];
    if (stop === undefined) return;
    const middle: number = (stop.entryTime + stop.end) / 2;
    const l: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      middle,
      "leftUpperLeg",
    );
    const r: IAutoMovieVector3 = HumanSignature.joint(
      reader,
      middle,
      "rightUpperLeg",
    );
    const off: number = Math.hypot(
      (l.x + r.x) / 2 - place.x,
      (l.z + r.z) / 2 - place.z,
    );
    if (off > 0.3)
      complaints.push(
        `stop ${index}: the pelvis stands ${off.toFixed(3)} m from the place, within 0.3 m expected`,
      );
    for (const side of ["left", "right"] as const)
      if (!HumanSignature.bears(reader, middle, side))
        complaints.push(`stop ${index}: the ${side} foot does not bear`);
    const first: number = left(stop.entryTime + 0.25 * (stop.end - stop.entryTime));
    const second: number = left(
      stop.entryTime + 0.75 * (stop.end - stop.entryTime),
    );
    if (!(first >= 20 && second <= -20))
      complaints.push(
        `stop ${index}: the head faces ${first.toFixed(0)} degrees to the left at a quarter of the stop and ${(-second).toFixed(0)} to the right at three quarters, at least 20 each expected`,
      );
  });
  TestValidator.equals("a searcher stops and looks", complaints, []);
}
