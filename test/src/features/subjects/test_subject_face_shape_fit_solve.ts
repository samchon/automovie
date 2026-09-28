import { TestValidator } from "@nestia/e2e";

import {
  faceShapeFitProject,
  faceShapeFitView,
} from "../../../scripts/face-review/faceShapeFitCamera";
import {
  type IFaceShapeFitProblem,
  boundedQuadratic,
  solveFaceShapeFit,
} from "../../../scripts/face-review/faceShapeFitSolve";
import { nclose, throwsError } from "../internal/predicates";

type Point = [number, number, number];

/**
 * The bounded, regularized photograph fit on a known linear problem.
 * Scenarios:
 * 1. Twelve points on the target plane and a channel that stretches them
 *    horizontally by 2 cm per unit (not a similarity): a photograph made at
 *    magnitude 0.6 is recovered to 0.6 with a negligible prior, and the data
 *    cost falls to nearly zero; a negative-side variable recovers the
 *    opposite stretch.
 * 2. A maximum of 0.4 stops the fit at the bound; a strong prior keeps the
 *    fit near the current value, whether from lambda or from a variable's
 *    own prior multiplier on a moderate lambda.
 * 3. Left and right channels stretching their own halves vertically, with
 *    only the left half stretched in the photograph (a twist no similarity
 *    imitates): without the symmetry prior the fit is (0.6, 0); with a
 *    strong one both approach 0.3.
 * 4. A thirteenth point the photograph shows only as an incisal edge, moved
 *    down 2 cm per unit by a channel no landmark sees: a bound at the
 *    photograph of magnitude 0.5 recovers 0.5; an at-or-below bound there
 *    lifts a start of 0 to 0.5, an at-or-above one pulls a start of 0.8 up
 *    to 0.5, and each is inactive, leaving its start, from the side it
 *    allows (the width starting fitted, so no early similarity moves the
 *    edge); the bound's violation counts in the data cost.
 * 5. Fewer than three usable landmarks refuse.
 * 6. The bounded quadratic returns the interior, a clipped and a two-bound
 *    optimum (the last needs a bound released and another taken), and a
 *    singular system refuses.
 */
export const test_subject_face_shape_fit_solve = (): void => {
  const view = faceShapeFitView({
    yaw: 0,
    pitch: 0,
    distance: 0.62,
    target: [0, 0, 0.06],
  });
  const base: Point[] = Array.from({ length: 12 }, (_, k) => [
    0.04 * Math.cos((k * Math.PI) / 6),
    0.05 * Math.sin((k * Math.PI) / 6),
    0.06,
  ]);
  const stretch = base.map((p): Point => [0.02 * Math.sign(p[0]), 0, 0]);
  const photograph = (magnitude: number, move = stretch) =>
    base.map((p, k) =>
      faceShapeFitProject(
        view,
        [0, 1, 2].map((a) => p[a]! + magnitude * move[k]![a]!),
      ),
    );
  const problem = (
    props: Partial<IFaceShapeFitProblem>,
  ): IFaceShapeFitProblem => ({
    base,
    target: photograph(0.6),
    weight: base.map(() => 1),
    view,
    variables: [
      {
        channel: "width",
        side: "positive",
        current: 0,
        maximum: 1,
        displacement: stretch,
      },
    ],
    pairs: [],
    lambda: 1e-9,
    mu: 0,
    interocular: 100,
    iterations: 6,
    ...props,
  });
  const free = solveFaceShapeFit(problem({}));
  TestValidator.predicate(
    "recovered magnitude",
    nclose(free.magnitudes[0]!, 0.6, 1e-3),
  );
  TestValidator.predicate(
    "cost falls",
    free.costAfter < 1e-6 && free.costBefore > 0.1,
  );
  const opposite = stretch.map((p): Point => [-p[0], 0, 0]);
  const negative = solveFaceShapeFit(
    problem({
      target: photograph(0.5, opposite),
      variables: [
        {
          channel: "width",
          side: "negative",
          current: 0,
          maximum: 1,
          displacement: opposite,
        },
      ],
    }),
  );
  TestValidator.predicate(
    "negative side",
    nclose(negative.magnitudes[0]!, 0.5, 1e-3),
  );
  const bounded = solveFaceShapeFit(
    problem({
      variables: [
        {
          channel: "width",
          side: "positive",
          current: 0,
          maximum: 0.4,
          displacement: stretch,
        },
      ],
    }),
  );
  TestValidator.predicate("bound", nclose(bounded.magnitudes[0]!, 0.4, 1e-9));
  const held = solveFaceShapeFit(problem({ lambda: 1e3 }));
  const heldBySpread = solveFaceShapeFit(
    problem({
      lambda: 1,
      variables: [
        {
          channel: "width",
          side: "positive",
          current: 0,
          maximum: 1,
          displacement: stretch,
          prior: 1e3,
        },
      ],
    }),
  );
  TestValidator.predicate(
    "a per-variable prior multiplies lambda",
    heldBySpread.magnitudes[0]! < 0.01 &&
      solveFaceShapeFit(problem({ lambda: 1 })).magnitudes[0]! > 0.1,
  );
  TestValidator.predicate("strong prior holds", held.magnitudes[0]! < 0.01);

  // Vertical stretch of each half: a one-sided one is a twist no similarity
  // or symmetric stretch can imitate, so the answer is unique.
  const vertical = base.map((p): Point => [0, 0.02 * Math.sign(p[1]), 0]);
  const left = vertical.map(
    (p, k): Point => (base[k]![0] > 1e-9 ? p : [0, 0, 0]),
  );
  const right = vertical.map(
    (p, k): Point => (base[k]![0] < -1e-9 ? p : [0, 0, 0]),
  );
  const pair = (mu: number) =>
    solveFaceShapeFit(
      problem({
        target: photograph(0.6, left),
        variables: [
          {
            channel: "leftWidth",
            side: "positive",
            current: 0,
            maximum: 1,
            displacement: left,
          },
          {
            channel: "rightWidth",
            side: "positive",
            current: 0,
            maximum: 1,
            displacement: right,
          },
        ],
        pairs: [["leftWidth", "rightWidth"]],
        mu,
      }),
    ).magnitudes;
  const asymmetric = pair(0);
  TestValidator.predicate(
    "free asymmetry",
    nclose(asymmetric[0]!, 0.6, 1e-3) && nclose(asymmetric[1]!, 0, 1e-3),
  );
  const symmetric = pair(1e3);
  TestValidator.predicate(
    "symmetry prior",
    nclose(symmetric[0]!, symmetric[1]!, 1e-3) &&
      Math.abs(symmetric[0]! - 0.3) < 0.05,
  );
  const jaw = [...stretch.map((): Point => [0, 0, 0]), [0, -0.02, 0] as Point];
  const edgeAt = (magnitude: number) =>
    faceShapeFitProject(view, [0, -0.03 - 0.02 * magnitude, 0.06]);
  const withEdge = (
    relation: "at" | "atOrBeyond" | "atOrBefore",
    current: number,
    width = 0.6,
  ) =>
    solveFaceShapeFit(
      problem({
        // The linearization point is the build at the current weights.
        base: [
          ...base.map(
            (p, k): Point => [p[0] + width * stretch[k]![0], p[1], p[2]],
          ),
          [0, -0.03 - 0.02 * current, 0.06],
        ],
        target: [...photograph(0.6), null],
        weight: [...base.map(() => 1), 0],
        variables: [
          {
            channel: "width",
            side: "positive",
            current: width,
            maximum: 1,
            displacement: [...stretch, [0, 0, 0]],
          },
          {
            channel: "jawOpen",
            side: "positive",
            current,
            maximum: 1,
            displacement: jaw,
          },
        ],
        bounds: [
          {
            point: 12,
            target: edgeAt(0.5),
            direction: [0, 1],
            relation,
            weight: 1,
          },
        ],
      }),
    );
  const exact = withEdge("at", 0, 0);
  TestValidator.predicate(
    "edge observed",
    nclose(exact.magnitudes[1]!, 0.5, 1e-3) &&
      nclose(exact.magnitudes[0]!, 0.6, 1e-3) &&
      exact.costBefore > exact.costAfter,
  );
  TestValidator.predicate(
    "at or below lifts",
    nclose(withEdge("atOrBeyond", 0).magnitudes[1]!, 0.5, 1e-3),
  );
  TestValidator.predicate(
    "at or below allows",
    nclose(withEdge("atOrBeyond", 0.8).magnitudes[1]!, 0.8, 1e-6),
  );
  TestValidator.predicate(
    "at or above pulls",
    nclose(withEdge("atOrBefore", 0.8).magnitudes[1]!, 0.5, 1e-3),
  );
  TestValidator.predicate(
    "at or above allows",
    nclose(withEdge("atOrBefore", 0).magnitudes[1]!, 0, 1e-6),
  );
  TestValidator.predicate(
    "too few landmarks",
    throwsError(
      () =>
        solveFaceShapeFit(
          problem({ target: base.map((_, k) => (k < 2 ? [450, 450] : null)) }),
        ),
      "three landmarks",
    ),
  );

  TestValidator.equals(
    "interior",
    boundedQuadratic([[2]], [-4], [-5], [5]),
    [2],
  );
  TestValidator.equals("clipped", boundedQuadratic([[2]], [-4], [0], [1]), [1]);
  const corner = boundedQuadratic(
    [
      [1, 0.9],
      [0.9, 1],
    ],
    [-1, 0.5],
    [-1, -1],
    [1, 1],
  );
  TestValidator.predicate(
    "two bounds",
    nclose(corner[0]!, 1) && nclose(corner[1]!, -1),
  );
  TestValidator.predicate(
    "singular",
    throwsError(() => boundedQuadratic([[0]], [1], [-1], [1]), "singular"),
  );
};
