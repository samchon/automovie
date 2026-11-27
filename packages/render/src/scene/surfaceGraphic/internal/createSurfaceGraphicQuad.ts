import * as THREE from "three";

/*
 * A flat quad on a surface face, in the surface's reading frame.
 *
 * The face is the `faceWidth` by `faceDepth` metre rectangle centred on the
 * frame in its XZ plane, read from `+Y` with `+X` to the right and `-Z` toward
 * the top. `box` places the quad in face fractions from the top-left corner,
 * `x` rightward and `y` downward. The quad lies at `y = 0`, faces `+Y` (its
 * triangles wind counter-clockwise seen from `+Y`) and has normal `+Y`.
 *
 * Texture coordinates follow the glTF image convention the carried-image
 * decoder keeps: `u` runs left to right and `v` top to bottom, so the first
 * image row lies along the quad's top edge. `uv` gives the image window the
 * quad shows, which a `cover` fit narrows to crop.
 */
export function createSurfaceGraphicQuad(
  faceWidth: number,
  faceDepth: number,
  box: { x: number; y: number; width: number; height: number },
  uv: { u0: number; v0: number; u1: number; v1: number } = {
    u0: 0,
    v0: 0,
    u1: 1,
    v1: 1,
  },
): THREE.BufferGeometry {
  const left: number = (box.x - 0.5) * faceWidth;
  const right: number = (box.x + box.width - 0.5) * faceWidth;
  const top: number = (box.y - 0.5) * faceDepth;
  const bottom: number = (box.y + box.height - 0.5) * faceDepth;

  // Corners top-left, bottom-left, bottom-right, top-right.
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [left, 0, top, left, 0, bottom, right, 0, bottom, right, 0, top],
      3,
    ),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [uv.u0, uv.v0, uv.u0, uv.v1, uv.u1, uv.v1, uv.u1, uv.v0],
      2,
    ),
  );

  // (top-left, bottom-left, bottom-right) has normal +Y because
  // (bottom-left - top-left) × (bottom-right - top-left) points along +Y.
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
}
