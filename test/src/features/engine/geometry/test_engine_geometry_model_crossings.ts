import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieModelCrossing,
  IAutoMovieModelPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `measureModelCrossings` lists the pairs of a model's parts that pass
 * through each other, where their transforms place them, and with `withinParts`
 * also a part crossing itself; touching is not crossing.
 *
 * Fixture: the floor (0,0,0), (1,0,0), (0,1,0); a blade through its interior; the
 * blade lifted to z 1..2 (`above`); a hinge sharing the floor's edge; a fan
 * sharing one corner; a flat triangle overlapping the floor in its plane.
 *
 * Scenarios:
 *
 * 1. Floor and blade: one entry with one triangle each way; floor and above:
 *    none; of floor, above and blade only floor-blade; floor and a corner
 *    triangle whose bounds only overlap: none.
 * 2. A primitive (non-mesh) part between them is skipped; one part or none
 *    reports nothing.
 * 3. A coplanar overlap counts one triangle each way, coplanar 2.
 * 4. Above lowered 1.5 crosses the floor; the blade raised 5 does not.
 * 5. One part holding floor and blade: with `withinParts` a self entry (2, 2,
 *    coplanar 0), without it nothing; floor, hinge and fan in one part touch
 *    only; floor and the flat overlap in one part count coplanar 2; a self
 *    entry precedes its part's pairs; a single triangle never crosses itself.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names between-part and self crossings, transforms, contact-only cases, coplanarity and skipped primitive parts.
 * @evidence contracts/development/testing.md#behavioral-verification Measures several literal model part configurations, reading pair order, exact counts and changes after placement.
 * @evidence contracts/development/testing.md#independent-expectations A blade crosses its known floor plane through the triangle interior. Raised geometry, hinges and shared corners do not pierce it. The flat overlapping face supplies the distinct coplanar case.
 */
export function test_engine_geometry_model_crossings(): void {
  const part = (id: string, triangles: number[][][]): IAutoMovieModelPart => ({
    id,
    name: id,
    material: "skin",
    geometry: {
      type: "mesh",
      mesh: {
        positions: triangles.flat(2),
        indices: triangles.flatMap((_: number[][], t: number): number[] => [3 * t, 3 * t + 1, 3 * t + 2]),
        normals: null,
        uvs: null,
        skin: null,
      },
    },
    attachedBone: null,
    transform: null,
  });
  const model = (parts: IAutoMovieModelPart[]): IAutoMovieModel => ({
    id: "crossing",
    name: "crossing",
    origin: "imported",
    parts,
    materials: [],
    skeleton: null,
    body: null,
    asset: null,
  });
  const entry = (a: string, b: string, coplanar: number = 0, n: number = 1): IAutoMovieModelCrossing => ({
    part: a,
    other: b,
    triangles: n,
    otherTriangles: n,
    coplanar,
  });
  const pairs = (m: IAutoMovieModel, withinParts: boolean = false): string[][] =>
    AutoMovieEngineGeometry.measureModelCrossings(m, { withinParts }).map((e: IAutoMovieModelCrossing): string[] => [e.part, e.other]);
  const floor: number[][] = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ];
  const blade: number[][] = [
    [0.25, 0.25, -1],
    [0.25, 0.25, 1],
    [0.75, 0.25, 1],
  ];
  const above: number[][] = [
    [0.25, 0.25, 1],
    [0.25, 0.25, 2],
    [0.75, 0.25, 2],
  ];

  // 1.
  TestValidator.equals(
    "pair",
    AutoMovieEngineGeometry.measureModelCrossings(model([part("floor", [floor]), part("blade", [blade])])),
    [entry("floor", "blade")],
  );
  TestValidator.equals("clear", AutoMovieEngineGeometry.measureModelCrossings(model([part("floor", [floor]), part("above", [above])])), []);
  TestValidator.equals(
    "three parts",
    pairs(model([part("floor", [floor]), part("above", [above]), part("blade", [blade])])),
    [["floor", "blade"]],
  );
  TestValidator.equals(
    "bounds only",
    AutoMovieEngineGeometry.measureModelCrossings(
      model([
        part("floor", [floor]),
        part("corner", [
          [
            [0.9, 0.9, 0],
            [1.5, 0.9, 0],
            [0.9, 1.5, 0],
          ],
        ]),
      ]),
    ),
    [],
  );

  // 2.
  const sphere: IAutoMovieModelPart = {
    ...part("sphere", [floor]),
    geometry: { type: "primitive", shape: { type: "sphere", radius: 1 } },
  };
  TestValidator.equals(
    "primitive skipped",
    pairs(model([part("floor", [floor]), sphere, part("blade", [blade])])),
    [["floor", "blade"]],
  );
  TestValidator.equals("one part", AutoMovieEngineGeometry.measureModelCrossings(model([part("floor", [floor])])), []);
  TestValidator.equals("empty", AutoMovieEngineGeometry.measureModelCrossings(model([])), []);

  // 3.
  TestValidator.equals(
    "coplanar",
    AutoMovieEngineGeometry.measureModelCrossings(
      model([
        part("floor", [floor]),
        part("flat", [
          [
            [0.5, -0.5, 0],
            [0.5, 0.5, 0],
            [1.5, 0.5, 0],
          ],
        ]),
      ]),
    ),
    [entry("floor", "flat", 2)],
  );

  // 4.
  const moved = (id: string, corners: number[][], z: number): IAutoMovieModelPart => ({
    ...part(id, [corners]),
    transform: {
      translation: { x: 0, y: 0, z },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  TestValidator.equals(
    "lowered",
    AutoMovieEngineGeometry.measureModelCrossings(model([part("floor", [floor]), moved("lowered", above, -1.5)])),
    [entry("floor", "lowered")],
  );
  TestValidator.equals("raised", AutoMovieEngineGeometry.measureModelCrossings(model([part("floor", [floor]), moved("raised", blade, 5)])), []);

  // 5.
  const skin: IAutoMovieModel = model([part("skin", [floor, blade])]);
  TestValidator.equals("self", AutoMovieEngineGeometry.measureModelCrossings(skin, { withinParts: true }), [entry("skin", "skin", 0, 2)]);
  TestValidator.equals("self silent by default", AutoMovieEngineGeometry.measureModelCrossings(skin), []);
  const hinge: number[][] = [
    [0, 0, 0],
    [1, 0, 0],
    [0.5, -0.5, 0.5],
  ];
  const fan: number[][] = [
    [0, 0, 0],
    [-1, 0, 0.2],
    [-1, -1, 0.2],
  ];
  TestValidator.equals(
    "touching",
    AutoMovieEngineGeometry.measureModelCrossings(model([part("skin", [floor, hinge, fan])]), { withinParts: true }),
    [],
  );
  const overlap: number[][] = [
    [0.1, 0.1, 0],
    [0.6, 0.1, 0],
    [0.1, 0.6, 0],
  ];
  TestValidator.equals(
    "self coplanar",
    AutoMovieEngineGeometry.measureModelCrossings(model([part("skin", [floor, overlap])]), { withinParts: true }),
    [entry("skin", "skin", 2, 2)],
  );
  TestValidator.equals(
    "self first",
    pairs(model([part("skin", [floor, blade]), part("other", [blade])]), true),
    [
      ["skin", "skin"],
      ["skin", "other"],
    ],
  );
  TestValidator.equals(
    "single triangle",
    AutoMovieEngineGeometry.measureModelCrossings(model([part("one", [floor])]), { withinParts: true }),
    [],
  );
}
