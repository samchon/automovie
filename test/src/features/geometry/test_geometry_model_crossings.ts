import {
  type IAutoMovieModel,
  type IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieModelCrossing } from "@automovie/engine";
import { measureAutoMovieModelCrossings } from "@automovie/engine";

/** A model part holding one triangle from three hand-typed corners. */
const part: (
  id: string,
  corners: number[][],
) => {
  id: string;
  name: string;
  material: string;
  geometry: {
    type: "mesh";
    mesh: {
      positions: number[];
      indices: number[];
      normals: null;
      uvs: null;
      skin: null;
    };
  };
  attachedBone: null;
  transform: null;
} = (
  id: string,
  corners: number[][],
): {
  id: string;
  name: string;
  material: string;
  geometry: {
    type: "mesh";
    mesh: {
      positions: number[];
      indices: number[];
      normals: null;
      uvs: null;
      skin: null;
    };
  };
  attachedBone: null;
  transform: null;
} => ({
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

const model: (parts: IAutoMovieModelPart[]) => IAutoMovieModel = (
  parts: IAutoMovieModelPart[],
): IAutoMovieModel => ({
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
const floor: number[][] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
];
/** Stands upright through the floor's interior. */
const blade: number[][] = [
  [0.25, 0.25, -1],
  [0.25, 0.25, 1],
  [0.75, 0.25, 1],
];
/** Sits above the floor, sharing no space with it. */
const above: number[][] = [
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
 * The deliberately clear neighbours must have empty reports, whereas the
 * piercing pair must be reported. Neither result certifies a model's closed
 * volume, layered anatomy or visual acceptability.
 *
 * Scenarios:
 * 1. Two crossing parts are reported once, in model order, with both directions counted.
 * 2. A part sharing no space with the others produces no entry, and neither does a clear model.
 * 3. Only the crossing pair appears when a model holds three parts, two of which are clear.
 * 4. Parts whose geometry is not a mesh are skipped rather than refused.
 * 5. A model of one part, or of none, reports nothing.
 * 6. Parts are measured where their transforms place them: a part authored
 *    clear but moved through the floor crosses it, and a part authored
 *    through the floor but moved away does not.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures actual model-part crossings and checks directional witness counts, model-order pair identities, triangle-level misses despite overlapping bounds, skipped nonmesh records, empty/singleton input and transformed placement. It catches local-coordinate or bounding-box-only classification.
 * @evidence contracts/testing.md#independent-expectations The authored blade pierces the unit floor once in each direction; the lifted and lateral neighbours do not. The two explicit Z translations move the existing blade across or away from the floor with identity rotation/unit scale. Expected counts are subject-triangle witnesses, not all intersecting face pairs or solid-volume overlap; the forged nonmesh tag only exercises the observer's skip boundary, not a valid primitive admission.
 * @evidence contracts/testing.md#distinguishing-cases Keeps crossing/clear/disjoint and bounds-overlap neighbours, three-part order, forged nonmesh record, empty/singleton model and each retained transform. Within-part self examination and complete mesh-pair enumeration belong to separate entries; no anatomical or pixel validity is inferred.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry directly calls portable model-crossing source, which transforms actual mesh records and invokes numerical crossing observation. It starts no process, browser, GPU or native build, installs no consumer and registers no new Human fixtures or dynamic cases.
 */
export function test_geometry_model_crossings(): void {
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
    ).map((entry: IAutoMovieModelCrossing): string[] => [
      entry.part,
      entry.other,
    ]),
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
  const sphere: {
    geometry: { type: "sphere"; radius: number };
    id: string;
    name: string;
    material: string;
    attachedBone: null;
    transform: null;
  } = {
    ...part("sphere", floor),
    geometry: { type: "sphere" as const, radius: 1 },
  };
  TestValidator.equals(
    "a part that is not a mesh is skipped, not refused",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), sphere as never, part("blade", blade)]),
    ).map((entry: IAutoMovieModelCrossing): string[] => [
      entry.part,
      entry.other,
    ]),
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
  const flat: number[][] = [
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
  // `above` spans z 1..2; lowered by 1.5 it spans -0.5..0.5 and its edges
  // pierce the floor at (0.25, 0.25) and (0.5, 0.25), both inside it.
  const moved: (
    id: string,
    corners: number[][],
    z: number,
  ) => IAutoMovieModelPart = (
    id: string,
    corners: number[][],
    z: number,
  ): IAutoMovieModelPart => ({
    ...part(id, corners),
    transform: {
      translation: { x: 0, y: 0, z },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  TestValidator.equals(
    "a part moved through the floor crosses it",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), moved("lowered", above, -1.5)]),
    ),
    [
      {
        part: "floor",
        other: "lowered",
        triangles: 1,
        otherTriangles: 1,
        coplanar: 0,
      },
    ],
  );
  TestValidator.equals(
    "a part moved off the floor no longer crosses it",
    measureAutoMovieModelCrossings(
      model([part("floor", floor), moved("raised", blade, 5)]),
    ),
    [],
  );
}
