import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer";
import * as THREE from "three";

/**
 * Pose one closed skirt and two intentionally open robe panels on the actual rig.
 * @evidence contracts/common.md#implementation-and-ownership Measured hips and knees define coarse garment dimensions. The skirt has one indexed periodic ring per tier, so asymmetric legs cannot separate duplicated seams. Continuous left/right thigh weights transport shared vertices; top vertices follow hips. Robe halves remain separate to permit steps. This authored fabric approximation changes no Human geometry and owns only its meshes/buffers, borrowing materials.
 * @evidence contracts/common.md#authoring-interface Supply the neutral live drawing and borrowed materials. Call update after every complete FK write, including reach. Deterministic body-local vertices do not depend on scene placement. Actual seat/hand/prop clearance remains a staged inspection; this is not a cloth-force or collision solver. Dispose removes owned attachments and buffers.
 */
export function createSchoolGarmentPanels(
  drawing: AutoMovieHumanPolygon.IDrawing,
  female: boolean,
  robe: THREE.Material,
  skirt: THREE.Material,
): {
  update: (output: Pick<AutoMovieHumanSkeleton.IOutput, "posed">) => void;
  dispose: () => void;
} {
  const hips: THREE.Group | undefined = drawing.bones.get("hips");
  const hipsMesh: THREE.Mesh | undefined = drawing.parts.get("hips");
  const left: THREE.Group | undefined = drawing.bones.get("leftUpperLeg");
  const right: THREE.Group | undefined = drawing.bones.get("rightUpperLeg");
  const knee: THREE.Group | undefined = drawing.bones.get("leftLowerLeg");
  if (!hips || !hipsMesh || !left || !right || !knee)
    throw new Error("School garments need actual hips and thighs");
  drawing.object.updateMatrixWorld(true);
  const bounds: THREE.Box3 = new THREE.Box3().setFromObject(hipsMesh, true);
  const centre: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
  const radii: THREE.Vector2 = new THREE.Vector2(
    (bounds.max.x - bounds.min.x) / 2 + 0.015,
    (bounds.max.z - bounds.min.z) / 2 + 0.02,
  );
  const hipHeight: number = left.getWorldPosition(new THREE.Vector3()).y - 0.01;
  const kneeHeight: number = knee.getWorldPosition(new THREE.Vector3()).y;
  const pieces: {
    mesh: THREE.Mesh;
    bindings: {
      hips: THREE.Vector3;
      left: THREE.Vector3;
      right: THREE.Vector3;
      tier: number;
      blend: number;
    }[];
  }[] = [];
  const dispose: () => void = (): void => {
    for (const p of pieces) {
      p.mesh.removeFromParent();
      p.mesh.geometry.dispose();
    }
    pieces.length = 0;
  };
  try {
    for (const kind of female
      ? ["skirt", "left-robe", "right-robe"]
      : ["left-robe", "right-robe"]) {
      const closed: boolean = kind === "skirt";
      const start: number = closed
        ? 0
        : kind === "left-robe"
          ? Math.PI / 3
          : Math.PI;
      const end: number = closed
        ? Math.PI * 2
        : kind === "left-robe"
          ? Math.PI
          : (Math.PI * 5) / 3;
      const count: number = closed ? 16 : 9;
      const vertices: number[] = [];
      const bindings: (typeof pieces)[number]["bindings"] = [];
      for (let tier: number = 0; tier < 3; tier++)
        for (let i: number = 0; i < count; i++) {
          const weight: number = tier / 2;
          const angle: number = THREE.MathUtils.lerp(
            start,
            end,
            i / (closed ? count : count - 1),
          );
          const flare: number =
            weight * 0.045 + (closed ? (i % 2 ? 0.008 : 0) : 0.018);
          const point: THREE.Vector3 = new THREE.Vector3(
            centre.x + Math.cos(angle) * (radii.x + flare),
            THREE.MathUtils.lerp(
              hipHeight,
              kneeHeight + (closed ? 0.025 : -0.005),
              weight,
            ),
            centre.z + Math.sin(angle) * (radii.y + flare),
          );
          const blend: number = closed
            ? THREE.MathUtils.clamp(0.5 + 0.5 * Math.sin(angle), 0, 1)
            : kind === "left-robe"
              ? 1
              : 0;
          bindings.push({
            hips: hips.worldToLocal(point.clone()),
            left: left.worldToLocal(point.clone()),
            right: right.worldToLocal(point.clone()),
            tier: weight,
            blend,
          });
          vertices.push(...drawing.object.worldToLocal(point).toArray());
        }
      const indices: number[] = [];
      for (let tier: number = 0; tier < 2; tier++)
        for (let i: number = 0; i < (closed ? count : count - 1); i++) {
          const a: number = tier * count + i;
          const b: number = tier * count + ((i + 1) % count);
          indices.push(a, a + count, b, b, a + count, b + count);
        }
      const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const mesh: THREE.Mesh = new THREE.Mesh(geometry, closed ? skirt : robe);
      mesh.name = closed ? "closed-skirt-wrap" : kind + "-half-wrap";
      pieces.push({ mesh, bindings });
      drawing.object.add(mesh);
    }
    return {
      update(output: Pick<AutoMovieHumanSkeleton.IOutput, "posed">): void {
        const transform: (
          bone: string,
          point: THREE.Vector3,
        ) => THREE.Vector3 = (
          bone: string,
          point: THREE.Vector3,
        ): THREE.Vector3 => {
          const at: AutoMovieHumanSkeleton.IPlacement | undefined =
            output.posed.find(
              (p: AutoMovieHumanSkeleton.IPlacement): boolean =>
                p.bone === bone,
            );
          if (!at) throw new Error("Garment FK lacks " + bone);
          return point
            .clone()
            .applyQuaternion(new THREE.Quaternion(...at.rotation))
            .add(new THREE.Vector3(...at.position));
        };
        for (const piece of pieces) {
          const positions: THREE.BufferAttribute =
            piece.mesh.geometry.getAttribute(
              "position",
            ) as THREE.BufferAttribute;
          for (const [i, b] of piece.bindings.entries()) {
            const thigh: THREE.Vector3 = transform(
              "rightUpperLeg",
              b.right,
            ).lerp(transform("leftUpperLeg", b.left), b.blend);
            const p: THREE.Vector3 = transform("hips", b.hips).lerp(
              thigh,
              b.tier,
            );
            positions.setXYZ(i, p.x, p.y, p.z);
          }
          positions.needsUpdate = true;
          piece.mesh.geometry.computeVertexNormals();
          piece.mesh.geometry.computeBoundingBox();
          piece.mesh.geometry.computeBoundingSphere();
        }
      },
      dispose,
    };
  } catch (error: unknown) {
    dispose();
    throw error;
  }
}
