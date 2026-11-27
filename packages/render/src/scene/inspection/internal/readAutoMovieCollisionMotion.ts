import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMoviePhysicalShape,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

/*
 * Read the feature points, world box and thickness of one collision part at one
 * placed instant, for comparing its motion between instants.
 *
 * A shape's features are its defining points: a sphere's centre, a capsule's
 * axis ends, a box's corners or a hull's points, placed by the collider pose
 * and the shape transform. An envelope's features are its eight corners.
 * Thickness is the part's smallest full extent.
 * Parameter part: A collected part.
 * Returns: Its pose, or null when the part has no geometry.
 */
export function readAutoMovieCollisionMotion(
  part: Collision.IPart,
): readAutoMovieCollisionMotion.IPose | null {
  const geometry: Collision.IPart["geometry"] = part.geometry;
  if (geometry === null) return null;
  if (geometry.kind === "envelope") {
    const { min, max } = geometry.bounds;
    return {
      points: corners(min, max),
      box: geometry.bounds,
      thickness: Math.min(max.x - min.x, max.y - min.y, max.z - min.z),
    };
  }
  const { pose, shape } = geometry.collider;
  const place: THREE.Matrix4 = new THREE.Matrix4()
    .compose(
      new THREE.Vector3(pose.position.x, pose.position.y, pose.position.z),
      new THREE.Quaternion(
        pose.rotation.x,
        pose.rotation.y,
        pose.rotation.z,
        pose.rotation.w,
      ),
      new THREE.Vector3(1, 1, 1),
    )
    .multiply(
      new THREE.Matrix4().compose(
        new THREE.Vector3(
          shape.transform.position.x,
          shape.transform.position.y,
          shape.transform.position.z,
        ),
        new THREE.Quaternion(
          shape.transform.rotation.x,
          shape.transform.rotation.y,
          shape.transform.rotation.z,
          shape.transform.rotation.w,
        ),
        new THREE.Vector3(1, 1, 1),
      ),
    );
  const local: { points: THREE.Vector3[]; thickness: number } = features(shape);
  return {
    points: local.points.map(
      (point: THREE.Vector3): { x: number; y: number; z: number } => {
        const world: THREE.Vector3 = point.applyMatrix4(place);
        return { x: world.x, y: world.y, z: world.z };
      },
    ),
    box: AutoMovieEnginePhysics.physicalShapeBounds(pose, shape),
    thickness: local.thickness,
  };
}

/*
 * Feature poses and their comparison between instants.
 */
export namespace readAutoMovieCollisionMotion {
  /*
   * A part's features, world box and thickness at one instant.
   */
  export interface IPose {
    /*
     * Feature points in world metres.
     */
    readonly points: readonly { x: number; y: number; z: number }[];
    /*
     * World bounds at the instant.
     */
    readonly box: IAutoMovieSubjectBox;
    /*
     * Smallest full extent in metres.
     */
    readonly thickness: number;
  }

  /*
   * The largest displacement of any feature between two instants.
   * Parameter a: The part's earlier pose.
   * Parameter b: Its later pose.
   * Returns: Metres, or Infinity when the features do not correspond.
   */
  export function displacement(a: IPose, b: IPose): number {
    if (a.points.length !== b.points.length) return Infinity;
    let largest: number = 0;
    for (let i: number = 0; i < a.points.length; ++i) {
      const p = a.points[i]!;
      const q = b.points[i]!;
      largest = Math.max(largest, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
    }
    return largest;
  }

  /*
   * Conservative swept bounds between two instants: both world boxes, enlarged
   * by half the largest feature displacement. A feature turning by up to half a
   * revolution leaves its chord by at most half the chord, so the enlargement
   * covers rigid rotation and deformation of that size.
   * Parameter a: The earlier pose.
   * Parameter b: The later pose.
   * Returns: The swept world box.
   */
  export function swept(a: IPose, b: IPose): IAutoMovieSubjectBox {
    const grow: number = Math.min(displacement(a, b) / 2, 1e9);
    return {
      min: {
        x: Math.min(a.box.min.x, b.box.min.x) - grow,
        y: Math.min(a.box.min.y, b.box.min.y) - grow,
        z: Math.min(a.box.min.z, b.box.min.z) - grow,
      },
      max: {
        x: Math.max(a.box.max.x, b.box.max.x) + grow,
        y: Math.max(a.box.max.y, b.box.max.y) + grow,
        z: Math.max(a.box.max.z, b.box.max.z) + grow,
      },
    };
  }
}

/*
 * The defining points and full thickness of a shape in its own frame.
 */
function features(shape: IAutoMoviePhysicalShape): {
  points: THREE.Vector3[];
  thickness: number;
} {
  switch (shape.kind) {
    case "sphere":
      return { points: [new THREE.Vector3()], thickness: 2 * shape.radius };
    case "capsule":
      return {
        points: [
          new THREE.Vector3(0, -shape.halfLength, 0),
          new THREE.Vector3(0, shape.halfLength, 0),
        ],
        thickness: 2 * shape.radius,
      };
    case "box": {
      const h = shape.halfExtents;
      return {
        points: corners(
          { x: -h.x, y: -h.y, z: -h.z },
          { x: h.x, y: h.y, z: h.z },
        ).map((p) => new THREE.Vector3(p.x, p.y, p.z)),
        thickness: 2 * Math.min(h.x, h.y, h.z),
      };
    }
    case "hull": {
      const box: THREE.Box3 = new THREE.Box3().setFromPoints(
        shape.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
      );
      const size: THREE.Vector3 = box.getSize(new THREE.Vector3());
      return {
        points: shape.points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
        thickness: Math.min(size.x, size.y, size.z),
      };
    }
  }
}

/*
 * The eight corners of a box in a fixed order.
 */
function corners(
  min: { x: number; y: number; z: number },
  max: { x: number; y: number; z: number },
): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z]) out.push({ x, y, z });
  return out;
}
