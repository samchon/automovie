import { deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory, type IAutoMovieRenderSubject, type IAutoMovieRenderTextureSource } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieMaterial, IAutoMovieModel, IAutoMovieScene } from "@automovie/interface";

import { boxModel, material, sceneFixture } from "../internal/renderFixtures";

/**
 * A material declaration consumes no texture until a drawable binds it. The
 * actual model part references define both PBR lookup and source upload closure.
 *
 * Scenarios:
 *
 * 1. A used plain material and an unused textured declaration retain only the
 *    shared PBR lookup; binding the latter adds its independently computed bytes.
 * 2. Repeated part references share the same material/upload and a null or
 *    missing material follows the Viewer's supported default PBR path.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises inventory selection from actual model-part bindings and checks material count, raw image upload deduplication and default-PBR lookup accounting.
 * @evidence contracts/testing.md#independent-expectations The unused declaration expects one material and the fixed 1024-byte lookup; binding a 4-by-4 RGBA8 image independently adds 64 bytes, and repeated bindings expect one image row.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts unused and used textured declarations, repeated part bindings and null versus unresolved material references on the same scene.
 * @evidence contracts/testing.md#execution-ownership Owns synchronous portable metadata fixtures and invokes the real semantic-mask and inventory functions; the test runner owns execution, and no Viewer draw or native texture upload is observed.
 */
export function test_render_texture_used_bindings(): void {
  const plain: IAutoMovieMaterial = material("plain");
  const textured: IAutoMovieMaterial = material("textured", "image");
  const model: IAutoMovieModel = boxModel({ id: "model", materials: [plain, textured] });
  const scene: IAutoMovieScene = { ...sceneFixture(), nodes: [{ ...sceneFixture().nodes[0], model: "model" }], lights: [] };
  const textures: IAutoMovieRenderTextureSource[] = [{ asset: "image", width: 4, height: 4, format: "rgba8" as const, mipmapped: false }];
  const inspect: (parts?: IAutoMovieModel["parts"]) => ReturnType<typeof measureAutoMovieRenderInventory> = (parts: IAutoMovieModel["parts"] = model.parts): ReturnType<typeof measureAutoMovieRenderInventory> => {
    const subject: IAutoMovieRenderSubject = { scene, models: [{ ...model, parts }], textures };
    return measureAutoMovieRenderInventory({ subject, mask: deriveAutoMovieSemanticMask(subject) });
  };
  TestValidator.equals("unused declaration has no upload", [inspect().totals.materials, inspect().totals.textureBytes], [1, 1024]);
  const part: IAutoMovieModel["parts"][number] = { ...model.parts[0], material: "textured" };
  TestValidator.equals("actual binding owns an upload", inspect([part]).totals.textureBytes, 1024 + 4 * 4 * 4);
  TestValidator.equals("repeated binding shares one upload", inspect([part, { ...part, id: "other-part" }]).textures.filter((row: ReturnType<typeof measureAutoMovieRenderInventory>["textures"][number]): boolean => row.asset === "image").length, 1);
  for (const binding of [null, "missing"])
    TestValidator.equals("default PBR path remains represented", inspect([{ ...part, material: binding }]).totals.textureBytes, 1024);
}
