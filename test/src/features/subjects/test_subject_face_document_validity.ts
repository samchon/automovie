import { TestValidator } from "@nestia/e2e";

import {
  faceExpressionYield,
  faceFaultClusters,
  faceValidScale,
} from "../../../scripts/face-review/faceDocumentValidity";
import { throwsError } from "../internal/predicates";

/**
 * The largest share of the priors' departure at which a document's skin has
 * no fault.
 * Scenarios:
 * 1. A document whole at full priors keeps them (one evaluation).
 * 2. One faulting past 0.3 of them is scaled to the largest bisection step
 *    below 0.3 (0.296875 after six halvings), faultless.
 * 3. One whose measured controls alone make faults keeps every prior that
 *    adds none (all of them when the count stays, 0.25 of them when more
 *    than a quarter adds) and reports the measured controls' faults.
 * 4. Fewer than one step refuses.
 * 5. An expression whose unit a faults past 0.3 of its weight yields a to
 *    the largest step under it (0.296875 after six halvings) and keeps the
 *    units the fault does not touch; one without a fault stands as given;
 *    two folds apart yield their own units by their own shares (a to 0.5,
 *    b to 0.25), not one share for both.
 * 6. A fold two units make together costs only the one moving it most (a,
 *    to half), or the one a norm set (b, to half) before a photographed one.
 * 7. A fold that moves onto unit b's skin once a has yielded brings b in on
 *    the next round (both at half, the skin whole); a unit a fold needs at
 *    nothing is dropped; a fold no unit moves is left and reported.
 * 8. A unit and its partner yield as one (both corners to half) where alone
 *    the corner moving the fold most would go to rest and leave the other.
 * 9. Fewer than one round refuses, and the faulting triangles gather into
 *    clusters through shared vertices, in the order of their lowest
 *    triangle.
 */
export const test_subject_face_document_validity = (): void => {
  const seen: number[] = [];
  const whole = faceValidScale({
    faults: (scale) => {
      seen.push(scale);
      return 0;
    },
    steps: 6,
  });
  const threshold = faceValidScale({
    faults: (scale) => (scale > 0.3 ? 12 : 0),
    steps: 6,
  });
  const measured = faceValidScale({ faults: () => 4, steps: 6 });
  const adding = faceValidScale({
    faults: (scale) => (scale > 0.25 ? 9 : 4),
    steps: 2,
  });
  TestValidator.predicate(
    "scales",
    whole.scale === 1 &&
      whole.faults === 0 &&
      seen.join() === "1" &&
      threshold.scale === 0.296875 &&
      threshold.faults === 0 &&
      measured.scale === 1 &&
      measured.faults === 4 &&
      adding.scale === 0.25 &&
      adding.faults === 4,
  );
  TestValidator.predicate(
    "refusal",
    throwsError(
      () => faceValidScale({ faults: () => 0, steps: 0 }),
      "one step or more",
    ),
  );
  // Unit a moves vertex 1 by twice its weight, b vertex 1 by its weight
  // and vertex 2 by it, c vertex 3.
  const reach: Record<string, Record<number, number>> = {
    a: { 1: 2 },
    b: { 1: 1, 2: 1 },
    c: { 3: 1 },
  };
  const contribution = (
    unit: string,
    e: Record<string, number>,
    fold: ReadonlySet<number>,
  ) =>
    [...fold].reduce(
      (sum, v) => sum + (reach[unit]?.[v] ?? 0) * Math.abs(e[unit] ?? 0),
      0,
    );
  const single = faceExpressionYield({
    expression: { a: 1, c: 0.4 },
    faults: (e) => ((e.a ?? 0) > 0.3 ? 5 : 0),
    clusters: (e) => ((e.a ?? 0) > 0.3 ? [new Set([1])] : []),
    contribution,
    steps: 6,
    rounds: 3,
  });
  const still = faceExpressionYield({
    expression: { a: 1 },
    faults: () => 0,
    clusters: () => [],
    contribution,
    steps: 6,
    rounds: 3,
  });
  const apart = faceExpressionYield({
    expression: { a: 1, b: 1, c: 1 },
    faults: (e) => ((e.a ?? 0) > 0.5 ? 3 : 0) + ((e.b ?? 0) > 0.25 ? 2 : 0),
    clusters: (e) => [
      ...((e.a ?? 0) > 0.5 ? [new Set([1])] : []),
      ...((e.b ?? 0) > 0.25 ? [new Set([2])] : []),
    ],
    contribution: (unit, e, fold) =>
      unit === "b" && fold.has(1) ? 0 : contribution(unit, e, fold),
    steps: 6,
    rounds: 3,
  });
  TestValidator.predicate(
    "expression yield",
    JSON.stringify(single) ===
      JSON.stringify({
        expression: { a: 0.296875, c: 0.4 },
        shares: { a: 0.296875 },
        faults: 0,
      }) &&
      JSON.stringify(still) ===
        JSON.stringify({ expression: { a: 1 }, shares: {}, faults: 0 }) &&
      JSON.stringify(apart) ===
        JSON.stringify({
          expression: { a: 0.5, b: 0.25, c: 1 },
          shares: { a: 0.5, b: 0.25 },
          faults: 0,
        }),
  );
  const joint = (priors?: ReadonlySet<string>) =>
    faceExpressionYield({
      expression: { a: 1, b: 1 },
      faults: (e) => ((e.a ?? 0) > 0.5 && (e.b ?? 0) > 0.5 ? 4 : 0),
      clusters: (e) =>
        (e.a ?? 0) > 0.5 && (e.b ?? 0) > 0.5 ? [new Set([1])] : [],
      contribution,
      ...(priors === undefined ? {} : { priors }),
      steps: 6,
      rounds: 3,
    });
  TestValidator.predicate(
    "the unit moving a fold most yields first, a norm's before a reading's",
    JSON.stringify(joint()) ===
      JSON.stringify({
        expression: { a: 0.5, b: 1 },
        shares: { a: 0.5 },
        faults: 0,
      }) &&
      JSON.stringify(joint(new Set(["b"]))) ===
        JSON.stringify({
          expression: { a: 1, b: 0.5 },
          shares: { b: 0.5 },
          faults: 0,
        }),
  );
  const moved = faceExpressionYield({
    expression: { a: 1, b: 1, c: 1 },
    faults: (e) =>
      ((e.a ?? 0) > 0.5 ? 3 : 0) +
      ((e.b ?? 0) > 0.5 && (e.a ?? 0) <= 0.5 ? 2 : 0),
    clusters: (e) =>
      (e.a ?? 0) > 0.5
        ? [new Set([1])]
        : (e.b ?? 0) > 0.5
          ? [new Set([2])]
          : [],
    contribution: (unit, e, fold) =>
      unit === "b" && fold.has(1) ? 0 : contribution(unit, e, fold),
    steps: 6,
    rounds: 3,
  });
  const dropped = faceExpressionYield({
    expression: { a: 1, c: 1 },
    faults: (e) => ((e.a ?? 0) > 0 ? 1 : 0),
    clusters: (e) => ((e.a ?? 0) > 0 ? [new Set([1])] : []),
    contribution,
    steps: 6,
    rounds: 3,
  });
  const idle = faceExpressionYield({
    expression: { c: 1 },
    faults: () => 1,
    clusters: () => [new Set([9])],
    contribution,
    steps: 6,
    rounds: 2,
  });
  TestValidator.predicate(
    "rounds",
    JSON.stringify(moved) ===
      JSON.stringify({
        expression: { a: 0.5, b: 0.5, c: 1 },
        shares: { a: 0.5, b: 0.5 },
        faults: 0,
      }) &&
      JSON.stringify(dropped) ===
        JSON.stringify({ expression: { c: 1 }, shares: { a: 0 }, faults: 0 }) &&
      JSON.stringify(idle) ===
        JSON.stringify({ expression: { c: 1 }, shares: {}, faults: 1 }) &&
      throwsError(
        () =>
          faceExpressionYield({
            expression: {},
            faults: () => 0,
            clusters: () => [],
            contribution,
            steps: 6,
            rounds: 0,
          }),
        "one round or more",
      ),
  );
  const pair = (partner?: (unit: string) => string | null) =>
    faceExpressionYield({
      expression: { smileLeft: 1, smileRight: 1 },
      faults: (e) => ((e.smileLeft ?? 0) + (e.smileRight ?? 0) > 1 ? 2 : 0),
      clusters: (e) =>
        (e.smileLeft ?? 0) + (e.smileRight ?? 0) > 1 ? [new Set([1])] : [],
      contribution: (unit, e) =>
        (unit === "smileRight" ? 2 : 1) * (e[unit] ?? 0),
      ...(partner === undefined ? {} : { partner }),
      steps: 6,
      rounds: 3,
    });
  TestValidator.predicate(
    "partners yield together",
    JSON.stringify(
      pair((unit) =>
        unit === "smileLeft"
          ? "smileRight"
          : unit === "smileRight"
            ? "smileLeft"
            : null,
      ).expression,
    ) === JSON.stringify({ smileLeft: 0.5, smileRight: 0.5 }) &&
      JSON.stringify(pair().expression) === JSON.stringify({ smileLeft: 1 }),
  );
  TestValidator.equals(
    "clusters",
    faceFaultClusters([0, 1, 2, 2, 3, 4, 5, 6, 7], [6, 3, 0]).map((one) =>
      [...one].sort((x, y) => x - y),
    ),
    [
      [0, 1, 2, 3, 4],
      [5, 6, 7],
    ],
  );
};
