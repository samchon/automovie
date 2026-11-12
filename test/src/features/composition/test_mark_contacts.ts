import { type IAutoMovieMark, markAutoMovieContacts } from "@automovie/engine";
import type { IAutoMovieContactReceipt } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Solved contacts acting at one second become arrows at their contact points along their normals, as long as the mean force times the stated scale; other contacts draw nothing.
 *
 * Scenarios:
 *
 * 1. A solver receipt whose step at 1.0 s carries 0.5 N s over 0.01 s, a mean force of 50 N, at (1, 0, 0) along +Y, drawn at 1.005 s with 0.002 m per newton, gives one arrow from (1, 0, 0) of length 0.1 m along +Y, kind `contact`, at the first collider's path.
 * 2. The same receipt drawn at 0.99 s, before its step, at 1.02 s, after the step's duration, and a geometric receipt draw nothing; a step with a positive separation draws nothing.
 * 3. Of two steps, the later one at or before the drawn second is read.
 * 4. A scale that is zero or not finite, and an acting step with no duration, are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer on receipts the test writes and reads the returned arrows' origins, vectors, paths and kinds.
 * @evidence contracts/development/testing.md#independent-expectations The expected length is the impulse over the duration times the scale, 0.5 / 0.01 x 0.002 = 0.1 m, computed by hand from the documented rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts an acting step against one not yet completed, one expired, a geometric receipt and a separated step, an earlier step against a later one, and valid against refused scales and durations. Drawing the arrows belongs to the inspection tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own receipts and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A solver receipt whose step at 1.0 s carries 0.5 N s over 0.01 s).
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
  const arrow: IAutoMovieMark.IArrows = acting[0]!
    .shape as IAutoMovieMark.IArrows;
  TestValidator.equals(
    "one contact mark",
    [acting.length, acting[0]!.kind, acting[0]!.path, arrow.origins],
    [1, "contact", "hero/leftHand/contact/c1", [1, 0, 0]],
  );
  TestValidator.predicate(
    `the arrow is 0.1 m along +Y: ${arrow.vectors.join(",")}`,
    nclose(arrow.vectors[0]!, 0, 1e-12) &&
      nclose(arrow.vectors[1]!, 0.1, 1e-12) &&
      nclose(arrow.vectors[2]!, 0, 1e-12),
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
    nclose((later[0]!.shape as IAutoMovieMark.IArrows).vectors[1]!, 0.2, 1e-12),
  );

  // 4. Refusals.
  for (const scale of [0, Number.POSITIVE_INFINITY, Number.NaN])
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
}
