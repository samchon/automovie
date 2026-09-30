import {
  findHumanBoundaryLoops,
  mergeHumanBoundaryLoops,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanPersonTube } from "../internal/humanPersonTubeFixture";
import { throwsError } from "../internal/predicates";

/**
 * A merged ribbon joins two oriented surfaces into one oriented manifold.
 *
 * The face is a capped tube of twelve vertices per ring whose lower ring is its
 * open loop (vertex k at angle 30 k degrees, so at position k along it), the
 * body a capped tube of eight per ring whose upper ring is its open loop (vertex
 * k at angle 45 k degrees, so at position 1.5 k). The body's loop runs the
 * other way about the axis, so its positions run down as its loop is walked.
 *
 * Scenarios:
 * 1. The ribbon has one triangle per loop edge, 12 + 8 = 20, every triangle
 *    uses three distinct vertices, and every loop vertex is used.
 * 2. Joining the face, the body and the ribbon (with the loops' own vertices)
 *    leaves no open edge and no edge held in the same direction twice, which
 *    is what `findHumanBoundaryLoops` refuses: the ribbon runs opposite to
 *    each surface edge it meets.
 * 3. Each triangle has all three corners within one face edge's span or across
 *    a single face vertex: the position of its second-loop corner lies within a
 *    unit of its first-loop corners, so the ribbon follows the loop.
 * 4. Positions out of order (a rise in the middle), out of range, or a loop of
 *    one vertex refuse.
 */
export const test_human_boundary_merge = (): void => {
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
  const parameters = bodyLoop.map((vertex) => 1.5 * body.rings[1].indexOf(vertex));
  const ribbon = mergeHumanBoundaryLoops(faceLoop.length, parameters);
  TestValidator.equals(
    "one triangle per loop edge",
    ribbon.length / 3,
    faceLoop.length + bodyLoop.length,
  );
  TestValidator.predicate(
    "no triangle repeats a vertex",
    Array.from(
      { length: ribbon.length / 3 },
      (_, t) => new Set(ribbon.slice(t * 3, t * 3 + 3)).size,
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

  const position = (local: number): number =>
    local < faceLoop.length ? local : parameters[local - faceLoop.length];
  TestValidator.predicate(
    "each triangle's corners lie within one unit along the loop",
    Array.from({ length: ribbon.length / 3 }, (_, t) => {
      const values = ribbon.slice(t * 3, t * 3 + 3).map(position);
      const spread = Math.max(...values) - Math.min(...values);
      // a wrap across the loop's end spans the whole length minus a unit
      return spread <= 1.5 || spread >= faceLoop.length - 1.5;
    }).every(Boolean),
  );

  TestValidator.predicate(
    "positions out of order refuse",
    throwsError(
      () => mergeHumanBoundaryLoops(12, [0, 9, 3, 7, 6, 2, 4, 1]),
      "in order",
    ),
  );
  TestValidator.predicate(
    "positions out of range refuse",
    throwsError(
      () => mergeHumanBoundaryLoops(12, [13, 9, 6, 3]),
      "in order",
    ),
  );
  TestValidator.predicate(
    "a loop of one vertex refuses",
    throwsError(() => mergeHumanBoundaryLoops(12, [1]), "at least two"),
  );
};
