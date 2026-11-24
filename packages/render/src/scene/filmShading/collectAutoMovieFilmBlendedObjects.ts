import * as THREE from "three";

/**
 * The drawn objects whose every material blends instead of covering what lies
 * behind it, each with its layer mask, so the occlusion prepass leaves them
 * out.
 *
 * A material blends when it is `transparent`, as a blended glass such as a
 * lantern's globe is, or when its blending is neither normal nor none, as a
 * flame's additive glow is. The prepass draws every object it sees as an opaque
 * surface, so a blended object there would put its own depth in front of the
 * wall behind it and the wall would read the visibility of a candle flame or a
 * pane of glass. Leaving the object out lets the surface behind it, which the
 * beauty pass shows through it, read its own occlusion. An object with one
 * opaque material among its groups is kept, because that group does cover what
 * lies behind it.
 */
export function collectAutoMovieFilmBlendedObjects(
  scene: THREE.Scene,
): Map<THREE.Object3D, number> {
  const blended: Map<THREE.Object3D, number> = new Map();
  scene.traverse((object: THREE.Object3D): void => {
    const material: unknown =
      "material" in object ? object.material : undefined;
    if (material === undefined || object.layers.mask === 0) return;
    const materials: unknown[] = Array.isArray(material)
      ? material
      : [material];
    if (
      materials.length !== 0 &&
      materials.every(
        (entry: unknown): boolean =>
          entry instanceof THREE.Material &&
          (entry.transparent ||
            (entry.blending !== THREE.NormalBlending &&
              entry.blending !== THREE.NoBlending)),
      )
    )
      blended.set(object, object.layers.mask);
  });
  return blended;
}
