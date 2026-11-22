import type { IAutoMovieSceneCollision } from "@automovie/interface";
import * as THREE from "three";

/** The userData key every generator writes and the collision collector reads. */
const KEY: string = "automovieCollisionSource";

/**
 * Collision identities that a scene generator attaches to the native objects it
 * actually draws, so the placed-scene collision check reads the same members
 * and segments the frame shows.
 *
 * @evidence contracts/development/design.md#principled-representation An instanced batch maps each drawn instance index to its generator slot and managed group. A cord keeps its solver particles and radius beside the tube drawn through them. A rigid model keeps each part's built placement relative to its root, so a part moved since is no longer part of the assembly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The generator that draws the object writes its record once per update, and only the placed collision collector reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Names and scene nesting never imply a slot, a group or a cord. An object without a record is read as ordinary geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States the writer, the reader, the units and the index correspondence.
 */
export namespace AutoMovieCollisionSource {
  /**
   * Drawn members of one instanced batch.
   *
   * @evidence contracts/development/design.md#principled-representation The array index is the instance index, and its value is the generator's stable slot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the identity the collision report names.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The group is the generator's explicit formation owner.
   * @evidence contracts/development/common.md#meaningful-documentation Describes each field's origin.
   */
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

  /**
   * The solver particles a cord tube was drawn through.
   *
   * @evidence contracts/development/design.md#principled-representation Flat object-local metre coordinates of consecutive distinct particles and the tube radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The soft-prop owner writes it with the same frame that rebuilt the tube.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fewer than two distinct particles draw no tube and record nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate frame and units.
   */
  export interface ICord {
    /** Positive tube radius in object-local metres. */
    readonly radius: number;

    /** Particle coordinates x, y, z in object-local metres, at least two distinct points. */
    readonly points: readonly number[];
  }

  /**
   * Record the drawn members of an instanced batch.
   *
   * @param mesh The batch the generator draws.
   * @param source Slot of every instance index and its managed group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is recorded, on which object and from which owner.
   * @evidence contracts/development/implementation.md#principled-implementation The record lives on the batch the generator draws, so the collector reads the identities of exactly the drawn instances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One tagged assignment under the module's key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The slots are stored as given; no slot is derived from names or nesting.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A constant-time assignment chooses no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each generator update writes its current record once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record lives on the mesh and is released with it.
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
   * @param source Its particles and radius, or null for a surface that is not a cord.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is recorded or cleared and on which object.
   * @evidence contracts/development/implementation.md#principled-implementation The record sits on the tube rebuilt from the same particles, and a null source removes a stale record so a surface that stopped being a cord is read as geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delete or one tagged assignment under the module's key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The particles are stored as given; no cord is inferred from the tube's shape.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A constant-time assignment chooses no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each soft-prop update writes its current record once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record lives on the object and is released or deleted with it.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is recorded and relative to what.
   * @evidence contracts/development/implementation.md#principled-implementation Each part's placement is stored relative to the root's world matrix at build time, so a later reader can tell whether the part still holds it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One world-matrix update, one inverse and one relative matrix per part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parts are the ones the builder passes; nesting adds none.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, with one matrix product each.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A model is recorded once when it is built.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The placements are kept in a WeakMap keyed by the root, so they are released with the model.
   */
  export function bindAssembly(
    root: THREE.Object3D,
    parts: Iterable<THREE.Object3D>,
  ): void {
    root.updateWorldMatrix(true, true);
    const inverse: THREE.Matrix4 = root.matrixWorld.clone().invert();
    const rest: Map<THREE.Object3D, THREE.Matrix4> = new Map();
    for (const part of parts)
      rest.set(part, inverse.clone().multiply(part.matrixWorld));
    ASSEMBLIES.set(root, rest);
  }

  /**
   * Read a rigid assembly whose parts still hold their built placement.
   *
   * @param root A visible object, after the frame's world-matrix update.
   * @returns The assembly's parts, or undefined when none was built or any part moved relative to the root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on the world matrices and both outcomes.
   * @evidence contracts/development/implementation.md#principled-implementation Compares every part's current root-relative matrix with its built one, so only a model still rigid in its built shape groups its parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one inverse and one element-wise comparison per part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Any element beyond 2^-20 relative difference voids the assembly instead of being tolerated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, with one matrix product and sixteen comparisons each, stopping at the first moved part.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Placement can change every frame, so each observation compares afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh set and keeps nothing.
   */
  export function assembly(
    root: THREE.Object3D,
  ): ReadonlySet<THREE.Object3D> | undefined {
    const rest: Map<THREE.Object3D, THREE.Matrix4> | undefined =
      ASSEMBLIES.get(root);
    if (rest === undefined) return undefined;
    const inverse: THREE.Matrix4 = root.matrixWorld.clone().invert();
    const current: THREE.Matrix4 = new THREE.Matrix4();
    for (const [part, built] of rest) {
      current.multiplyMatrices(inverse, part.matrixWorld);
      for (let i: number = 0; i < 16; ++i)
        if (
          !(
            Math.abs(current.elements[i]! - built.elements[i]!) <=
            2 ** -20 * Math.max(1, Math.abs(built.elements[i]!))
          )
        )
          return undefined;
    }
    return new Set(rest.keys());
  }

  /**
   * Read the drawn members recorded on an instanced batch.
   *
   * @param mesh A visible instanced mesh.
   * @returns The generator record, or undefined for an anonymous batch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and when nothing is.
   * @evidence contracts/development/implementation.md#principled-implementation Returns only a record this module tagged as instances, so foreign userData is never read as identities.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one tag check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An untagged or differently tagged record yields undefined instead of a guessed slot list.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A constant-time read chooses no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The stored record itself is returned.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the mesh's record and keeps nothing.
   */
  export function instances(mesh: THREE.InstancedMesh): IInstances | undefined {
    const record: unknown = mesh.userData[KEY];
    return isRecord(record, "instances")
      ? (record.source as IInstances)
      : undefined;
  }

  /**
   * Read the particles recorded on a cord tube.
   *
   * @param object A visible mesh.
   * @returns The cord record, or undefined for any other surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and when nothing is.
   * @evidence contracts/development/implementation.md#principled-implementation Returns only a record this module tagged as a cord, so a surface is read as a cord only when its owner said so.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read and one tag check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An untagged or differently tagged record yields undefined instead of a guessed cord.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A constant-time read chooses no algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The stored record itself is returned.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the object's record and keeps nothing.
   */
  export function cord(object: THREE.Object3D): ICord | undefined {
    const record: unknown = object.userData[KEY];
    return isRecord(record, "cord") ? (record.source as ICord) : undefined;
  }
}

/**
 * Built part placements per model root. Kept outside userData, which Three
 * clones through JSON, so object references never enter a serialized record.
 */
const ASSEMBLIES: WeakMap<
  THREE.Object3D,
  Map<THREE.Object3D, THREE.Matrix4>
> = new WeakMap();

/** Accept only this module's own tagged record. */
function isRecord(
  value: unknown,
  kind: "instances" | "cord",
): value is { kind: string; source: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === kind &&
    "source" in value
  );
}
