import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createPortraitMaterials,
} from "@automovie/human";

/**
 * Independent analytic articulated basis, in metres, with hand-checkable
 * numbers. Three surfaces: `skin`, a unit square in the plane z = 0 whose
 * vertices 0 and 1 sit on the x axis, vertex 2 is half attached to the jaw and
 * vertex 3 is fully attached; `arch`, a triangle fully attached to the jaw;
 * `globe`, a triangle fully attached to the left eye. The jaw axis is +X
 * through the `joint-mouth` landmark at the origin, so a positive opening turns
 * (y, z) by the angle in the yz plane; full opening is 90 degrees with a
 * coupled translation of 0.1 along +Z, protrusion translates 0.5 along +Z,
 * each laterotrusion 0.3 along its side, and the sagittal budget is 0.55, so
 * a full opening leaves room for a tenth of the protrusion and no more. The
 * left eye turns about the `joint-l-eye` landmark at (2, 0, 0) by 90 degrees
 * about -X per unit of `gazeUp`. The shape channel `spacing` moves the eye
 * landmark 1 metre along +X and the skin's vertex 3 with it, which is what
 * makes an identity carry a joint. Every expression endpoint also owns one
 * small residual row on the skin, because a declared endpoint must move a
 * surface, and those rows are the tissue detail the articulation is measured
 * apart from. No portrait data or measured mesh participates.
 */
export function humanFaceArticulationFixture(): {
  basis: IAutoMovieHumanFaceBasis;
  document: IAutoMovieHumanFaceBasisDocument;
} {
  const expression = (id: string, positive = id + "Target") => ({
    id,
    kind: "expression" as const,
    minimum: 0,
    maximum: 1,
    positive,
    negative: null,
  });
  const basis: IAutoMovieHumanFaceBasis = {
    id: "analytic-articulation/1",
    channels: [
      {
        id: "spacing",
        kind: "shape",
        minimum: 0,
        maximum: 1,
        positive: "spaced",
        negative: null,
      },
      expression("open"),
      expression("forward"),
      expression("left"),
      expression("right"),
      expression("gazeUp"),
    ],
    landmarks: {
      ids: ["joint-mouth", "joint-l-eye"],
      positions: [0, 0, 0, 2, 0, 0],
      targets: { spaced: [1, 1, 0, 0] },
    },
    articulation: {
      jaw: {
        pivot: "joint-mouth",
        axisOffset: [0, 0, 0],
        axis: [1, 0, 0],
        opening: { channel: "open", degrees: 90, translation: [0, 0, 0.1] },
        protrusion: { channel: "forward", translation: [0, 0, 0.5] },
        laterotrusion: {
          left: { channel: "left", translation: [0.3, 0, 0] },
          right: { channel: "right", translation: [-0.3, 0, 0] },
        },
        translationLimitMetres: 0.55,
      },
      eyes: [
        {
          id: "leftEye",
          center: "joint-l-eye",
          gaze: [
            {
              channel: "gazeUp",
              axis: [-1, 0, 0],
              degrees: 90,
              translation: [0, 0, 0],
            },
          ],
        },
      ],
    },
    surfaces: [
      {
        id: "skin",
        positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        indices: [0, 1, 2, 0, 2, 3],
        targets: {
          spaced: [3, 1, 0, 0],
          openTarget: [0, 0, 0, 0.01],
          forwardTarget: [0, 0, 0, 0.02],
          leftTarget: [0, 0, 0, 0.03],
          rightTarget: [0, 0, 0, 0.04],
          gazeUpTarget: [0, 0, 0, 0.05],
        },
        attachments: [{ owner: "jaw", rows: [2, 0.5, 3, 1] }],
        regions: [
          {
            id: "skin/all",
            material: "skin",
            indices: [0, 1, 2, 0, 2, 3],
            uvs: null,
          },
        ],
      },
      {
        id: "arch",
        positions: [0, -1, 0, 1, -1, 0, 0, -1, 1],
        indices: [0, 1, 2],
        targets: {},
        attachments: [{ owner: "jaw", rows: [0, 1, 1, 1, 2, 1] }],
        regions: [
          { id: "arch/all", material: "lips", indices: [0, 1, 2], uvs: null },
        ],
      },
      {
        id: "globe",
        positions: [2, 0, 1, 3, 0, 1, 2, 1, 1],
        indices: [0, 1, 2],
        targets: {},
        attachments: [{ owner: "leftEye", rows: [0, 1, 1, 1, 2, 1] }],
        regions: [
          { id: "globe/all", material: "skin", indices: [0, 1, 2], uvs: null },
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
      id: "articulated",
      name: "Analytic articulated face",
      basis: basis.id,
      shape: {},
      expression: {},
    },
  };
}

/** Flat positions of the region mesh a built model carries for `regionId`. */
export function articulatedPositions(
  model: ReturnType<
    ReturnType<typeof import("@automovie/human").createHumanFaceBasisBuilder>
  >,
  regionId: string,
): number[] {
  const part = model.parts.find((one) => one.id === regionId);
  if (part === undefined || part.geometry.type !== "mesh")
    throw new Error("Expected a resident region mesh: " + regionId);
  return part.geometry.mesh.positions;
}
