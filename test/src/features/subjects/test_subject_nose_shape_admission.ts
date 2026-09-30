import { type IPortraitNoseShape, resolvePortraitNoseShape } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceRecipeFixture } from "../internal/humanFaceRecipeFixture";
import { throwsError } from "../internal/predicates";

/**
 * A nose shape is admitted as one complete construction. Alternative bases
 * (envelopes, a rim band, a final body, a pre-fit section, lobules, a depth
 * scale) are refused when stacked, dimensions must be finite with the lining
 * contracted, and the result is an owned copy of the input.
 *
 * Scenarios:
 * 1. The recipe's nose resolves to equal values that share no array with the
 *    input, so a later edit to the input cannot reach the resolved copy.
 * 2. Each stacked pair is refused while its single member alone is admitted:
 *    envelopes with a rim band, with a body, with curve refinement and with a
 *    profile count that differs from the openings; a pre-fit section with a
 *    body; lobules with a section; a non-unit depth scale with a section.
 * 3. A depth scale may accompany a lobule body, a nonpositive or non-finite
 *    scale refuses, and rim refinement outside surface or curve refuses.
 * 4. Each dimension guard refuses at its adjacent invalid value and admits the
 *    valid neighbour: contraction and support at one, roundness above one,
 *    negative blend reach, a two-element cavity offset and a NaN tilt.
 */
export const test_subject_nose_shape_admission = (): void => {
  const base = (): IPortraitNoseShape => structuredClone(humanFaceRecipeFixture.nose);
  const admit = (shape: IPortraitNoseShape, openings = 2): boolean =>
    !throwsError(() => resolvePortraitNoseShape(shape, openings));
  const input = base();
  const resolved = resolvePortraitNoseShape(input, 2);
  TestValidator.equals("copied values", resolved.shape, input);
  TestValidator.predicate(
    "copied cavity offset",
    resolved.shape.cavityOffset !== input.cavityOffset,
  );
  const section = {
    transverse: [-3, -1, 1, 3],
    stations: [0, 1, 2, 3].map((height) => ({
      height,
      depths: [0, 0, 0, 0],
    })),
    joinWidth: 1,
    influence: 1,
  };
  const lobule = {
    anchor: 0,
    offset: [0, 0, 0],
    radii: [1, 1, 1],
    core: 0,
  };
  const envelope = { sections: [{ at: 0, width: 1, crest: 0, crestPosition: 0.5, roll: 0 }], segments: 2 };
  const body = { shape: { section }, joinWidth: 1, depthReach: 1 };
  const flat = { ...base(), depthScale: 1 };
  for (const [title, single, stacked] of [
    ["envelopes", { envelopes: [envelope, envelope] }, { envelopes: [envelope, envelope], rimSection: { width: 1, crest: 0 } }],
    ["envelope body", { envelopes: [envelope, envelope] }, { envelopes: [envelope, envelope], body }],
    ["envelope curve", { envelopes: [envelope, envelope] }, { envelopes: [envelope, envelope], rimRefinement: "curve" as const }],
    ["envelope count", { envelopes: [envelope, envelope] }, { envelopes: [envelope] }],
    ["section body", { section }, { section, body }],
    ["lobules section", { lobules: [lobule] }, { lobules: [lobule], section }],
    ["depth section", { section }, { section, depthScale: 0.8 }],
  ] as const)
    TestValidator.equals(
      title,
      [admit({ ...flat, ...single }), admit({ ...flat, ...stacked })],
      [true, false],
    );
  TestValidator.predicate(
    "depth scale with lobule body",
    admit({
      ...base(),
      body: { shape: { lobules: [lobule] }, joinWidth: 1, depthReach: 1 },
    }),
  );
  for (const value of [0, -1, NaN, Infinity])
    TestValidator.predicate(
      `depth scale ${value}`,
      !admit({ ...base(), depthScale: value }),
    );
  TestValidator.predicate(
    "unknown refinement",
    !admit({ ...base(), rimRefinement: "other" as never }),
  );
  const guards: [string, Partial<IPortraitNoseShape>, Partial<IPortraitNoseShape>][] = [
    ["contraction", { cavityContraction: 0.99 }, { cavityContraction: 1 }],
    ["support", { rimSupport: 0.99 }, { rimSupport: 1 }],
    ["roundness", { rimRoundness: 1 }, { rimRoundness: 1.01 }],
    ["reach", { blendReach: 0 }, { blendReach: -1 }],
    ["offset", { cavityOffset: [0, 1, 2] }, { cavityOffset: [0, 1] }],
    ["tilt", { nostrilTilt: 0 }, { nostrilTilt: NaN }],
  ];
  for (const [title, valid, invalid] of guards)
    TestValidator.equals(
      title,
      [admit({ ...base(), ...valid }), admit({ ...base(), ...invalid })],
      [true, false],
    );
};
