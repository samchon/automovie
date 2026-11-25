import { markAutoMovieSupportWrenches } from "@automovie/engine";
import type {
  IAutoMovieMark,
  IAutoMoviePhysicalSupportWrench,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Support wrenches governing one cache step become an allocated-force arrow from the centre of mass and, past the allocator's admitted error, a flagged shortfall arrow from its tip.
 *
 * Scenarios:
 *
 * 1. A record at 1.0 s requesting 100 N up and allocating 60 N, drawn at 1.004 s with a 1/120 s step and 0.002 m per newton from (0, 1, 0), gives a 0.12 m allocated arrow from (0, 1, 0) and a flagged 0.08 m shortfall from (0, 1.12, 0); the two add up to the 0.2 m request.
 * 2. The same record drawn at 0.99 s, before it, and at 1.01 s, after its 1/120 s step, draws nothing; of two records of one body the later one at or before the second is read, and two bodies each draw their own.
 * 3. A residual of 5e-5 N on a 100 N request, inside the 1e-4 N the allocator admits, draws no shortfall; a zero allocation draws only the whole request as shortfall.
 * 4. A step or a scale that is zero or not finite is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the engine producer on wrench records the test writes and reads the returned arrows' kinds, paths, origins, vectors and flags.
 * @evidence contracts/development/testing.md#independent-expectations Lengths are newtons times the scale computed by hand: 60 × 0.002 = 0.12 m and 40 × 0.002 = 0.08 m; the admitted error is 1e-6 × 100 N = 1e-4 N by the documented rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a governing record against earlier and expired ones, an earlier against a later record, two bodies, a shortfall inside and outside the admitted error, zero allocation, and valid against refused steps and scales. Allocation by the real solver and drawing belong to `test_inspection_physical_force_marks`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit writes its own records and starts no solver, browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A record at 1.0 s requesting 100 N up and allocating 60 N).
 */
export function test_unit_engine_composition_mark_support_wrenches(): void {
  const interval: number = 1 / 120;
  const mark = (
    wrenches: IAutoMoviePhysicalSupportWrench[],
    seconds: number,
  ): IAutoMovieMark[] =>
    markAutoMovieSupportWrenches({
      wrenches,
      seconds,
      interval,
      metresPerNewton: 0.002,
    });

  // 1. Allocated force and its shortfall.
  const partial: IAutoMoviePhysicalSupportWrench = wrench("hero", 1, 100, 60);
  const drawn: IAutoMovieMark[] = mark([partial], 1.004);
  TestValidator.equals(
    "allocated and shortfall marks",
    drawn.map((m: IAutoMovieMark) => [m.kind, m.path, m.flagged]),
    [
      ["support/allocated", "hero/support/allocated", false],
      ["support/shortfall", "hero/support/shortfall", true],
    ],
  );
  const [allocated, shortfall] = drawn.map(arrows);
  TestValidator.predicate(
    "the allocated arrow is 0.12 m up from the centre of mass and the shortfall continues 0.08 m from its tip",
    close(allocated!.origins, [0, 1, 0]) &&
      close(allocated!.vectors, [0, 0.12, 0]) &&
      close(shortfall!.origins, [0, 1.12, 0]) &&
      close(shortfall!.vectors, [0, 0.08, 0]),
  );

  // 2. The governing record.
  const later: IAutoMoviePhysicalSupportWrench = wrench(
    "hero",
    1 + interval,
    100,
    100,
  );
  TestValidator.equals(
    "earlier, expired, later and per-body records",
    [
      mark([partial], 0.99).length,
      mark([partial], 1.01).length,
      mark([partial, later], 1 + interval).map((m: IAutoMovieMark) => m.kind),
      mark([partial, wrench("rival", 1, 50, 50)], 1).map(
        (m: IAutoMovieMark) => m.path,
      ),
    ],
    [
      0,
      0,
      ["support/allocated"],
      [
        "hero/support/allocated",
        "hero/support/shortfall",
        "rival/support/allocated",
      ],
    ],
  );

  // 3. The admitted error and an unsupported request.
  const unsupported: IAutoMovieMark[] = mark([wrench("hero", 1, 100, 0)], 1);
  TestValidator.equals(
    "a residual inside the admitted error, and zero allocation",
    [
      mark([wrench("hero", 1, 100, 100 - 5e-5)], 1).map(
        (m: IAutoMovieMark) => m.kind,
      ),
      unsupported.map((m: IAutoMovieMark) => [m.kind, m.flagged]),
    ],
    [["support/allocated"], [["support/shortfall", true]]],
  );
  TestValidator.predicate(
    "the whole request is shortfall from the centre of mass",
    close(arrows(unsupported[0]!).origins, [0, 1, 0]) &&
      close(arrows(unsupported[0]!).vectors, [0, 0.2, 0]),
  );

  // 4. Refusals.
  for (const value of [0, -1]) {
    TestValidator.error(`a step of ${value} is refused`, (): void => {
      markAutoMovieSupportWrenches({
        wrenches: [],
        seconds: 0,
        interval: value,
        metresPerNewton: 0.002,
      });
    });
    TestValidator.error(`a scale of ${value} is refused`, (): void => {
      markAutoMovieSupportWrenches({
        wrenches: [],
        seconds: 0,
        interval,
        metresPerNewton: value,
      });
    });
  }
}

/** A vertical request of `requested` newtons allocated `allocated` newtons at a centre of mass 1 m up, with its exact residual and no moment. */
function wrench(
  body: string,
  seconds: number,
  requested: number,
  allocated: number,
): IAutoMoviePhysicalSupportWrench {
  const of = (force: number): IAutoMoviePhysicalSupportWrench["requested"] => ({
    force: { x: 0, y: force, z: 0 },
    torque: { x: 0, y: 0, z: 0 },
  });
  return {
    body,
    seconds,
    origin: { x: 0, y: 1, z: 0 },
    requested: of(requested),
    allocated: of(allocated),
    residual: of(requested - allocated),
    pointCount: allocated === 0 ? 0 : 4,
  };
}

/** The arrows a wrench mark draws; any other shape is a wrong mark. */
function arrows(mark: IAutoMovieMark): IAutoMovieMark.IArrows {
  if (mark.shape.type !== "arrows")
    throw new Error(`${mark.path} draws ${mark.shape.type}, not arrows`);
  return mark.shape;
}

/** Whether two flat coordinate lists agree within 1e-12 m. */
function close(
  actual: readonly number[],
  expected: readonly number[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 1e-12),
    )
  );
}
