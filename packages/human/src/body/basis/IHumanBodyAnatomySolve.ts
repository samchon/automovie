/**
 * The last anatomy solve of a body builder, kept with the key of the authored weights and measurements it read so that pose, material and history edits reuse it instead of solving again.
 *
 * @evidence contracts/common.md#principled-implementation A serialized authored-shape/anatomy key accompanies solved weights under one compiled builder basis, preserving the inputs that determine the cached numerical result.
 * @evidence contracts/common.md#clear-and-simple-design One last-result record lets builder-owned pose/material/history phases reuse solved weights without mixing them with new anatomical requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The string key alone cannot prove equivalence across different bases; validity relies on the owning builder's fixed basis and admitted deterministic inputs.
 * @evidence contracts/common.md#meaningful-documentation Members identify the serialized inputs and solved weights, and prose names last-solve reuse scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The cache-entry type selects no anatomy solver or serialization algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cache lookup/invalidation lives in createHumanBodyBasisBuilder rather than this key/value declaration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record describes one builder-owned last entry; acquisition/replacement and closure lifetime remain with that builder.
 * @author Samchon
 */
export interface IHumanBodyAnatomySolve {
  /** Serialized authored weights and measurements the solve read. */
  key: string;

  /** The solved shape channel weights. */
  shape: Record<string, number>;
}
