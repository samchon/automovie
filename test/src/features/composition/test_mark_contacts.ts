import { markAutoMovieContacts } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMovieMark,
  IAutoMoviePhysicalOwnershipEvent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Solved contacts acting at one second become one arrow per collider at their contact points, along the force each collider receives, as long as the mean force times the stated scale; other contacts draw nothing.
 *
 * Scenarios:
 *
 * 1. A solver receipt whose step at 1.0 s carries 0.5 N s over 0.01 s, a mean force of 50 N, at (1, 0, 0) with its normal +Y from the hand toward the wall, drawn at 1.005 s with 0.002 m per newton, gives two `contact` arrows from (1, 0, 0) of length 0.1 m: the hand's, at the hand's path, along -Y, and the wall's, at the wall's path, along +Y.
 * 2. The same receipt drawn at 0.99 s, before its step, at 1.02 s, after the step's duration, and a geometric receipt draw nothing; a step with a positive separation draws nothing.
 * 3. Of two steps, the later one at or before the drawn second is read.
 * 4. A scale that is zero or not finite, and an acting step with no duration, are refused.
 * 5. With the hand dynamic and the wall without ownership history, a stated zero flags only the hand, a transfer the hand received flags nothing, the wall's stated zero never flags, and an unstated transfer flags nothing; with the wall dynamic too both zeros flag; a hand made authored or returning before the step, a hand whose only event comes after it, and a call without ownership flag nothing.
 * 6. Under a 0.05 m maximum the 0.1 m arrows keep their directions at 0.05 m as unflagged `contact/clamped` marks labelled with the clamp and the 25 N they stand for at least; under a 0.1 m or 0.2 m maximum they stay `contact` at 0.1 m; a maximum that is zero or not finite is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer on receipts the test writes and reads the returned arrows' origins, vectors, paths and kinds.
 * @evidence contracts/development/testing.md#independent-expectations The expected length is the impulse over the duration times the scale, 0.5 / 0.01 x 0.002 = 0.1 m, computed by hand from the documented rule; the opposite directions follow from action and reaction along the written normal; a 0.05 m clamp at 0.002 m per newton stands for at least 0.05 / 0.002 = 25 N.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts an acting step against one not yet completed, one expired, a geometric receipt and a separated step, an earlier step against a later one, valid against refused scales and durations, the two sides of a stated zero, one-sided and unstated transfer against dynamic, unowned, authored, returning, not-yet-owned and absent ownership, and arrows above, at and below a maximum length with valid and refused maxima. Drawing the arrows belongs to the inspection tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own receipts and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A solver receipt whose step at 1.0 s carries 0.5 N s over 0.01 s).
 */
export function test_mark_contacts(): void {
  const step = (
    seconds: number,
    impulse: number,
    duration: number,
    separation: number = 0,
  ) => ({
    seconds,
    duration,
    impulse,
    point: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    separation,
    compression: 0,
  });
  const receipt = (
    source: "solver" | "geometric",
    samples: ReturnType<typeof step>[],
  ): IAutoMovieContactReceipt => ({
    id: "c1",
    source,
    seconds: 1,
    endSeconds: 1.1,
    a: { body: "hero", bone: "leftHand", shape: "palm", material: "skin" },
    b: { body: "wall", bone: "root", shape: "slab", material: "stone" },
    point: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    impulse: 0.5,
    separation: 0,
    compression: 0,
    samples,
  });
  const mark = (
    receipts: IAutoMovieContactReceipt[],
    seconds: number,
  ): IAutoMovieMark[] =>
    markAutoMovieContacts({ receipts, seconds, metresPerNewton: 0.002 });

  // 1. One acting contact.
  const acting: IAutoMovieMark[] = mark(
    [receipt("solver", [step(1, 0.5, 0.01)])],
    1.005,
  );
  TestValidator.equals(
    "one contact mark per collider",
    acting.map((m: IAutoMovieMark) => [
      m.kind,
      m.path,
      (m.shape as IAutoMovieMark.IArrows).origins,
    ]),
    [
      ["contact", "hero/leftHand/contact/c1", [1, 0, 0]],
      ["contact", "wall/root/contact/c1", [1, 0, 0]],
    ],
  );
  const [hand, wall] = acting.map(
    (m: IAutoMovieMark): readonly number[] =>
      (m.shape as IAutoMovieMark.IArrows).vectors,
  );
  TestValidator.predicate(
    `the hand is pushed 0.1 m along -Y and the wall along +Y: ${hand!.join(",")} / ${wall!.join(",")}`,
    [hand!, wall!].every(
      (vector: readonly number[], index: number): boolean =>
        nclose(vector[0]!, 0, 1e-12) &&
        nclose(vector[1]!, index === 0 ? -0.1 : 0.1, 1e-12) &&
        nclose(vector[2]!, 0, 1e-12),
    ),
  );

  // 2. Nothing acting.
  TestValidator.equals(
    "before, after, geometric and separated contacts draw nothing",
    [
      mark([receipt("solver", [step(1, 0.5, 0.01)])], 0.99).length,
      mark([receipt("solver", [step(1, 0.5, 0.01)])], 1.02).length,
      mark([receipt("geometric", [step(1, 0.5, 0.01)])], 1.005).length,
      mark([receipt("solver", [step(1, 0.5, 0.01, 0.001)])], 1.005).length,
    ],
    [0, 0, 0, 0],
  );

  // 3. The later step.
  const later: IAutoMovieMark[] = mark(
    [receipt("solver", [step(1, 0.5, 0.01), step(1.01, 1, 0.01)])],
    1.015,
  );
  TestValidator.predicate(
    "the later step is read",
    nclose((later[1]!.shape as IAutoMovieMark.IArrows).vectors[1]!, 0.2, 1e-12),
  );

  // 4. Refusals.
  for (const scale of [0, -1])
    TestValidator.error(`a scale of ${scale} is refused`, (): void => {
      markAutoMovieContacts({
        receipts: [],
        seconds: 0,
        metresPerNewton: scale,
      });
    });
  TestValidator.error(
    "an acting step with no duration is refused",
    (): void => {
      mark([receipt("solver", [step(1, 0.5, 0)])], 1);
    },
  );

  // 5. A solved impulse that a dynamic side did not receive.
  const event = (
    body: string,
    bone: string,
    seconds: number,
    kind: IAutoMoviePhysicalOwnershipEvent["kind"],
  ): IAutoMoviePhysicalOwnershipEvent => ({ body, bone, seconds, kind });
  const handDynamic: IAutoMoviePhysicalOwnershipEvent[] = [
    event("hero", "leftHand", 0, "dynamic"),
  ];
  const transferred = (
    appliedImpulse: { a: number; b: number } | undefined,
    ownership: IAutoMoviePhysicalOwnershipEvent[] | undefined,
  ): boolean[] =>
    markAutoMovieContacts({
      receipts: [
        receipt("solver", [
          {
            ...step(1, 0.5, 0.01),
            ...(appliedImpulse === undefined ? {} : { appliedImpulse }),
          },
        ]),
      ],
      seconds: 1.005,
      metresPerNewton: 0.002,
      ...(ownership === undefined ? {} : { ownership }),
    }).map((m: IAutoMovieMark): boolean => m.flagged);
  TestValidator.equals(
    "only a dynamic side's stated zero is flagged",
    [
      transferred({ a: 0, b: 0 }, handDynamic),
      transferred({ a: 0.5, b: 0 }, handDynamic),
      transferred({ a: 0, b: 0.5 }, handDynamic),
      transferred(undefined, handDynamic),
      transferred({ a: 0, b: 0 }, [
        ...handDynamic,
        event("wall", "root", 0, "dynamic"),
      ]),
      transferred({ a: 0, b: 0 }, [
        ...handDynamic,
        event("hero", "leftHand", 0.9, "authored"),
      ]),
      transferred({ a: 0, b: 0 }, [
        ...handDynamic,
        event("hero", "leftHand", 0.9, "return"),
      ]),
      transferred({ a: 0, b: 0 }, [event("hero", "leftHand", 1.5, "dynamic")]),
      transferred({ a: 0, b: 0 }, undefined),
    ],
    [
      [true, false],
      [false, false],
      [true, false],
      [false, false],
      [true, true],
      [false, false],
      [false, false],
      [false, false],
      [false, false],
    ],
  );

  // 6. A clamp keeps the direction, shortens the arrow and declares itself.
  const clamp = (maximumLength: number): IAutoMovieMark[] =>
    markAutoMovieContacts({
      receipts: [receipt("solver", [step(1, 0.5, 0.01)])],
      seconds: 1.005,
      metresPerNewton: 0.002,
      maximumLength,
    });
  const short: IAutoMovieMark[] = clamp(0.05);
  TestValidator.equals(
    "a 0.1 m arrow under a 0.05 m maximum is clamped and labelled",
    short.map((m: IAutoMovieMark) => [m.kind, m.label, m.color, m.flagged]),
    [
      [
        "contact/clamped",
        "contact force clamped at 0.05 m (at least 25 N)",
        0x007a6a,
        false,
      ],
      [
        "contact/clamped",
        "contact force clamped at 0.05 m (at least 25 N)",
        0x007a6a,
        false,
      ],
    ],
  );
  TestValidator.predicate(
    "the clamped arrows keep their directions at 0.05 m",
    short.every((m: IAutoMovieMark, index: number): boolean => {
      const vector: readonly number[] = (m.shape as IAutoMovieMark.IArrows)
        .vectors;
      return (
        nclose(vector[0]!, 0, 1e-12) &&
        nclose(vector[1]!, index === 0 ? -0.05 : 0.05, 1e-12) &&
        nclose(vector[2]!, 0, 1e-12)
      );
    }),
  );
  TestValidator.equals(
    "an arrow at or under its maximum keeps its kind and length",
    [clamp(0.1), clamp(0.2)].map((marks: IAutoMovieMark[]) =>
      marks.map((m: IAutoMovieMark) => [
        m.kind,
        (m.shape as IAutoMovieMark.IArrows).vectors[1],
      ]),
    ),
    [
      [
        ["contact", -0.1],
        ["contact", 0.1],
      ],
      [
        ["contact", -0.1],
        ["contact", 0.1],
      ],
    ],
  );
  for (const maximum of [0, -1])
    TestValidator.error(
      `a maximum length of ${maximum} is refused`,
      (): void => {
        clamp(maximum);
      },
    );
}
