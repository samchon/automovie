import type { IAutoMovieSceneCollision } from "@automovie/interface";
import * as THREE from "three";

/**
 * Collision identities that a scene generator attaches to the native objects it
 * actually draws, so the placed-scene collision check reads the same members
 * and segments the frame shows.
 */
export namespace AutoMovieCollisionSource {
  /** Drawn members of one instanced batch. */
  export interface IInstances {
    /** Stable path prefix of the members, such as the formation's identity. */
    readonly id: string;

    /** Generator-owned exclusion group, omitted for independent instances. */
    readonly group?: IAutoMovieSceneCollision.IGroup;

    /** Broad refinement region shared by this batch, such as its chunk. */
    readonly region?: string;

    /** Generator slot of each drawn instance index. */
    readonly slots: readonly number[];
  }

  /** The solver particles a cord tube was drawn through. */
  export interface ICord {
    /** Positive tube radius in object-local metres. */
    readonly radius: number;

    /**
     * Particle coordinates x, y, z in object-local metres, at least two
     * distinct points.
     */
    readonly points: readonly number[];
  }

  /**
   * Record the drawn members of an instanced batch.
   *
   * @param mesh The batch the generator draws.
   * @param source Slot of every instance index and its managed group.
   */
  export function bindInstances(
    mesh: THREE.InstancedMesh,
    source: IInstances,
  ): void {
    mesh.userData[KEY] = { kind: "instances", source };
  }

  /**
   * Record or clear the particles of a drawn cord.
   *
   * @param object The tube mesh drawn for the cord.
   * @param source Its particles and radius, or null for a surface that is not a
   *   cord.
   */
  export function bindCord(object: THREE.Object3D, source: ICord | null): void {
    if (source === null) delete object.userData[KEY];
    else object.userData[KEY] = { kind: "cord", source };
  }

  /**
   * Record the parts of a model built as one rigid assembly, with each part's
   * placement relative to the root at build time.
   *
   * @param root The model root.
   * @param parts Every drawn part object of the model.
   */
  export function bindAssembly(
    root: THREE.Object3D,
    parts: Iterable<THREE.Object3D>,
  ): void {
    root.updateWorldMatrix(true, true);
    const inverse: THREE.Matrix4 = root.matrixWorld.clone().invert();
    const record: IAssemblyPart[] = [];
    for (const part of parts)
      record.push({
        uuid: part.uuid,
        built: inverse.clone().multiply(part.matrixWorld).toArray(),
      });
    root.userData[ASSEMBLY] = record;
  }

  /**
   * Read a rigid assembly whose parts still hold their built placement.
   *
   * @param root A visible object, after the frame's world-matrix update.
   * @returns The assembly's parts, or undefined when none was built or any part
   *   moved relative to the root.
   */
  export function assembly(
    root: THREE.Object3D,
  ): ReadonlySet<THREE.Object3D> | undefined {
    const record: readonly IAssemblyPart[] | undefined =
      root.userData[ASSEMBLY];
    if (record === undefined) return undefined;
    const inverse: THREE.Matrix4 = root.matrixWorld.clone().invert();
    const current: THREE.Matrix4 = new THREE.Matrix4();
    const found: Set<THREE.Object3D> = new Set();
    for (const entry of record) {
      const part: THREE.Object3D | undefined = root.getObjectByProperty(
        "uuid",
        entry.uuid,
      );
      if (part === undefined) return undefined;
      current.multiplyMatrices(inverse, part.matrixWorld);
      for (let i: number = 0; i < 16; ++i)
        if (
          !(
            Math.abs(current.elements[i]! - entry.built[i]!) <=
            2 ** -20 * Math.max(1, Math.abs(entry.built[i]!))
          )
        )
          return undefined;
      found.add(part);
    }
    return found;
  }

  /**
   * Read the drawn members recorded on an instanced batch.
   *
   * @param mesh A visible instanced mesh.
   * @returns The generator record, or undefined for an anonymous batch.
   */
  export function instances(mesh: THREE.InstancedMesh): IInstances | undefined {
    const record: IRecord | undefined = mesh.userData[KEY];
    return record?.kind === "instances" ? record.source : undefined;
  }

  /**
   * Read the particles recorded on a cord tube.
   *
   * @param object A visible mesh.
   * @returns The cord record, or undefined for any other surface.
   */
  export function cord(object: THREE.Object3D): ICord | undefined {
    const record: IRecord | undefined = object.userData[KEY];
    return record?.kind === "cord" ? record.source : undefined;
  }
}

/*
 * The userData key every generator writes and the collision collector reads.
 */
const KEY: string = "automovieCollisionSource";

/*
 * The userData key of a rigid assembly's record on its root: each part's uuid
 * and built placement relative to the root, plain data that survives Three's
 * JSON clone of userData; a clone's parts carry new uuids, so it reads as no
 * assembly.
 */
const ASSEMBLY: string = "automovieCollisionAssembly";

/*
 * One part of a rigid assembly record: its uuid and built placement.
 */
interface IAssemblyPart {
  /*
   * The part object's uuid.
   */
  readonly uuid: string;

  /*
   * Its placement relative to the root at build time, column-major.
   */
  readonly built: readonly number[];
}

/*
 * This module's own tagged record on a drawn object.
 */
type IRecord =
  | { kind: "instances"; source: AutoMovieCollisionSource.IInstances }
  | { kind: "cord"; source: AutoMovieCollisionSource.ICord };
