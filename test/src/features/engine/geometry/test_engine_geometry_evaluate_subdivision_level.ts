import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieSubdivisionCage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Direct subdivision evaluation publishes only packed quad surfaces at the
 * given generating level.
 *
 * A level-zero quad is evaluated at its existing level and keeps its generating
 * buffers. A level-zero triangle or pentagon needs one refinement first. Both
 * polygonal cages remain supported by the public subdivision call.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names level-zero quad compatibility, polygon refusal and continued support after refinement.
 * @evidence contracts/development/testing.md#behavioral-verification Admits three polygon cages, passes their levels directly to the public evaluator, and reads the results from explicit and automatic refinement.
 * @evidence contracts/development/testing.md#independent-expectations Direct quad evaluation keeps four face corners and their original buffer. One refinement makes one quad per input corner, giving 12 and 20 packed indices for a triangle and a pentagon.
 */
export function test_engine_geometry_evaluate_subdivision_level(): void {
  const geometry = AutoMovieEngineGeometry;
  const quad = geometry.admitSubdivisionCage({
    positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    faces: [[0, 1, 2, 3]],
  });
  const direct = geometry.evaluateSubdivisionLevel(quad);
  TestValidator.equals(
    "level-zero quad keeps its one face",
    [direct.faces, direct.normalFaces.length, direct.limitPositions.length],
    [[0, 1, 2, 3], 4, 12],
  );
  TestValidator.predicate(
    "level-zero quad keeps generating storage",
    direct.faces === quad.topology.faceVertices &&
      direct.positions === quad.positions &&
      direct.normals.every(Number.isFinite),
  );

  const cages: IAutoMovieSubdivisionCage[] = [
    { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], faces: [[0, 1, 2]] },
    {
      positions: [0, 0, 0, 2, 0, 0, 3, 1, 0, 1, 2, 0, 0, 1, 0],
      faces: [[0, 1, 2, 3, 4]],
    },
  ];
  for (const cage of cages) {
    const source = geometry.admitSubdivisionCage(cage);
    TestValidator.predicate(
      "nonquad level cannot publish packed quad indices",
      throwsError(
        () => geometry.evaluateSubdivisionLevel(source),
        "requires a quad generating level",
      ),
    );
    const explicit = geometry.evaluateSubdivisionLevel(
      geometry.refineSubdivisionLevel(source),
    );
    const automatic = geometry.subdivideSurface({ cage, levels: 1 });
    const count: number = 4 * cage.faces[0]!.length;
    TestValidator.equals(
      "one refined quad per original corner",
      [
        explicit.faces.length,
        explicit.normalFaces.length,
        automatic.faces.length,
      ],
      [count, count, count],
    );
    TestValidator.equals("same packed faces", explicit.faces, automatic.faces);
  }
}
