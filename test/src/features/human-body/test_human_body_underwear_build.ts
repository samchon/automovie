import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  parseHumanBodyBasisDocument,
  segmentHumanBodyModel,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * A document's underwear is appended after the skin as a part of its own
 * material, leaves everything else unchanged, and stays out of the skin's
 * segment partition.
 *
 * The analytic box gains hip joints at y = 0.5 and knees 2.5 m below them,
 * so the shipped boxer rules (waistband at 0.9 of the pelvis-to-lumbar
 * metre, hem 0.3 of the thigh below the hips, at -0.25) cover the bottom
 * face and clip each side where the field falls from 0.25 at y = 0 to -1.1
 * at y = 2: at y = 2 x 0.25 / 1.35.
 *
 * Scenarios:
 * 1. Without underwear the model is the skin alone.
 * 2. With it, the skin parts and materials are unchanged, one `box/underwear`
 *    part follows them with the document's colour, and its cut edge stands
 *    within the lift of y = 0.37037.
 * 3. A second document on the same builder reuses the compiled rules and
 *    follows the pose: a flexed spine moves the cut edge the spine carries.
 * 4. The segment partition reads the skin only.
 * 5. The sports bra needs the shipped nipple vertex, which the box lacks;
 *    the document boundary refuses a nonfinite underwear colour and keeps a
 *    colourless one.
 */
export const test_human_body_underwear_build = (): void => {
  const fixture = humanBodyBasisFixture();
  const extra: Record<string, number[]> = {
    "joint-l-upper-leg": [0.05, 0.5, 0],
    "joint-r-upper-leg": [-0.05, 0.5, 0],
    "joint-l-knee": [0.05, -2, 0],
    "joint-r-knee": [-0.05, -2, 0],
  };
  const basis: IAutoMovieHumanBodyBasis = {
    ...fixture.basis,
    landmarks: {
      ...fixture.basis.landmarks,
      ids: [...fixture.basis.landmarks.ids, ...Object.keys(extra)],
      positions: [
        ...fixture.basis.landmarks.positions,
        ...Object.values(extra).flat(),
      ],
    },
  };
  const build = createHumanBodyBasisBuilder(basis);
  const document = { ...fixture.document, basis: basis.id };
  const plain = build(document);
  TestValidator.equals(
    "no underwear, no garment",
    plain.model.parts.map((part) => part.id),
    ["box/skin"],
  );
  const color = { r: 0.2, g: 0.3, b: 0.4 };
  const dressed = build({
    ...document,
    underwear: { style: "boxer-briefs", color },
  });
  TestValidator.equals(
    "the skin is unchanged",
    dressed.model.parts.slice(0, 1),
    plain.model.parts,
  );
  TestValidator.equals(
    "the garment follows the skin in its own material",
    dressed.model.parts.map((part) => [part.id, part.material]),
    [
      ["box/skin", "skin"],
      ["box/underwear", "underwear"],
    ],
  );
  TestValidator.equals(
    "the materials gain the fabric",
    dressed.model.materials.map((material) => [
      material.id,
      material.baseColor.r,
      material.baseColor.g,
      material.baseColor.b,
    ]),
    [
      ...plain.model.materials.map((material) => [
        material.id,
        material.baseColor.r,
        material.baseColor.g,
        material.baseColor.b,
      ]),
      ["underwear", 0.2, 0.3, 0.4],
    ],
  );
  const garment = (built: typeof plain) =>
    (built.model.parts[1]!.geometry as { mesh: IAutoMovieMesh }).mesh;
  const top = (mesh: IAutoMovieMesh) =>
    Math.max(...mesh.positions.filter((_, i) => i % 3 === 1));
  TestValidator.predicate(
    "the cut stands where the field crosses zero",
    Math.abs(top(garment(dressed)) - (2 * 0.25) / 1.35) <= 0.003 + 1e-9,
  );
  const posed = build({
    ...document,
    underwear: { style: "boxer-briefs" },
    pose: [{ bone: "spine", flexion: 60, abduction: null, twist: null }],
  });
  TestValidator.predicate(
    "the garment follows the pose",
    top(garment(posed)) < top(garment(dressed)) - 0.01 &&
      posed.model.materials.at(-1)!.baseColor.r === 0.62,
  );
  TestValidator.equals(
    "the partition reads the skin",
    segmentHumanBodyModel(basis, dressed).model.parts,
    segmentHumanBodyModel(basis, plain).model.parts,
  );
  TestValidator.error("the bra needs the nipple vertex", () =>
    build({ ...document, underwear: { style: "bra-and-briefs" } }),
  );
  const text = (underwear: unknown) =>
    JSON.stringify({ ...document, underwear });
  TestValidator.error("a nonfinite colour is refused", () =>
    parseHumanBodyBasisDocument(
      text({ style: "boxer-briefs", color: { r: 0, g: 0, b: 0 } }).replace(
        '"b":0}',
        '"b":1e999}',
      ),
    ),
  );
  TestValidator.equals(
    "a colourless underwear is kept",
    parseHumanBodyBasisDocument(text({ style: "boxer-briefs" })).underwear,
    { style: "boxer-briefs" },
  );
};
