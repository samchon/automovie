import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSubjectBox,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieSkinnedMesh } from "../AutoMovieSkinnedMesh.js";
import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import type { IAutoMovieFormationCycleTake } from "../IAutoMovieFormationCycleTake.js";
import { formationCyclePosition } from "../formationCyclePosition.js";
import { sampleFormationCycleMatrix } from "../sampleFormationCycleMatrix.js";
import { AutoMovieCollisionSource } from "./AutoMovieCollisionSource.js";
import { autoMovieInspectionPathOf } from "./autoMovieInspectionPathOf.js";
import { readAutoMovieDisplayedBox } from "./readAutoMovieDisplayedBox.js";

/** Program key installed by the formation cycle material owner. */
const CYCLE_PROGRAM: string = "automovie-formation-cycle";
const IDENTITY = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
const UP: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

/**
 * Read every visible drawn object of one placed layer as collision parts.
 *
 * Plain stock boxes become exact displayed solids. A closed stock mesh, a
 * stock skin and every drawn member of an instanced batch become conservative
 * world envelopes with a lazily posed surface. A cord becomes enclosing
 * capsules around its solver segments, with its drawn tube as the surface.
 * Open surfaces and custom vertex programs remain unsupported with a reason.
 *
 * @param layer The placed layer and its source-owned identities.
 * @param time Sample clock, used only to name anonymous meshes.
 * @param budget Posed-vertex allowance shared by the frame; reserved when a surface is read.
 * @returns Parts in traversal order, posed surfaces by part and unsupported reasons by part.
 * @evidence contracts/development/common.md#meaningful-documentation States which drawn object yields which geometry authority and when a surface is posed.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the drawn world matrix, instance matrix and formation cycle law of each object, the generator's slot and cord records, and topology-derived closure.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal dispatches each drawn object kind to one reader. Surfaces are deferred closures used only by a later witness search.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nesting and names grant no group. Degenerate instances draw nothing and are skipped. Open surfaces, custom programs, morphs and cut draw ranges certify nothing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits visible nodes once, transforms eight box corners per part, and poses a surface only when a candidate pair needs it within the vertex budget.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Topology closure, rest bounds and cycle envelopes are cached by geometry version and take.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned closures borrow the placed meshes for the current observation only.
 */
export function collectAutoMovieCollisionParts(
  layer: collectAutoMovieCollisionParts.ILayer,
  time: Diagnostic.ITime,
  budget: { posedVertices: number },
): collectAutoMovieCollisionParts.IResult {
  const parts: Collision.IPart[] = [];
  const surfaces: Map<string, collectAutoMovieCollisionParts.IPartSurface> =
    new Map();
  const reasons: Map<string, string> = new Map();
  const pending: THREE.Object3D[] = [layer.root];
  const meshes: { mesh: THREE.Mesh; id: string }[] = [];
  const counts: Map<string, number> = new Map();
  while (pending.length) {
    const object: THREE.Object3D = pending.pop()!;
    if (!object.visible) continue;
    const opaque: readonly Collision.IPart[] | undefined =
      layer.opaque?.get(object);
    if (opaque !== undefined) {
      for (const part of opaque) parts.push(part);
      continue;
    }
    if (object instanceof THREE.Mesh) {
      const id: string =
        layer.ownership?.get(object)?.id ??
        autoMovieInspectionPathOf(layer.root, object);
      counts.set(id, (counts.get(id) ?? 0) + 1);
      meshes.push({ mesh: object, id });
    }
    for (let i: number = object.children.length - 1; i >= 0; --i)
      pending.push(object.children[i]!);
  }
  const declared: Set<string> = new Set(parts.map((part) => part.id));
  const reserved: Set<string> = new Set([...counts.keys(), ...declared]);
  for (const [index, { mesh, id }] of meshes.entries()) {
    const ownership: Omit<Collision.IPart, "geometry"> | undefined =
      layer.ownership?.get(mesh);
    let identity: string = id;
    if (
      ownership === undefined &&
      (!id.trim() || counts.get(id) !== 1 || declared.has(id))
    ) {
      identity = JSON.stringify(["scene-mesh", time.filmSeconds, index]);
      while (reserved.has(identity)) identity += "/";
      reserved.add(identity);
    }
    const add = (
      part: Collision.IPart,
      surface?: collectAutoMovieCollisionParts.IPartSurface,
      reason?: string,
    ): void => {
      parts.push(part);
      if (surface !== undefined) surfaces.set(part.id, surface);
      if (reason !== undefined) reasons.set(part.id, reason);
    };
    const cord: AutoMovieCollisionSource.ICord | undefined =
      AutoMovieCollisionSource.cord(mesh);
    if (cord !== undefined) readCord(mesh, identity, cord, budget, add);
    else if (mesh instanceof THREE.InstancedMesh)
      readInstances(mesh, identity, budget, add);
    else readMesh(mesh, { ...ownership, id: identity }, budget, add);
  }
  return { parts, surfaces, reasons };
}
/** The layer read by the collector and the surfaces and reasons it returns. */
export namespace collectAutoMovieCollisionParts {
  /**
   * One source-owned layer, after its exact placement and world-matrix update.
   *
   * @evidence contracts/development/design.md#principled-representation A root and source identities describe the drawn layer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only ownership and opaque replacements reach the collector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nesting implies no identity.
   * @evidence contracts/development/common.md#meaningful-documentation States what each member replaces.
   */
  export interface ILayer {
    /** Placed root whose visible descendants are drawn. */
    root: THREE.Object3D;

    /** Named identities and exemptions given by a model or formation owner. */
    ownership?: ReadonlyMap<THREE.Object3D, Omit<Collision.IPart, "geometry">>;

    /** Roots whose source already supplied placed parts. Their descendants are not scanned. */
    opaque?: ReadonlyMap<THREE.Object3D, readonly Collision.IPart[]>;
  }

  /**
   * Drawn world surface of one part.
   *
   * @evidence contracts/development/design.md#principled-representation World vertices with the drawn triangle list, closure and pose error.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Consumed by the witness search only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate drawn triangles contribute no vertex.
   * @evidence contracts/development/common.md#meaningful-documentation Names the units and index spaces.
   */
  export interface ISurface {
    /** World vertex positions by vertex index. */
    readonly values: readonly THREE.Vector3[];

    /** Drawn nondegenerate triangles as vertex index triples. */
    readonly triangles: Uint32Array;

    /** Distinct vertex indices used by the drawn triangles. */
    readonly drawn: Uint32Array;

    /** Pose error of each position in world metres. */
    readonly error: number;

    /** Whether every drawn edge is traversed equally in both directions, so the surface bounds a solid. */
    readonly closed: boolean;

    /** World bounds of the drawn vertices. */
    readonly bounds: THREE.Box3;
  }

  /**
   * A lazily posed surface and the part of it a collision part owns.
   *
   * @evidence contracts/development/design.md#principled-representation A shared surface and an optional ownership test.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reading reserves the vertex budget once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refused budget is distinct from an unsupported surface.
   * @evidence contracts/development/common.md#meaningful-documentation States the three outcomes of reading.
   */
  export interface IPartSurface {
    /** The posed surface, null when unsupported, or "budget" when its vertices exceed the remaining allowance. */
    read(): ISurface | null | "budget";

    /** Whether a world point of the surface belongs to this part. Omitted for a whole surface. */
    owns?: (point: THREE.Vector3) => boolean;
  }

  /**
   * Parts, their drawn surfaces and unsupported reasons.
   *
   * @evidence contracts/development/design.md#principled-representation Keyed by part identity.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The observer reads each map once per finding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A part without geometry carries its reason.
   * @evidence contracts/development/common.md#meaningful-documentation Names each map.
   */
  export interface IResult {
    readonly parts: Collision.IPart[];
    readonly surfaces: ReadonlyMap<string, IPartSurface>;
    readonly reasons: ReadonlyMap<string, string>;
  }
}

type IAdd = (
  part: Collision.IPart,
  surface?: collectAutoMovieCollisionParts.IPartSurface,
  reason?: string,
) => void;

/** Read one ordinary drawn mesh: an exact box, a closed static surface or a stock skin. */
function readMesh(
  mesh: THREE.Mesh,
  identity: Omit<Collision.IPart, "geometry">,
  budget: { posedVertices: number },
  add: IAdd,
): void {
  const unsupported = (reason: string): void =>
    add({ ...identity, geometry: null }, undefined, reason);
  if (!readAutoMovieDisplayedBox.supportsStockMaterial(mesh))
    return unsupported("custom-appearance");
  if (mesh.geometry.morphAttributes.position?.length)
    return unsupported("morph-targets");
  if (mesh instanceof AutoMovieSkinnedMesh) {
    const skin = readSkin(mesh, budget);
    const bounds: IAutoMovieSubjectBox | null =
      skin === null ? null : readAutoMovieDisplayedBox.skinEnvelope(mesh);
    if (skin === null || bounds === null)
      return unsupported("no-displayed-geometry");
    return add(
      { ...identity, geometry: { kind: "envelope", bounds } },
      { read: skin },
    );
  }
  if (mesh.constructor !== THREE.Mesh) return unsupported("custom-mesh");
  const box: Geometry.ICollider | null = readAutoMovieDisplayedBox(
    mesh,
    identity.id,
  );
  const topology = readTopology(mesh.geometry);
  if (box !== null)
    return add(
      {
        ...identity,
        geometry: { kind: "shape", basis: "displayed", collider: box },
      },
      topology === null
        ? undefined
        : {
            read: lazySurface(budget, topology, (i, target) =>
              target
                .fromBufferAttribute(topology.positions, i)
                .applyMatrix4(mesh.matrixWorld),
            ),
          },
    );
  if (topology === null) return unsupported("no-displayed-geometry");
  if (!topology.closed) return unsupported("open-surface");
  const bounds: IAutoMovieSubjectBox | null = worldBox(
    topology.bounds,
    mesh.matrixWorld,
  );
  if (bounds === null) return unsupported("no-displayed-geometry");
  add(
    { ...identity, geometry: { kind: "envelope", bounds } },
    {
      read: lazySurface(budget, topology, (i, target) =>
        target
          .fromBufferAttribute(topology.positions, i)
          .applyMatrix4(mesh.matrixWorld),
      ),
    },
  );
}

/** Each drawn instance of a batch, named by the generator's slot when it recorded one. */
function readInstances(
  mesh: THREE.InstancedMesh,
  identity: string,
  budget: { posedVertices: number },
  add: IAdd,
): void {
  const source: AutoMovieCollisionSource.IInstances | undefined =
    AutoMovieCollisionSource.instances(mesh);
  const prefix: string = source?.id ?? identity;
  const cycle: IAutoMovieFormationCycle | undefined =
    mesh.userData.automovieFormationCycle;
  const materials: THREE.Material[] = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];
  const program: boolean = materials.every((material) =>
    cycle === undefined
      ? material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile
      : material.customProgramCacheKey() === CYCLE_PROGRAM,
  );
  const admitted: boolean =
    materials.length !== 0 &&
    materials.every(readAutoMovieDisplayedBox.supportsStockSurface) &&
    program &&
    mesh.onBeforeRender === THREE.Object3D.prototype.onBeforeRender &&
    !mesh.geometry.morphAttributes.position?.length;
  const topology = readTopology(mesh.geometry);
  const take: IAutoMovieFormationCycleTake | undefined = cycle?.active;
  const local: THREE.Box3 | null =
    topology === null
      ? null
      : cycle === undefined || take === undefined
        ? topology.bounds
        : cycleBounds(mesh.geometry, topology, cycle, take);
  const phases: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mesh.geometry.getAttribute("automoviePhase");
  const partIndex: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mesh.geometry.getAttribute("automoviePart");
  const instance: THREE.Matrix4 = new THREE.Matrix4();
  for (let index: number = 0; index < mesh.count; ++index) {
    const slot: number = source?.slots[index] ?? index;
    const id: string =
      source === undefined ? `${prefix}#${index}` : `${prefix}/slot/${slot}`;
    const owner: Omit<Collision.IPart, "geometry"> = {
      id,
      ...(source?.group === undefined ? {} : { group: source.group }),
      ...(source?.group === undefined || source.region === undefined
        ? {}
        : { region: source.region }),
    };
    mesh.getMatrixAt(index, instance);
    const placement: THREE.Matrix4 = new THREE.Matrix4().multiplyMatrices(
      mesh.matrixWorld,
      instance,
    );
    const determinant: number = instance.determinant();
    // A zero-scale instance is a withdrawn member that rasterizes nothing.
    if (determinant === 0 && instance.elements.every(Number.isFinite)) continue;
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
      local === null ? null : worldBox(local, placement);
    if (topology === null || bounds === null) {
      add({ ...owner, geometry: null }, undefined, "no-displayed-geometry");
      continue;
    }
    if (cycle === undefined && !topology.closed) {
      add({ ...owner, geometry: null }, undefined, "open-surface");
      continue;
    }
    let pose: (i: number, target: THREE.Vector3) => THREE.Vector3;
    if (cycle === undefined || take === undefined)
      pose = (i, target) =>
        target
          .fromBufferAttribute(topology.positions, i)
          .applyMatrix4(placement);
    else {
      if (phases === undefined || partIndex === undefined) {
        add({ ...owner, geometry: null }, undefined, "no-displayed-geometry");
        continue;
      }
      // The vertex stage's law: fract(phase + advance + radius * turn), with the
      // radius read from the instance translation in the unit's XZ plane.
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
      pose = (i, target) => {
        const part: number = partIndex.getX(i);
        let matrix: THREE.Matrix4 | undefined = matrices.get(part);
        if (matrix === undefined) {
          matrix = sampleFormationCycleMatrix(cycle, part, position, take);
          matrices.set(part, matrix);
        }
        return target
          .fromBufferAttribute(topology.positions, i)
          .applyMatrix4(matrix)
          .applyMatrix4(placement);
      };
    }
    add(
      { ...owner, geometry: { kind: "envelope", bounds } },
      {
        read: lazySurface(
          budget,
          topology,
          pose,
          cycle === undefined ? 0 : 2 ** -16,
        ),
      },
    );
  }
}

/** Enclosing capsules around consecutive solver particles and the tube drawn through them. */
function readCord(
  mesh: THREE.Mesh,
  identity: string,
  cord: AutoMovieCollisionSource.ICord,
  budget: { posedVertices: number },
  add: IAdd,
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
  const topology = readTopology(mesh.geometry);
  const surface: collectAutoMovieCollisionParts.IPartSurface["read"] | null =
    topology !== null &&
    readAutoMovieDisplayedBox.supportsStockMaterial(mesh) &&
    mesh.constructor === THREE.Mesh
      ? lazySurface(budget, topology, (i, target) =>
          target
            .fromBufferAttribute(topology.positions, i)
            .applyMatrix4(mesh.matrixWorld),
        )
      : null;
  if (
    !(radius > 0) ||
    !Number.isFinite(radius) ||
    points.length < 2 ||
    !points.every(finite)
  ) {
    add({ id: identity, geometry: null }, undefined, "no-displayed-geometry");
    return;
  }
  for (let i: number = 0; i + 1 < points.length; ++i) {
    const a: THREE.Vector3 = points[i]!;
    const b: THREE.Vector3 = points[i + 1]!;
    const axis: THREE.Vector3 = new THREE.Vector3().subVectors(b, a);
    const length: number = axis.length();
    const id: string = `${identity}/segment/${i}`;
    if (!(length > 0)) continue;
    const rotation: THREE.Quaternion =
      new THREE.Quaternion().setFromUnitVectors(UP, axis.divideScalar(length));
    const center: THREE.Vector3 = new THREE.Vector3()
      .addVectors(a, b)
      .multiplyScalar(0.5);
    const segment: THREE.Line3 = new THREE.Line3(a, b);
    const closest: THREE.Vector3 = new THREE.Vector3();
    add(
      {
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
      },
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

/** Reserve the full current-pose workload of a stock skin before its owner fills the pose cache. */
function readSkin(
  mesh: AutoMovieSkinnedMesh,
  budget: { posedVertices: number },
): collectAutoMovieCollisionParts.IPartSurface["read"] | null {
  const topology = readTopology(mesh.geometry);
  if (topology === null || topology.positions.count > budget.posedVertices)
    return null;
  budget.posedVertices -= topology.positions.count;
  const e = mesh.matrixWorld.elements;
  const error: number =
    mesh.tolerance() *
    Math.max(
      Math.hypot(e[0], e[4], e[8]),
      Math.hypot(e[1], e[5], e[9]),
      Math.hypot(e[2], e[6], e[10]),
    ) *
    3;
  if (!Number.isFinite(error)) return null;
  return lazySurface(
    { posedVertices: Infinity },
    topology,
    (i, target) =>
      mesh.getVertexPosition(i, target).applyMatrix4(mesh.matrixWorld),
    error,
  );
}

interface ITopology {
  readonly positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  /** Drawn triangle vertex indices in the geometry's own index space. */
  readonly triangles: Uint32Array;
  /** Rest bounds of the drawn vertices. */
  readonly bounds: THREE.Box3;
  /** Every drawn edge, merged by rest position, is traversed equally in both directions. */
  readonly closed: boolean;
}

/** Topology facts per geometry, recomputed when its buffers change. */
const TOPOLOGY: WeakMap<
  THREE.BufferGeometry,
  { key: string; topology: ITopology | null }
> = new WeakMap();

/** Read the drawn triangle list of a resident Float32 geometry once per buffer version. */
function readTopology(geometry: THREE.BufferGeometry): ITopology | null {
  const positions = geometry.getAttribute("position");
  const index: THREE.BufferAttribute | null = geometry.getIndex();
  const key: string = JSON.stringify([
    positions instanceof THREE.BufferAttribute ? positions.version : -1,
    index?.version ?? -1,
    geometry.drawRange.start,
    geometry.drawRange.count,
  ]);
  const cached = TOPOLOGY.get(geometry);
  if (cached?.key === key) return cached.topology;
  let topology: ITopology | null = null;
  if (
    positions !== undefined &&
    positions.itemSize === 3 &&
    !positions.normalized &&
    positions.count > 0
  ) {
    const total: number = index?.count ?? positions.count;
    const start: number = Math.max(0, geometry.drawRange.start);
    const end: number = Math.min(total, start + geometry.drawRange.count);
    const first: number = start - (start % 3);
    if (end > first && (end - first) % 3 === 0 && first === start) {
      const triangles: Uint32Array = new Uint32Array(end - first);
      for (let i: number = first; i < end; ++i)
        triangles[i - first] = index?.getX(i) ?? i;
      const bounds: THREE.Box3 = new THREE.Box3();
      const point: THREE.Vector3 = new THREE.Vector3();
      let valid: boolean = true;
      for (const vertex of triangles) {
        if (vertex >= positions.count) {
          valid = false;
          break;
        }
        bounds.expandByPoint(point.fromBufferAttribute(positions, vertex));
      }
      if (valid && finite(bounds.min) && finite(bounds.max))
        topology = {
          positions,
          triangles,
          bounds,
          closed: isClosed(positions, triangles, bounds),
        };
    }
  }
  TOPOLOGY.set(geometry, { key, topology });
  return topology;
}

/**
 * Merge vertices by rest position and require every nondegenerate edge to be
 * traversed equally often in both directions, as by one or more closed shells.
 * Seam duplicates generated by trigonometry differ by rounding only, so
 * positions merge on a grid far below the surface's size.
 */
function isClosed(
  positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  triangles: Uint32Array,
  bounds: THREE.Box3,
): boolean {
  const size: THREE.Vector3 = bounds.getSize(new THREE.Vector3());
  const cell: number = Math.max(size.x, size.y, size.z, 2 ** -20) * 2 ** -20;
  const ids: Map<string, number> = new Map();
  const merged: number[] = [];
  const canonical = (vertex: number): number => {
    const key: string = `${Math.round(positions.getX(vertex) / cell)},${Math.round(positions.getY(vertex) / cell)},${Math.round(positions.getZ(vertex) / cell)}`;
    let id: number | undefined = ids.get(key);
    if (id === undefined) ids.set(key, (id = ids.size));
    return id;
  };
  for (const vertex of triangles) merged.push(canonical(vertex));
  // Each consistently wound closed shell traverses every edge once in each
  // direction, so a union of shells, even shells sharing edges, balances.
  const edges: Map<string, number> = new Map();
  let faces: number = 0;
  for (let i: number = 0; i < merged.length; i += 3) {
    const a: number = merged[i]!;
    const b: number = merged[i + 1]!;
    const c: number = merged[i + 2]!;
    if (a === b || b === c || a === c) continue;
    ++faces;
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key: string = p < q ? `${p},${q}` : `${q},${p}`;
      edges.set(key, (edges.get(key) ?? 0) + (p < q ? 1 : -1));
    }
  }
  if (faces < 4) return false;
  for (const balance of edges.values()) if (balance !== 0) return false;
  return true;
}

/** Union every part's rest bounds over all baked samples of the playing take. */
const CYCLE_BOUNDS: WeakMap<
  IAutoMovieFormationCycleTake,
  WeakMap<THREE.BufferGeometry, THREE.Box3 | null>
> = new WeakMap();

/** Linear mixes of two samples keep each point inside their segment, so the samples bound every phase. */
function cycleBounds(
  geometry: THREE.BufferGeometry,
  topology: ITopology,
  cycle: IAutoMovieFormationCycle,
  take: IAutoMovieFormationCycleTake,
): THREE.Box3 | null {
  let byGeometry = CYCLE_BOUNDS.get(take);
  if (byGeometry === undefined)
    CYCLE_BOUNDS.set(take, (byGeometry = new WeakMap()));
  if (byGeometry.has(geometry)) return byGeometry.get(geometry)!;
  const parts = geometry.getAttribute("automoviePart");
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
          box
            .clone()
            .applyMatrix4(
              sampleFormationCycleMatrix(
                cycle,
                part,
                (sample + 0.5) / cycle.samples,
                take,
              ),
            ),
        );
    // The half-sample positions above mix neighbours equally; add exact samples.
    for (const [part, box] of rest)
      for (let sample: number = 0; sample < cycle.samples; ++sample)
        result.union(
          box.clone().applyMatrix4(exactSample(take, cycle, part, sample)),
        );
    if (!finite(result.min) || !finite(result.max)) result = null;
  }
  byGeometry.set(geometry, result);
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

/** Pose a surface once, on first use, within the shared vertex allowance. */
function lazySurface(
  budget: { posedVertices: number },
  topology: ITopology,
  pose: (vertex: number, target: THREE.Vector3) => THREE.Vector3,
  error: number = 0,
): collectAutoMovieCollisionParts.IPartSurface["read"] {
  let result:
    | collectAutoMovieCollisionParts.ISurface
    | null
    | "budget"
    | undefined;
  return () => {
    if (result !== undefined) return result;
    const count: number = topology.positions.count;
    if (count > budget.posedVertices) return (result = "budget");
    budget.posedVertices -= count;
    const values: THREE.Vector3[] = Array.from({ length: count }, (_, i) =>
      pose(i, new THREE.Vector3()),
    );
    const scale: number = values.reduce(
      (max, p) => Math.max(max, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)),
      1,
    );
    const slack: number = error + 32 * 2 ** -23 * scale;
    const triangles: number[] = [];
    const drawn: Set<number> = new Set();
    const ab: THREE.Vector3 = new THREE.Vector3();
    const ac: THREE.Vector3 = new THREE.Vector3();
    const cross: THREE.Vector3 = new THREE.Vector3();
    for (let i: number = 0; i < topology.triangles.length; i += 3) {
      const a: number = topology.triangles[i]!;
      const b: number = topology.triangles[i + 1]!;
      const c: number = topology.triangles[i + 2]!;
      if (!finite(values[a]!) || !finite(values[b]!) || !finite(values[c]!))
        return (result = null);
      ab.subVectors(values[b]!, values[a]!);
      ac.subVectors(values[c]!, values[a]!);
      if (
        cross.crossVectors(ab, ac).length() <=
        2 * slack * (ab.length() + ac.length() + 2 * slack)
      )
        continue;
      triangles.push(a, b, c);
      drawn.add(a);
      drawn.add(b);
      drawn.add(c);
    }
    const bounds: THREE.Box3 = new THREE.Box3();
    for (const vertex of drawn) bounds.expandByPoint(values[vertex]!);
    return (result = {
      values,
      triangles: Uint32Array.from(triangles),
      drawn: Uint32Array.from(drawn),
      error: slack,
      closed: topology.closed,
      bounds,
    });
  };
}

/** Enclose an affinely placed local box by its eight transformed corners. */
function worldBox(
  local: THREE.Box3,
  matrix: THREE.Matrix4,
): IAutoMovieSubjectBox | null {
  if (!matrix.elements.every(Number.isFinite)) return null;
  const box: THREE.Box3 = local.clone().applyMatrix4(matrix);
  return finite(box.min) && finite(box.max)
    ? {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      }
    : null;
}

/** All three coordinates are finite in double and single precision. */
function finite(point: THREE.Vector3): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z) &&
    Number.isFinite(Math.fround(point.x)) &&
    Number.isFinite(Math.fround(point.y)) &&
    Number.isFinite(Math.fround(point.z))
  );
}
