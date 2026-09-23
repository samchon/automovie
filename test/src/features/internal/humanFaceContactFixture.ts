import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createPortraitMaterials,
} from "@automovie/human";

/**
 * An analytic contact basis whose every answer is known in closed form.
 *
 * The frame is up +Y, forward +Z, transverse +X, which is also the opening
 * frame the contact rules read. The mandible turns about +X through the
 * origin by 90 degrees at full opening and translates (0, 0, 1.1) with it,
 * so the lower incisor at (0, -0.1, 1) lands at (0, -1, 1).
 *
 * Two octahedral crowns of L1 radius 0.2 sit at (0, +-0.3, 1); the lower one
 * rides the jaw and seals its bottom four faces through closure triangles.
 * The mouth is two lip triangles 0.1 apart at z = 1.4, the lower one on the
 * jaw, with a closure row decomposed at full opening that brings the lower
 * lip vertex exactly onto the upper one, and a `press` row that drives a
 * lower lip corner 0.05 inside a face of the lower crown. The tongue is a fixed tetrahedron
 * 0.3 tall behind the incisal plane whose `out` row carries it 0.6 forward.
 * A closed `globe` octahedron of L1 radius 0.2 at (0, 2, 1) stands in for an
 * eye: nothing touches it, so it is a second rigid collider the preparation
 * seals with no ring and the resolution queries without effect.
 */
export function humanFaceContactFixture(): {
  basis: IAutoMovieHumanFaceBasis;
  document: IAutoMovieHumanFaceBasisDocument;
} {
  const expression = (id: string) => ({
    id,
    kind: "expression" as const,
    minimum: 0,
    maximum: 1,
    positive: id + "Target",
    negative: null,
  });
  const octahedron = (
    cy: number,
  ): { positions: number[]; upper: number[]; lower: number[] } => ({
    // 0 +x, 1 -x, 2 +y (top), 3 -y (bottom), 4 +z, 5 -z
    positions: [
      0.2,
      cy,
      1,
      -0.2,
      cy,
      1,
      0,
      cy + 0.2,
      1,
      0,
      cy - 0.2,
      1,
      0,
      cy,
      1.2,
      0,
      cy,
      0.8,
    ],
    upper: [2, 4, 0, 2, 1, 4, 2, 5, 1, 2, 0, 5],
    lower: [3, 0, 4, 3, 4, 1, 3, 1, 5, 3, 5, 0],
  });
  const top = octahedron(0.3);
  const bottom = octahedron(-0.3);
  const basis: IAutoMovieHumanFaceBasis = {
    id: "analytic-contact/1",
    channels: [
      {
        id: "wide",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "wider",
        negative: null,
      },
      expression("open"),
      expression("forward"),
      expression("left"),
      expression("right"),
      expression("close"),
      expression("out"),
      expression("press"),
    ],
    landmarks: {
      ids: ["joint-mouth"],
      positions: [0, 0, 0],
      targets: { wider: [0, 0.1, 0, 0] },
    },
    articulation: {
      jaw: {
        pivot: "joint-mouth",
        axisOffset: [0, 0, 0],
        axis: [1, 0, 0],
        opening: { channel: "open", degrees: 90, translation: [0, 0, 1.1] },
        protrusion: { channel: "forward", translation: [0, 0, 0] },
        laterotrusion: {
          left: { channel: "left", translation: [0, 0, 0] },
          right: { channel: "right", translation: [0, 0, 0] },
        },
        translationLimitMetres: 2,
      },
      eyes: [],
    },
    contact: {
      lips: { surface: "mouth", upper: 0, lower: 3 },
      incisors: { surface: "teeth", upper: 3, lower: 6 + 2 },
      closure: { channel: "close", reference: "open" },
      passage: { surface: "tongue", channel: "out", slabMetres: 0.5 },
      colliders: [
        {
          surface: "teeth",
          closure: bottom.lower.map((v) => v + 6),
          reachMetres: 1,
        },
      ],
      soft: [
        { surface: "mouth", budgetMetres: 0.5 },
        { surface: "tongue", budgetMetres: 0 },
      ],
      toleranceMetres: 1e-9,
    },
    surfaces: [
      {
        id: "teeth",
        positions: [...top.positions, ...bottom.positions],
        indices: [
          ...top.upper,
          ...top.lower,
          ...bottom.upper.map((v) => v + 6),
        ],
        targets: { wider: [0, 0.1, 0, 0] },
        attachments: [
          { owner: "jaw", rows: [6, 1, 7, 1, 8, 1, 9, 1, 10, 1, 11, 1] },
        ],
        regions: [
          {
            id: "teeth/all",
            material: "skin",
            indices: [
              ...top.upper,
              ...top.lower,
              ...bottom.upper.map((v) => v + 6),
            ],
            uvs: null,
          },
        ],
      },
      {
        id: "mouth",
        // 0 upper lip seam, 1 2 upper corners, 3 lower lip seam, 4 5 lower corners
        positions: [
          0, 0.05, 1.4, 0.5, 0.3, 1.4, -0.5, 0.3, 1.4, 0, -0.05, 1.4, 0.5, -0.3,
          1.4, -0.5, -0.3, 1.4,
        ],
        indices: [0, 1, 2, 3, 5, 4],
        targets: {
          closeTarget: [3, 0, 0.35, -1.45],
          pressTarget: [4, -0.45, 0.05, -0.35],
        },
        attachments: [{ owner: "jaw", rows: [3, 1, 4, 1, 5, 1] }],
        regions: [
          {
            id: "mouth/all",
            material: "lips",
            indices: [0, 1, 2, 3, 5, 4],
            uvs: null,
          },
        ],
      },
      {
        id: "globe",
        positions: octahedron(2).positions,
        indices: [...octahedron(2).upper, ...octahedron(2).lower],
        targets: {},
        regions: [
          {
            id: "globe/all",
            material: "skin",
            indices: [...octahedron(2).upper, ...octahedron(2).lower],
            uvs: null,
          },
        ],
      },
      {
        id: "tongue",
        positions: [0, -0.3, 0.7, 0.2, -0.3, 0.9, -0.2, -0.3, 0.9, 0, 0, 0.9],
        indices: [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3],
        targets: {
          outTarget: [0, 0, 0, 0.6, 1, 0, 0, 0.6, 2, 0, 0, 0.6, 3, 0, 0, 0.6],
        },
        regions: [
          {
            id: "tongue/all",
            material: "skin",
            indices: [0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3],
            uvs: null,
          },
        ],
      },
    ],
    materials: createPortraitMaterials().filter(
      (material) => material.id === "skin" || material.id === "lips",
    ),
  };
  return {
    basis,
    document: {
      id: "contact",
      name: "Analytic contact face",
      basis: basis.id,
      shape: {},
      expression: {},
    },
  };
}
