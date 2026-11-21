import type { IAutoMovieSceneCollision } from "@automovie/interface";
import type * as THREE from "three";

/** The userData key every generator writes and the collision collector reads. */
const KEY: string = "automovieCollisionSource";

/**
 * Collision identities that a scene generator attaches to the native objects it
 * actually draws, so the placed-scene collision check reads the same members
 * and segments the frame shows.
 *
 * @evidence contracts/development/design.md#principled-representation An instanced batch maps each drawn instance index to its generator slot and managed group. A cord keeps its solver particles and radius beside the tube drawn through them.
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
   */
  export function bindCord(object: THREE.Object3D, source: ICord | null): void {
    if (source === null) delete object.userData[KEY];
    else object.userData[KEY] = { kind: "cord", source };
  }

  /**
   * Read the drawn members recorded on an instanced batch.
   *
   * @param mesh A visible instanced mesh.
   * @returns The generator record, or undefined for an anonymous batch.
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
   */
  export function cord(object: THREE.Object3D): ICord | undefined {
    const record: unknown = object.userData[KEY];
    return isRecord(record, "cord") ? (record.source as ICord) : undefined;
  }
}

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
