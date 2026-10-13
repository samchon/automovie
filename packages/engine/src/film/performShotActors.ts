import { IAutoMovieActionCall } from "@automovie/interface";

/**
 * The actor ids one action names, as a list.
 *
 * A single id becomes a one-element list and an id list is returned as given;
 * any other value, which the action gate refuses, yields an empty list so the
 * later checks have nothing to iterate. The ids are not validated here.
 *
 * @param action The action as authored.
 * @returns The actor ids, the action's own array when it named a list.
 *
 * @evidence contracts/common.md#principled-implementation Normalizes the union `string | string[]` to a list, and maps an off-schema value to the empty list because every consumer only iterates it after the action gate has already reported the malformed field.
 * @evidence contracts/common.md#clear-and-simple-design One normalization read by the action gate, the region-overlap gate, the blocking gate and the launch compile, which all ask which actors an action names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every verb is normalized the same way; the empty answer for a malformed field is the stated rule, not a fallback that hides the defect, which the action gate reports.
 * @evidence contracts/common.md#meaningful-documentation States the three input shapes and their answers, that ids are not validated, and that a list is returned by reference.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: a type test and at most one one-element array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure projection of one action that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; a list actor is returned by reference, so callers must not mutate it.
 */
export const performShotActors = (action: IAutoMovieActionCall): string[] =>
  typeof action.actor === "string"
    ? [action.actor]
    : Array.isArray(action.actor)
      ? action.actor
      : [];
