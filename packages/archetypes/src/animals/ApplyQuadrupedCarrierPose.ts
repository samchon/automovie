import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { ArchetypePartOwnership } from "../core/ArchetypePartOwnership";
import { AutoMovieArchetype } from "../core/AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "../core/AutoMovieArchetypeFrame";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** The built-in owners that normalized the private neutral source. */
const REPOSE: typeof AutoMovieArchetype.prototype.reposed =
  AutoMovieArchetype.prototype.reposed;
const CLONE: typeof structuredClone = structuredClone;

/** Private data-copy admission for the neutral preparation. */
export namespace ApplyQuadrupedCarrierPose {
  /** Move parts and contact frames through their admitted carrier deltas. */
  export function emit<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    rest: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    posed: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    copy?: ApplyQuadrupedCarrierPose.CopyPart,
    neutral?: ApplyQuadrupedCarrierPose.ObserveNeutral,
    expose?: () => void,
  ): AutoMovieArchetype<Id, D> {
    const deltas: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeFrame.IMotion
    > = QuadrupedRigDelta.between(rest, posed);
    const identities: Map<string, AutoMovieArchetypeQuadrupedBody.Bone> =
      new Map(
        [...deltas.keys()].map(
          (
            bone: AutoMovieArchetypeQuadrupedBody.Bone,
          ): [string, AutoMovieArchetypeQuadrupedBody.Bone] => [bone, bone],
        ),
      );
    const original: readonly IAutoMovieModelPart[] = animal.parts;
    let owned: boolean =
      neutral !== undefined && ArchetypePartOwnership.owns(animal, original);
    const moved: IAutoMovieModelPart[] = original.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const bone: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
          identities.get(part.id) ?? parts[part.id];
        const frame: IAutoMovieTransform =
          part.transform ??
          AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
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
    const construct = (): AutoMovieArchetype<Id, D> =>
      Reflect.apply(reposed, animal, [moved, frames]);
    if (owned && reposed === REPOSE && neutral !== undefined)
      return ArchetypePartOwnership.observe(moved, construct, neutral);
    const model: AutoMovieArchetype<Id, D> = construct();
    neutral?.(false);
    return model;
  }

  /** Copy a part before replacing its moved transform. */
  export type CopyPart = (
    part: IAutoMovieModelPart,
  ) => IAutoMovieModelPart | undefined;

  /** Observe whether the neutral emission used the native owners. */
  export type ObserveNeutral = (native: boolean) => void;

  /**
   * Check the current structured-clone data binding without evaluating a
   * replacement getter.
   */
  export function nativeClone(): boolean {
    return (
      Object.getOwnPropertyDescriptor(globalThis, "structuredClone")?.value ===
      CLONE
    );
  }

  /**
   * Check the currently installed native repose before the private copying
   * path.
   */
  export function nativeRepose(): boolean {
    return (
      Object.getOwnPropertyDescriptor(AutoMovieArchetype.prototype, "reposed")
        ?.value === REPOSE
    );
  }

  /** Prepare the bounded layout copier for the owned primitive parts. */
  export function primitiveCopy(
    parts: readonly IAutoMovieModelPart[],
  ): CopyPart | undefined {
    if (
      !parts.some(
        (part: IAutoMovieModelPart): boolean =>
          part.geometry.type === "primitive",
      )
    )
      return undefined;
    return (part: IAutoMovieModelPart): IAutoMovieModelPart | undefined => {
      const geometry = part.geometry;
      if (geometry.type !== "primitive") return undefined;
      return {
        ...part,
        geometry: { ...geometry, shape: { ...geometry.shape } },
      };
    };
  }
}
