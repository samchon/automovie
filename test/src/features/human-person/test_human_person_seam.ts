import {
  type IAutoMovieHumanPersonSeam,
  createHumanPersonSeam,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The seam of two analytic necks, every expectation hand-derived.
 *
 * The face is a tube of twelve vertices per ring, radius 0.05, rings at 0,
 * 0.02 and 0.04, capped on top, so its only open loop is the ring at height 0.
 * The body is a tube of eight per ring, capped at the bottom, with rings every
 * 0.01 from -0.055 up to 0.025, so it overlaps the face by the rings above
 * height 0 (0.005, 0.015 and 0.025, 24 vertices) and its retained top ring is
 * at -0.005, 0.005 below the face loop. The reach is 0.035, so the rings 0.01,
 * 0.02 and 0.03 below the retained loop are inside it and the ring 0.04 below
 * is not.
 *
 * Scenarios:
 * 1. The covered set is exactly the three upper body rings, the retained loop
 *    is exactly the ring at -0.005, the ribbon has 12 + 8 triangles and the
 *    loops are the tubes' own.
 * 2. The band is the retained ring (weight one) and the three rings below it
 *    at the Wendland weight (1 - r)^4 (4 r + 1) of r = 0.01 / 0.035, 0.02 /
 *    0.035 and 0.03 / 0.035; the fourth ring and the covered rings are absent.
 *    Band vertices at a loop vertex azimuth take that vertex with fraction
 *    zero, and every body loop vertex follows a face edge whose foot is within
 *    the height gap and the chord of the face polygon.
 * 3. A body that already ends below the face loop covers nothing and keeps its
 *    own top ring as the loop. Without a given reach the reach is read from the
 *    body's skin weights: with the neck bone dominant on the two rings nearest
 *    the loop and the upper chest below, the running neck share stays above a
 *    half through the fourth ring (16 of 32 vertices) and falls to 16 of 33 at
 *    the first vertex of the fifth, 0.04 from the loop, which is the reach. With
 *    neither a given reach nor weights the seam refuses.
 * 4. Refusals: a face with two open loops; a body with two open loops; a
 *    nonpositive or non-finite reach; a body whose triangles face inward (the
 *    ribbon then folds against the neck); and a body folded so that the covered
 *    band cuts it into three open loops.
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
  TestValidator.equals(
    "the retained loop is the ring below the face loop",
    [...seam.bodyLoop].sort((a, b) => a - b),
    body.rings[5],
  );
  TestValidator.equals(
    "the face loop is the face tube's lower ring",
    [...seam.faceLoop].sort((a, b) => a - b),
    face.rings[0],
  );
  TestValidator.equals(
    "one ribbon triangle per loop edge",
    seam.ribbon.length / 3,
    12 + 8,
  );

  const weight = (metres: number): number => {
    const r = metres / 0.035;
    return (1 - r) ** 4 * (4 * r + 1);
  };
  const byVertex = new Map(
    seam.collar.band.map((entry) => [entry.vertex, entry]),
  );
  const expectations: [number, number][] = [
    [5, 1],
    [4, weight(0.01)],
    [3, weight(0.02)],
    [2, weight(0.03)],
  ];
  for (const [ring, expected] of expectations)
    TestValidator.predicate(
      "ring " + ring + " carries the compact weight of its distance",
      body.rings[ring].every((vertex) => {
        const entry = byVertex.get(vertex);
        return entry !== undefined && nclose(entry.weight, expected, 1e-9);
      }),
    );
  TestValidator.equals(
    "the band is those four rings alone",
    seam.collar.band.length,
    4 * 8,
  );
  TestValidator.predicate(
    "a band vertex at a loop vertex azimuth brackets that vertex",
    body.rings[4].every((vertex, k) => {
      const entry = byVertex.get(vertex)!;
      return seam.bodyLoop[entry.low] === body.rings[5][k] && entry.along === 0;
    }),
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
      const p = point(body.positions, seam.bodyLoop[j]);
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
          joints: ["neck", "upperChest"],
          boneIndices: Array.from({ length: count }, (_, v) =>
            neckRings.has(v) ? [0, 0, 0, 0] : [1, 0, 0, 0],
          ).flat(),
          weights: Array.from({ length: count }, () => [1, 0, 0, 0]).flat(),
        },
      },
    },
  });
  TestValidator.predicate(
    "the reach is where the neck stops being the skin's majority",
    nclose(weighted.collar.reachMetres, 0.04, 1e-9),
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
    "a body facing inward folds the ribbon",
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
      "folds against the neck",
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
