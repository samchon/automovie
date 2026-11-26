import * as THREE from "three";

/**
 * Turn a motion case's drawn figure into a ghost: every mesh under the root
 * draws with a translucent flat colour, so an uninterrupted source motion, a
 * seed fan or an earlier pose overlays the actual figure without hiding it.
 *
 * A ghost is content a case draws of itself, not a capability of the inspection
 * instrument, so it lives with the motion cases that draw it. Each mesh's
 * material is replaced by one shared transparent `MeshBasicMaterial`, which the
 * returned function disposes; the previous materials stay with their owner,
 * which keeps disposing them. Depth writing is off and the meshes draw after
 * opaque surfaces, so a ghost never occludes the solid figure.
 *
 * It throws for an opacity outside (0, 1].
 *
 * @param root The figure's root object.
 * @param color SRGB hex colour.
 * @param opacity Opacity in (0, 1].
 * @returns Disposes the ghost material.
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
  // three's own type flag (`Mesh.isMesh`) tells a mesh among the objects.
  root.traverse((object: THREE.Object3D): void => {
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.isMesh === true) {
      mesh.material = material;
      mesh.renderOrder = 5;
    }
  });
  return (): void => material.dispose();
}
