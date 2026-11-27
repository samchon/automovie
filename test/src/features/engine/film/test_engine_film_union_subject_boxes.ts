import { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieSubjectBox } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `unionSubjectBoxes` is the per-axis extreme of the corners of a list of
 * boxes.
 *
 * Scenarios:
 *
 * 1. An empty list gives null, not an inverted or zero box.
 * 2. A single box (-1,0,2)-(1,3,4) gives its own corners as a new object.
 * 3. Boxes (-5,1,3)-(0,2,3) and (0,-2,2)-(0,9,7) added to it give
 *    (-5,-2,2)-(1,9,7); the first box is unchanged.
 * 4. 300000 unit boxes at x = 0, 1, 2, ... give (0,0,0)-(300000,1,1), past the
 *    argument limit of a spread `Math.min`.
 */
export function test_engine_film_union_subject_boxes(): void {
  TestValidator.equals("empty", AutoMovieEngineFilm.unionSubjectBoxes([]), null);
  const only: IAutoMovieSubjectBox = {
    min: { x: -1, y: 0, z: 2 },
    max: { x: 1, y: 3, z: 4 },
  };
  const single: IAutoMovieSubjectBox | null = AutoMovieEngineFilm.unionSubjectBoxes([only]);
  TestValidator.equals("single corners", single, only);
  TestValidator.predicate("single is new", single !== only);
  const mixed: IAutoMovieSubjectBox | null = AutoMovieEngineFilm.unionSubjectBoxes([
    only,
    { min: { x: -5, y: 1, z: 3 }, max: { x: 0, y: 2, z: 3 } },
    { min: { x: 0, y: -2, z: 2 }, max: { x: 0, y: 9, z: 7 } },
  ]);
  TestValidator.equals("mixed", mixed, {
    min: { x: -5, y: -2, z: 2 },
    max: { x: 1, y: 9, z: 7 },
  });
  TestValidator.equals("first unchanged", only.min, { x: -1, y: 0, z: 2 });
  const many: IAutoMovieSubjectBox[] = Array.from(
    { length: 300_000 },
    (_: unknown, index: number): IAutoMovieSubjectBox => ({
      min: { x: index, y: 0, z: 0 },
      max: { x: index + 1, y: 1, z: 1 },
    }),
  );
  TestValidator.equals("many", AutoMovieEngineFilm.unionSubjectBoxes(many), {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 300_000, y: 1, z: 1 },
  });
}
