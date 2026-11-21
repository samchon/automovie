import type { IAutoMovieSceneCollision as Collision } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieCollisionSource } from "./AutoMovieCollisionSource.js";
import { autoMovieInspectionEntityPathOf } from "./autoMovieInspectionEntityPathOf.js";
import { readAutoMovieCollisionCord } from "./readAutoMovieCollisionCord.js";
import { readAutoMovieCollisionInstances } from "./readAutoMovieCollisionInstances.js";
import { readAutoMovieCollisionMesh } from "./readAutoMovieCollisionMesh.js";

/**
 * Read every visible drawn object of one placed layer as collision parts.
 *
 * Plain stock boxes become exact displayed solids. A closed stock mesh, a
 * stock skin and every drawn member of an instanced batch become conservative
 * world envelopes with a lazily posed surface. A cord becomes enclosing
 * capsules around its solver segments, with its drawn tube as the surface.
 * Open surfaces and custom vertex programs remain unsupported with a reason.
 * Each mesh is named by its unique entity path, so identities stay the same
 * from frame to frame.
 *
 * @param layer The placed layer and its source-owned identities.
 * @param budget Posed-vertex allowance shared by the frame; charged when a surface is read.
 * @returns Parts in traversal order, posed surfaces by part and unsupported reasons by part.
 * @evidence contracts/development/common.md#meaningful-documentation States which drawn object yields which geometry authority, how parts are named and when a surface is posed.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the drawn world and instance matrices, the generator's slot, cord and assembly records, and the shared entity path for identity.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal dispatches each drawn object kind to one reader module.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nesting and names grant no group; a built rigid model groups its parts only while each still holds its built placement. A clash with a source-declared path is refused rather than renamed by time.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits visible nodes once and names meshes with one frontier memo per layer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Readers share cached topology and box proofs; surfaces are posed only on demand.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned closures borrow the placed meshes for the current observation only.
 */
export function collectAutoMovieCollisionParts(
  layer: collectAutoMovieCollisionParts.ILayer,
  budget: { posedVertices: number },
): collectAutoMovieCollisionParts.IResult {
  const parts: Collision.IPart[] = [];
  const surfaces: Map<string, collectAutoMovieCollisionParts.IPartSurface> =
    new Map();
  const reasons: Map<string, string> = new Map();
  const frontiers: Map<
    THREE.Object3D,
    ReadonlyMap<string, readonly THREE.Object3D[]>
  > = new Map();
  const meshes: { mesh: THREE.Mesh; group?: Collision.IGroup }[] = [];
  const pending: {
    object: THREE.Object3D;
    assembly?: { group: Collision.IGroup; parts: ReadonlySet<THREE.Object3D> };
  }[] = [{ object: layer.root }];
  while (pending.length) {
    const { object, assembly: outer } = pending.pop()!;
    if (!object.visible) continue;
    const opaque: readonly Collision.IPart[] | undefined =
      layer.opaque?.get(object);
    if (opaque !== undefined) {
      for (const part of opaque) parts.push(part);
      continue;
    }
    // A built rigid model whose parts still hold their built placement owns
    // its internal pairs; nesting alone never does.
    const members: ReadonlySet<THREE.Object3D> | undefined =
      AutoMovieCollisionSource.assembly(object);
    const assembly:
      | { group: Collision.IGroup; parts: ReadonlySet<THREE.Object3D> }
      | undefined =
      members === undefined
        ? outer
        : {
            group: {
              id: autoMovieInspectionEntityPathOf(
                layer.root,
                object,
                frontiers,
              ),
              kind: "rigid-assembly",
            },
            parts: members,
          };
    if (object instanceof THREE.Mesh)
      meshes.push({
        mesh: object,
        ...(assembly?.parts.has(object) ? { group: assembly.group } : {}),
      });
    for (let i: number = object.children.length - 1; i >= 0; --i)
      pending.push({
        object: object.children[i]!,
        ...(assembly === undefined ? {} : { assembly }),
      });
  }
  const declared: Set<string> = new Set(
    parts.map((part: Collision.IPart): string => part.id),
  );
  const add: readAutoMovieCollisionMesh.IAdd = (
    part: Collision.IPart,
    surface?: collectAutoMovieCollisionParts.IPartSurface,
    reason?: string,
  ): void => {
    parts.push(part);
    if (surface !== undefined) surfaces.set(part.id, surface);
    if (reason !== undefined) reasons.set(part.id, reason);
  };
  for (const { mesh, group } of meshes) {
    const ownership: Omit<Collision.IPart, "geometry"> | undefined =
      layer.ownership?.get(mesh);
    const identity: string =
      ownership?.id ??
      autoMovieInspectionEntityPathOf(layer.root, mesh, frontiers);
    if (declared.has(identity))
      throw new Error(
        `Drawn mesh "${identity}" repeats a path its source already supplied`,
      );
    const cord: AutoMovieCollisionSource.ICord | undefined =
      AutoMovieCollisionSource.cord(mesh);
    if (cord !== undefined)
      readAutoMovieCollisionCord(mesh, identity, cord, budget, add);
    else if (mesh instanceof THREE.InstancedMesh)
      readAutoMovieCollisionInstances(mesh, identity, budget, add);
    else
      readAutoMovieCollisionMesh(
        mesh,
        {
          ...(group === undefined ? {} : { group }),
          ...ownership,
          id: identity,
        },
        budget,
        add,
      );
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
   * @evidence contracts/development/design.md#principled-representation World vertices with the drawn triangle list, closure, pose error and optional joint labels.
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

    /** The skin joint that dominates a vertex, for joint-scoped allowances. Omitted for unskinned surfaces. */
    readonly label?: (vertex: number) => string | undefined;
  }

  /**
   * A lazily posed surface and the part of it a collision part owns.
   *
   * @evidence contracts/development/design.md#principled-representation A shared surface and an optional ownership test.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reading charges the vertex budget once.
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
    /** Parts in traversal order. */
    readonly parts: Collision.IPart[];
    /** Lazy drawn surfaces by part identity. */
    readonly surfaces: ReadonlyMap<string, IPartSurface>;
    /** Why a part has no geometry, by part identity. */
    readonly reasons: ReadonlyMap<string, string>;
  }
}
