import * as THREE from "three";

/**
 * The ring's light: broad neutral overhead light that casts the contact
 * shadows and a soft frontal fill, unchanged for the whole film, with the
 * arena beyond the apron left dark.
 *
 * ```ts
 * scene.add(new RingLights().object);
 * ```
 *
 * @evidence docs/body/settings/sets/ring.md#light Broad neutral overhead light and soft frontal fill; the audience stays dark.
 * @evidence docs/body/settings/cinematography/ring-coverage.md#neutral The light never changes.
 */
export class RingLights {
  /** The lights' root. */
  public readonly object: THREE.Group = new THREE.Group();

  /** Build the lights. */
  public constructor() {
    const fill: THREE.HemisphereLight = new THREE.HemisphereLight(0xe2efff, 0x3a3631, 1.6);
    const key: THREE.DirectionalLight = new THREE.DirectionalLight(0xfff4e2, 2.6);
    key.position.set(0.5, 8, 1);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 15 });
    this.object.add(fill, key, key.target);
  }

  /** Release the lights. */
  public dispose(): void {
    this.object.removeFromParent();
  }
}
