import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type AutoMovieHumanSupportFrame,
} from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Close the actual generated feet inside coarse flat black school shoes.
 *
 * @evidence contracts/common.md#implementation-and-ownership Measures real neutral Foot-descendant length/width and bottom in their Foot frame, then adds a closed rounded65mm-high toe box and low vamp strap; ankle/instep height no longer fills the entire toe length. The base retains the source minimum. Every displayed shoe vertex enters the same full-floor solver alongside unchanged Human skin; no anatomy or foot surface is replaced. Upper ankle can remain visible as black tights/trouser-covered skin.
 * @evidence contracts/common.md#authoring-interface Supply matching neutral output/drawing before performance. Returns bone-local physical points and owned-resource disposal. Toe/foot intrinsic controls remain neutral in this short; any later such articulation requires rechecking the rigid shoe fit. Actual support and pixels still need inspection.
 */
export function createSchoolShoes(
  drawing: AutoMovieHumanPolygon.IDrawing,
  neutral: AutoMovieHumanSkeleton.IOutput,
): { points: AutoMovieHumanSupportFrame.IPoint[]; dispose: () => void } {
  const points: AutoMovieHumanSupportFrame.IPoint[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const meshes: THREE.Mesh[] = [];
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0x171b1e,
    roughness: 0.85,
    flatShading: true,
  });
  const parents: Map<string, string | null> = new Map(
    neutral.bones.map(
      (bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [
        bone.bone,
        bone.parent,
      ],
    ),
  );
  drawing.object.updateMatrixWorld(true);
  for (const side of ["left", "right"] as const) {
    const bone: string = `${side}Foot`;
    const frame: THREE.Group = drawing.bones.get(bone)!;
    const bounds: THREE.Box3 = new THREE.Box3();
    for (const [name, mesh] of drawing.parts) {
      let ancestor: string | null | undefined = name;
      while (ancestor !== undefined && ancestor !== null && ancestor !== bone)
        ancestor = parents.get(ancestor);
      if (ancestor !== bone) continue;
      const attribute:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      for (let index: number = 0; index < attribute.count; index++) {
        const point: THREE.Vector3 = mesh.localToWorld(
          new THREE.Vector3(
            attribute.getX(index),
            attribute.getY(index),
            attribute.getZ(index),
          ),
        );
        bounds.expandByPoint(frame.worldToLocal(point));
      }
    }
    const size: THREE.Vector3 = bounds
      .getSize(new THREE.Vector3())
      .add(new THREE.Vector3(0.006, 0, 0.006));
    size.y = 0.065;
    const center: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
    center.y = bounds.min.y + size.y / 2;

    /** Register exact owned shoe vertices with their real Foot carrier. */
    function piece(geometry: THREE.BoxGeometry, at: THREE.Vector3): void {
      geometries.push(geometry);
      const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(at);
      frame.add(mesh);
      meshes.push(mesh);
      const attribute: THREE.BufferAttribute = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let index: number = 0; index < attribute.count; index++)
        points.push({
          bone: AutoMovieHumanRigControls.joint(bone),
          localPoint: [
            attribute.getX(index) + at.x,
            attribute.getY(index) + at.y,
            attribute.getZ(index) + at.z,
          ],
        });
    }
    piece(new RoundedBoxGeometry(size.x, size.y, size.z, 1, 0.009), center);
    piece(
      new THREE.BoxGeometry(size.x * 0.19, 0.004, size.z * 0.9),
      new THREE.Vector3(
        center.x - size.x * 0.1,
        bounds.min.y + size.y + 0.002,
        center.z,
      ),
    );
  }
  return {
    points,
    dispose: (): void => {
      for (const mesh of meshes) mesh.removeFromParent();
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
    },
  };
}
