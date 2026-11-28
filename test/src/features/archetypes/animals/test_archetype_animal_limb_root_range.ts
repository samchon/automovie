import {
  type AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedRootRange,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Four literal constraints; the test never asks production code to make an oracle. */
type Constraints = Record<
  AutoMovieArchetypeQuadrupedBody.Limb,
  AutoMovieArchetypeQuadrupedRootRange.IConstraint
>;

/**
 * One whole-body vertical interval must satisfy all four actual limb constraints.
 *
 * Scenarios:
 * 1. Attachment (0,1,0), goal (0,0,3), reach [2,5] gives [-1,3]; a floor
 *    at zero yields [0,3], while reach [4,5] raises its lower end to sqrt(7)-1.
 * 2. A different hind constraint shares that same root, producing [1,3];
 *    incompatible limb intervals, a floor above three and horizontal
 *    distance past five refuse without moving any attachment or goal.
 * 3. Exact horizontal tangency at five produces the singleton root -1.
 *    A 1e308 radius with horizontal distance 6e307 retains upper 8e307.
 * 4. Missing limbs, nonfinite coordinates/floor, invalid radii and derived
 *    overflow refuse; input bytes and fresh returned intervals remain owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared root-height intervals, floor restriction, lateral tangency and invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public four-limb intersection on authored constraints. Separate cases exercise an incompatible hind limb, a floor bound and malformed data. The asserted shared interval catches independent roots.
 * @evidence contracts/development/testing.md#independent-expectations A horizontal offset of three at outer radius five gives vertical reach four by Pythagoras. The initial attachment offset then gives [-1, 3], and intersecting [1, 5] narrows it to [1, 3]. A scaled 6-8-10 triangle also has finite height.
 */
export function test_archetype_animal_limb_root_range(): void {
  const findings: string[] = [];
  const base: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  const before: string = JSON.stringify(base);
  band("literal unfloored", base, -10, -1, 3);
  band("actual floor zero", base, 0, 0, 3);
  band(
    "inner radius active",
    make({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 3 }, 4, 5),
    -10,
    Math.sqrt(7) - 1,
    3,
  );
  band(
    "horizontal axes share one metric",
    make({ x: 0, y: 1, z: 0 }, { x: 3, y: 0, z: 0 }, 2, 5),
    -10,
    -1,
    3,
  );
  band(
    "exact horizontal tangency",
    make({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 5 }, 2, 5),
    -10,
    -1,
    -1,
  );
  const coupled: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  coupled.rightHind.attachment.y = -1;
  band("all limbs share the same root", coupled, -10, 1, 3);
  band("floor and all limbs jointly active", coupled, 2, 2, 3);
  const impossible: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  impossible.rightHind.attachment.y = -5;
  refusal("incompatible four-limb intervals", (): unknown =>
    AutoMovieArchetypeQuadrupedRootRange.intersect(impossible, -10),
  );
  refusal("actual body floor above limb reach", (): unknown =>
    AutoMovieArchetypeQuadrupedRootRange.intersect(base, 3 + 2 ** -48),
  );
  const outside: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  outside.rightHind.goal.z = 5 + 2 ** -49;
  refusal(
    "near-outside horizontal target",
    (): unknown => AutoMovieArchetypeQuadrupedRootRange.intersect(outside, -10),
    "rightHind",
  );

  const huge: AutoMovieArchetypeQuadrupedRootRange.IRange =
    AutoMovieArchetypeQuadrupedRootRange.intersect(
      make({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 6e307 }, 0, 1e308),
      0,
    );
  near("large finite lower", huge.minimum, 0, 0);
  near(
    "large finite upper normalized by literal scale",
    huge.maximum / 1e307,
    8,
    1e-12,
  );
  const missing: Partial<Constraints> = { ...base };
  delete missing.leftHind;
  refusal(
    "missing actual limb",
    (): unknown =>
      AutoMovieArchetypeQuadrupedRootRange.intersect(missing as Constraints, 0),
    "leftHind",
  );
  for (const floor of [NaN, Infinity, -Infinity])
    refusal("nonfinite actual floor", (): unknown =>
      AutoMovieArchetypeQuadrupedRootRange.intersect(base, floor),
    );
  for (const [minimum, maximum] of [
    [-1, 5],
    [6, 5],
    [0, 0],
    [NaN, 5],
    [0, Infinity],
  ] as const) {
    const invalid: Constraints = make(
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 3 },
      2,
      5,
    );
    invalid.leftFore.reach = { minimum, maximum };
    refusal(
      "invalid actual radial band",
      (): unknown => AutoMovieArchetypeQuadrupedRootRange.intersect(invalid, 0),
      "leftFore",
    );
  }
  const nonfinite: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  nonfinite.rightFore.goal.x = NaN;
  refusal(
    "nonfinite actual goal",
    (): unknown => AutoMovieArchetypeQuadrupedRootRange.intersect(nonfinite, 0),
    "rightFore",
  );
  const overflow: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  overflow.leftHind.attachment.x = 1e308;
  overflow.leftHind.goal.x = -1e308;
  refusal(
    "finite coordinates with overflowing separation",
    (): unknown => AutoMovieArchetypeQuadrupedRootRange.intersect(overflow, 0),
    "leftHind",
  );
  const offsetOverflow: Constraints = make(
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 3 },
    2,
    5,
  );
  offsetOverflow.rightHind.attachment.y = -1e308;
  offsetOverflow.rightHind.goal.y = 1e308;
  refusal(
    "finite coordinates with overflowing vertical interval",
    (): unknown =>
      AutoMovieArchetypeQuadrupedRootRange.intersect(offsetOverflow, 0),
    "rightHind",
  );
  const result: AutoMovieArchetypeQuadrupedRootRange.IRange =
    AutoMovieArchetypeQuadrupedRootRange.intersect(base, 0);
  result.minimum = 100;
  band("independent interval replay", base, 0, 0, 3);
  truth(
    "all observations preserve source constraint bytes",
    JSON.stringify(base) === before,
  );
  TestValidator.equals(
    "one exact whole-body root feasibility interval",
    findings,
    [],
  );

  /** Each input limb owns independent literal point/radius records. */
  function make(
    attachment: IAutoMovieVector3,
    goal: IAutoMovieVector3,
    minimum: number,
    maximum: number,
  ): Constraints {
    return {
      leftFore: {
        attachment: { ...attachment },
        goal: { ...goal },
        reach: { minimum, maximum },
      },
      rightFore: {
        attachment: { ...attachment },
        goal: { ...goal },
        reach: { minimum, maximum },
      },
      leftHind: {
        attachment: { ...attachment },
        goal: { ...goal },
        reach: { minimum, maximum },
      },
      rightHind: {
        attachment: { ...attachment },
        goal: { ...goal },
        reach: { minimum, maximum },
      },
    };
  }

  /** Compare the actual result with independently worked literal interval endpoints. */
  function band(
    label: string,
    input: Constraints,
    floor: number,
    minimum: number,
    maximum: number,
  ): void {
    const actual: AutoMovieArchetypeQuadrupedRootRange.IRange =
      AutoMovieArchetypeQuadrupedRootRange.intersect(input, floor);
    near(`${label} minimum`, actual.minimum, minimum);
    near(`${label} maximum`, actual.maximum, maximum);
  }

  /** Malformed individual geometry must identify its actual limb in the refusal. */
  function refusal(
    label: string,
    action: () => unknown,
    limb?: AutoMovieArchetypeQuadrupedBody.Limb,
  ): void {
    let error: unknown;
    try {
      action();
    } catch (caught) {
      error = caught;
    }
    truth(
      label,
      error instanceof RangeError &&
        (limb === undefined || error.message.includes(limb)),
    );
  }

  /** Keep finite numerical observation separate from geometric admission policy. */
  function near(
    label: string,
    actual: number,
    expected: number,
    tolerance: number = 1e-12,
  ): void {
    truth(
      `${label}: ${actual}, expected ${expected}`,
      nclose(actual, expected, tolerance),
    );
  }

  /** Aggregate the complete independent domain case batch. */
  function truth(label: string, condition: boolean): void {
    try {
      TestValidator.predicate(label, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
