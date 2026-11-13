import * as THREE from "three";

/**
 * Turn a motion case's drawn figure into a ghost: every mesh under the root draws with a translucent flat colour, so an uninterrupted source motion, a seed fan or an earlier pose overlays the actual figure without hiding it.
 *
 * A ghost is content a case draws of itself, not a capability of the inspection instrument, so it lives with the motion cases that draw it. Each mesh's material is replaced by one shared transparent `MeshBasicMaterial`, which the returned function disposes; the previous materials stay with their owner, which keeps disposing them. Depth writing is off and the meshes draw after opaque surfaces, so a ghost never occludes the solid figure.
 *
 * It throws for an opacity outside (0, 1].
 *
 * @param root The figure's root object.
 * @param color sRGB hex colour.
 * @param opacity Opacity in (0, 1].
 * @returns Disposes the ghost material.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what changes, why it lives here, material ownership, depth behaviour and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Standard three.js transparency: one unlit transparent material with depth writes disabled, drawn after opaque surfaces through a higher render order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal assigning one shared material.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An opacity outside (0, 1] throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the root's descendants.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every mesh shares one material.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function disposes the material this call created; replaced materials remain the figure owner's.
 */
export function applyMotionCaptureGhost(
  root: THREE.Object3D,
  color: number,
  opacity: number,
): () => void {
  if (!(opacity > 0 && opacity <= 1))
    throw new Error("A ghost opacity lies in (0, 1]");
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  root.traverse((object: THREE.Object3D): void => {
    if (object instanceof THREE.Mesh) {
      object.material = material;
      object.renderOrder = 5;
    }
  });
  return (): void => material.dispose();
}
