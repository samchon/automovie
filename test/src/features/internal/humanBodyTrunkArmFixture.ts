import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { humanBodyShoulderFixture } from "./humanBodyShoulderFixture";

/** Corners of an axis-aligned box as triangles wound outward. */
const block = (
  low: number[],
  high: number[],
  offset: number,
): { positions: number[]; indices: number[] } => {
  const positions: number[] = [];
  for (const z of [low[2], high[2]])
    for (const y of [low[1], high[1]])
      for (const x of [low[0], high[0]]) positions.push(x, y, z);
  const faces = [
    [0, 2, 3, 1],
    [4, 5, 7, 6],
    [0, 1, 5, 4],
    [2, 6, 7, 3],
    [0, 4, 6, 2],
    [1, 3, 7, 5],
  ];
  return {
    positions,
    indices: faces.flatMap(([a, b, c, d]) =>
      [a, b, c, a, c, d].map((v) => v + offset),
    ),
  };
};

/** A box along the arm's rest direction: 0.3 m long, 0.02 m either side. */
const armBlock = (
  shoulder: number[],
  elevation: number,
  offset: number,
): { positions: number[]; indices: number[] } => {
  const axial = block([-0.02, -0.3, -0.02], [0.02, 0, 0.02], offset);
  const e = (elevation * Math.PI) / 180;
  // rotate the hanging box about +Z by the rest elevation toward +X
  for (let at = 0; at < axial.positions.length; at += 3) {
    const [x, y] = [axial.positions[at], axial.positions[at + 1]];
    axial.positions[at] = shoulder[0] + x * Math.cos(e) - y * Math.sin(e);
    axial.positions[at + 1] = shoulder[1] + x * Math.sin(e) + y * Math.cos(e);
  }
  return axial;
};

/**
 * The shoulder fixture with its skin replaced by two closed block surfaces:
 * a trunk bound to `upperChest` (`|x| <= half`, y 2.0 to 2.85, `|z| <= 0.1`)
 * and a left arm block bound to `leftUpperArm`, 0.3 m long and 0.04 m thick,
 * laid along the measured A-pose (elevation 45) from a shoulder at
 * (0.25, 3). The right arm carries no skin.
 */
export const humanBodyTrunkArmFixture = (
  half: number,
): IAutoMovieHumanBodyBasis => {
  const { basis } = humanBodyShoulderFixture();
  const shoulder = [0.25, 3, 0];
  const at = basis.landmarks.ids.indexOf("left-shoulder") * 3;
  basis.landmarks.positions.splice(at, 3, ...shoulder);
  const elbow = basis.landmarks.ids.indexOf("left-elbow") * 3;
  const r = Math.PI / 4;
  basis.landmarks.positions.splice(
    elbow,
    3,
    0.25 + 0.3 * Math.sin(r),
    3 - 0.3 * Math.cos(r),
    0,
  );
  const targets = {
    wide: [0, 0.001, 0, 0],
    narrow: [0, -0.001, 0, 0],
    raised: [0, 0, 0.001, 0],
    leftOut: [0, 0, 0, 0.001],
    rightOut: [1, 0, 0, 0.001],
    wideTall: [2, 0, 0, 0.001],
  };
  // two closed surfaces, each connected, with disjoint interiors at rest
  basis.surfaces = (
    [
      ["trunk", block([-half, 2.0, -0.1], [half, 2.85, 0.1], 0), "upperChest"],
      ["arm", armBlock(shoulder, 45, 0), "leftUpperArm"],
    ] as const
  ).map(([id, mesh, bone]) => ({
    id,
    positions: mesh.positions,
    indices: mesh.indices,
    targets: structuredClone(targets),
    regions: [
      {
        id: `${id}/skin`,
        material: "skin",
        indices: mesh.indices,
        uvs: null,
      },
    ],
    skin: {
      joints: [bone],
      boneIndices: Array.from({ length: 32 }, () => 0),
      weights: Array.from({ length: 8 }, () => [1, 0, 0, 0]).flat(),
    },
  }));
  return basis;
};
