import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  createPortraitMaterials,
} from "@automovie/human";

/**
 * Independent analytic body basis: a closed box 0.2 m wide, 2 m tall and
 * 0.4 m deep standing on the origin, with two bones stacked along +Y.
 *
 * `hips` runs from `joint-pelvis` (0,0,0) to `joint-spine-4` (0,1,0) and
 * `spine` from there to `joint-spine-2` (0,2,0); both flex toward +Z, so the
 * frame rule gives X = Y x F = +X world and Z = +Z world for each. The bottom four
 * vertices are bound to the hips and the top four to the spine, with the box
 * split at the joint so a spine rotation carries the whole upper half as a
 * rigid body. Channels: `width` widens (+0.05 per side) or narrows the whole
 * box, `tall` (nonnegative) raises the top face and the `joint-spine-2`
 * landmark by 0.5, `sideLeft`/`sideRight` are a mirror pair moving one
 * upper-left or upper-right vertex outward, and the corrective `wideTall`
 * lifts one top vertex when `width` and `tall` are both positive. Every
 * expected number in the scenarios is hand-derived from these figures; no
 * measured mesh participates.
 */
export function humanBodyBasisFixture(): {
  basis: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanBodyBasisDocument;
} {
  const w = 0.1,
    d = 0.2;
  // Bottom ring 0..3 runs +X then +Z, top ring 4..7 sits two metres above it.
  const positions = [
    -w,
    0,
    -d,
    w,
    0,
    -d,
    w,
    0,
    d,
    -w,
    0,
    d,
    -w,
    2,
    -d,
    w,
    2,
    -d,
    w,
    2,
    d,
    -w,
    2,
    d,
  ];
  // The bottom ring runs +X then +Z, which is clockwise seen from above, so
  // each triangle is wound so that its normal points out of the box.
  const indices = [
    // sides, outward facing
    0, 5, 1, 0, 4, 5, 1, 6, 2, 1, 5, 6, 2, 7, 3, 2, 6, 7, 3, 4, 0, 3, 7, 4,
    // top (+Y) and bottom (-Y)
    4, 6, 5, 4, 7, 6, 0, 2, 3, 0, 1, 2,
  ];
  const wide = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
    v,
    positions[v * 3] > 0 ? 0.05 : -0.05,
    0,
    0,
  ]);
  const narrow = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((v) => [
    v,
    positions[v * 3] > 0 ? -0.02 : 0.02,
    0,
    0,
  ]);
  const basis: IAutoMovieHumanBodyBasis = {
    id: "analytic-box/1",
    channels: [
      {
        id: "width",
        kind: "shape",
        group: "torso",
        mirror: null,
        minimum: -1,
        maximum: 1,
        positive: "wide",
        negative: "narrow",
      },
      {
        id: "tall",
        kind: "shape",
        group: "macro",
        mirror: null,
        minimum: 0,
        maximum: 1,
        positive: "raised",
        negative: null,
      },
      {
        id: "sideLeft",
        kind: "shape",
        group: "arms",
        mirror: "sideRight",
        minimum: 0,
        maximum: 1,
        positive: "leftOut",
        negative: null,
      },
      {
        id: "sideRight",
        kind: "shape",
        group: "arms",
        mirror: "sideLeft",
        minimum: 0,
        maximum: 1,
        positive: "rightOut",
        negative: null,
      },
    ],
    correctives: [
      {
        id: "wideTall",
        inputs: [
          { channel: "width", side: "positive" },
          { channel: "tall", side: "positive" },
        ],
        weight: 1,
        target: "wideTall",
      },
    ],
    landmarks: {
      ids: ["joint-pelvis", "joint-spine-4", "joint-spine-2"],
      positions: [0, 0, 0, 0, 1, 0, 0, 2, 0],
      targets: { raised: [2, 0, 0.5, 0] },
    },
    joints: [
      {
        bone: "hips",
        parent: null,
        head: "joint-pelvis",
        tail: "joint-spine-4",
        reference: [0, 0, 1],
        signs: { flexion: 1, abduction: -1, twist: 1 },
        neutral: { flexion: 0, abduction: 0, twist: 0 },
        constraint: null,
      },
      {
        bone: "spine",
        parent: "hips",
        head: "joint-spine-4",
        tail: "joint-spine-2",
        reference: [0, 0, 1],
        signs: { flexion: 1, abduction: -1, twist: 1 },
        neutral: { flexion: 0, abduction: 0, twist: 0 },
        constraint: {
          flexion: { min: -30, max: 90 },
          abduction: { min: -10, max: 10 },
          twist: { min: -10, max: 10 },
        },
      },
    ],
    surfaces: [
      {
        id: "box",
        positions,
        indices,
        targets: {
          wide,
          narrow,
          raised: [4, 0, 0.5, 0, 5, 0, 0.5, 0, 6, 0, 0.5, 0, 7, 0, 0.5, 0],
          leftOut: [4, -0.01, 0, 0],
          rightOut: [5, 0.01, 0, 0],
          wideTall: [6, 0, 0, 0.01],
        },
        regions: [{ id: "box/skin", material: "skin", indices, uvs: null }],
        skin: {
          joints: ["hips", "spine"],
          boneIndices: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 0, 1, 0, 0, 0,
          ],
          weights: [
            1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,
            0, 1, 0, 0, 0, 1, 0, 0, 0,
          ],
        },
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin",
    ),
  };
  return {
    basis,
    document: {
      id: "box",
      name: "Analytic body",
      basis: basis.id,
      shape: {},
    },
  };
}
