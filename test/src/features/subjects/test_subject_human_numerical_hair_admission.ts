import { assertHumanFaceHair } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createNumericalHairFixture } from "../internal/createNumericalHairFixture";
import { throwsError } from "../internal/predicates";

/**
 * Numerical hair admission preserves authored fields and distinguishes limits.
 * Scenarios:
 * 1. Empty and zero-count populations are valid; eight unique layers are valid.
 * 2. Optional parting/region and helix fields admit without normalizing inputs.
 * 3. Inclusive seed/count/colour/taper boundaries and exactly eight samples per
 *    curl period admit, independently of whether any roots will be generated.
 * 4. Unknown guide/image data and malformed tuple/enum fields refuse.
 */
export const test_subject_human_numerical_hair_admission = (): void => {
  assertHumanFaceHair({ layers: [] });
  const input = createNumericalHairFixture(),
    layer = input.layers[0];
  assertHumanFaceHair(input);
  layer.count = 0;
  layer.seed = 0xffffffff;
  layer.clearance = 0;
  layer.lengthVariation = 1;
  layer.lift.strength = 0;
  layer.curl.mode = "helix";
  layer.finish = {
    color: [0, 1, 0],
    roughness: 0,
    fibres: 1,
    coverage: 0.1,
    normal: 0,
    shade: 0,
  };
  layer.taper = { tipWidth: 0.05, start: 0 };
  layer.part = {
    normal: [2, 0, 0],
    offset: -0.1,
    transitionWidth: 0.001,
    bias: [0, 0, 0],
    strength: 0,
    reach: 0.02,
  };
  assertHumanFaceHair(input);
  layer.part.region = { center: [0, 0, 0], spread: [0.1, 0.2, 0.3] };
  layer.finish = {
    color: [1, 1, 1],
    roughness: 1,
    fibres: 32,
    coverage: 1,
    normal: 1,
    shade: 1,
  };
  layer.taper = { tipWidth: 1, start: 0.95 };
  layer.hairline = { front: 0, left: 0, right: 0, back: 0 };
  const before = JSON.stringify(input);
  assertHumanFaceHair(input);
  TestValidator.equals(
    "authoring values remain owned",
    JSON.stringify(input),
    before,
  );
  const maximum = createNumericalHairFixture();
  maximum.layers[0].count = 1024;
  assertHumanFaceHair(maximum);
  const eight = {
    layers: Array.from({ length: 8 }, (_, at) => ({
      ...structuredClone(layer),
      id: String(at),
    })),
  };
  assertHumanFaceHair(eight);
  for (const extra of [
    { ...input, guides: [[0, 0, 0]] },
    { ...input, image: "data:image/png;base64,anything" },
  ])
    TestValidator.predicate(
      "personal geometry or image fields refuse",
      throwsError(() => assertHumanFaceHair(extra)),
    );
  for (const change of [
    { flow: [0, -1] },
    { lengthAxes: [0.05] },
    { curl: { ...layer.curl, mode: "unsupported" } },
  ])
    TestValidator.predicate(
      "malformed field shape refuses",
      throwsError(() =>
        assertHumanFaceHair({
          layers: [{ ...layer, ...change }],
        } as unknown as Parameters<typeof assertHumanFaceHair>[0]),
      ),
    );
};
