import type { IAutoMovieSceneCollision as Collision } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../../AutoMovieThreeKind.js";
import { AutoMovieCollisionSource } from "../AutoMovieCollisionSource.js";
import { autoMovieInspectionEntityPathOf } from "../autoMovieInspectionEntityPathOf.js";
import { readAutoMovieCollisionCord } from "./readAutoMovieCollisionCord.js";
import { readAutoMovieCollisionInstances } from "./readAutoMovieCollisionInstances.js";
import { readAutoMovieCollisionMesh } from "./readAutoMovieCollisionMesh.js";

/**
 * Read every visible drawn object of one placed layer as collision parts.
 *
 * Plain stock boxes become exact displayed solids. A closed stock mesh, a stock
 * skin and every drawn member of an instanced batch become conservative world
 * envelopes with a lazily posed surface. A cord becomes enclosing capsules
 * around its solver segments, with its drawn tube as the surface. Open surfaces
 * and custom vertex programs remain unsupported with a reason. Each mesh is
 * named by its unique entity path, so identities stay the same from frame to
 * frame.
 *
 * @param layer The placed layer and its source-owned identities.
 * @param budget Posed-vertex allowance charged when a surface is read, and an
 *   optional part allowance charged per collected part; collection stops when
 *   the parts run out.
 * @returns Parts in traversal order, posed surfaces by part and unsupported
 *   reasons by part.
 */
export function collectAutoMovieCollisionParts(
  layer: collectAutoMovieCollisionParts.ILayer,
  budget: { posedVertices: number; parts?: number },
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
    if (AutoMovieThreeKind.isMesh(object))
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
    if (budget.parts !== undefined) --budget.parts;
    if (surface !== undefined) surfaces.set(part.id, surface);
    if (reason !== undefined) reasons.set(part.id, reason);
  };
  let truncated: boolean = false;
  for (const { mesh, group } of meshes) {
    if (budget.parts !== undefined && budget.parts <= 0) {
      truncated = true;
      break;
    }
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
    else if (AutoMovieThreeKind.isInstancedMesh(mesh))
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
  if (budget.parts !== undefined && budget.parts < 0) truncated = true;
  return { parts, surfaces, reasons, truncated };
}

/** The layer read by the collector and the surfaces and reasons it returns. */
export namespace collectAutoMovieCollisionParts {
  /** One source-owned layer, after its exact placement and world-matrix update. */
  export interface ILayer {
    /** Placed root whose visible descendants are drawn. */
    root: THREE.Object3D;

    /** Named identities and exemptions given by a model or formation owner. */
    ownership?: ReadonlyMap<THREE.Object3D, Omit<Collision.IPart, "geometry">>;

    /**
     * Roots whose source already supplied placed parts. Their descendants are
     * not scanned.
     */
    opaque?: ReadonlyMap<THREE.Object3D, readonly Collision.IPart[]>;
  }

  /** Drawn world surface of one part. */
  export interface ISurface {
    /** World vertex positions by vertex index. */
    readonly values: readonly THREE.Vector3[];

    /** Drawn nondegenerate triangles as vertex index triples. */
    readonly triangles: Uint32Array;

    /** Distinct vertex indices used by the drawn triangles. */
    readonly drawn: Uint32Array;

    /** Pose error of each position in world metres. */
    readonly error: number;

    /**
     * Whether every drawn edge is traversed equally in both directions, so the
     * surface bounds a solid.
     */
    readonly closed: boolean;

    /** World bounds of the drawn vertices. */
    readonly bounds: THREE.Box3;

    /**
     * The skin joint that dominates a vertex, for joint-scoped allowances.
     * Omitted for unskinned surfaces.
     */
    readonly label?: (vertex: number) => string | undefined;
  }

  /** A lazily posed surface and the part of it a collision part owns. */
  export interface IPartSurface {
    /**
     * The posed surface, null when unsupported, or "budget" when its vertices
     * exceed the remaining allowance.
     */
    read(): ISurface | null | "budget";

    /**
     * Whether a world point of the surface belongs to this part. Omitted for a
     * whole surface.
     */
    owns?: (point: THREE.Vector3) => boolean;
  }

  /** Parts, their drawn surfaces and unsupported reasons. */
  export interface IResult {
    /** Parts in traversal order. */
    readonly parts: Collision.IPart[];
    /** Lazy drawn surfaces by part identity. */
    readonly surfaces: ReadonlyMap<string, IPartSurface>;
    /** Why a part has no geometry, by part identity. */
    readonly reasons: ReadonlyMap<string, string>;
    /**
     * Whether the part allowance ran out before every drawn object was
     * collected.
     */
    readonly truncated: boolean;
  }
}
