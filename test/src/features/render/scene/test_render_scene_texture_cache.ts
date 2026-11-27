import { AutoMovieRenderTextureCache } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderTextureCache` decodes each primed asset once and issues clones.
 *
 * Scenarios:
 *
 * 1. Priming two bindings of one asset loads it once, and the cache holds one
 *    source.
 * 2. Resolving an unprimed asset is refused; a primed one gives a clone that is
 *    not the loaded texture, fresh on every call.
 * 3. A shared resolve gives one texture for equal structured bindings and a
 *    fresh one for a string binding.
 * 4. Disposing disposes every issued clone and every source, once, and the
 *    cache then refuses to prime or resolve.
 */
export async function test_render_scene_texture_cache(): Promise<void> {
  const loaded: THREE.Texture[] = [];
  const loads: string[] = [];
  const cache: AutoMovieRenderTextureCache = new AutoMovieRenderTextureCache(
    async (asset: string): Promise<THREE.Texture> => {
      loads.push(asset);
      const texture: THREE.Texture = new THREE.Texture();
      loaded.push(texture);
      return texture;
    },
  );
  const wood = { asset: "wood.png", texCoord: 0, colorSpace: "srgb" as const };
  await cache.prime(["wood.png", wood, null, undefined]);
  TestValidator.equals("loaded once", loads, ["wood.png"]);
  TestValidator.equals("size", cache.size, 1);
  TestValidator.error("unprimed", (): void => {
    cache.resolve("stone.png");
  });
  const first: THREE.Texture = cache.resolve("wood.png");
  const second: THREE.Texture = cache.resolve("wood.png");
  TestValidator.predicate(
    "clones",
    first !== second && first !== loaded[0] && second !== loaded[0],
  );
  TestValidator.predicate(
    "shared object binding",
    cache.resolveShared(wood) === cache.resolveShared({ ...wood }),
  );
  TestValidator.predicate(
    "string binding is fresh",
    cache.resolveShared("wood.png") !== cache.resolveShared("wood.png"),
  );

  let disposals: number = 0;
  for (const texture of [first, second, loaded[0]!])
    texture.addEventListener("dispose", (): void => {
      ++disposals;
    });
  await cache.dispose();
  TestValidator.equals("disposed", disposals, 3);
  await cache.dispose();
  TestValidator.equals("once", disposals, 3);
  TestValidator.error("resolve after dispose", (): void => {
    cache.resolve("wood.png");
  });
  await TestValidator.error("prime after dispose", async (): Promise<void> => {
    await cache.prime(["wood.png"]);
  });
}