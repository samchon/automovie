import { deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

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
 */
export const test_render_texture_used_bindings = (): void => {
  const plain = material("plain");
  const textured = material("textured", "image");
  const model = boxModel({ id: "model", materials: [plain, textured] });
  const scene = { ...sceneFixture(), nodes: [{ ...sceneFixture().nodes[0], model: "model" }], lights: [] };
  const textures = [{ asset: "image", width: 4, height: 4, format: "rgba8" as const, mipmapped: false }];
  const inspect = (parts = model.parts) => {
    const subject = { scene, models: [{ ...model, parts }], textures };
    return measureAutoMovieRenderInventory({ subject, mask: deriveAutoMovieSemanticMask(subject) });
  };
  TestValidator.equals("unused declaration has no upload", [inspect().totals.materials, inspect().totals.textureBytes], [1, 1024]);
  const part = { ...model.parts[0], material: "textured" };
  TestValidator.equals("actual binding owns an upload", inspect([part]).totals.textureBytes, 1024 + 4 * 4 * 4);
  TestValidator.equals("repeated binding shares one upload", inspect([part, { ...part, id: "other-part" }]).textures.filter((row) => row.asset === "image").length, 1);
  for (const binding of [null, "missing"])
    TestValidator.equals("default PBR path remains represented", inspect([{ ...part, material: binding }]).totals.textureBytes, 1024);
};
