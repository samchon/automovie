import {
  type IPortraitNoseShape,
  resolvePortraitNoseShape,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceRecipeFixture } from "../internal/humanFaceRecipeFixture";
import { throwsError } from "../internal/predicates";

/**
 * A nose shape is a set of named nasal measurements; admission says the shape
 * is constructible and returns an owned copy.
 *
 * Scenarios:
 * 1. The recipe's nose resolves to equal values that share no array with the
 *    input, so a later edit to the input cannot reach the resolved copy.
 * 2. Each dimension guard refuses at its adjacent invalid value and admits the
 *    valid neighbour: contraction and support at one (open interval),
 *    roundness above one, negative blend reach, a two-element cavity offset, a
 *    NaN tilt, nonpositive width and aperture scales.
 * 3. An omitted depth scale and a depth scale of one are admitted; zero,
 *    negative, NaN and infinite depth scales refuse.
 */
export const test_subject_nose_shape_admission = (): void => {
  const base = (): IPortraitNoseShape =>
    structuredClone(humanFaceRecipeFixture.nose);
  const admit = (shape: IPortraitNoseShape): boolean =>
    !throwsError(() => resolvePortraitNoseShape(shape));
  const input = base();
  const resolved = resolvePortraitNoseShape(input);
  TestValidator.equals("copied values", resolved, input);
  TestValidator.predicate(
    "copied cavity offset",
    resolved.cavityOffset !== input.cavityOffset,
  );
  const guards: [
    string,
    Partial<IPortraitNoseShape>,
    Partial<IPortraitNoseShape>,
  ][] = [
    ["contraction", { cavityContraction: 0.99 }, { cavityContraction: 1 }],
    ["support", { rimSupport: 0.99 }, { rimSupport: 1 }],
    ["roundness", { rimRoundness: 1 }, { rimRoundness: 1.01 }],
    ["reach", { blendReach: 0 }, { blendReach: -1 }],
    ["offset", { cavityOffset: [0, 1, 2] }, { cavityOffset: [0, 1] }],
    ["tilt", { nostrilTilt: 0 }, { nostrilTilt: NaN }],
    ["width", { widthScale: 0.01 }, { widthScale: 0 }],
    ["aperture width", { nostrilWidthScale: 0.01 }, { nostrilWidthScale: -1 }],
    ["aperture height", { nostrilHeightScale: 0.01 }, { nostrilHeightScale: 0 }],
  ];
  for (const [title, valid, invalid] of guards)
    TestValidator.equals(
      title,
      [admit({ ...base(), ...valid }), admit({ ...base(), ...invalid })],
      [true, false],
    );
  TestValidator.equals(
    "omitted and unit depth scale",
    [
      admit({ ...base(), depthScale: undefined }),
      admit({ ...base(), depthScale: 1 }),
    ],
    [true, true],
  );
  for (const depthScale of [0, -1, NaN, Infinity])
    TestValidator.predicate(
      `depth scale ${depthScale}`,
      !admit({ ...base(), depthScale }),
    );
};
