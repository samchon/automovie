import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

/**
 * An equid's body between two posed models of it at their placements, read in the second's placement and held on the floor by its lowest part.
 *
 * Each part's and contact's world frame blends from the first model's to the second's, the rotation by spherical interpolation and the translation linearly, at the share; the blend is then raised by the depth its lowest part would reach under the floor, so the body rests on the floor rather than passing through it. It is the transition between a stride or a stance and a lying pose, where the two poses share no common rig path.
 *
 * @param from The first posed model.
 * @param fromPlacement Its placement.
 * @param to The second posed model, whose parts and contacts the blend keeps.
 * @param toPlacement Its placement, the blend's own.
 * @param share 0 for the first pose, 1 for the second.
 * @returns The blended model in the second's placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the blend, the floor support and its use.
 * @evidence contracts/development/implementation.md#principled-implementation Per-frame slerp and lerp in world space, read back into the second placement, then one lift by the lowest part's floor depth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Blend, lift, repose.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lift only ever raises the body; nothing is clamped part by part.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(P + A).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the fall and the foaling recumbency.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh model.
 */
export function EquineBlend<Id extends string, D extends string>(
  from: AutoMovieArchetype<Id, D>,
  fromPlacement: IAutoMovieTransform,
  to: AutoMovieArchetype<Id, D>,
  toPlacement: IAutoMovieTransform,
  share: number,
): AutoMovieArchetype<Id, D> {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    toPlacement.rotation,
  );
  const local = (frame: IAutoMovieTransform): IAutoMovieTransform => ({
    ...frame,
    rotation: Quaternion.multiply(inverse, frame.rotation),
    translation: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(frame.translation, toPlacement.translation),
    ),
  });
  const mix = (
    a: IAutoMovieTransform,
    b: IAutoMovieTransform,
  ): IAutoMovieTransform =>
    local({
      ...b,
      rotation: Quaternion.slerp(a.rotation, b.rotation, share),
      translation: Vector3.lerp(a.translation, b.translation, share),
    });
  const source: ReadonlyMap<string, IAutoMovieModelPart> = new Map(
    from.parts.map(
      (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
        part.id,
        part,
      ],
    ),
  );
  let parts: IAutoMovieModelPart[] = to.parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart => {
      const was: IAutoMovieModelPart | undefined = source.get(part.id);
      if (
        was?.transform === undefined ||
        was.transform === null ||
        part.transform === undefined ||
        part.transform === null
      )
        return part;
      return {
        ...part,
        transform: mix(
          AutoMovieArchetypeFrame.compose(fromPlacement, was.transform),
          AutoMovieArchetypeFrame.compose(toPlacement, part.transform),
        ),
      };
    },
  );

  // Hold the blended body on the floor by its lowest part.
  const lowest: number = Math.min(
    ...parts
      .filter(
        (part: IAutoMovieModelPart): boolean =>
          part.transform !== undefined && part.transform !== null,
      )
      .map((part: IAutoMovieModelPart): number =>
        QuadrupedRestFloor({
          ...part,
          transform: AutoMovieArchetypeFrame.compose(
            toPlacement,
            part.transform!,
          ),
        }),
      ),
  );
  const lift: IAutoMovieVector3 = Quaternion.rotateVector(inverse, {
    x: 0,
    y: Math.max(0, -lowest),
    z: 0,
  });
  parts = parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart =>
      part.transform === undefined || part.transform === null
        ? part
        : {
            ...part,
            transform: {
              ...part.transform,
              translation: Vector3.add(part.transform.translation, lift),
            },
          },
  );
  const contacts: ReadonlyMap<string, IAutoMovieTransform> = new Map(
    from.affordances.map(
      (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
        contact.id,
        contact.frame,
      ],
    ),
  );
  return to.reposed(
    parts,
    new Map(
      to.affordances.map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => {
          const was: IAutoMovieTransform =
            contacts.get(contact.id) ?? contact.frame;
          const frame: IAutoMovieTransform = mix(
            AutoMovieArchetypeFrame.compose(fromPlacement, was),
            AutoMovieArchetypeFrame.compose(toPlacement, contact.frame),
          );
          return [
            contact.id,
            {
              ...frame,
              translation: Vector3.add(frame.translation, lift),
            },
          ];
        },
      ),
    ),
  );
}
