import * as THREE from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

/**
 * Stand an ordinary `LineSegments` in for a screen-space `LineSegments2`, so the CPU rasterizer draws the same segments, colours and width as WebGL does.
 *
 * A `LineSegments2` is a mesh of one widened quad per segment whose ends are its instanced `instanceStart` and `instanceEnd` attributes, so drawing its triangles as a mesh would draw the unit quad instead. The stand-in pairs those ends, carries the per-end colours when the material uses vertex colours, and takes the material's colour, width in pixels, depth test, transparency, visibility and clipping planes, and the object's world matrix and render order. The rasterizer already draws a line `linewidth` output pixels wide, which is what a `LineMaterial` draws at its resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why a stand-in is needed, what it carries over, and why the widths agree.
 * @evidence contracts/development/implementation.md#principled-implementation The segment ends and colours are read through three.js's own interleaved attributes, so the stand-in draws exactly the segments the shader widens.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Copy the ends, copy the colours, then one material and one object carrying the drawn state.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No segment is dropped or merged, and the material's own state is copied instead of assumed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segments.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A stand-in is made for one draw of one object.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The stand-in holds plain arrays and no GPU resource, so it is dropped after the draw; the source object is read and not changed.
 */
export function proxyAutoMovieRasterLineSegments(
  object: THREE.Mesh,
): THREE.LineSegments {
  const geometry: THREE.BufferGeometry = object.geometry;
  const material: LineMaterial = object.material as LineMaterial;
  const ends: THREE.BufferGeometry = new THREE.BufferGeometry();
  const pairs: (start: string, end: string) => Float32Array | null = (
    start: string,
    end: string,
  ): Float32Array | null => {
    if (!geometry.hasAttribute(start) || !geometry.hasAttribute(end))
      return null;
    const a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      geometry.getAttribute(start);
    const b: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      geometry.getAttribute(end);
    const out: Float32Array = new Float32Array(a.count * 6);
    for (let i: number = 0; i < a.count; i++)
      out.set(
        [a.getX(i), a.getY(i), a.getZ(i), b.getX(i), b.getY(i), b.getZ(i)],
        i * 6,
      );
    return out;
  };
  const positions: Float32Array | null = pairs("instanceStart", "instanceEnd");
  if (positions !== null)
    ends.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const colors: Float32Array | null = pairs(
    "instanceColorStart",
    "instanceColorEnd",
  );
  if (colors !== null)
    ends.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const drawn: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({
    color: material.color,
    vertexColors: material.vertexColors && colors !== null,
    linewidth: material.linewidth,
    depthTest: material.depthTest,
    transparent: material.transparent,
    visible: material.visible,
  });
  drawn.clippingPlanes = material.clippingPlanes;
  const proxy: THREE.LineSegments = new THREE.LineSegments(ends, drawn);
  proxy.matrixAutoUpdate = false;
  proxy.matrixWorld.copy(object.matrixWorld);
  proxy.renderOrder = object.renderOrder;
  return proxy;
}
