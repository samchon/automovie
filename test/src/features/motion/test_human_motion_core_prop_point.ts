import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A target on a part that moves within its object follows the part: a pedal
 * aimed at is where the crank has it at that second, not where it was when
 * the object stood at rest.
 *
 * The object is a stand-in for a bicycle, placed 1 m ahead: a pedal 0.17 m
 * ahead of an axle 0.3 m up and 0.1 m to the left, and a saddle 0.9 m up.
 * Its per-second reader (what an archetype ride's `frame` is) turns the
 * pedal about the axle once a second, from ahead to up to behind, and
 * leaves the saddle where the object's placement puts it.
 *
 * Scenarios, in a performance of one second of standing:
 * 1. With the reader, the pedal is aimed at 1.17 m ahead and 0.3 m up at
 *    0 s, 1 m ahead and 0.47 m up at 0.25 s, and 0.83 m ahead and 0.3 m up
 *    at 0.5 s, within a micrometre, with the reader's `+Y` as its normal.
 * 2. With the reader, the saddle is aimed at where the placement puts it,
 *    at every one of those seconds.
 * 3. Without the reader, the pedal is aimed at its place at rest at every
 *    one of those seconds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the prop through the public object reader, performs and reads the public aim; a target that keeps the rest place of a moving part, or moves a fixed one, fails.
 * @evidence contracts/development/testing.md#independent-expectations The pedal's places are a circle of the stated radius about the stated axle at the stated quarter and half turn; nothing is read back from the prop.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving part and a fixed one of the same object, and the same object with and without a per-second reader. A prop that moves whole is `test_human_motion_object_affordances`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and plans one second of standing twice; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the object, its reader and the 3 scenarios with their numbers.
 */
export function test_human_motion_core_prop_point(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const RADIUS: number = 0.17;
  const AXLE: IAutoMovieVector3 = { x: 0.1, y: 0.3, z: 0 };
  const AHEAD: number = 1;
  const identity: IAutoMovieTransform["rotation"] = { x: 0, y: 0, z: 0, w: 1 };
  const contact = (
    id: string,
    translation: IAutoMovieVector3,
    kind: IAutoMovieAffordance["kind"],
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: { translation, rotation: identity, scale: { x: 1, y: 1, z: 1 } },
    extent: null,
  });
  const model: HumanObject.IModel = {
    affordances: [
      contact("pedal", { x: AXLE.x, y: AXLE.y, z: RADIUS }, "pedal"),
      contact("saddle", { x: 0, y: 0.9, z: 0 }, "seat"),
    ],
  };
  // The world frame of a contact at a second: the pedal turns about the
  // axle once a second, and the saddle stays on the placed object.
  const reader = (id: string, seconds: number): IAutoMovieTransform => ({
    translation:
      id === "pedal"
        ? {
            x: AXLE.x,
            y: AXLE.y + RADIUS * Math.sin(2 * Math.PI * seconds),
            z: AHEAD + RADIUS * Math.cos(2 * Math.PI * seconds),
          }
        : { x: 0, y: 0.9, z: AHEAD },
    rotation: identity,
    scale: { x: 1, y: 1, z: 1 },
  });
  const film = (moving: boolean): HumanPerformance =>
    new HumanPerformance({
      seed: "pedal",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop(
          "bike",
          model,
          { at: { x: 0, y: 0, z: AHEAD }, yaw: 0 },
          undefined,
          moving ? reader : undefined,
        ),
      ],
      composition: HumanChain.subject("a").stand({ seconds: 1 }).node,
    });
  const aimed = (
    of: HumanPerformance,
    point: string,
    seconds: number,
  ): number[] => {
    const aim: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } = of.aim(
      { kind: "prop", subject: "bike", point },
      seconds,
      {
        root: { x: 0, y: 0, z: 0 },
        yaw: 0,
        heights: { low: 0.8, middle: 1.2, high: 1.6 },
        range: 0.8,
        body,
        bones: () => of.bones("a", seconds),
      },
    );
    return [
      aim.point.x,
      aim.point.y,
      aim.point.z,
      aim.normal.x,
      aim.normal.y,
      aim.normal.z,
    ].map((v: number): number => Number(v.toFixed(6)) + 0);
  };
  const turning: HumanPerformance = film(true);
  const fixed: HumanPerformance = film(false);
  const rows = (of: HumanPerformance, point: string): number[][] =>
    [0, 0.25, 0.5].map((seconds: number): number[] =>
      aimed(of, point, seconds),
    );

  // 1. The pedal on its crank.
  TestValidator.equals("a pedal is aimed at where the crank has it", rows(turning, "pedal"), [
    [0.1, 0.3, 1.17, 0, 1, 0],
    [0.1, 0.47, 1, 0, 1, 0],
    [0.1, 0.3, 0.83, 0, 1, 0],
  ]);

  // 2. A part the reader leaves in place.
  TestValidator.equals("a saddle stays on the placed object", rows(turning, "saddle"), [
    [0, 0.9, 1, 0, 1, 0],
    [0, 0.9, 1, 0, 1, 0],
    [0, 0.9, 1, 0, 1, 0],
  ]);

  // 3. Without a reader every point moves with the object alone.
  TestValidator.equals("without a reader a pedal keeps its place at rest", rows(fixed, "pedal"), [
    [0.1, 0.3, 1.17, 0, 1, 0],
    [0.1, 0.3, 1.17, 0, 1, 0],
    [0.1, 0.3, 1.17, 0, 1, 0],
  ]);
}
