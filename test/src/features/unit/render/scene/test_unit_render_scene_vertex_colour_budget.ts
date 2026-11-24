import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieRenderSubject,
  IAutoMovieScene,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sceneFixture } from "../../../internal/renderFixtures";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../../../internal/vertexColourFixture";

/**
 * Optional colour memory is charged only when a buffer is resident.
 *
 * Scenarios:
 * 1. A triangle costs three positions/normals/RGB triples and three Uint32 indices.
 * 2. Removing RGB subtracts exactly 36 bytes and leaves other geometry unchanged.
 */
export function test_unit_render_scene_vertex_colour_budget(): void {
  const colored: IAutoMovieMesh = vertexColourMesh();
  const { colors: _colors, ...bare }: IAutoMovieMesh = colored;
  const costs: Array<number | null> = [colored, bare].map(
    (mesh: IAutoMovieMesh): number | null => {
      const model: IAutoMovieModel = vertexColourModel([mesh]);
      const scene: IAutoMovieScene = sceneFixture();
      scene.nodes = [{ ...scene.nodes[0]!, model: model.id }];
      const subject: IAutoMovieRenderSubject = { scene, models: [model] };
      return measureAutoMovieRenderInventory({
        subject,
        mask: deriveAutoMovieSemanticMask(subject),
      }).models[0]!.geometryBytes;
    },
  );
  TestValidator.equals("actual RGB allocation", costs, [
    3 * (12 + 12 + 12) + 3 * 4,
    3 * (12 + 12) + 3 * 4,
  ]);
}
