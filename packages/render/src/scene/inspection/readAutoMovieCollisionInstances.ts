import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "../IAutoMovieFormationCycleTake.js";
import { formationCyclePosition } from "../formationCyclePosition.js";
import { isAutoMovieFormationCycleMaterial } from "../isAutoMovieFormationCycleMaterial.js";
import { readMaterialShaderPatches } from "../readMaterialShaderPatches.js";
import { sampleFormationCycleMatrix } from "../sampleFormationCycleMatrix.js";
import { AutoMovieCollisionSource } from "./AutoMovieCollisionSource.js";
import { isAutoMovieFloat32Point } from "./isAutoMovieFloat32Point.js";
import type { readAutoMovieCollisionMesh } from "./readAutoMovieCollisionMesh.js";
import { readAutoMovieCollisionTopology } from "./readAutoMovieCollisionTopology.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/**
 * Read each drawn instance of a batch, named by the generator's slot when it
 * recorded one.
 *
 * A static stock box instance is an exact displayed solid. Any other admitted
 * instance is a world envelope over its static geometry or every baked sample
 * of its playing cycle, with a surface posed by the vertex stage's own law. A
 * zero-scale instance draws nothing and is skipped.
 *
 * @param mesh The drawn batch.
 * @param identity Path prefix for instances without a generator record.
 * @param budget Posed vertices the frame may still spend; charged when a
 *   surface is read.
 * @param add Receives each part, its lazy surface and any unsupported reason.
 */
export function readAutoMovieCollisionInstances(
  mesh: THREE.InstancedMesh,
  identity: string,
  budget: { posedVertices: number; parts?: number },
  add: readAutoMovieCollisionMesh.IAdd,
): void {
  const source: AutoMovieCollisionSource.IInstances | undefined =
    AutoMovieCollisionSource.instances(mesh);
  const cycle: IAutoMovieFormationCycle | undefined =
    mesh.userData.automovieFormationCycle;
  const take: IAutoMovieFormationCycleTake | undefined = cycle?.active;
  const admitted: boolean = admits(mesh, cycle !== undefined);
  const topology: readAutoMovieCollisionTopology.ITopology | null =
    readAutoMovieCollisionTopology(mesh.geometry);
  const local: THREE.Box3 | null =
    topology === null
      ? null
      : cycle === undefined || take === undefined
        ? topology.bounds
        : cycleBounds(mesh.geometry, topology, cycle, take);
  const instance: THREE.Matrix4 = new THREE.Matrix4();
  for (let index: number = 0; index < mesh.count; ++index) {
    if (budget.parts !== undefined && budget.parts <= 0) return;
    const slot: number = source?.slots[index] ?? index;
    const id: string =
      source === undefined
        ? `${identity}/instance/${index}`
        : `${source.id}/slot/${slot}`;
    const owner: Omit<Collision.IPart, "geometry"> = {
      id,
      ...(source?.group === undefined ? {} : { group: source.group }),
      ...(source?.group === undefined || source.region === undefined
        ? {}
        : { region: source.region }),
    };
    mesh.getMatrixAt(index, instance);
    // A zero-scale instance is a withdrawn member that rasterizes nothing.
    if (instance.determinant() === 0) continue;
    const placement: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
      mesh.matrixWorld,
      instance,
    );
    if (!admitted) {
      add({ ...owner, geometry: null }, undefined, "custom-appearance");
      continue;
    }
    if (cycle === undefined) {
      const box: Geometry.ICollider | null = readAutoMovieDisplayedBox(
        mesh,
        id,
        placement,
      );
      if (box !== null) {
        add({
          ...owner,
          geometry: { kind: "shape", basis: "displayed", collider: box },
        });
        continue;
      }
    }
    const bounds: IAutoMovieSubjectBox | null =
      local === null
        ? null
        : readAutoMovieCollisionTopology.worldBox(local, placement);
    if (topology === null || bounds === null) {
      add({ ...owner, geometry: null }, undefined, "no-displayed-geometry");
      continue;
    }
    if (cycle === undefined && !topology.closed) {
      add({ ...owner, geometry: null }, undefined, "open-surface");
      continue;
    }
    const pose:
      | ((vertex: number, target: THREE.Vector3) => THREE.Vector3)
      | null =
      cycle === undefined || take === undefined
        ? (vertex: number, target: THREE.Vector3): THREE.Vector3 =>
            target
              .fromBufferAttribute(topology.positions, vertex)
              .applyMatrix4(placement)
        : cyclePose(mesh, index, instance, placement, topology, cycle, take);
    if (pose === null) {
      add({ ...owner, geometry: null }, undefined, "no-displayed-geometry");
      continue;
    }
    add(
      { ...owner, geometry: { kind: "envelope", bounds } },
      {
        read: readAutoMovieCollisionTopology.lazySurface(
          budget,
          topology,
          pose,
          cycle === undefined ? 0 : 2 ** -16,
        ),
      },
    );
  }
}

/**
 * Admit stock surfaces drawn by the default program, or by the formation cycle
 * program when the batch has a cycle: the cycle's patch alone, since the
 * envelope follows only the cycle's vertex law and another patch would move the
 * drawn vertices off it.
 */
function admits(mesh: THREE.InstancedMesh, cyclic: boolean): boolean {
  const materials: THREE.Material[] = [mesh.material].flat();
  return (
    materials.length !== 0 &&
    materials.every(readAutoMovieDisplayedBox.supportsStockSurface) &&
    materials.every((material: THREE.Material): boolean =>
      cyclic
        ? isAutoMovieFormationCycleMaterial(material) &&
          readMaterialShaderPatches(material).length === 1
        : material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile,
    ) &&
    mesh.onBeforeRender === THREE.Object3D.prototype.onBeforeRender &&
    !mesh.geometry.morphAttributes.position?.length
  );
}

/**
 * The vertex stage's law for one member: fract(phase + advance + radius *
 * turn), with the radius read from the instance translation in the unit's XZ
 * plane, then the part's mixed baked matrix and the member's placement.
 */
function cyclePose(
  mesh: THREE.InstancedMesh,
  index: number,
  instance: THREE.Matrix4,
  placement: THREE.Matrix4,
  topology: readAutoMovieCollisionTopology.ITopology,
  cycle: IAutoMovieFormationCycle,
  take: IAutoMovieFormationCycleTake,
): ((vertex: number, target: THREE.Vector3) => THREE.Vector3) | null {
  const phases:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = mesh.geometry.getAttribute("automoviePhase");
  const parts:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = mesh.geometry.getAttribute("automoviePart");
  if (phases === undefined || parts === undefined) return null;
  const e: number[] = instance.elements;
  const position: number = formationCyclePosition(
    {
      advance: cycle.uniforms.automovieCycleAdvance.value,
      turn: cycle.uniforms.automovieCycleTurn.value,
    },
    phases.getX(index),
    Math.hypot(e[12]!, e[14]!),
  );
  const matrices: Map<number, THREE.Matrix4> = new Map();
  return (vertex: number, target: THREE.Vector3): THREE.Vector3 => {
    const part: number = parts.getX(vertex);
    let matrix: THREE.Matrix4 | undefined = matrices.get(part);
    if (matrix === undefined) {
      matrix = sampleFormationCycleMatrix(cycle, part, position, take);
      matrices.set(part, matrix);
    }
    return target
      .fromBufferAttribute(topology.positions, vertex)
      .applyMatrix4(matrix)
      .applyMatrix4(placement);
  };
}

/**
 * Linear mixes of two samples keep each point inside their segment, so the
 * samples bound every phase.
 */
function cycleBounds(
  geometry: THREE.BufferGeometry,
  topology: readAutoMovieCollisionTopology.ITopology,
  cycle: IAutoMovieFormationCycle,
  take: IAutoMovieFormationCycleTake,
): THREE.Box3 | null {
  const parts:
    | THREE.BufferAttribute
    | THREE.InterleavedBufferAttribute
    | undefined = geometry.getAttribute("automoviePart");
  let result: THREE.Box3 | null = null;
  if (parts !== undefined) {
    const rest: Map<number, THREE.Box3> = new Map();
    const point: THREE.Vector3 = new THREE.Vector3();
    for (const vertex of topology.triangles) {
      const part: number = parts.getX(vertex);
      let box: THREE.Box3 | undefined = rest.get(part);
      if (box === undefined) rest.set(part, (box = new THREE.Box3()));
      box.expandByPoint(point.fromBufferAttribute(topology.positions, vertex));
    }
    result = new THREE.Box3();
    for (const [part, box] of rest)
      for (let sample: number = 0; sample < cycle.samples; ++sample)
        result.union(
          box.clone().applyMatrix4(exactSample(take, cycle, part, sample)),
        );
    if (
      !isAutoMovieFloat32Point(result.min) ||
      !isAutoMovieFloat32Point(result.max)
    )
      result = null;
  }
  return result;
}

/** One stored rest-to-posed matrix, read exactly as the table holds it. */
function exactSample(
  take: IAutoMovieFormationCycleTake,
  cycle: IAutoMovieFormationCycle,
  part: number,
  sample: number,
): THREE.Matrix4 {
  const read = (row: number, column: number): number =>
    take.matrices[((part * 3 + row) * cycle.samples + sample) * 4 + column]!;
  return new THREE.Matrix4().set(
    read(0, 0),
    read(0, 1),
    read(0, 2),
    read(0, 3),
    read(1, 0),
    read(1, 1),
    read(1, 2),
    read(1, 3),
    read(2, 0),
    read(2, 1),
    read(2, 2),
    read(2, 3),
    0,
    0,
    0,
    1,
  );
}
