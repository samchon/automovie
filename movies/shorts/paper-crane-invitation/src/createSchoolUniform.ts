import type {
  AutoMovieHumanSkeleton,
  AutoMovieHumanSupportFrame,
} from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer";
import * as THREE from "three";

import { createSchoolGarmentPanels } from "./createSchoolGarmentPanels";
import { meshSurfacePoint } from "./meshSurfacePoint";

/**
 * Dress the actual Human modules with a coarse open school robe and shoes.
 * Thin surface-derived torso shells replace detached rectangular plates;
 * continuous half-wrap skirt/robe panels deform from actual hips/thigh FK.
 * Collar/tie follow real torso triangles; hair follows the actual head crown.
 * Shoes enclose the emitted neutral feet with a5mm sole allowance, not a
 * replacement Human foot. The actual Subtalar hindfoot carries their inversion;
 * exact bottom vertices and all display vertices use that same local frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual source meshes supply robe/hair boundaries and garment rays. Bone-local shoe geometry derives from every emitted Foot descendant, retaining the original Human underneath. The same neutral-world enclosure is re-expressed in the actual Subtalar frame, so public inversion can roll its original sole rather than leaving a rigid Foot-level shoe behind. Owned shoe vertices and three actual sole witnesses are returned for the same full-foot Grounding solve. Geometry/materials and attachments retire together, including construction failure.
 * @evidence contracts/common.md#authoring-interface Supply the current neutral drawing/skeleton, skirt choice and house RGB. Returned feet contain actual shoe vertices in their Subtalar bone frames; consumers must include them with all Human foot vertices for support. Open robe shells and continuously posed split lower panels preserve recognizable layers without simulated fabric. Moving clearance and fit remain observation duties.
 */
export function createSchoolUniform(
  drawing: AutoMovieHumanPolygon.IDrawing,
  female: boolean,
  houseColor: number,
  skeleton: AutoMovieHumanSkeleton.IOutput,
): {
  feet: Record<
    "left" | "right",
    {
      vertices: AutoMovieHumanSupportFrame.IPoint[];
      sole: [
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
      ];
    }
  >;
  update: (output: Pick<AutoMovieHumanSkeleton.IOutput, "posed">) => void;
  dispose: () => void;
} {
  let panels: ReturnType<typeof createSchoolGarmentPanels> | undefined;
  const geometries: THREE.BufferGeometry[] = [];
  const attached: THREE.Object3D[] = [];
  const dark: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0x20252a,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const white: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0eee5,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const house: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: houseColor,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const stripe: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: female ? 0xb8c1bd : 0xd4ad48,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const hair: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: female ? 0xe4d5a9 : 0x24211e,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const skirt: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0x45484d,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const materials: THREE.Material[] = [dark, white, house, stripe, hair, skirt];
  /** Retire only this costume's separately owned attachments and resources. */
  const dispose: () => void = (): void => {
    panels?.dispose();
    for (const item of attached) item.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };
  /** Borrow the exact existing module or refuse a missing identity. */
  const part: (id: string) => THREE.Mesh = (id: string): THREE.Mesh => {
    const mesh: THREE.Mesh | undefined = drawing.parts.get(id);
    if (!mesh) throw new Error("Missing costume source: " + id);
    mesh.geometry.computeBoundingBox();
    return mesh;
  };
  /** Mount one already-owned local geometry to its actual bone frame. */
  const mount: (
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ) => THREE.Mesh = (
    id: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ): THREE.Mesh => {
    const parent: THREE.Group | undefined = drawing.bones.get(id);
    if (!parent) throw new Error("Missing costume frame: " + id);
    geometries.push(geometry);
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    attached.push(mesh);
    mesh.castShadow = true;
    return mesh;
  };
  /** Preserve selected original triangles while offsetting the garment shell. */
  const shell: (
    id: string,
    material: THREE.Material,
    include: (centre: THREE.Vector3, bounds: THREE.Box3) => boolean,
  ) => void = (
    id: string,
    material: THREE.Material,
    include: (centre: THREE.Vector3, bounds: THREE.Box3) => boolean,
  ): void => {
    const source: THREE.Mesh = part(id);
    const bounds: THREE.Box3 = source.geometry.boundingBox!;
    const centre: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
    const positions: THREE.BufferAttribute = source.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const index: THREE.BufferAttribute | null = source.geometry.getIndex();
    const count: number = index?.count ?? positions.count;
    const vertices: number[] = [];
    for (let offset: number = 0; offset + 2 < count; offset += 3) {
      const points: THREE.Vector3[] = [0, 1, 2].map(
        (step: number): THREE.Vector3 =>
          new THREE.Vector3().fromBufferAttribute(
            positions,
            index ? index.getX(offset + step) : offset + step,
          ),
      );
      const middle: THREE.Vector3 = points[0]!
        .clone()
        .add(points[1]!)
        .add(points[2]!)
        .divideScalar(3);
      if (!include(middle, bounds)) continue;
      for (const point of points) {
        point.sub(centre);
        point.x *= 1.05;
        point.z *= 1.05;
        point.add(centre);
        vertices.push(point.x, point.y, point.z);
      }
    }
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.computeVertexNormals();
    mount(id, geometry, material);
  };
  try {
    for (const id of ["chest", "spine", "hips"])
      shell(id, dark, (point: THREE.Vector3, bounds: THREE.Box3): boolean => {
        const centre: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
        return (
          point.x <= centre.x ||
          Math.abs(point.z - centre.z) > (bounds.max.z - bounds.min.z) * 0.21
        );
      });
    const torso: THREE.Mesh = part("chest");
    const bounds: THREE.Box3 = torso.geometry.boundingBox!;
    const centre: THREE.Vector3 = bounds.getCenter(new THREE.Vector3());
    const top: number =
      bounds.max.y - Math.min(0.06, (bounds.max.y - bounds.min.y) * 0.22);
    /** Project a small garment polygon onto the actual anterior torso. */
    const patch: (
      points: [number, number][],
      material: THREE.Material,
      clearance: number,
    ) => void = (
      points: [number, number][],
      material: THREE.Material,
      clearance: number,
    ): void => {
      const vertices: number[] = [];
      for (const [y, z] of points) {
        const hit: ReturnType<typeof meshSurfacePoint> = meshSurfacePoint(
          torso,
          new THREE.Vector3(bounds.max.x + 0.1, y, z),
          new THREE.Vector3(-1, 0, 0),
        );
        vertices.push(hit.point.x + clearance, y, z);
      }
      const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(points.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]);
      geometry.computeVertexNormals();
      mount("chest", geometry, material);
    };
    for (const sign of [-1, 1])
      patch(
        [
          [top, centre.z + sign * 0.012],
          [top - 0.05, centre.z + sign * 0.035],
          [top, centre.z + sign * 0.06],
        ],
        white,
        0.008,
      );
    const tieLength: number = Math.min(
      0.18,
      (bounds.max.y - bounds.min.y) * 0.58,
    );
    patch(
      [
        [top - 0.025, centre.z - 0.014],
        [top - 0.025, centre.z + 0.014],
        [top - tieLength, centre.z + 0.011],
        [top - tieLength, centre.z - 0.011],
      ],
      house,
      0.012,
    );
    for (let n: number = 0; n < 4; n++) {
      const y: number = top - 0.045 - (n * tieLength) / 5;
      patch(
        [
          [y, centre.z - 0.014],
          [y - 0.006, centre.z + 0.014],
          [y - 0.013, centre.z + 0.014],
          [y - 0.007, centre.z - 0.014],
        ],
        stripe,
        0.014,
      );
    }
    panels = createSchoolGarmentPanels(drawing, female, dark, skirt);
    shell(
      "head",
      hair,
      (point: THREE.Vector3, box: THREE.Box3): boolean =>
        point.y > box.min.y + (box.max.y - box.min.y) * 0.69 ||
        point.x < (box.min.x + box.max.x) / 2,
    );
    const headSize: THREE.Vector3 = new THREE.Vector3(...drawing.head.max).sub(
      new THREE.Vector3(...drawing.head.min),
    );
    const headCentre: THREE.Vector3 = new THREE.Vector3(...drawing.head.max)
      .add(new THREE.Vector3(...drawing.head.min))
      .multiplyScalar(0.5);
    if (female) {
      const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(
        0.025,
        headSize.y * 0.85,
        headSize.z * 0.85,
      );
      geometry.translate(
        drawing.head.min[0] - 0.003,
        headCentre.y - headSize.y * 0.35,
        headCentre.z,
      );
      mount("head", geometry, hair);
    } else
      for (const sign of [-1, 1]) {
        const geometry: THREE.TorusGeometry = new THREE.TorusGeometry(
          headSize.z * 0.145,
          0.003,
          6,
          16,
        );
        geometry.rotateY(Math.PI / 2);
        geometry.translate(
          drawing.head.max[0] + 0.006,
          headCentre.y + headSize.y * 0.115,
          headCentre.z + sign * headSize.z * 0.235,
        );
        mount("head", geometry, dark);
      }
    const parents: Map<string, string | null> = new Map(
      skeleton.bones.map(
        (bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [
          bone.bone,
          bone.parent,
        ],
      ),
    );
    /** Enclose the actual foot without changing its geometry or calibration. */
    const shoe: (side: "left" | "right") => {
      vertices: AutoMovieHumanSupportFrame.IPoint[];
      sole: [
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
      ];
    } = (
      side: "left" | "right",
    ): {
      vertices: AutoMovieHumanSupportFrame.IPoint[];
      sole: [
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
        AutoMovieHumanSupportFrame.IPoint,
      ];
    } => {
      const id: "leftFoot" | "rightFoot" =
        side === "left" ? "leftFoot" : "rightFoot";
      const carrier: "leftSubtalar" | "rightSubtalar" =
        side === "left" ? "leftSubtalar" : "rightSubtalar";
      const frame: THREE.Group | undefined = drawing.bones.get(carrier);
      if (!frame) throw new Error("Missing shoe foot frame");
      drawing.object.updateMatrixWorld(true);
      const box: THREE.Box3 = new THREE.Box3();
      for (const [bone, mesh] of drawing.parts) {
        let ancestor: string | null = bone;
        while (ancestor !== null && ancestor !== id)
          ancestor = parents.get(ancestor) ?? null;
        if (ancestor !== id) continue;
        const positions: THREE.BufferAttribute = mesh.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        for (let i: number = 0; i < positions.count; i++)
          box.expandByPoint(
            mesh.localToWorld(
              new THREE.Vector3().fromBufferAttribute(positions, i),
            ),
          );
      }
      box.min.add(new THREE.Vector3(-0.006, -0.005, -0.005));
      box.max.add(new THREE.Vector3(0.012, 0.004, 0.005));
      const size: THREE.Vector3 = box.getSize(new THREE.Vector3());
      const centre: THREE.Vector3 = box.getCenter(new THREE.Vector3());
      const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(
        size.x,
        size.y,
        size.z,
      );
      geometry.translate(centre.x, centre.y, centre.z);
      geometry.applyMatrix4(frame.matrixWorld.clone().invert());
      // The hindfoot carries the rigid shoe's inversion. Attaching it above
      // that joint to Foot suppresses the real sole's available roll control.
      // Re-express the same neutral-world enclosure in its actual carrier.
      mount(carrier, geometry, dark);
      const positions: THREE.BufferAttribute = geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const vertices: AutoMovieHumanSupportFrame.IPoint[] = Array.from(
        { length: positions.count },
        (_: unknown, i: number): AutoMovieHumanSupportFrame.IPoint => ({
          bone: carrier,
          localPoint: [positions.getX(i), positions.getY(i), positions.getZ(i)],
        }),
      );
      const corners: THREE.Vector3[] = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      ];
      const sole: AutoMovieHumanSupportFrame.IPoint[] = corners.map(
        (corner: THREE.Vector3): AutoMovieHumanSupportFrame.IPoint => {
          let chosen: AutoMovieHumanSupportFrame.IPoint | undefined;
          let distance: number = Infinity;
          for (const point of vertices) {
            const actual: THREE.Vector3 = frame.localToWorld(
              new THREE.Vector3(...point.localPoint),
            );
            if (actual.distanceToSquared(corner) < distance) {
              distance = actual.distanceToSquared(corner);
              chosen = point;
            }
          }
          if (!chosen) throw new Error("Missing actual shoe sole vertex");
          return chosen;
        },
      );
      return { vertices, sole: [sole[0]!, sole[1]!, sole[2]!] };
    };
    return {
      feet: { left: shoe("left"), right: shoe("right") },
      update: panels.update,
      dispose,
    };
  } catch (error: unknown) {
    dispose();
    throw error;
  }
}
