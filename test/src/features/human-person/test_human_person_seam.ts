import {
  type IAutoMovieHumanPersonSeam,
  createHumanPersonSeam,
} from "@automovie/human";
import { evaluateHumanPersonCut } from "@automovie/human/human/seam/evaluateHumanPersonCut";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The seam of two analytic necks, every expectation hand-derived.
 *
 * The face is a tube of twelve vertices per ring, radius 0.05, rings at 0,
 * 0.02 and 0.04, capped on top, so its only open loop is the ring at height 0.
 * The body is a tube of eight per ring with rings from -0.055 to 0.025.
 * Its affine scalar cut crosses eight vertical and eight diagonal source edges
 * at height zero. The old ring at -0.005 remains interior and never becomes a
 * full-weight collar boundary. Expectations follow the planar cut by hand.
 *
 * Scenarios:
 * 1. The three positive rings are covered while sixteen shared crossings form
 *    the retained loop at zero; the lower original ring stays retained.
 * 2. The new loop has weight one. The original rings at -0.005, -0.015 and
 *    -0.025 take the Wendland weight of their shortest vertical distance.
 * 3. A body that already ends below the face loop covers nothing and keeps its
 *    own top ring as the loop. Without a given reach the reach is read from the
 *    body's skin weights: with the neck bone dominant on the two rings nearest
 *    the loop and the upper chest below, the running neck share stays above a
 *    half through the fourth ring (16 of 32 vertices) and falls to 16 of 33 at
 *    the first vertex of the fifth, 0.04 from the loop, which is the reach. With
 *    neither a given reach nor weights the seam refuses.
 * 4. The head reach is read from the same weights: the head has weight 0.4 on
 *    the two neck rings and none below, so 95 percent of its total lies within
 *    the second ring, 0.01 from the loop.
 * 5. Refusals: a face with two open loops; a body with two open loops; a
 *    nonpositive or non-finite reach; a body whose triangles face inward (its
 *    loop then runs the same way as the face loop, which no ribbon merges);
 *    and a body folded so that the covered band cuts it into three open loops.
 */
export const test_human_person_seam = (): void => {
  const face = humanPersonTube({
    rings: [0, 0.02, 0.04],
    segments: 12,
    radius: 0.05,
    close: "top",
  });
  const tall = Array.from({ length: 9 }, (_, k) => -0.055 + 0.01 * k);
  const body = humanPersonTube({
    rings: tall,
    segments: 8,
    radius: 0.05,
    close: "bottom",
  });
  const skin = (
    tube: { positions: number[]; indices: number[] },
    id: string,
  ) => ({ id, positions: tube.positions, indices: tube.indices });
  const seam = createHumanPersonSeam({
    face: { basis: "face/1", surface: skin(face, "face-skin") },
    body: { basis: "body/1", surface: skin(body, "body-skin") },
    reachMetres: 0.035,
    headReachMetres: 0.02,
  });
  TestValidator.equals(
    "the seam names the revisions and surfaces it was derived on",
    [seam.faceBasis, seam.bodyBasis, seam.faceSurface, seam.bodySurface],
    ["face/1", "body/1", "face-skin", "body-skin"],
  );
  TestValidator.equals(
    "the covered set is the three rings above the face loop",
    seam.covered,
    [...body.rings[6], ...body.rings[7], ...body.rings[8]].sort(
      (a, b) => a - b,
    ),
  );
  const cutPositions = evaluateHumanPersonCut(body.positions, seam.cut!);
  TestValidator.predicate(
    "the cut intersects the source edges at height zero instead of deleting the lower ring",
    seam.bodyLoop.length === 16 && seam.bodyLoop.every((vertex) =>
      vertex >= body.positions.length / 3 && nclose(cutPositions[vertex * 3 + 1], 0, 1e-12),
    ) && body.rings[5].every((vertex) => seam.cut!.indices.includes(vertex) && !seam.bodyLoop.includes(vertex)),
  );
  TestValidator.equals(
    "the face loop is the face tube's lower ring",
    [...seam.faceLoop].sort((a, b) => a - b),
    face.rings[0],
  );
  TestValidator.equals(
    "one ribbon triangle per loop edge",
    seam.ribbon.length / 3,
    12 + 16,
  );

  const weight = (metres: number): number => {
    const r = metres / 0.035;
    return (1 - r) ** 4 * (4 * r + 1);
  };
  const byVertex = new Map(
    seam.collar.band.map((entry) => [entry.vertex, entry]),
  );
  const expectations: [number, number][] = [
    [5, weight(0.005)],
    [4, weight(0.015)],
    [3, weight(0.025)],
  ];
  for (const [ring, expected] of expectations)
    TestValidator.predicate(
      "ring " + ring + " carries the compact weight of its distance",
      body.rings[ring].every((vertex) => {
        const entry = byVertex.get(vertex);
        return entry !== undefined && nclose(entry.weight, expected, 1e-9);
      }),
    );
  TestValidator.predicate(
    "new cut vertices own weight one and the old lower ring is interior",
    seam.bodyLoop.every((vertex) => byVertex.get(vertex)?.weight === 1) &&
      body.rings[5].every((vertex) => byVertex.get(vertex)!.weight < 1) &&
      body.rings[1].every((vertex) => !byVertex.has(vertex)),
  );
  const point = (positions: number[], vertex: number): number[] => [
    positions[vertex * 3],
    positions[vertex * 3 + 1],
    positions[vertex * 3 + 2],
  ];
  TestValidator.predicate(
    "every loop vertex follows a face edge near it",
    seam.collar.follow.every(({ edge, fraction }, j) => {
      const a = point(face.positions, seam.faceLoop[edge]);
      const b = point(face.positions, seam.faceLoop[(edge + 1) % 12]);
      const p = point(cutPositions, seam.bodyLoop[j]);
      const foot = [0, 1, 2].map(
        (axis) => a[axis] * (1 - fraction) + b[axis] * fraction,
      );
      const distance = Math.hypot(
        ...[0, 1, 2].map((axis) => foot[axis] - p[axis]),
      );
      return edge >= 0 && edge < 12 && fraction >= 0 && fraction <= 1 && distance < 0.012;
    }),
  );

  const clear = humanPersonTube({
    rings: tall.slice(0, 6),
    segments: 8,
    radius: 0.05,
    close: "bottom",
  });
  const uncovered = createHumanPersonSeam({
    face: { basis: "f", surface: skin(face, "f") },
    body: { basis: "b", surface: skin(clear, "b") },
    reachMetres: 0.04,
    headReachMetres: 0.02,
  });
  TestValidator.equals(
    "a body already below the face covers nothing",
    [uncovered.covered, [...uncovered.bodyLoop].sort((a, b) => a - b)],
    [[], clear.rings[5]],
  );
  const count = clear.positions.length / 3;
  const neckRings = new Set([...clear.rings[5], ...clear.rings[4]]);
  const weighted = createHumanPersonSeam({
    face: { basis: "f", surface: skin(face, "f") },
    body: {
      basis: "b",
      surface: {
        ...skin(clear, "b"),
        skin: {
          joints: ["neck", "upperChest", "head"],
          boneIndices: Array.from({ length: count }, (_, v) =>
            neckRings.has(v) ? [0, 2, 0, 0] : [1, 0, 0, 0],
          ).flat(),
          weights: Array.from({ length: count }, (_, v) =>
            neckRings.has(v) ? [0.6, 0.4, 0, 0] : [1, 0, 0, 0],
          ).flat(),
        },
      },
    },
  });
  TestValidator.predicate(
    "the reach is where the neck stops being the skin's majority",
    nclose(weighted.collar.reachMetres, 0.04, 1e-9),
  );
  TestValidator.predicate(
    "the head reach is where the head's weight has gone",
    nclose(weighted.collar.headReachMetres, 0.01, 1e-9),
  );
  TestValidator.predicate(
    "no reach and no weights refuses",
    throwsError(
      () =>
        createHumanPersonSeam({
          face: { basis: "f", surface: skin(face, "f") },
          body: { basis: "b", surface: skin(clear, "b") },
        }),
      "given or read",
    ),
  );

  const twoLoopFace = humanPersonTube({
    rings: [0, 0.02],
    segments: 12,
    radius: 0.05,
    close: "none",
  });
  const twoLoopBody = humanPersonTube({
    rings: tall,
    segments: 8,
    radius: 0.05,
    close: "none",
  });
  const make = (
    faceTube: { positions: number[]; indices: number[] },
    bodyTube: { positions: number[]; indices: number[] },
    reachMetres?: number,
  ): IAutoMovieHumanPersonSeam =>
    createHumanPersonSeam({
      face: { basis: "f", surface: skin(faceTube, "f") },
      body: { basis: "b", surface: skin(bodyTube, "b") },
      reachMetres,
      headReachMetres: 0.02,
    });
  TestValidator.predicate(
    "a face with two open loops refuses",
    throwsError(() => make(twoLoopFace, body), "the face has 2"),
  );
  TestValidator.predicate(
    "a body with two open loops refuses",
    throwsError(() => make(face, twoLoopBody), "the body 2"),
  );
  for (const reach of [0, -1, Number.NaN, Infinity])
    TestValidator.predicate(
      "reach " + reach + " refuses",
      throwsError(() => make(face, body, reach), "positive finite reach"),
    );
  TestValidator.predicate(
    "a body facing inward has no ribbon that runs along the face loop",
    throwsError(
      () =>
        make(
          face,
          humanPersonTube({
            rings: tall,
            segments: 8,
            radius: 0.05,
            close: "bottom",
            inward: true,
          }),
        ),
      "in order",
    ),
  );
  TestValidator.predicate(
    "a covered band that cuts the body apart refuses",
    throwsError(
      () =>
        make(
          face,
          humanPersonTube({
            rings: [-0.05, -0.03, -0.01, 0.02, 0.03, -0.02, -0.04],
            segments: 8,
            radius: 0.05,
            close: "bottom",
          }),
        ),
      "leaves 3 open loops",
    ),
  );
};
