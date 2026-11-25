import type { IAutoMovieSceneCollision as Collision } from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieCollisionSource } from "./AutoMovieCollisionSource.js";
import type { collectAutoMovieCollisionParts } from "./collectAutoMovieCollisionParts.js";
import type { readAutoMovieCollisionMesh } from "./readAutoMovieCollisionMesh.js";
import { readAutoMovieCollisionTopology } from "./readAutoMovieCollisionTopology.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/** Identity pose of a shape placed directly by its collider pose. */
const IDENTITY: {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
} = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** The capsule's local axis. */
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

/**
 * Read a drawn cord as enclosing capsules around consecutive solver particles,
 * one deformable body, with the tube drawn through them as their surface.
 *
 * The tube's ring vertices lie on the radius around each particle, and every
 * quad between two rings lies in the convex capsule of their segment, so the
 * capsules enclose the drawn tube: their separation proves clearance.
 *
 * @param mesh The drawn tube.
 * @param identity The cord's path; segments append `/segment/<i>`.
 * @param cord The particles and radius recorded with the tube.
 * @param budget Posed vertices the frame may still spend; charged when the tube
 *   is read.
 * @param add Receives each segment part and its share of the tube surface.
 */
export function readAutoMovieCollisionCord(
  mesh: THREE.Mesh,
  identity: string,
  cord: AutoMovieCollisionSource.ICord,
  budget: { posedVertices: number; parts?: number },
  add: readAutoMovieCollisionMesh.IAdd,
): void {
  const group: Collision.IGroup = { id: identity, kind: "deformable-body" };
  const e: number[] = mesh.matrixWorld.elements;
  // The largest singular value of the linear part, bounded by its Frobenius norm.
  const stretch: number = Math.hypot(
    e[0]!,
    e[1]!,
    e[2]!,
    e[4]!,
    e[5]!,
    e[6]!,
    e[8]!,
    e[9]!,
    e[10]!,
  );
  // The tube's Float32 ring vertices lie on the radius; keep them inside.
  const radius: number = cord.radius * stretch * (1 + 2 ** -16) + 2 ** -20;
  const points: THREE.Vector3[] = [];
  for (let i: number = 0; i + 2 < cord.points.length; i += 3)
    points.push(
      new THREE.Vector3(
        cord.points[i],
        cord.points[i + 1],
        cord.points[i + 2],
      ).applyMatrix4(mesh.matrixWorld),
    );
  if (!(radius > 0) || points.length < 2) {
    add({ id: identity, geometry: null }, undefined, "no-displayed-geometry");
    return;
  }
  const topology: readAutoMovieCollisionTopology.ITopology | null =
    readAutoMovieCollisionTopology(mesh.geometry);
  const surface: collectAutoMovieCollisionParts.IPartSurface["read"] | null =
    topology !== null &&
    readAutoMovieDisplayedBox.supportsStockMaterial(mesh) &&
    mesh.constructor === THREE.Mesh
      ? readAutoMovieCollisionTopology.lazySurface(
          budget,
          topology,
          (vertex: number, target: THREE.Vector3): THREE.Vector3 =>
            target
              .fromBufferAttribute(topology.positions, vertex)
              .applyMatrix4(mesh.matrixWorld),
        )
      : null;
  for (let i: number = 0; i + 1 < points.length; ++i) {
    if (budget.parts !== undefined && budget.parts <= 0) return;
    const part: Collision.IPart | null = capsule(
      `${identity}/segment/${i}`,
      group,
      points[i]!,
      points[i + 1]!,
      radius,
    );
    if (part === null) continue;
    const segment: THREE.Line3 = new THREE.Line3(points[i]!, points[i + 1]!);
    const closest: THREE.Vector3 = new THREE.Vector3();
    add(
      part,
      surface === null
        ? undefined
        : {
            read: surface,
            owns: (point: THREE.Vector3): boolean =>
              segment
                .closestPointToPoint(point, true, closest)
                .distanceTo(point) <= radius,
          },
    );
  }
}

/**
 * One enclosing capsule along a world segment, or null for a degenerate
 * segment.
 */
function capsule(
  id: string,
  group: Collision.IGroup,
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
): Collision.IPart | null {
  const axis: THREE.Vector3 = new THREE.Vector3().subVectors(b, a);
  const length: number = axis.length();
  if (!(length > 0)) return null;
  const rotation: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(
    UP,
    axis.divideScalar(length),
  );
  const center: THREE.Vector3 = new THREE.Vector3()
    .addVectors(a, b)
    .multiplyScalar(0.5);
  return {
    id,
    group,
    geometry: {
      kind: "shape",
      basis: "enclosing",
      collider: {
        body: id,
        bone: "root",
        pose: {
          position: { x: center.x, y: center.y, z: center.z },
          rotation: {
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
            w: rotation.w,
          },
        },
        shape: {
          id,
          material: "displayed",
          transform: IDENTITY,
          kind: "capsule",
          radius,
          halfLength: length / 2,
        },
      },
    },
  };
}
