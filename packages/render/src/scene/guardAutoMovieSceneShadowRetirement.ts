import type * as THREE from "three";

/** One acquired retirement population and its original outcome. */
type Retirement = {
  scene: THREE.Scene | undefined;
  resources: readonly (THREE.RenderTarget | THREE.Texture)[];
  nativeDepth: readonly WebGLTexture[];
  error: unknown;
};

const retiring: WeakMap<object, Retirement> = new WeakMap();

/**
 * Guard an exclusive renderer owner's shadow retirement, subsequent scene passes and budget reads. The key must be the same original renderer object, including when borrowed through a partial capability type; this does not discover alias facades for one native context. A failed attempt retains its scene, original cause and acquired references after light slots withdraw. Another scene with that renderer key cannot bypass uncertainty. Success removes the record; an observation-only preflight needs no scene.
 */
export function guardAutoMovieSceneShadowRetirement(
  scene: THREE.Scene | undefined,
  renderer: object,
  attempt?: {
    resources: readonly (THREE.RenderTarget | THREE.Texture)[];
    nativeDepth: readonly WebGLTexture[];
    run: () => void;
  },
): void {
  const previous: Retirement | undefined = retiring.get(renderer);
  if (previous !== undefined) throw previous.error;
  if (attempt === undefined) return;
  const current: Retirement = {
    scene,
    resources: [...attempt.resources],
    nativeDepth: [...attempt.nativeDepth],
    error: new Error("The scene's shadow resources are still being retired."),
  };
  retiring.set(renderer, current);
  try {
    attempt.run();
    retiring.delete(renderer);
  } catch (error) {
    current.error = error;
    throw error;
  }
}
