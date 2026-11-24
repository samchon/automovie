import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../core/AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "../core/AutoMovieArchetypeFrame";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** Rigid carrier deltas applied to a quadruped's parts and contacts. */
export namespace ApplyQuadrupedCarrierPose {
  /**
   * Move parts and contact frames through their carriers' rigid deltas from the
   * rest frames to the posed frames.
   *
   * @param animal The model whose parts and contacts move; never changed.
   * @param rest Each bone's rest frame.
   * @param posed Each bone's posed frame.
   * @param parts The carrier bone of each non-bone part.
   * @param contacts The carrier bone of each contact.
   * @returns A fresh model with the moved parts and contact frames.
   */
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
    const moved: IAutoMovieModelPart[] = animal.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const bone: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
          identities.get(part.id) ?? parts[part.id];
        const frame: IAutoMovieTransform =
          part.transform ??
          AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
        return {
          ...structuredClone(part),
          transform: QuadrupedRigDelta.move(frame, bone, deltas, part.id),
        };
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
    return animal.reposed(moved, frames);
  }
}
