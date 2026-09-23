import { Vector3 } from "@automovie/engine";
import {
  assertHumanFaceHair,
  humanFaceHairLength,
  interpolateHumanFaceHairStrands,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Strands grow from their guides by scalp distance, on their own side of the
 * part, at their own length.
 * Scenarios:
 * 1. A strand midway between two straight guides of equal length follows the
 *    average of their displacements, scaled to its own regional length.
 * 2. A strand beside a part takes only the guides on its own side.
 * 3. A strand farther than twice the guide spacing follows its single
 *    nearest guide; one guide alone carries every strand.
 * 4. Admission refuses a zero or excessive fraction and a neighbour count
 *    outside one to eight; a strand needs at least one guide and a guide a
 *    positive length.
 */
export const test_subject_human_hair_guides = (): void => {
  const layer = {
    ...createNumericalHairFixture().layers[0],
    guides: { fraction: 0.5, neighbours: 2 },
  };
  const origin = Vector3.create(0, 0, 0);
  // Two guides rooted 0.02 apart on a flat scalp at y = 1, each straight:
  // one down -y, one down -y with a +z lean, both 0.05 long.
  const straight = (x: number, lean: number) => {
    const direction = Vector3.normalize(Vector3.create(0, -1, lean));
    return {
      root: Vector3.create(x, 1, 0),
      reference: Vector3.create(x, 1, 0),
      points: [0, 1, 2, 3, 4, 5].map((at) =>
        Vector3.add(
          Vector3.create(x, 1, 0),
          Vector3.scale(direction, (0.05 * at) / 5),
        ),
      ),
    };
  };
  const guides = [straight(-0.01, 0), straight(0.01, 0)];
  const mid = {
    root: Vector3.create(0, 1, 0),
    reference: Vector3.create(0, 1, 0),
    sequence: 3,
    normal: Vector3.create(0, 1, 0),
  };
  const [strand] = interpolateHumanFaceHairStrands({
    layer,
    origin,
    guides,
    strands: [mid],
  });
  const expected = humanFaceHairLength(layer, origin, mid.reference, 3);
  const tip = strand.points[strand.points.length - 1];
  TestValidator.predicate(
    "midway strand follows the averaged guides at its own length",
    nclose(strand.length, expected) &&
      nclose(tip.x, 0) &&
      nclose(tip.y, 1 - expected) &&
      nclose(tip.z, 0),
  );
  const parted = {
    ...layer,
    part: {
      normal: [1, 0, 0] as [number, number, number],
      offset: 0,
      transitionWidth: 0.001,
      bias: [0, 0, 0] as [number, number, number],
      strength: 1,
      reach: 0.02,
    },
  };
  const leaning = [straight(-0.01, 0), straight(0.01, 1)];
  const [right] = interpolateHumanFaceHairStrands({
    layer: parted,
    origin,
    guides: leaning,
    strands: [
      {
        ...mid,
        root: Vector3.create(0.005, 1, 0),
        reference: Vector3.create(0.005, 1, 0),
      },
    ],
  });
  const rightTip = right.points[right.points.length - 1];
  TestValidator.predicate(
    "a strand beside the part follows only its own side",
    nclose(rightTip.z - 0, right.length / Math.SQRT2, 1e-9) &&
      nclose(rightTip.x, 0.005),
  );
  const [far] = interpolateHumanFaceHairStrands({
    layer,
    origin,
    guides: [straight(-0.01, 0), straight(0.01, 1)],
    strands: [
      {
        ...mid,
        root: Vector3.create(0.2, 1, 0),
        reference: Vector3.create(0.2, 1, 0),
      },
    ],
  });
  const farTip = far.points[far.points.length - 1];
  TestValidator.predicate(
    "a strand beyond twice the spacing follows its nearest guide",
    nclose(farTip.z, far.length / Math.SQRT2, 1e-9),
  );
  const [alone] = interpolateHumanFaceHairStrands({
    layer,
    origin,
    guides: [straight(0.01, 1)],
    strands: [mid],
  });
  TestValidator.predicate(
    "one guide carries every strand",
    nclose(
      alone.points[alone.points.length - 1].z,
      alone.length / Math.SQRT2,
      1e-9,
    ),
  );
  for (const guides of [
    { fraction: 0, neighbours: 2 },
    { fraction: 1.5, neighbours: 2 },
    { fraction: 0.5, neighbours: 0 },
    { fraction: 0.5, neighbours: 9 },
    { fraction: 0.5, neighbours: 2.5 },
  ])
    TestValidator.predicate(
      "guide admission refuses " + JSON.stringify(guides),
      throwsError(
        () => assertHumanFaceHair({ layers: [{ ...layer, guides }] }),
        "fraction in (0,1] and one to eight neighbours",
      ),
    );
  TestValidator.predicate(
    "strands need a guide",
    throwsError(
      () =>
        interpolateHumanFaceHairStrands({
          layer,
          origin,
          guides: [],
          strands: [mid],
        }),
      "at least one guide",
    ),
  );
  const collapsed = straight(0.01, 0);
  collapsed.points = collapsed.points.map(() => collapsed.root);
  TestValidator.predicate(
    "a guide needs a positive length",
    throwsError(
      () =>
        interpolateHumanFaceHairStrands({
          layer,
          origin,
          guides: [collapsed],
          strands: [mid],
        }),
      "finite positive length",
    ),
  );
};
