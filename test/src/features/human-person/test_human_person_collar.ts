import {
  type IAutoMovieHumanPersonSeam,
  conformHumanPersonCollar,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Placing the body collar on the face neck, by hand on a seam small enough to
 * solve on paper.
 *
 * The evaluated face has loop vertices 0 (0,0,0), 1 (1.1,0.2,0) and 2
 * (2.3,0,0.4). The body has five vertices: a loop of vertices 0 (0.05,0,0)
 * and 1 (1,0,0) and the skin vertices 2 (2,0,0), 3 (3,0,0) and 4 (4,0,0).
 * Loop vertex 0 follows face edge 0 (vertex 0 to 1) half way, so its target
 * is (0.55,0.1,0) and its mismatch (0.5,0.1,0). Loop vertex 1 follows face
 * edge 2 (vertex 2 to 0) a quarter of the way, so its target is 0.75 *
 * (2.3,0,0.4) = (1.725,0,0.3) and its mismatch (0.725,0,0.3).
 *
 * Scenarios:
 * 1. Loop vertices as band entries of weight one land exactly on their targets.
 * 2. Vertex 2 lies a quarter of the way from loop vertex 0 to 1 at weight one
 *    half, so it moves by 0.5 * (0.75 * (0.5,0.1,0) + 0.25 * (0.725,0,0.3)) =
 *    (0.278125, 0.0375, 0.0375).
 * 3. Vertex 3, at loop vertex 1 with weight one, takes that mismatch whole;
 *    vertex 4 is not in the band and stays.
 * 4. When the body loop already lies on the face loop the mismatch is zero and
 *    the body comes back unchanged; the inputs are never modified.
 */
export const test_human_person_collar = (): void => {
  const seam: IAutoMovieHumanPersonSeam = {
    axis: { x: 0, z: 0 },
    faceBasis: "f",
    bodyBasis: "b",
    faceSurface: "f",
    bodySurface: "b",
    faceLoop: [0, 1, 2],
    bodyLoop: [0, 1],
    covered: [],
    ribbon: [],
    collar: {
      reachMetres: 0.04,
      follow: [
        { edge: 0, fraction: 0.5 },
        { edge: 2, fraction: 0.25 },
      ],
      band: [
        { vertex: 0, low: 0, high: 0, along: 0, weight: 1 },
        { vertex: 1, low: 1, high: 1, along: 0, weight: 1 },
        { vertex: 2, low: 0, high: 1, along: 0.25, weight: 0.5 },
        { vertex: 3, low: 1, high: 1, along: 0, weight: 1 },
      ],
    },
  };
  const face = [0, 0, 0, 1.1, 0.2, 0, 2.3, 0, 0.4];
  const body = [0.05, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0];
  const before = [face.slice(), body.slice()];
  const moved = conformHumanPersonCollar({ seam, face, body });
  const at = (vertex: number): number[] =>
    moved.slice(vertex * 3, vertex * 3 + 3);
  const close = (actual: number[], expected: number[]): boolean =>
    actual.every((value, axis) => nclose(value, expected[axis], 1e-12));

  TestValidator.predicate(
    "loop vertex 0 lands on its target",
    close(at(0), [0.55, 0.1, 0]),
  );
  TestValidator.predicate(
    "loop vertex 1 lands on its target",
    close(at(1), [1.725, 0, 0.3]),
  );
  TestValidator.predicate(
    "a skin vertex between the loop vertices takes the weighted blend",
    close(at(2), [2.278125, 0.0375, 0.0375]),
  );
  TestValidator.predicate(
    "a skin vertex at loop vertex 1 with weight one takes its mismatch whole",
    close(at(3), [3.725, 0, 0.3]),
  );
  TestValidator.predicate(
    "a vertex outside the band stays",
    close(at(4), [4, 0, 0]),
  );
  TestValidator.equals("the inputs are not modified", [face, body], before);

  const agreed = conformHumanPersonCollar({
    seam,
    face,
    body: [0.55, 0.1, 0, 1.725, 0, 0.3, 2, 0, 0, 3, 0, 0, 4, 0, 0],
  });
  TestValidator.predicate(
    "a body loop already on the face loop is unchanged",
    close(agreed.slice(0, 3), [0.55, 0.1, 0]) &&
      close(agreed.slice(3, 6), [1.725, 0, 0.3]) &&
      close(agreed.slice(6, 9), [2, 0, 0]),
  );
};
