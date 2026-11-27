import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { QuadrupedScapula } from "./QuadrupedScapula";

/*
 * The closed rigid vocabulary; no body or species is reconstructed.
 */
const BONES: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
  "trunk",
  "hindquarters",
  "neck",
  "head",
  "tail",
  ...Object.values(QuadrupedScapula.BONES),
  ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
    (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
      ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
    ],
  ),
];

/*
 * Internal shared rigid-frame admission and carrier delta arithmetic.
 */
export namespace QuadrupedRigDelta {
  /*
   * Compute one admitted carrier delta per bone.
   * Parameter neutral: Complete neutral world frames of the source rig.
   * Parameter current: Complete current world frames of that same rig.
   * Returns: Fresh rigid maps from original coordinates to current coordinates.
   * For incomplete/unknown vocabularies, invalid rigid
   * frames or unrepresentable derived translations.
   */
  export function between(
    neutral: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    current: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
  ): ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    AutoMovieArchetypeFrame.IMotion
  > {
    if (
      neutral === undefined ||
      neutral === null ||
      current === undefined ||
      current === null ||
      neutral.size !== BONES.length ||
      current.size !== BONES.length ||
      BONES.some(
        (bone: AutoMovieArchetypeQuadrupedBody.Bone): boolean =>
          !neutral.has(bone) || !current.has(bone),
      )
    )
      throw new RangeError(
        "Quadruped deltas require both complete actual FK states",
      );
    const deltas: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeFrame.IMotion
    > = new Map();
    for (const bone of BONES) {
      const old: IAutoMovieTransform = neutral.get(bone)!;
      const now: IAutoMovieTransform = current.get(bone)!;
      rigid(old, bone);
      rigid(now, bone);
      const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
        now.rotation,
        Quaternion.inverse(old.rotation),
      );
      const translation: IAutoMovieTransform["translation"] = Vector3.subtract(
        now.translation,
        Quaternion.rotateVector(rotation, old.translation),
      );
      deltas.set(bone, { rotation, translation });
    }
    return deltas;
  }

  /*
   * Move one part/contact frame by its explicit carrier.
   * Parameter frame: Original rigid frame in source-model metres.
   * Parameter bone: The explicitly declared carrier; undefined is refused.
   * Parameter deltas: The complete admitted carrier maps.
   * Parameter id: Source part/contact identity retained in a refusal.
   * Returns: A new current rigid frame without retaining or changing its input.
   * For missing carriers or invalid/unrepresentable
   * frames.
   */
  export function move(
    frame: IAutoMovieTransform,
    bone: AutoMovieArchetypeQuadrupedBody.Bone | undefined,
    deltas: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeFrame.IMotion
    >,
    id: string,
  ): IAutoMovieTransform {
    rigid(frame, id);
    const delta: AutoMovieArchetypeFrame.IMotion | undefined =
      bone === undefined ? undefined : deltas.get(bone);
    if (delta === undefined)
      throw new RangeError(`Missing quadruped carrier for ${id}`);
    const current: IAutoMovieTransform = AutoMovieArchetypeFrame.move(
      delta,
      frame,
    );
    rigid(current, id);
    return current;
  }

  /*
   * Rigid maps cannot ignore scale or report a nonfinite current frame.
   */
  function rigid(frame: IAutoMovieTransform, id: string): void {
    if (frame === undefined || frame === null)
      throw new RangeError(`Quadruped ${id} has no rigid frame`);
    for (const axis of ["x", "y", "z"] as const)
      if (frame.scale[axis] !== 1)
        throw new RangeError(
          `Quadruped ${id} requires a finite unit-scale frame`,
        );
    const q: IAutoMovieTransform["rotation"] = frame.rotation;
    const length: number = Math.hypot(q.x, q.y, q.z, q.w);
    if (!(Math.abs(length - 1) <= 64 * Number.EPSILON))
      throw new RangeError(`Quadruped ${id} requires a unit rotation`);
  }
}
