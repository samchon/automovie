import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A model part holding one triangle from three hand-typed corners. */
const part = (id: string, corners: number[][]) => ({
  id,
  name: id,
  material: "skin",
  geometry: {
    type: "mesh" as const,
    mesh: {
      positions: corners.flat(),
      indices: [0, 1, 2],
      normals: null,
      uvs: null,
      skin: null,
    },
  },
  attachedBone: null,
  transform: null,
});

const model = (parts: ReturnType<typeof part>[]): IAutoMovieModel => ({
  id: "crossing",
  name: "crossing",
  origin: "imported",
  parts,
  materials: [],
  skeleton: null,
  body: null,
  asset: null,
});

/** Lies flat on z=0; every case is read against it. */
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
/** Sits above the floor, sharing no space with it. */
const above = [
  [0.25, 0.25, 1],
  [0.25, 0.25, 2],
  [0.75, 0.25, 2],
];

/**
 * A model reports the pairs of its own parts that pass through each other.
 *
 * A successful build says nothing about whether composing its operations put
 * two surfaces in the same place, so this is judged from topology. Expected
 * values come from the coordinates: the blade pierces the floor's interior and
 * the floor pierces the blade, so both directions count one, while a part
 * lifted clear shares no space with anything and a third part disjoint from
 * both must not appear at all.
 *
 * These parts are deliberately separate shells, so an empty report is the right
 * answer here. That is a property of this fixture and not of models generally:
 * a layered character rests with its shells inside each other, and the reading
 * that carries information there is the change from its own rest pose.
 *
 * Scenarios:
 * 1. Two crossing parts are reported once, in model order, with both directions counted.
 * 2. A part sharing no space with the others produces no entry, and neither does a clear model.
 * 3. Only the crossing pair appears when a model holds three parts, two of which are clear.
 * 4. Parts whose geometry is not a mesh are skipped rather than refused.
 * 5. A model of one part, or of none, reports nothing.
 */
export const test_geometry_model_crossings = (): void => {
  TestValidator.equals(
    "a crossing pair is reported once with both directions",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), part("blade", blade)]),
    ),
    [
      {
        part: "floor",
        other: "blade",
        triangles: 1,
        otherTriangles: 1,
        coplanar: 0,
      },
    ],
  );
  TestValidator.equals(
    "parts clear of each other report nothing",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), part("above", above)]),
    ),
    [],
  );
  TestValidator.equals(
    "only the crossing pair of three parts appears",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), part("above", above), part("blade", blade)]),
    ).map((entry) => [entry.part, entry.other]),
    [["floor", "blade"]],
  );
  // The bounds of these two overlap in the far corner, so the cheap rejection
  // cannot decide it and the answer really comes from the triangles.
  TestValidator.equals(
    "overlapping bounds without overlapping surfaces report nothing",
    measureAutoMovieModelCrossings(
      model([
        part("floor", floor),
        part("corner", [
          [0.9, 0.9, 0],
          [1.5, 0.9, 0],
          [0.9, 1.5, 0],
        ]),
      ]),
    ),
    [],
  );
  const sphere = {
    ...part("sphere", floor),
    geometry: { type: "sphere" as const, radius: 1 },
  };
  TestValidator.equals(
    "a part that is not a mesh is skipped, not refused",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), sphere as never, part("blade", blade)]),
    ).map((entry) => [entry.part, entry.other]),
    [["floor", "blade"]],
  );
  TestValidator.equals(
    "one part cannot cross anything",
    measureAutoMovieModelCrossings(model([part("floor", floor)])),
    [],
  );
  TestValidator.equals(
    "an empty model reports nothing",
    measureAutoMovieModelCrossings(model([])),
    [],
  );
  const flat = [
    [0.5, -0.5, 0],
    [0.5, 0.5, 0],
    [1.5, 0.5, 0],
  ];
  TestValidator.equals(
    "coplanar overlap is counted and flagged",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), part("flat", flat)]),
    ),
    [
      {
        part: "floor",
        other: "flat",
        triangles: 1,
        otherTriangles: 1,
        coplanar: 2,
      },
    ],
  );
};
