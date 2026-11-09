import { IAutoMovieActionCall } from "@automovie/interface";

/**
 * The actor ids one action names, as a list.
 *
 * A single id becomes a one-element list and an id list is returned as given; any other value, which the action gate refuses, yields an empty list so the later checks have nothing to iterate. The ids are not validated here.
 *
 * @param action The action as authored.
 * @returns The actor ids, the action's own array when it named a list.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Normalizes string or array to a list and maps other shapes to an empty list so iteration is safe, including inside the action gate before that gate reports the malformed actor field; id validation remains the gate's responsibility.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One normalization read by the action gate, the region-overlap gate, the blocking gate and the launch compile, which all ask which actors an action names.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every verb is normalized the same way; the empty answer for a malformed field is the stated rule, not a fallback that hides the defect, which the action gate reports.
 * @evidence contracts/development/common.md#meaningful-documentation States the three input shapes and their answers, that ids are not validated, and that a list is returned by reference.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: a type test and at most one one-element array.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure projection of one action that coordinates no work across calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; a list actor is returned by reference, so callers must not mutate it.
 */
export function performShotActors(action: IAutoMovieActionCall): string[] {
  return typeof action.actor === "string"
    ? [action.actor]
    : Array.isArray(action.actor)
      ? action.actor
      : [];
}
