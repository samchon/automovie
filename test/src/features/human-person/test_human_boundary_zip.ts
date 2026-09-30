import {
  findHumanBoundaryLoops,
  zipHumanBoundaryLoops,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { throwsError } from "../internal/predicates";

/**
 * A zipped ribbon joins two oriented surfaces into one oriented manifold.
 *
 * The face is a capped tube of twelve vertices per ring whose lower ring is
 * its open loop, the body a capped tube of eight per ring whose upper ring is
 * its open loop, so the loops differ in size and turn opposite ways. Each
 * expected count is the loop edge count, hand-derived.
 *
 * Scenarios:
 * 1. The ribbon has one triangle per loop edge, 12 + 8 = 20, and every
 *    triangle uses three distinct vertices.
 * 2. Joining the face, the body and the ribbon (with the loops' own vertices)
 *    leaves no open edge, and no edge held in the same direction twice, which
 *    is what `findHumanBoundaryLoops` refuses: the ribbon runs opposite to
 *    each surface edge it meets.
 * 3. Every loop vertex of both loops is used by the ribbon.
 * 4. A loop of one vertex refuses.
 */
export const test_human_boundary_zip = (): void => {
  const face = humanPersonTube({
    rings: [0, 0.02],
    segments: 12,
    radius: 0.05,
    close: "top",
  });
  const body = humanPersonTube({
    rings: [-0.05, -0.005],
    segments: 8,
    radius: 0.05,
    close: "bottom",
  });
  const faceLoop = findHumanBoundaryLoops(face.indices)[0];
  const bodyLoop = findHumanBoundaryLoops(body.indices)[0];
  const at = (positions: number[], vertex: number) => ({
    x: positions[vertex * 3],
    y: positions[vertex * 3 + 1],
    z: positions[vertex * 3 + 2],
  });
  const ribbon = zipHumanBoundaryLoops(
    faceLoop.map((vertex) => at(face.positions, vertex)),
    bodyLoop.map((vertex) => at(body.positions, vertex)),
  );
  TestValidator.equals(
    "one triangle per loop edge",
    ribbon.length / 3,
    faceLoop.length + bodyLoop.length,
  );
  TestValidator.predicate(
    "no triangle repeats a vertex",
    Array.from({ length: ribbon.length / 3 }, (_, t) =>
      new Set(ribbon.slice(t * 3, t * 3 + 3)).size,
    ).every((size) => size === 3),
  );
  TestValidator.equals(
    "every loop vertex is used",
    [...new Set(ribbon)].sort((a, b) => a - b),
    Array.from({ length: faceLoop.length + bodyLoop.length }, (_, k) => k),
  );

  const faceCount = face.positions.length / 3;
  const joined = [
    ...face.indices,
    ...body.indices.map((vertex) => vertex + faceCount),
    ...ribbon.map((local) =>
      local < faceLoop.length
        ? faceLoop[local]
        : bodyLoop[local - faceLoop.length] + faceCount,
    ),
  ];
  TestValidator.equals(
    "the joined surfaces are one closed oriented manifold",
    findHumanBoundaryLoops(joined),
    [],
  );

  TestValidator.predicate(
    "a loop of one vertex refuses",
    throwsError(
      () =>
        zipHumanBoundaryLoops(
          [{ x: 0, y: 0, z: 0 }],
          [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
          ],
        ),
      "at least two vertices",
    ),
  );
};
