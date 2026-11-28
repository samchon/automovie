import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  ropeLine
} from "../../../../../packages/motions/src/rope/internal/ropeLine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * Two quarter-turn quaternion products and affine position sums fit within 64
 * binary64 rounding units at the fixtures' 4 m scale.
 */
const ROUNDING: number = 64 * Number.EPSILON * 4;

/**
 * Check the staged rope line, height interpolation and oriented contact.
 *
 * Scenarios:
 *
 * 1. Combine the prop's quarter turn and bar's independent turn to locate the
 *    vertical line in world space.
 * 2. Interpolate at world height 1 m on a sloped line and clamp outside both
 *    ends. A horizontal line returns its midpoint.
 * 3. Read the root-facing hand normal, upward foot normal and alternate-prop
 *    fallback. Refuse missing bars and moving ropes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the hierarchy, measured frames and refusal conditions.
 * @evidence contracts/development/testing.md#behavioral-verification The line and aim readers receive typed prop and contact callbacks at the requested film times.
 * @evidence contracts/development/testing.md#independent-expectations The given rotations and translation fix the endpoints. Similar triangles give the height interpolation and perpendicular projection fixes the hand normal.
 */
export function test_motions_rope_line(): void {
  const quarter: number = Math.SQRT1_2;
  const world: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: quarter, z: 0, w: quarter },
  };
  const bar: IAutoMovieAffordance = {
    id: "main",
    kind: "bar",
    extent: null,
    frame: {
      translation: { x: 1, y: 0, z: 2 },
      rotation: { x: 0, y: 0, z: -quarter, w: quarter },
      scale: { x: 1, y: 1, z: 1 },
    },
    length: 2,
  };
  const fixture: IAutoMovieMotionHumanPropReader = {
    prop: {
      subject: "rope",
      points: {},
      fixed: true,
      frame: world,
      affordances: [bar],
    },
    frame: (seconds: number): IAutoMovieRigidTransform => {
      if (seconds !== 1.25) throw new Error("Expected the film start");
      return world;
    },
  };
  const context: ropeLine.IRead = {
    start: 1.25,
    prop: (subject: string): IAutoMovieMotionHumanPropReader => {
      if (subject !== "rope") throw new Error("Expected the rope prop");
      return fixture;
    },
  };
  const line: ropeLine.ILine = ropeLine.read(context, "rope", "main");
  TestValidator.predicate(
    "a descending local bar is ordered low to high in world metres",
    vclose(line.low, { x: 3, y: 1, z: 2 }, ROUNDING) &&
      vclose(line.high, { x: 3, y: 3, z: 2 }, ROUNDING) &&
      vclose(line.axis, { x: 0, y: 1, z: 0 }, ROUNDING) &&
      nclose(line.length, 2, ROUNDING) &&
      nclose(line.floor, 2, ROUNDING),
  );
  const sloped: ropeLine.ILine = {
    low: { x: 0, y: 0, z: 0 },
    high: { x: 3, y: 4, z: 0 },
    axis: { x: 0.6, y: 0.8, z: 0 },
    length: 5,
    floor: 0,
  };
  TestValidator.predicate(
    "read a line by height rather than by path distance",
    vclose(ropeLine.atHeight(sloped, 1), { x: 0.75, y: 1, z: 0 }, ROUNDING) &&
      vclose(ropeLine.atHeight(sloped, -1), sloped.low, ROUNDING) &&
      vclose(ropeLine.atHeight(sloped, 5), sloped.high, ROUNDING) &&
      vclose(
        ropeLine.atHeight(
          {
            ...sloped,
            high: { x: 5, y: 0, z: 0 },
            axis: { x: 1, y: 0, z: 0 },
          },
          9,
        ),
        { x: 2.5, y: 0, z: 0 },
        ROUNDING,
      ),
  );

  const fallback = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const reach = ropeLine.aim(
    {
      entry: { posture: { root: { x: 4, y: 6, z: 2 } } },
      aim: (_target: IAutoMovieMotionTarget, seconds: number) => {
        if (seconds !== 5) throw new Error("Expected the aim time");
        return fallback;
      },
    },
    "rope",
    new Map([
      ["leftHand", line.high],
      ["leftFoot", line.low],
    ]),
    line,
  );
  TestValidator.predicate(
    "staged hand and foot use their distinct support normals",
    vclose(
      reach({ kind: "prop", subject: "rope", point: "leftHand" }, 5).normal,
      { x: 1, y: 0, z: 0 },
      ROUNDING,
    ) &&
      vclose(
        reach({ kind: "prop", subject: "rope", point: "leftFoot" }, 5).normal,
        { x: 0, y: 1, z: 0 },
        ROUNDING,
      ) &&
      reach({ kind: "prop", subject: "other", point: "leftHand" }, 5) ===
        fallback &&
      reach({ kind: "prop", subject: "rope", point: "unknown" }, 5) ===
        fallback,
  );
  TestValidator.predicate(
    "only a positive fixed bar can define the line",
    throwsError(
      (): ropeLine.ILine => ropeLine.read(context, "rope", "missing"),
      "fixed rope line",
    ) &&
      throwsError(
        (): ropeLine.ILine =>
          ropeLine.read(
            {
              ...context,
              prop: (): IAutoMovieMotionHumanPropReader => ({
                ...fixture,
                prop: {
                  ...fixture.prop,
                  motion: (): IAutoMovieRigidTransform => world,
                },
              }),
            },
            "rope",
            "main",
          ),
        "fixed rope line",
      ),
  );
}
