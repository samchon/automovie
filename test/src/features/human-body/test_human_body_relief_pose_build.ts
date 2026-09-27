import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinDetail,
  createHumanBodyBasisBuilder,
  createHumanBodySkinDetailTexture,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

const FLAT: IAutoMovieHumanBodySkinDetail = {
  seed: 1,
  pixels: 32,
  tileMillimetres: 10,
  lines: [],
  pores: {
    perSquareCentimetre: 1,
    radiusMicrometres: 300,
    depthMicrometres: 0,
  },
  age: [[0, 1]],
};

/**
 * A posed body's skin region carries the relief weights its pose gives.
 *
 * The analytic box's upper joint is named as the table's elbow, so bending
 * it moves a relief-pose joint; the box's vertices lie a metre from it, past
 * its creases, so their weights stay one.
 *
 * Scenarios:
 * 1. With the skin detail and a relief, a bent joint of the table gives the
 *    skin region one weight a region vertex, gathered through the region's
 *    correspondence.
 * 2. The same body at rest, or without the skin detail, carries none.
 */
export const test_human_body_relief_pose_build = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const box = basis.surfaces[0]!;
  const uvs = box.regions[0]!.indices.flatMap((v) => [
    box.positions[v * 3]! / 2 + 0.5,
    box.positions[v * 3 + 1]! / 2,
  ]);
  const surface: Surface = {
    ...box,
    regions: [{ ...box.regions[0]!, uvs }],
    skin: { ...box.skin, joints: ["hips", "leftLowerArm"] },
    relief: {
      material: "skin",
      texture: createHumanBodySkinDetailTexture(FLAT),
    },
  };
  const renamed: IAutoMovieHumanBodyBasis = {
    ...basis,
    joints: basis.joints.map((joint) =>
      joint.bone === "spine"
        ? { ...joint, bone: "leftLowerArm" as typeof joint.bone }
        : joint,
    ),
    surfaces: [surface],
  };
  const build = createHumanBodyBasisBuilder(renamed);
  const weightsOf = (extra: object) => {
    const part = build({ ...document, ...extra }).model.parts[0]!;
    if (part.geometry.type !== "mesh") throw new Error("expected a mesh");
    return [
      part.geometry.mesh.reliefWeights,
      part.geometry.mesh.positions.length / 3,
    ] as const;
  };
  const bent = {
    skinDetail: { strength: 1 },
    pose: [{ bone: "leftLowerArm", flexion: 20, abduction: null, twist: null }],
  };
  const [weights, vertices] = weightsOf(bent);
  TestValidator.predicate(
    "a bent table joint gives the skin region its weights",
    weights !== undefined &&
      weights.length === vertices &&
      weights.every((w) => w === 1),
  );
  TestValidator.equals(
    "at rest or without skin detail there are none",
    [
      weightsOf({ skinDetail: { strength: 1 } })[0],
      weightsOf({ pose: bent.pose })[0],
    ],
    [undefined, undefined],
  );
};
