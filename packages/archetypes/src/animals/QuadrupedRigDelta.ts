import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { ArchetypeFrame } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedScapula } from "./QuadrupedScapula";

/** The actual closed rigid vocabulary; no body or species is reconstructed. */
const BONES: readonly QuadrupedBody.Bone[] = [
  "trunk",
  "hindquarters",
  "neck",
  "head",
  "tail",
  ...Object.values(QuadrupedScapula.BONES),
  ...QuadrupedBody.LIMBS.flatMap(
    (limb: QuadrupedBody.Limb): QuadrupedBody.Bone[] => [
      ...QuadrupedBody.BONES[limb],
    ],
  ),
];

/**
 * Internal shared rigid-frame admission and actual-carrier delta arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the complete actual quadruped vocabulary, finite unit-scale world frames and the current-times-inverse-neutral rigid map shared by model emission and body support measurement.
 * @evidence contracts/development/design.md#principled-representation The existing frame motion type and closed bone map represent a rigid change of actual carrier coordinates; no new geometry, rig or contact vocabulary is introduced.
 * @evidence contracts/development/design.md#minimal-and-owned-surface between serves both current consumers' frame deltas and move applies them with the same admission; geometry cloning and span evaluation stay with their actual owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing frames, nonunit scale and absent carriers are refused rather than inferred, and no species or humanoid slot selects a transform.
 */
export namespace QuadrupedRigDelta {
  /**
   * Compute one admitted actual-carrier delta per bone.
   *
   * @param neutral Complete neutral world frames of the actual source rig.
   * @param current Complete current world frames of that same rig.
   * @returns Fresh rigid maps from original coordinates to current coordinates.
   * @throws {RangeError} For incomplete/unknown vocabularies, invalid rigid frames or unrepresentable derived translations.
   * @evidence contracts/development/common.md#meaningful-documentation States complete same-rig maps, world metre units, independent output and rigid/nonfinite refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Current rotation times inverse-neutral rotation gives the carrier turn; current origin minus that turn applied to the neutral origin gives the rigid translation, preserving every carrier-local point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit both complete twenty-three-frame maps, then compute one quaternion/vector pair per actual bone through the engine owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No omitted frame, scaled geometry, nearest-bone guess, alternate root or species branch substitutes for the actual admitted rigid maps.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B) admission, work and fresh output for the fixed actual vocabulary; no source model, geometry buffer or FK traversal is rebuilt.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each consumer shares the returned delta per carrier across all its attached parts/contacts; queries at other frames are evaluated afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned map owns scalar motion records; the operation retains no caller frame map, completed result or external resource.
   */
  export function between(
    neutral: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
    current: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
  ): ReadonlyMap<QuadrupedBody.Bone, ArchetypeFrame.IMotion> {
    if (
      neutral === undefined ||
      neutral === null ||
      current === undefined ||
      current === null ||
      neutral.size !== BONES.length ||
      current.size !== BONES.length ||
      BONES.some(
        (bone: QuadrupedBody.Bone): boolean =>
          !neutral.has(bone) || !current.has(bone),
      )
    )
      throw new RangeError(
        "Quadruped deltas require both complete actual FK states",
      );
    const deltas: Map<QuadrupedBody.Bone, ArchetypeFrame.IMotion> = new Map();
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
      if (![translation.x, translation.y, translation.z].every(Number.isFinite))
        throw new RangeError(
          `Quadruped ${bone} has an unrepresentable carrier delta`,
        );
      deltas.set(bone, { rotation, translation });
    }
    return deltas;
  }

  /**
   * Move one actual part/contact frame by its explicit actual carrier.
   *
   * @param frame Original rigid frame in source-model metres.
   * @param bone The explicitly declared carrier; undefined is refused.
   * @param deltas The complete admitted actual carrier maps.
   * @param id Source part/contact identity retained in a refusal.
   * @returns A new current rigid frame without retaining or changing its input.
   * @throws {RangeError} For missing carriers or invalid/unrepresentable frames.
   * @evidence contracts/development/common.md#meaningful-documentation Defines source/current metre frames, explicit binding, preserved diagnostic identity and independent output.
   * @evidence contracts/development/implementation.md#principled-implementation The shared ArchetypeFrame.move applies the admitted current-times-inverse-neutral rigid map, preserving source carrier-local coordinates and unit scale.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the source frame, resolve the declared delta, move through the shared rigid owner and admit its finite result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No absent binding is guessed, nonunit scale is not ignored and an overflowed transform cannot escape as current geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work/storage per frame with one map lookup, one rigid placement and finite/unit checks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's already admitted delta instead of inverting the same carrier for each attached part or contact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the new transform escapes; no source frame, model, map, geometry buffer or external handle is retained.
   */
  export function move(
    frame: IAutoMovieTransform,
    bone: QuadrupedBody.Bone | undefined,
    deltas: ReadonlyMap<QuadrupedBody.Bone, ArchetypeFrame.IMotion>,
    id: string,
  ): IAutoMovieTransform {
    rigid(frame, id);
    const delta: ArchetypeFrame.IMotion | undefined =
      bone === undefined ? undefined : deltas.get(bone);
    if (delta === undefined)
      throw new RangeError(`Missing quadruped carrier for ${id}`);
    const current: IAutoMovieTransform = ArchetypeFrame.move(delta, frame);
    rigid(current, id);
    return current;
  }

  /** Rigid maps cannot ignore scale or report a nonfinite current frame. */
  function rigid(frame: IAutoMovieTransform, id: string): void {
    if (frame === undefined || frame === null)
      throw new RangeError(`Quadruped ${id} has no rigid frame`);
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(frame.translation[axis]) || frame.scale[axis] !== 1)
        throw new RangeError(
          `Quadruped ${id} requires a finite unit-scale frame`,
        );
    const q: IAutoMovieTransform["rotation"] = frame.rotation;
    const length: number = Math.hypot(q.x, q.y, q.z, q.w);
    if (
      !(Number.isFinite(length) && Math.abs(length - 1) <= 64 * Number.EPSILON)
    )
      throw new RangeError(`Quadruped ${id} requires a unit rotation`);
  }
}
