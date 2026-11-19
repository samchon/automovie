import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Archetype } from "../core/Archetype";
import { ArchetypeFrame } from "../core/ArchetypeFrame";
import { ArchetypePartOwnership } from "../core/ArchetypePartOwnership";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** The built-in owners that normalized the private neutral source. */
const REPOSE: typeof Archetype.prototype.reposed = Archetype.prototype.reposed;
const CLONE: typeof structuredClone = structuredClone;

/**
 * Private data-copy admission for the actual neutral preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the independent primitive record and its actual native clone owner.
 * @evidence contracts/development/design.md#principled-representation The qualified shape is a tree of ordinary owned data records with scalar leaves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only native quadruped preparation and ODE hitch emission consume this protocol.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported graphs or overridden clone functions use the existing generic clone.
 */
export namespace ApplyQuadrupedCarrierPose {
  /**
   * Move actual parts and contact frames through their admitted carrier deltas.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the original geometry and complete carrier inputs and fresh normal posed output.
   * @evidence contracts/development/implementation.md#principled-implementation Apply the same rigid deltas to both kinds of carrier and emit through the original model's reposed method.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One part map and one contact map precede the native model emission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only an independently owned data copy can substitute for the original structured clone; exact transform, floor consumers and model normalization remain live.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+V) work for bones, parts, contacts and copied geometry data. The private primitive path only copies bounded scalar records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Public skeleton and private prepare share every transform and contact operation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation keeps no completed pose. The new model owns current records.
   */
  export function emit<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
    rest: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
    posed: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
    parts: Readonly<Record<string, QuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, QuadrupedBody.Bone>>,
    copy?: ApplyQuadrupedCarrierPose.CopyPart,
    neutral?: ApplyQuadrupedCarrierPose.ObserveNeutral,
    expose?: () => void,
  ): Archetype<Id, D> {
    const deltas: ReadonlyMap<QuadrupedBody.Bone, ArchetypeFrame.IMotion> =
      QuadrupedRigDelta.between(rest, posed);
    const identities: Map<string, QuadrupedBody.Bone> = new Map(
      [...deltas.keys()].map(
        (bone: QuadrupedBody.Bone): [string, QuadrupedBody.Bone] => [
          bone,
          bone,
        ],
      ),
    );
    const original: readonly IAutoMovieModelPart[] = animal.parts;
    let owned: boolean =
      neutral !== undefined && ArchetypePartOwnership.owns(animal, original);
    const moved: IAutoMovieModelPart[] = original.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const bone: QuadrupedBody.Bone | undefined =
          identities.get(part.id) ?? parts[part.id];
        const frame: IAutoMovieTransform =
          part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
        if (owned) owned = ApplyQuadrupedCarrierPose.nativeClone();
        const current: IAutoMovieModelPart | undefined = copy?.(part);
        if (current === undefined)
          return {
            ...structuredClone(part),
            transform: QuadrupedRigDelta.move(frame, bone, deltas, part.id),
          };
        current.transform = QuadrupedRigDelta.move(
          frame,
          bone,
          deltas,
          part.id,
        );
        return current;
      },
    );
    const frames: Map<string, IAutoMovieTransform> = new Map(
      animal.affordances.map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
          contact.id,
          QuadrupedRigDelta.move(
            contact.frame,
            contacts[contact.id],
            deltas,
            contact.id,
          ),
        ],
      ),
    );
    if (neutral === undefined && expose === undefined)
      return animal.reposed(moved, frames);

    if (expose !== undefined && !ApplyQuadrupedCarrierPose.nativeRepose())
      expose();
    const reposed: typeof animal.reposed = animal.reposed;
    if (reposed !== REPOSE) expose?.();
    const construct = (): Archetype<Id, D> =>
      Reflect.apply(reposed, animal, [moved, frames]);
    if (owned && reposed === REPOSE && neutral !== undefined)
      return ArchetypePartOwnership.observe(moved, construct, neutral);
    const model: Archetype<Id, D> = construct();
    neutral?.(false);
    return model;
  }

  /**
   * Copy a part before replacing its moved transform.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the ownership of copied part data before the current transform is set.
   * @evidence contracts/development/design.md#principled-representation Copies independent model records in original key order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the private carrier emitter needs this operation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable reference from the prior part is published.
   */
  export type CopyPart = (
    part: IAutoMovieModelPart,
  ) => IAutoMovieModelPart | undefined;

  /**
   * Observe whether the actual neutral emission used the native owners.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reports admission after the actual neutral emission.
   * @evidence contracts/development/design.md#principled-representation A current built-in clone and native repose give the normalizer's actual private output.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only private neutral preparation observes the result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A caller flag cannot authenticate an opaque source.
   */
  export type ObserveNeutral = (native: boolean) => void;

  /**
   * Check the current structured-clone data binding without evaluating a replacement getter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the original clone authority and opaque fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Read the own binding descriptor rather than calling an unknown accessor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compare one current descriptor value with the intrinsic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A replacement method or getter cannot authorize the special copy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the intrinsic binding permits the proved equivalent data copies.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only the original operator identity.
   */
  export function nativeClone(): boolean {
    return (
      Object.getOwnPropertyDescriptor(globalThis, "structuredClone")?.value ===
      CLONE
    );
  }

  /**
   * Check the currently installed native repose before the private copying path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the actual native repose binding read by the current private source.
   * @evidence contracts/development/implementation.md#principled-implementation A descriptor check leaves any changed accessor to the ordinary call.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Match one exact prototype data function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No altered method is made opaque to the original pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms One own descriptor check.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The proved source still has its original repose owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the canonical method identity.
   */
  export function nativeRepose(): boolean {
    return (
      Object.getOwnPropertyDescriptor(Archetype.prototype, "reposed")?.value ===
      REPOSE
    );
  }

  /**
   * Prepare the bounded layout copier for the owned primitive parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the native output ownership, supported record tree and declined alternative.
   * @evidence contracts/development/implementation.md#principled-implementation Admit only own plain enumerable string data and the actual primitive shape's scalar values, with separate records at every mutable node.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private snapshot admission, followed by ordinary spreads in native key order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither descriptors nor model data from an unproved public receiver establish copying; unsupported part identities keep the original clone.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P) bounded recipe checks once; each qualified part copy allocates a constant number of fresh records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original private neutral part data supplies all current poses, while the original exact mover still computes each current transform.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The copier keeps only admitted neutral identities with its prepared source.
   */
  export function primitiveCopy(
    parts: readonly IAutoMovieModelPart[],
  ): CopyPart | undefined {
    const admitted: Set<IAutoMovieModelPart> = new Set();
    for (let i: number = 0; i < parts.length; ++i) {
      const part: IAutoMovieModelPart = parts[i]!;
      if (plainPart(part)) admitted.add(part);
    }
    if (admitted.size === 0) return undefined;
    return (part: IAutoMovieModelPart): IAutoMovieModelPart | undefined => {
      if (!admitted.has(part)) return undefined;
      const geometry = part.geometry;
      if (geometry.type !== "primitive") return undefined;
      return {
        ...part,
        geometry: { ...geometry, shape: { ...geometry.shape } },
      };
    };
  }

  /** Verify the original object's own structured-clone key domain. */
  function plainData(object: unknown): object is Record<string, unknown> {
    return (
      object !== null &&
      typeof object === "object" &&
      Object.getPrototypeOf(object) === Object.prototype &&
      Reflect.ownKeys(object).every((key: PropertyKey): boolean => {
        const field: PropertyDescriptor | undefined =
          Object.getOwnPropertyDescriptor(object, key);
        return (
          typeof key === "string" &&
          field?.enumerable === true &&
          "value" in field
        );
      })
    );
  }

  /** Admit only the actual renderer part fields and an independent scalar recipe. */
  function plainPart(part: IAutoMovieModelPart): boolean {
    if (
      !plainData(part) ||
      Object.keys(part).length !== 6 ||
      ![
        "id",
        "name",
        "geometry",
        "material",
        "attachedBone",
        "transform",
      ].every((key: string): boolean => Object.hasOwn(part, key)) ||
      ![part.id, part.name, part.material, part.attachedBone].every(scalar)
    )
      return false;
    const geometry = part.geometry;
    return (
      plainData(geometry) &&
      geometry.type === "primitive" &&
      Object.keys(geometry).length === 2 &&
      Object.hasOwn(geometry, "type") &&
      Object.hasOwn(geometry, "shape") &&
      plainData(geometry.shape) &&
      Object.values(geometry.shape).every(scalar) &&
      plainTransform(part.transform, geometry, geometry.shape)
    );
  }

  /** The discarded neutral transform cannot alias any copied geometry node. */
  function plainTransform(
    transform: IAutoMovieTransform | null,
    geometry: object,
    shape: object,
  ): boolean {
    if (transform === null) return true;
    if (!plainData(transform) || Object.keys(transform).length !== 3)
      return false;
    const vectors: readonly unknown[] = [
      transform.translation,
      transform.rotation,
      transform.scale,
    ];
    return (
      new Set([geometry, shape, transform, ...vectors]).size === 6 &&
      vectors.every(
        (value: unknown): boolean =>
          plainData(value) && Object.values(value).every(scalar),
      )
    );
  }

  /** Scalars keep exact primitive values and never secretly reference a record. */
  function scalar(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    );
  }
}
