import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieRenderSubject,
  IAutoMovieScene,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { instanceSetFixture, sceneFixture } from "../../../internal/renderFixtures";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../../../internal/vertexColourFixture";

/**
 * Instanced RGB identity padding is resident memory, charged once per model.
 *
 * Scenarios:
 * 1. Ordinary mixed triangles cost 204 bytes; flattening adds 36 white RGB bytes.
 * 2. Instance sets and formations each charge that padding, without multiplying
 *    it by slot count or charging it twice when both use the same prototype.
 * 3. All-bare/all-coloured models add no padding; a bare box next to a coloured
 *    triangle contributes 24 white triples while retaining its original cost.
 */
export function test_unit_render_scene_vertex_colour_instancing_budget(): void {
  const colored: IAutoMovieMesh = vertexColourMesh();
  const { colors: _colors, ...bare }: IAutoMovieMesh = colored;
  const models: IAutoMovieModel[] = [
    vertexColourModel([colored, bare]),
    vertexColourModel([colored, colored]),
    vertexColourModel([bare, bare]),
    vertexColourModel([colored, bare]),
  ];
  models[3]!.parts[1]!.geometry = {
    type: "primitive",
    shape: { type: "box", width: 1, height: 1, depth: 1 },
  };
  const expected: number[][] = [
    [204, 240],
    [240, 240],
    [168, 168],
    [840, 1128],
  ];
  for (const [index, model] of models.entries()) {
    const set: IAutoMovieCompiledInstanceSet = instanceSetFixture({
      id: "copies",
      count: 8,
      chunks: 2,
      model: model.id,
    });
    const formation: IAutoMovieCompiledFormation = {
      ...set,
      id: "crowd",
      anonymousCount: set.count,
      chunks: set.chunks.map(
        (
          chunk: IAutoMovieCompiledInstanceSet["chunks"][number],
        ): IAutoMovieCompiledFormation["chunks"][number] => ({
          ...chunk,
          anonymousCount: chunk.count,
        }),
      ),
      ground: [],
      heroes: [],
      phase: { seed: 1 },
      layout: {
        kind: "line",
        files: 8,
        ranks: 1,
        spacing: { lateral: 1, depth: 1 },
      },
    };
    const scene: IAutoMovieScene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: model.id }];
    scene.lights = [];
    const costs: Array<number | null> = [0, 1, 2, 3].map(
      (mode: number): number | null => {
        const subject: IAutoMovieRenderSubject = {
          scene,
          models: [model],
          instanceSets: mode & 1 ? [set] : [],
          formations: mode & 2 ? [formation] : [],
        };
        const inventory: ReturnType<typeof measureAutoMovieRenderInventory> =
          measureAutoMovieRenderInventory({
            subject,
            mask: deriveAutoMovieSemanticMask(subject),
          });
        TestValidator.equals(
          "model and total agree",
          inventory.models[0]!.geometryBytes,
          inventory.totals.geometryBytes,
        );
        return inventory.totals.geometryBytes;
      },
    );
    TestValidator.equals("resident padded geometry", costs, [
      expected[index]![0],
      ...new Array(3).fill(expected[index]![1]),
    ]);
  }
}
