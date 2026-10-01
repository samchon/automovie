import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanPersonDocument,
  createPortraitMaterials,
} from "@automovie/human";

import { humanPersonTube } from "./humanPersonTubeFixture";

/**
 * Independent analytic face and body for the person builder, in metres, with
 * every expectation derivable by hand.
 *
 * The face is a tube of twelve vertices per ring, radius 0.05, rings at 0,
 * 0.1, 0.2 and 0.3, capped on top, so its open loop is the ring at height 0;
 * its `headWidth` channel moves every ring vertex radially by 0.01 (wide) or
 * -0.005 (narrow). The body is a tube of eight per ring, radius 0.05, capped
 * at the bottom, with rings at -0.5, -0.4, -0.3, -0.2, -0.1, -0.03, 0.01, 0.03
 * and 0.05, so it overlaps the face by the three rings above height 0 and its
 * retained collar is the ring at -0.03; its `width` channel moves the rings at
 * -0.1 and above radially by 0.02 (wide) or -0.01 (narrow). Its rig is the
 * chain hips, spine, neck, head along +Y with the joints at -0.5, -0.3, -0.1,
 * 0.06 and 0.2 (`joint-head` is the head's centre, which the person builder
 * seats the face on), and its skin weights are the hips below -0.3, the spine
 * to -0.1, the neck and head (0.6 and 0.4) on the rings from -0.1 up. Both
 * skins draw the `skin` material, and the face has a second surface, a small
 * triangle at height 0.25, that no channel moves and no seam touches, which
 * rides the head bone whole. No measured mesh participates.
 */
export function humanPersonBasisFixture(): {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  document: IAutoMovieHumanPersonDocument;
} {
  const faceTube = humanPersonTube({
    rings: [0, 0.1, 0.2, 0.3],
    segments: 12,
    radius: 0.05,
    close: "top",
  });
  const radial = (
    positions: number[],
    vertices: number[],
    amount: number,
  ): number[] =>
    vertices.flatMap((vertex) => {
      const x = positions[vertex * 3];
      const z = positions[vertex * 3 + 2];
      const length = Math.hypot(x, z);
      return [vertex, (amount * x) / length, 0, (amount * z) / length];
    });
  const faceRing = faceTube.rings.flat();
  const face: IAutoMovieHumanFaceBasis = {
    id: "analytic-person-face/1",
    channels: [
      {
        id: "headWidth",
        kind: "shape",
        minimum: -1,
        maximum: 1,
        positive: "wide",
        negative: "narrow",
      },
    ],
    surfaces: [
      {
        id: "face",
        positions: faceTube.positions,
        indices: faceTube.indices,
        targets: {
          wide: radial(faceTube.positions, faceRing, 0.01),
          narrow: radial(faceTube.positions, faceRing, -0.005),
        },
        regions: [
          {
            id: "face/skin",
            material: "skin",
            indices: faceTube.indices,
            uvs: null,
          },
        ],
      },
      {
        // a part that rides the head whole, as the eyes and teeth do
        id: "brow",
        positions: [0.02, 0.25, 0.06, 0.04, 0.25, 0.06, 0.03, 0.27, 0.06],
        indices: [0, 1, 2],
        targets: {},
        regions: [
          { id: "face/brow", material: "skin", indices: [0, 1, 2], uvs: null },
        ],
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin",
    ),
  };

  const ys = [-0.5, -0.4, -0.3, -0.2, -0.1, -0.03, 0.01, 0.03, 0.05];
  const bodyTube = humanPersonTube({
    rings: ys,
    segments: 8,
    radius: 0.05,
    close: "bottom",
  });
  const upper = bodyTube.rings.slice(4).flat();
  const count = bodyTube.positions.length / 3;
  const ringOf = (vertex: number): number =>
    Math.max(
      0,
      bodyTube.rings.findIndex((ring) => ring.includes(vertex)),
    );
  // hips = 0, spine = 1, neck = 2, head = 3
  const boneRows = Array.from({ length: count }, (_, vertex) => {
    const y = ys[Math.min(ringOf(vertex), ys.length - 1)];
    if (y < -0.3) return { bones: [0, 0, 0, 0], weights: [1, 0, 0, 0] };
    if (y < -0.1) return { bones: [1, 0, 0, 0], weights: [1, 0, 0, 0] };
    return { bones: [2, 3, 0, 0], weights: [0.6, 0.4, 0, 0] };
  });
  const joint = (
    bone: "hips" | "spine" | "neck" | "head",
    parent: "hips" | "spine" | "neck" | null,
    head: string,
    tail: string,
  ): IAutoMovieHumanBodyBasis["joints"][number] => ({
    bone,
    parent,
    head,
    tail,
    reference: [0, 0, 1],
    signs: { flexion: 1, abduction: -1, twist: 1 },
    neutral: { flexion: 0, abduction: 0, twist: 0 },
    constraint:
      parent === null
        ? null
        : {
            flexion: { min: -60, max: 60 },
            abduction: { min: -60, max: 60 },
            twist: { min: -80, max: 80 },
          },
  });
  const body: IAutoMovieHumanBodyBasis = {
    id: "analytic-person-body/1",
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
    ],
    landmarks: {
      ids: [
        "joint-pelvis",
        "joint-spine-4",
        "joint-neck",
        "joint-head",
        "joint-head-2",
      ],
      positions: [0, -0.5, 0, 0, -0.3, 0, 0, -0.1, 0, 0, 0.06, 0, 0, 0.2, 0],
      targets: {},
    },
    joints: [
      joint("hips", null, "joint-pelvis", "joint-spine-4"),
      joint("spine", "hips", "joint-spine-4", "joint-neck"),
      joint("neck", "spine", "joint-neck", "joint-head"),
      joint("head", "neck", "joint-head", "joint-head-2"),
    ],
    surfaces: [
      {
        id: "body",
        positions: bodyTube.positions,
        indices: bodyTube.indices,
        targets: {
          wide: radial(bodyTube.positions, upper, 0.02),
          narrow: radial(bodyTube.positions, upper, -0.01),
        },
        regions: [
          {
            id: "body/skin",
            material: "skin",
            indices: bodyTube.indices,
            uvs: null,
          },
        ],
        skin: {
          joints: ["hips", "spine", "neck", "head"],
          boneIndices: boneRows.flatMap((row) => row.bones),
          weights: boneRows.flatMap((row) => row.weights),
        },
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin",
    ),
  };
  return {
    face,
    body,
    document: {
      id: "person",
      name: "Analytic person",
      face: {
        id: "person-face",
        name: "face",
        basis: face.id,
        shape: {},
        expression: {},
      },
      body: {
        id: "person-body",
        name: "body",
        basis: body.id,
        shape: {},
      },
    },
  };
}
