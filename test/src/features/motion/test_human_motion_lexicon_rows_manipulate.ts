import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type IHumanActionLaw,
  type IHumanBody,
  type IHumanProp,
  typeText,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every row of the `manipulate` family is something a body can do (#3446):
 * on the average man and on the small woman, each row plans before a
 * keyboard (for `type`) or a five-button pad (for the others) at the
 * performer's elbow height and a forearm's reach, and the placed action
 * carries the row's name.
 *
 * Scenarios, for each body:
 *
 * 1. `type` and `typeTwoFinger` type "hello" on the keyboard.
 * 2. `play`, `fret`, `strum`, `dial` and `thumbText` press the pad's five
 *    buttons in order, and `sequence` (the law itself) the same with its
 *    hand named.
 * 3. The family holds every row the lexicon lists for it, and no other.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers each row through the public input and builds a performance on real bodies; a refusal or a placed action under another name fails with the row, the body and the message.
 * @evidence contracts/development/testing.md#independent-expectations That each row is performable before a reachable prop is what the row claims; nothing is read back from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases Two builds, a keyboard and a pad, every row and the family's membership.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing two polygon men; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the three scenarios.
 */
export function test_human_motion_lexicon_rows_manipulate(): void {
  const complaints: string[] = [];
  const rows: readonly IHumanActionLaw<never>[] =
    HUMAN_LEXICON.manipulate ?? [];
  const names: string[] = rows.map(
    (r: IHumanActionLaw<never>): string => r.name,
  );
  const expected: string[] = [
    "manipulate",
    "type",
    "typeTwoFinger",
    "play",
    "fret",
    "strum",
    "dial",
    "thumbText",
  ];
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
    const body: IHumanBody = motionHumanBody(name);
    const m: IHumanBody["measure"] = body.measure;
    const at: IAutoMovieVector3 = {
      x: 0,
      y: m.shoulderHeight - m.upperArm,
      z: body.rest.get("rightUpperArm")!.z + 0.8 * m.forearm,
    };
    const keyboard: IHumanProp = {
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
    const pad: IHumanProp = {
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
    const staged: [string, object][] = [
      ["type", { prop: "keyboard", text: "hello" }],
      ["typeTwoFinger", { prop: "keyboard", text: "hello" }],
      ["play", { prop: "pad", contacts }],
      ["fret", { prop: "pad", contacts }],
      ["strum", { prop: "pad", contacts }],
      ["dial", { prop: "pad", contacts }],
      ["thumbText", { prop: "pad", contacts }],
      ["manipulate", { prop: "pad", contacts, side: "right" }],
    ];
    for (const [row, params] of staged)
      try {
        const performance: HumanPerformance = new HumanPerformance({
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
