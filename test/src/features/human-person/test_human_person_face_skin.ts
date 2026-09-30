import {
  type IAutoMovieHumanPersonSeam,
  createHumanPersonFaceSkin,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The face skin takes the body collar's weights at the cut and the head above
 * the blend, by hand.
 *
 * The neck axis is the origin. The face loop is four vertices 0..3 at
 * azimuths 0, 90, 180 and -90 degrees on the unit circle at height 0; the body
 * loop is the same four at height -0.005. The body's weights at its loop
 * vertices: 0 is neck 0.6 and upper chest 0.4; 1 is neck 0.2, head 0.3 and
 * upper chest 0.5; 2 is neck 0.4, upper chest 0.3, left shoulder 0.2 and right
 * shoulder 0.1; 3 is neck 0.6 and upper chest 0.4. The blend length is 0.015,
 * so a vertex 0.0075 above the loop is half way (t = 0.5), where the C2
 * smootherstep 10 t^3 - 15 t^4 + 6 t^5 is exactly 0.5.
 *
 * Scenarios:
 * 1. A vertex on the loop at azimuth 0 has t = 0 and the collar's weights
 *    there, neck 0.6 and upper chest 0.4, with the head at zero.
 * 2. Half way up at azimuth 0: head 0.5, neck 0.3, upper chest 0.2.
 * 3. Half way up at azimuth 90 degrees, where the body loop gives neck 0.2,
 *    head 0.3 and upper chest 0.5: head 0.5 + 0.5 * 0.3 = 0.65, neck 0.1, upper
 *    chest 0.25.
 * 4. A vertex 0.03 above the loop is the head alone.
 * 5. Half way up at azimuth 180 degrees, where five influences result (the head
 *    at 0.5 and the body's four at half): the smallest, the right shoulder,
 *    is dropped and the rest renormalize by 0.95, so no vertex carries more
 *    than four and every vector sums to one.
 * 6. A blend length of zero, negative or infinite refuses.
 */
export const test_human_person_face_skin = (): void => {
  const at = (degrees: number, y: number): number[] => [
    Math.sin((degrees * Math.PI) / 180),
    y,
    Math.cos((degrees * Math.PI) / 180),
  ];
  const seam = {
    axis: { x: 0, z: 0 },
    faceLoop: [0, 1, 2, 3],
    bodyLoop: [0, 1, 2, 3],
  } as IAutoMovieHumanPersonSeam;
  const face = [
    ...at(0, 0),
    ...at(90, 0),
    ...at(180, 0),
    ...at(-90, 0),
    ...at(0, 0.0075),
    ...at(0, 0.03),
    ...at(90, 0.0075),
    ...at(180, 0.0075),
  ];
  const body = [
    ...at(0, -0.005),
    ...at(90, -0.005),
    ...at(180, -0.005),
    ...at(-90, -0.005),
  ];
  const bodySkin = {
    joints: ["neck", "head", "upperChest", "leftShoulder", "rightShoulder"] as const,
    boneIndices: [
      0, 2, 0, 0, 0, 1, 2, 0, 0, 2, 3, 4, 0, 2, 0, 0,
    ],
    weights: [
      0.6, 0.4, 0, 0, 0.2, 0.3, 0.5, 0, 0.4, 0.3, 0.2, 0.1, 0.6, 0.4, 0, 0,
    ],
  };
  const skin = createHumanPersonFaceSkin({
    seam,
    face,
    body,
    bodySkin,
    headBlendMetres: 0.015,
  });
  const weightsOf = (vertex: number): Record<string, number> => {
    const found: Record<string, number> = {};
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[vertex * 4 + k];
      if (weight !== 0)
        found[skin.joints[skin.boneIndices[vertex * 4 + k]]] = weight;
    }
    return found;
  };
  const close = (
    vertex: number,
    expected: Record<string, number>,
  ): boolean => {
    const found = weightsOf(vertex);
    return (
      Object.keys(found).length === Object.keys(expected).length &&
      Object.entries(expected).every(
        ([bone, weight]) => found[bone] !== undefined && nclose(found[bone], weight, 1e-9),
      )
    );
  };
  TestValidator.predicate(
    "at the cut a vertex takes the collar's weights",
    close(0, { neck: 0.6, upperChest: 0.4 }),
  );
  TestValidator.predicate(
    "half way up it takes half the head",
    close(4, { head: 0.5, neck: 0.3, upperChest: 0.2 }),
  );
  TestValidator.predicate(
    "the collar's own head share adds to the blended head",
    close(6, { head: 0.65, neck: 0.1, upperChest: 0.25 }),
  );
  TestValidator.predicate(
    "well above the cut it is the head alone",
    close(5, { head: 1 }),
  );
  TestValidator.predicate(
    "a fifth influence is dropped and the rest renormalize",
    close(7, {
      head: 0.5 / 0.95,
      neck: 0.2 / 0.95,
      upperChest: 0.15 / 0.95,
      leftShoulder: 0.1 / 0.95,
    }),
  );
  TestValidator.predicate(
    "every vector sums to one and the head is first",
    Array.from({ length: face.length / 3 }, (_, v) =>
      [0, 1, 2, 3].reduce((sum, k) => sum + skin.weights[v * 4 + k], 0),
    ).every((sum) => nclose(sum, 1, 1e-9)) && skin.joints[0] === "head",
  );

  for (const bad of [0, -0.01, Number.NaN, Infinity])
    TestValidator.predicate(
      "a blend length of " + bad + " refuses",
      throwsError(
        () =>
          createHumanPersonFaceSkin({
            seam,
            face,
            body,
            bodySkin,
            headBlendMetres: bad,
          }),
        "positive finite",
      ),
    );
  TestValidator.equals(
    "the default blend is the named convention",
    createHumanPersonFaceSkin({ seam, face, body, bodySkin }).weights.length,
    face.length / 3 * 4,
  );
};
