import {
  deriveAutoMovieSemanticMask,
  measureAutoMovieRenderInventory,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieScene } from "@automovie/interface";
import type { IAutoMovieRenderSubject } from "@automovie/engine";

import { sceneFixture } from "../internal/renderFixtures";
import {
  vertexColourMesh,
  vertexColourModel,
} from "../internal/vertexColourFixture";

/**
 * Optional colour memory is charged only when a buffer is resident.
 *
 * Scenarios:
 * 1. A triangle costs three positions/normals/RGB triples and three Uint32 indices.
 * 2. Removing RGB subtracts exactly 36 bytes and leaves other geometry unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the same authored triangle with and without optional RGB through the real inventory and semantic-mask path and checks its resident geometry-byte cost.
 * @evidence contracts/testing.md#independent-expectations Three vertices require 12-byte position and normal triples, optional 12-byte RGB triples and three four-byte indices, yielding 120 and 84 bytes independently of inventory output.
 * @evidence contracts/testing.md#distinguishing-cases Removes only colors from a fresh colored mesh so a missing RGB charge or a charge applied to bare geometry changes one of the adjacent expectations.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous portable mesh/model/scene records, borrows no renderer and allocates no GPU buffer; the test runner executes metadata measurement without asserting visual output.
 */
export function test_render_vertex_colour_budget(): void {
  const colored: IAutoMovieMesh = vertexColourMesh();
  const { colors: _colors, ...bare }: IAutoMovieMesh = colored;
  const costs: Array<number | null> = [colored, bare].map((mesh: IAutoMovieMesh): number | null => {
    const model: IAutoMovieModel = vertexColourModel([mesh]);
    const scene: IAutoMovieScene = sceneFixture();
    scene.nodes = [{ ...scene.nodes[0]!, model: model.id }];
    const subject: IAutoMovieRenderSubject = { scene, models: [model] };
    return measureAutoMovieRenderInventory({
      subject,
      mask: deriveAutoMovieSemanticMask(subject),
    }).models[0]!.geometryBytes;
  });
  TestValidator.equals("actual RGB allocation", costs, [
    3 * (12 + 12 + 12) + 3 * 4,
    3 * (12 + 12) + 3 * 4,
  ]);
}
