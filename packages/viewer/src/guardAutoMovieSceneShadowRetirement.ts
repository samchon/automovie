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
 *
 * @evidence contracts/common.md#principled-implementation A weak renderer key retains the exact scene/retirement population before callbacks run; success withdraws it and failure preserves the original cause for subsequent scene-pass refusal in that context.
 * @evidence contracts/common.md#clear-and-simple-design The existing primitive supplies resource collection and independent operations; this guard owns in-progress/failed outcome retention and existing pass/budget preflight keyed by the same original renderer object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed owner is reported freed or retried, cleared light slots cannot yield a successful budget, and reentrant work refuses. Renderer-key/exclusive-context correspondence remains a caller premise rather than independent native/kernel proof.
 * @evidence contracts/common.md#meaningful-documentation States exact scene/context scope, retained uncertainty, success withdrawal, reentry and the requirement that direct hosts use this gate before drawing after a failed retirement.
 * @evidence contracts/performance.md#efficient-algorithms Guard checks use weak lookups, and one attempt snapshots R resource and H native-depth references in O(R+H); actual disposal work remains with its callback.
 * @evidence contracts/performance.md#reuse-equivalent-work Later calls share this failed original outcome without invoking disposal again; a successful later retirement is a new acquired population and is not cached by scene name.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Failed/in-progress values retain the scene and resources while the renderer key remains reachable; success deletes the record and no task, replacement allocation or independent release proof is acquired.
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
