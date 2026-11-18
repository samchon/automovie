import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  typeText,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The manipulate catalogue binds instrument, keyboard and keypad names to a hand and, for single-digit techniques, a digit.
 *
 * Scenarios:
 * 1. Look up each named technique and verify which supplied hand and digit it overrides.
 * 2. Use the small body for two-handed keyboard input and left-hand fretting, and the average body for two-handed pad input and thumb-only contact.
 * 3. The catalogue includes exactly the seven named techniques and the underlying manipulate action.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the registration and hand-selection rules and retained scenes.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real catalogue records and places representative techniques against keyboard and keypad affordances.
 * @evidence contracts/development/testing.md#independent-expectations The instrument and typing techniques specify the expected hand and which digits they fix.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks every fixed hand and digit assignment. The direct manipulate test independently measures the key, finger, timing and refusal contracts.
 * @evidence contracts/development/testing.md#execution-ownership Builds four local performances with performer-scaled fixtures and reads each placed name.
 */
export function test_human_motion_lexicon_rows_manipulate(): void {
  const complaints: string[] = [];
  const rows: readonly IAutoMovieMotionHumanActionLaw<never>[] =
    HUMAN_LEXICON.manipulate ?? [];
  const names: string[] = rows.map(
    (r: IAutoMovieMotionHumanActionLaw<never>): string => r.name,
  );
  const techniques: readonly Technique[] = [
    ["type", "both"],
    ["typeTwoFinger", "both", "index"],
    ["play", "both"],
    ["fret", "left"],
    ["strum", "right"],
    ["dial", "right", "index"],
    ["thumbText", "right", "thumb"],
  ];
  const expected: string[] = ["manipulate"];
  for (const [name, side, digit] of techniques) {
    expected.push(name);
    const law: IAutoMovieMotionHumanActionLaw<never> | undefined = rows.find(
      (row: IAutoMovieMotionHumanActionLaw<never>): boolean =>
        row.name === name,
    );
    TestValidator.equals(name + " owner", law?.family, "manipulate");
    TestValidator.equals(
      name + " hand and digit",
      law?.resolve?.({ side: "caller", digit: "middle" }),
      { side, digit: digit ?? "middle" },
    );
  }
  if (
    JSON.stringify(
      [...names].sort((a: string, b: string): number => a.localeCompare(b)),
    ) !==
    JSON.stringify(
      [...expected].sort((a: string, b: string): number => a.localeCompare(b)),
    )
  )
    complaints.push(
      `the family holds ${names.join(", ")}, ${expected.join(", ")} expected`,
    );
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const at: IAutoMovieVector3 = {
      x: 0,
      y: m.shoulderHeight - m.upperArm,
      z: body.rest.get("rightUpperArm")!.z + 0.8 * m.forearm,
    };
    const keyboard: IAutoMovieMotionHumanProp = {
      subject: "keyboard",
      frame: { position: at, rotation: { x: 0, y: 1, z: 0, w: 0 } },
      points: {},
      affordances: [
        {
          id: "homeRow",
          kind: "surface",
          frame: Transform.identity(),
          extent: null,
        },
        {
          id: "keys",
          kind: "surface",
          frame: Transform.identity(),
          extent: null,
          width: typeText.WIDTH,
        },
      ],
    };
    const pad: IAutoMovieMotionHumanProp = {
      subject: "pad",
      frame: {
        position: Vector3.add(at, { x: 0, y: -0.05, z: 0 }),
        rotation: Quaternion.identity(),
      },
      points: {},
      affordances: [0, 1, 2, 3, 4].map((k: number) => ({
        id: `b${k}`,
        kind: "button" as const,
        frame: {
          ...Transform.identity(),
          translation: { x: (k - 2) * typeText.PITCH, y: 0, z: 0 },
        },
        extent: null,
        travel: 0.002,
      })),
    };
    const contacts = [0, 1, 2, 3, 4].map((k: number) => ({ site: `b${k}` }));
    const staged: readonly Scene[] =
      name === "f-small"
        ? [
            ["typeTwoFinger", { prop: "keyboard", text: "hello" }],
            ["fret", { prop: "pad", contacts }],
          ]
        : [
            ["play", { prop: "pad", contacts }],
            ["thumbText", { prop: "pad", contacts }],
          ];
    for (const [row, params] of staged)
      try {
        const performance: IAutoMovieMotionHumanPerformance =
          new HumanPerformance({
            seed: "rows",
            laws: [...rows],
            props: [keyboard, pad],
            performers: [
              {
                subject: "a",
                body,
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" },
              },
            ],
            composition: HumanChain.subject("a").registered(row, params).node,
          });
        const placed: string | undefined = performance
          .segments("a")
          .at(-1)?.name;
        if (placed !== row)
          complaints.push(`${name} ${row}: placed as ${placed}`);
      } catch (error) {
        complaints.push(
          `${name} ${row}: expected to plan, got ${(error as Error).message}`,
        );
      }
  }
  TestValidator.equals("every manipulate row is performable", complaints, []);
}

/** Public row name, fixed hand and optional fixed digit. */
type Technique = readonly [string, string, string?];

/** A registered technique and the parameters its named prop supplies. */
type Scene = readonly [string, object];
