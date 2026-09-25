import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A model part holding the given hand-typed triangles as one mesh. */
const part = (id: string, triangles: number[][][]) => ({
  id,
  name: id,
  material: "skin",
  geometry: {
    type: "mesh" as const,
    mesh: {
      positions: triangles.flat(2),
      indices: triangles.flatMap((_, t) => [t * 3, t * 3 + 1, t * 3 + 2]),
      normals: null,
      uvs: null,
      skin: null,
    },
  },
  attachedBone: null,
  transform: null,
});

const model = (parts: ReturnType<typeof part>[]): IAutoMovieModel => ({
  id: "within",
  name: "within",
  origin: "imported",
  parts,
  materials: [],
  skeleton: null,
  body: null,
  asset: null,
});

const floor = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
];
/** Stands upright through the floor's interior. */
const blade = [
  [0.25, 0.25, -1],
  [0.25, 0.25, 1],
  [0.75, 0.25, 1],
];
/** Shares the floor's edge (0,0,0)-(1,0,0) and folds up out of its plane. */
const hinge = [
  [0, 0, 0],
  [1, 0, 0],
  [0.5, -0.5, 0.5],
];
/** Shares only the floor's corner (0,0,0), clear of it elsewhere. */
const fan = [
  [0, 0, 0],
  [-1, 0, 0.2],
  [-1, -1, 0.2],
];
/** Lies in the floor's plane and overlaps its area. */
const overlap = [
  [0.1, 0.1, 0],
  [0.6, 0.1, 0],
  [0.1, 0.6, 0],
];

/**
 * A skin segment that passes through itself is found only when the caller
 * asks for each part against itself, and touching is still not crossing.
 *
 * Expected values follow from the hand-typed corners: the blade crosses the
 * floor's interior and the floor crosses the blade, so a part holding both
 * counts two of its own triangles crossed; the same two triangles as
 * separate parts are the ordinary pair.
 *
 * Scenarios:
 * 1. One part holding the floor and the blade reports `{part, other: part,
 *    triangles: 2, otherTriangles: 2, coplanar: 0}` with `withinParts`, and
 *    nothing without it (the default keeps layered parts silent).
 * 2. A hinge sharing an edge with the floor and a fan sharing one corner are
 *    touching: one part holding floor, hinge and fan reports nothing.
 * 3. A triangle lying in the floor's plane over its area counts as coplanar
 *    crossing on both triangles.
 * 4. The self entry precedes the part's pairs: a part holding floor and
 *    blade beside a second part holding a blade reports the self entry, then
 *    the pair, in model order; a single one-triangle part reports nothing.
 */
export const test_geometry_model_crossings_within_parts = (): void => {
  TestValidator.equals(
    "a part crossing itself is counted with withinParts",
    measureAutoMovieModelCrossings(model([part("skin", [floor, blade])]), {
      withinParts: true,
    }),
    [
      {
        part: "skin",
        other: "skin",
        triangles: 2,
        otherTriangles: 2,
        coplanar: 0,
      },
    ],
  );
  TestValidator.equals(
    "the default leaves a part's own layers silent",
    measureAutoMovieModelCrossings(model([part("skin", [floor, blade])])),
    [],
  );
  TestValidator.equals(
    "an edge-sharing hinge and a corner-sharing fan are touching",
    measureAutoMovieModelCrossings(model([part("skin", [floor, hinge, fan])]), {
      withinParts: true,
    }),
    [],
  );
  TestValidator.equals(
    "a coplanar overlap counts as flat crossing",
    measureAutoMovieModelCrossings(model([part("skin", [floor, overlap])]), {
      withinParts: true,
    }),
    [
      {
        part: "skin",
        other: "skin",
        triangles: 2,
        otherTriangles: 2,
        coplanar: 2,
      },
    ],
  );
  TestValidator.equals(
    "the self entry precedes the part's pairs",
    measureAutoMovieModelCrossings(
      model([part("skin", [floor, blade]), part("other", [blade])]),
      { withinParts: true },
    ).map((one) => [one.part, one.other]),
    [
      ["skin", "skin"],
      ["skin", "other"],
    ],
  );
  TestValidator.equals(
    "a single triangle never crosses itself",
    measureAutoMovieModelCrossings(model([part("one", [floor])]), {
      withinParts: true,
    }),
    [],
  );
};
