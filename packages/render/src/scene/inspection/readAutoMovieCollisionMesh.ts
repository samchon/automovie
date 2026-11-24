import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import type { collectAutoMovieCollisionParts } from "./collectAutoMovieCollisionParts.js";
import { readAutoMovieCollisionTopology } from "./readAutoMovieCollisionTopology.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/**
 * Read one ordinary drawn mesh: an exact box, a closed static surface or a
 * stock skin.
 *
 * A box is an exact displayed solid. A closed static mesh and a stock skin are
 * conservative world envelopes whose drawn surface is posed only when a
 * candidate pair needs it. A skin labels each vertex with its dominant joint,
 * so a named allowance can be scoped to bones.
 *
 * @param mesh The drawn mesh.
 * @param identity Its collision identity and ownership.
 * @param budget Posed vertices the frame may still spend; charged when a
 *   surface is read.
 * @param add Receives the part, its lazy surface and any unsupported reason.
 */
export function readAutoMovieCollisionMesh(
  mesh: THREE.Mesh,
  identity: Omit<Collision.IPart, "geometry">,
  budget: { posedVertices: number; parts?: number },
  add: readAutoMovieCollisionMesh.IAdd,
): void {
  const unsupported = (reason: string): void =>
    add({ ...identity, geometry: null }, undefined, reason);
  if (!readAutoMovieDisplayedBox.supportsStockMaterial(mesh))
    return unsupported("custom-appearance");
  if (mesh.geometry.morphAttributes.position?.length)
    return unsupported("morph-targets");
  const topology: readAutoMovieCollisionTopology.ITopology | null =
    readAutoMovieCollisionTopology(mesh.geometry);
  if (mesh instanceof AutoMovieSkinnedMesh) {
    const bounds: IAutoMovieSubjectBox | null =
      readAutoMovieDisplayedBox.skinEnvelope(mesh);
    const read: collectAutoMovieCollisionParts.IPartSurface["read"] | null =
      topology === null ? null : readSkin(mesh, topology, budget);
    if (bounds === null || read === null)
      return unsupported("no-displayed-geometry");
    return add(
      { ...identity, geometry: { kind: "envelope", bounds } },
      { read },
    );
  }
  if (mesh.constructor !== THREE.Mesh) return unsupported("custom-mesh");
  const placed = (vertex: number, target: THREE.Vector3): THREE.Vector3 =>
    target
      .fromBufferAttribute(topology!.positions, vertex)
      .applyMatrix4(mesh.matrixWorld);
  const box: Geometry.ICollider | null = readAutoMovieDisplayedBox(
    mesh,
    identity.id,
  );
  if (box !== null)
    return add(
      {
        ...identity,
        geometry: { kind: "shape", basis: "displayed", collider: box },
      },
      topology === null
        ? undefined
        : {
            read: readAutoMovieCollisionTopology.lazySurface(
              budget,
              topology,
              placed,
            ),
          },
    );
  if (topology === null) return unsupported("no-displayed-geometry");
  if (!topology.closed) return unsupported("open-surface");
  const bounds: IAutoMovieSubjectBox | null =
    readAutoMovieCollisionTopology.worldBox(topology.bounds, mesh.matrixWorld);
  if (bounds === null) return unsupported("no-displayed-geometry");
  add(
    { ...identity, geometry: { kind: "envelope", bounds } },
    {
      read: readAutoMovieCollisionTopology.lazySurface(
        budget,
        topology,
        placed,
      ),
    },
  );
}

/** The callback shape every collision source reports parts through. */
export namespace readAutoMovieCollisionMesh {
  /**
   * Receives one part, its optional lazy surface and an optional unsupported
   * reason.
   */
  export type IAdd = (
    part: Collision.IPart,
    surface?: collectAutoMovieCollisionParts.IPartSurface,
    reason?: string,
  ) => void;
}

/**
 * A stock skin's drawn surface, posed by its owner's draw method and charged to
 * the vertex budget only when a candidate pair reads it.
 */
function readSkin(
  mesh: AutoMovieSkinnedMesh,
  topology: readAutoMovieCollisionTopology.ITopology,
  budget: { posedVertices: number; parts?: number },
): collectAutoMovieCollisionParts.IPartSurface["read"] | null {
  const e: number[] = mesh.matrixWorld.elements;
  const error: number =
    mesh.tolerance() *
    Math.max(
      Math.hypot(e[0]!, e[4]!, e[8]!),
      Math.hypot(e[1]!, e[5]!, e[9]!),
      Math.hypot(e[2]!, e[6]!, e[10]!),
    ) *
    3;
  return readAutoMovieCollisionTopology.lazySurface(
    budget,
    topology,
    (vertex: number, target: THREE.Vector3): THREE.Vector3 =>
      mesh.getVertexPosition(vertex, target).applyMatrix4(mesh.matrixWorld),
    error,
    dominantJoints(mesh),
  );
}

/**
 * Name the joint with the largest weight of each vertex, from the drawn skin
 * buffers.
 */
function dominantJoints(
  mesh: AutoMovieSkinnedMesh,
): ((vertex: number) => string | undefined) | undefined {
  const indices:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = mesh.geometry.getAttribute("skinIndex");
  const weights:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = mesh.geometry.getAttribute("skinWeight");
  const bones: THREE.Bone[] | undefined = mesh.skeleton?.bones;
  if (indices === undefined || weights === undefined || bones === undefined)
    return undefined;
  return (vertex: number): string | undefined => {
    let best: number = -1;
    let weight: number = -Infinity;
    for (let k: number = 0; k < weights.itemSize; ++k) {
      const w: number = weights.getComponent(vertex, k);
      if (w > weight) {
        weight = w;
        best = indices.getComponent(vertex, k);
      }
    }
    const name: string | undefined = bones[best]?.name;
    return name === undefined || name === "" ? undefined : name;
  };
}
