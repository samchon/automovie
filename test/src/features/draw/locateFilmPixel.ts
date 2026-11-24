import * as THREE from "three";

/**
 * The pixel of a `width` by `height` raster through which `camera` sees
 * `toward`, with its texture coordinate and the depth texel a depth pass of
 * `scene` writes there.
 *
 * The pixel is the one whose square holds the point's projection; its texture
 * coordinate is its centre, origin at the bottom left as GLSL's `vUv` is. The
 * depth is the window depth in [0, 1] of the nearest mesh the camera's ray
 * through that centre hits, found with three's Raycaster, or 1 where it hits
 * none, as a depth target cleared to the far plane holds.
 *
 * @param props The camera, the scene, the raster and the world point.
 * @returns The pixel, its texture coordinate and its depth texel.
 * @evidence contracts/development/common.md#meaningful-documentation States how the pixel, its coordinate and its depth are found and the coordinate convention.
 * @evidence contracts/development/implementation.md#principled-implementation Projects with the camera's own matrices and finds depth by a ray cast through the pixel centre, which is what rasterizing the scene's meshes writes at that pixel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shared by the medium tests so each names world points rather than pixels.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Computes no expected value.
 * @evidence contracts/development/implementation.md#efficient-algorithms One projection and one ray cast.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call is one pixel.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function locateFilmPixel(props: {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  width: number;
  height: number;
  toward: THREE.Vector3;
}): {
  pixel: { x: number; y: number };
  uv: { x: number; y: number };
  depth: number;
} {
  props.camera.updateMatrixWorld(true);
  props.scene.updateMatrixWorld(true);
  const ndc: THREE.Vector3 = props.toward.clone().project(props.camera);
  const pixel: { x: number; y: number } = {
    x: Math.floor(((ndc.x + 1) / 2) * props.width),
    y: Math.floor(((ndc.y + 1) / 2) * props.height),
  };
  const uv: { x: number; y: number } = {
    x: (pixel.x + 0.5) / props.width,
    y: (pixel.y + 0.5) / props.height,
  };
  const raycaster: THREE.Raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(
    new THREE.Vector2(uv.x * 2 - 1, uv.y * 2 - 1),
    props.camera,
  );
  const hit: THREE.Intersection | undefined = raycaster
    .intersectObjects(props.scene.children, true)
    .find(
      (entry: THREE.Intersection): boolean =>
        (entry.object as THREE.Mesh).isMesh === true,
    );
  return {
    pixel,
    uv,
    depth:
      hit === undefined
        ? 1
        : hit.point.clone().project(props.camera).z * 0.5 + 0.5,
  };
}
