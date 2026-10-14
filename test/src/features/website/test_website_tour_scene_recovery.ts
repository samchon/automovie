import { TestValidator } from "@nestia/e2e";

import { loadTourScene } from "../../../../website/src/loadTourScene";
import { tourData } from "../internal/tourData";
import { tourSceneFixture } from "../internal/tourSceneFixture";

/**
 * A failed upload attempts cleanup of previously acquired images and environment resources without losing its original cause. Successful loading returns once-only cleanup whose early dispose-event failure cannot prevent later resource attempts.
 *
 * Scenarios:
 * 1. A temple upload failure attempts its decoded image and native sky cleanup.
 * 2. A future upload failure attempts its offscreen daylight environment cleanup.
 * 3. A rollback texture listener throws: sky cleanup still runs and both causes survive.
 * 4. A loaded scene's geometry listener throws: material, depth material, textures and sky still receive their cleanup events once.
 *
 * @evidence contracts/testing.md#behavioral-verification Directly calls loadTourScene with the existing supplied uploader/load ports and observes actual Three dispose events; cause identity and later event counts catch lost upload failures, early cleanup interruption and repeated disposal.
 * @evidence contracts/testing.md#independent-expectations Each explicitly acquired image, sky or scene resource receives one cleanup attempt, while independently supplied upload/dispose errors retain identity; event expectations follow those owned inputs rather than a captured adapter output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves temple and future upload refusal cases and adds failed rollback plus successful loading with failed final cleanup and repeated receipt; other units cover texture readiness and scene projection, and CPU events do not certify native GPU release.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous unit directly imports its product owner, reuses existing in-memory fixtures and supplies owned dependency callbacks; it replaces no global or foreign method and starts no browser, renderer, network or asset acquisition.
 */
export async function test_website_tour_scene_recovery(): Promise<void> {
  const fixture: ReturnType<typeof tourSceneFixture> = tourSceneFixture();
  const data: ReturnType<typeof tourData> = tourData();
  data.native = {
    models: [{ materials: [{ id: "stone", baseColorTexture: "textures/stone.png" }] }],
  };
  let imagesDisposed: number = 0;
  let skyDisposed: number = 0;
  const templeFailure: Error = new Error("invalid temple mesh");
  const templeDependencies: Parameters<typeof loadTourScene>[3] = {
    ...fixture.dependencies,
    load: async (url: string): Promise<import("three").Texture> => {
      const texture: import("three").Texture = await fixture.dependencies.load(url);
      texture.addEventListener("dispose", (): void => { imagesDisposed++; });
      return texture;
    },
    uploadTemple: (): never => { throw templeFailure; },
  };
  fixture.sky.addEventListener("dispose", (): void => { skyDisposed++; });
  let reported: unknown;
  try { await loadTourScene(data, fixture.renderer, "https://example.org/", templeDependencies); }
  catch (error) { reported = error; }
  TestValidator.predicate("temple upload cause retained", reported === templeFailure);
  TestValidator.equals("partial temple resources attempted", [imagesDisposed, skyDisposed], [1, 1]);

  data.building = "future";
  const futureFailure: Error = new Error("invalid house mesh");
  const futureDependencies: Parameters<typeof loadTourScene>[3] = {
    ...fixture.dependencies,
    uploadHouse: (): never => { throw futureFailure; },
  };
  reported = null;
  try { await loadTourScene(data, fixture.renderer, "https://example.org/", futureDependencies); }
  catch (error) { reported = error; }
  TestValidator.predicate("future upload cause retained", reported === futureFailure);
  TestValidator.equals("partial future environment attempted", fixture.extraDisposed(), 1);

  const rollbackFixture: ReturnType<typeof tourSceneFixture> = tourSceneFixture();
  const rollbackData: ReturnType<typeof tourData> = tourData();
  rollbackData.native = { models: [{ materials: [{ id: "stone", baseColorTexture: "textures/stone.png" }] }] };
  const loadingFailure: Error = new Error("Upload refused after decoding.");
  const textureFailure: Error = new Error("Texture disposal listener failed.");
  const rollbackAttempts: string[] = [];
  rollbackFixture.sky.addEventListener("dispose", (): void => { rollbackAttempts.push("sky"); });
  const rollbackDependencies: Parameters<typeof loadTourScene>[3] = {
    ...rollbackFixture.dependencies,
    load: async (url: string): Promise<import("three").Texture> => {
      const texture: import("three").Texture = await rollbackFixture.dependencies.load(url);
      texture.addEventListener("dispose", (): never => {
        rollbackAttempts.push("texture");
        throw textureFailure;
      });
      return texture;
    },
    uploadTemple: (): never => { throw loadingFailure; },
  };
  let rollback: unknown;
  try { await loadTourScene(rollbackData, rollbackFixture.renderer, "https://example.org/", rollbackDependencies); }
  catch (error) { rollback = error; }
  TestValidator.predicate("rollback retains upload then cleanup causes", rollback instanceof AggregateError && rollback.errors.length === 2 && rollback.errors[0] === loadingFailure && rollback.errors[1] === textureFailure);
  TestValidator.equals("failed texture does not skip sky", rollbackAttempts, ["texture", "sky"]);

  const cleanupFixture: ReturnType<typeof tourSceneFixture> = tourSceneFixture();
  const cleanupData: ReturnType<typeof tourData> = tourData();
  cleanupData.native = rollbackData.native;
  const loaded: Awaited<ReturnType<typeof loadTourScene>> = await loadTourScene(cleanupData, cleanupFixture.renderer, "https://example.org/", cleanupFixture.dependencies);
  const geometryFailure: Error = new Error("Geometry disposal listener failed.");
  const attempts: string[] = [];
  cleanupFixture.mesh.geometry.addEventListener("dispose", (): never => { attempts.push("geometry"); throw geometryFailure; });
  cleanupFixture.mesh.material[0].addEventListener("dispose", (): void => { attempts.push("material-0"); });
  cleanupFixture.mesh.material[1].addEventListener("dispose", (): void => { attempts.push("material-1"); });
  cleanupFixture.mesh.customDepthMaterial!.addEventListener("dispose", (): void => { attempts.push("depth"); });
  cleanupFixture.textures[0].addEventListener("dispose", (): void => { attempts.push("loaded-texture"); });
  cleanupFixture.mesh.material[0].map!.addEventListener("dispose", (): void => { attempts.push("material-texture"); });
  cleanupFixture.sky.addEventListener("dispose", (): void => { attempts.push("sky"); });
  let receipt: unknown;
  try { loaded.dispose(); }
  catch (error) { receipt = error; }
  TestValidator.predicate("final cleanup keeps geometry cause", receipt === geometryFailure);
  TestValidator.equals("early failure does not skip later owners", attempts, ["geometry", "material-0", "material-1", "depth", "loaded-texture", "material-texture", "sky"]);
  let repeated: unknown;
  try { loaded.dispose(); }
  catch (error) { repeated = error; }
  TestValidator.predicate("repeated cleanup reports saved cause", repeated === receipt);
  TestValidator.equals("every cleanup event attempted once", attempts.length, 7);
}
