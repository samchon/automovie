import { humanBodySimpleShapeDirection } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * A solve refines its linear estimate on real readings inside the bracketing
 * segment, so a kink between two samples does not leave it off the target.
 *
 * Every response below is hand math over a scalar `t`, read through a counter.
 *
 * Scenarios:
 * 1. A kinked response, reading `t` below zero and `6 t` above (as a morph
 *    whose negative side is another target), sampled at -1 and 1 with the
 *    target 3: the chord across the kink lands at 1/7, reading 6/7, and the
 *    refinement lands on 0.5, reading 3, within a millionth of the span.
 * 2. The negative twin: a straight response meets its target in the first
 *    reading and keeps the linear estimate, so refinement costs nothing where
 *    the chord was already exact.
 * 3. A convex response (`t^3` on 0..2, target 1) keeps its low end on the
 *    same side reading after reading, and a concave one (`8 - (2 - t)^3`) its
 *    high end; both still converge to the target within the tolerance in the
 *    eight readings allowed, which pins the Illinois halving of each side.
 * 4. A flat segment has no span to refine and returns the estimate with no
 *    reading; the segment is the first one that brackets the target, so a
 *    target on a shared sample belongs to the lower one.
 */
export const test_human_body_simple_refinement = (): void => {
  const refine = humanBodySimpleShapeDirection.refine;
  const counted = (response: (t: number) => number) => {
    const reads: number[] = [];
    return {
      reads,
      read: (t: number): number => {
        reads.push(t);
        return response(t);
      },
    };
  };
  const kink = counted((t) => (t < 0 ? t : 6 * t));
  const kinked = refine(
    [
      [-3, -3],
      [-1, -1],
      [1, 6],
      [3, 18],
    ],
    3,
    -1 + 8 / 7,
    kink.read,
  );
  TestValidator.predicate(
    "the refined scalar reads the target across a kink",
    Math.abs(6 * kinked - 3) <= 1e-6 * 7 && Math.abs(kinked - 0.5) < 1e-5,
  );
  TestValidator.predicate(
    "the chord alone missed it",
    Math.abs(6 * (-1 + 8 / 7) - 3) > 1,
  );
  const straight = counted((t) => 2 * t);
  TestValidator.equals(
    "a straight response keeps the linear estimate",
    refine(
      [
        [0, 0],
        [1, 2],
        [2, 4],
      ],
      3,
      1.5,
      straight.read,
    ),
    1.5,
  );
  TestValidator.equals("and reads once", straight.reads.length, 1);
  for (const [name, response, samples, target] of [
    [
      "convex",
      (t: number) => t ** 3,
      [
        [0, 0],
        [2, 8],
      ] as [number, number][],
      1,
    ],
    [
      "concave",
      (t: number) => 8 - (2 - t) ** 3,
      [
        [0, 0],
        [2, 8],
      ] as [number, number][],
      7,
    ],
  ] as const) {
    const c = counted(response);
    const first = samples[0][0] + ((target - samples[0][1]) * 2) / 8;
    const t = refine([...samples], target, first, c.read);
    TestValidator.predicate(
      name + " response converges within the readings allowed",
      Math.abs(response(t) - target) <= 1e-6 * 8 && c.reads.length <= 8,
    );
  }
  const flat = counted((t) => t);
  TestValidator.equals(
    "a flat segment returns the estimate unread",
    refine(
      [
        [0, 1],
        [1, 1],
      ],
      1,
      0.25,
      flat.read,
    ),
    0.25,
  );
  TestValidator.equals("with no reading", flat.reads.length, 0);
  const shared = counted((t) => 2 * t);
  refine(
    [
      [0, 0],
      [1, 2],
      [2, 4],
    ],
    2,
    1,
    shared.read,
  );
  TestValidator.equals(
    "a target on a shared sample reads once, in the lower segment",
    shared.reads,
    [1],
  );
};
