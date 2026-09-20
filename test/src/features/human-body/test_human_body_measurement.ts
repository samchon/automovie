import {
  measureHumanBodyBasisChannels,
  measureHumanBodySection,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * Girths are closed section loops and channels report them in metres.
 *
 * Scenarios:
 * 1. A horizontal plane through the analytic box yields the perimeter
 *    2(0.2 + 0.4) = 1.2 and the breadth 0.2, independent of height; a plane
 *    above or below the box yields null.
 * 2. With two boxes cut by one plane, the loop whose centroid is nearest the
 *    seed answers, so the seed picks the limb.
 * 3. An open surface (the box without its top and bottom, cut lengthwise)
 *    has no closed loop and answers null.
 * 4. `measureHumanBodyBasisChannels` reports per-endpoint RMS, peak and
 *    vertex counts by hand sums, evaluates the waist rule (min girth) at the
 *    neutral 1.2, +1 = 1.4 and -1 = 1.12, the height rule as 2 m and 2.5 m,
 *    and reports null values for a rule whose landmarks the basis lacks and no
 *    measurement for a channel without a rule.
 * 5. An empty surface population is refused.
 */
export const test_human_body_measurement = (): void => {
  const { basis } = humanBodyBasisFixture();
  const surface = basis.surfaces[0];
  const up = { x: 0, y: 1, z: 0 };
  for (const height of [0.5, 1, 1.5]) {
    const section = measureHumanBodySection(
      surface.positions,
      surface.indices,
      { point: { x: 0, y: height, z: 0 }, normal: up },
      { x: 0, y: height, z: 0 },
    );
    TestValidator.predicate(
      "box girth at " + height,
      section !== null &&
        nclose(section.perimeter, 1.2) &&
        nclose(section.breadth, 0.2) &&
        nclose(section.centroid.y, height),
    );
  }
  TestValidator.equals(
    "plane above the box",
    measureHumanBodySection(
      surface.positions,
      surface.indices,
      { point: { x: 0, y: 3, z: 0 }, normal: up },
      { x: 0, y: 3, z: 0 },
    ),
    null,
  );
  const shifted = surface.positions.map((value, index) =>
    index % 3 === 0 ? value + 1 : value,
  );
  const twoBoxes = [...surface.positions, ...shifted];
  const twoIndices = [...surface.indices, ...surface.indices.map((i) => i + 8)];
  const near = measureHumanBodySection(
    twoBoxes,
    twoIndices,
    { point: { x: 0.9, y: 1, z: 0 }, normal: up },
    { x: 0.9, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "seed selects the nearer loop",
    near !== null && nclose(near.centroid.x, 1),
  );
  const openIndices = surface.indices.slice(0, 24);
  TestValidator.equals(
    "open surface cut lengthwise has no closed loop",
    measureHumanBodySection(
      surface.positions,
      openIndices,
      { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } },
      { x: 0, y: 1, z: 0 },
    ),
    null,
  );
  const measured = measureHumanBodyBasisChannels(basis);
  const width = measured.find((channel) => channel.id === "width")!;
  // wide moves all 8 vertices by 0.05; RMS over 8 resident vertices is 0.05.
  TestValidator.predicate(
    "positive endpoint scale",
    nclose(width.positive.displacement, 0.05) &&
      nclose(width.positive.peak, 0.05) &&
      width.positive.vertices === 8,
  );
  TestValidator.predicate(
    "negative endpoint scale",
    width.negative !== null &&
      nclose(width.negative.displacement, 0.02) &&
      width.negative.vertices === 8,
  );
  TestValidator.equals("channel without a rule", width.measurement, null);
  const waist = humanBodyBasisFixture();
  waist.basis.channels[0].id = "measureWaistCirc";
  waist.basis.correctives![0].inputs[0].channel = "measureWaistCirc";
  const rules = measureHumanBodyBasisChannels(waist.basis);
  const girth = rules.find(
    (channel) => channel.id === "measureWaistCirc",
  )!.measurement!;
  TestValidator.predicate(
    "waist girth rule at neutral and both ends",
    girth.kind === "girth" &&
      nclose(girth.neutral!, 1.2) &&
      nclose(girth.positive!, 1.4) &&
      nclose(girth.negative!, 1.12),
  );
  const tall = humanBodyBasisFixture();
  tall.basis.channels[1].id = "macroHeight";
  tall.basis.correctives![0].inputs[1].channel = "macroHeight";
  const height = measureHumanBodyBasisChannels(tall.basis).find(
    (channel) => channel.id === "macroHeight",
  )!.measurement!;
  TestValidator.predicate(
    "height rule reads the highest vertex above the ground",
    height.kind === "height" &&
      nclose(height.neutral!, 2) &&
      nclose(height.positive!, 2.5) &&
      height.negative === null,
  );
  const missing = humanBodyBasisFixture();
  missing.basis.channels[0].id = "measureUpperlegHeight";
  missing.basis.correctives![0].inputs[0].channel = "measureUpperlegHeight";
  const distance = measureHumanBodyBasisChannels(missing.basis).find(
    (channel) => channel.id === "measureUpperlegHeight",
  )!.measurement!;
  TestValidator.equals(
    "rule without its landmarks reports null values",
    [distance.kind, distance.neutral, distance.positive, distance.negative],
    ["distance", null, null, null],
  );
  const spanned = humanBodyBasisFixture();
  spanned.basis.channels[1].id = "measureNapetowaistDist";
  spanned.basis.correctives![0].inputs[1].channel = "measureNapetowaistDist";
  spanned.basis.landmarks.ids[2] = "joint-neck";
  spanned.basis.joints[1].tail = "joint-neck";
  const nape = measureHumanBodyBasisChannels(spanned.basis).find(
    (channel) => channel.id === "measureNapetowaistDist",
  )!.measurement!;
  TestValidator.predicate(
    "distance rule follows the raised landmark",
    nclose(nape.neutral!, 1) && nclose(nape.positive!, 1.5),
  );
  let refused = false;
  try {
    measureHumanBodyBasisChannels({ ...basis, surfaces: [] });
  } catch {
    refused = true;
  }
  TestValidator.predicate("empty surfaces refuse", refused);
};
