import * as THREE from "three";
import type { ViewerPayload } from "./ViewerPayload";

/** Translucent declared support surfaces for inspection only. @param {Payload} payload */

export function uploadSupports(payload: ViewerPayload) {
  const group = new THREE.Group();
  group.name = "supports";
  for (const support of payload.supports) {
    const shape = new THREE.Shape(support.polygon.map((p) => new THREE.Vector2(p.x, -p.z)));
    for (const hole of support.holes) shape.holes.push(new THREE.Path(hole.map((p) => new THREE.Vector2(p.x, -p.z))));
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; ++i) {
      const { origin, slopeX, slopeZ } = support.plane;
      position.setY(i, origin + slopeX * position.getX(i) + slopeZ * position.getZ(i) + 0.01);
    }
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0x2f8f5b, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.name = support.id;
    group.add(mesh);
  }
  return group;
}
