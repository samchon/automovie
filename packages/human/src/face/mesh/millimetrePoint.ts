import type { Point } from "./structures/Point";

/**
 * Construct one point in the shared millimetre coordinate frame.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Plain XYZ preserves current component head-millimetre coordinates; representation construction alone does not admit finite/domain inputs or convert them to model metres.
 * @evidence contracts/common.md#clear-and-simple-design One value constructor shares Point representation without silent transformation/normalization/validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamp/default reinterprets unsupported numbers; the unit name supplies no physical/anatomical validity certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives shared millimetre frame and fresh ownership rather than claiming source/geometry admission.
 * @evidence contracts/performance.md#efficient-algorithms Three assignments construct one fixed-size object in constant work/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Independently owned points share constructor semantics without a coordinate cache/source lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fresh record transfers; no input/state/handle/buffer/task is retained.
 */
export const millimetrePoint: (x: number, y: number, z: number) => Point = (x: number, y: number, z: number): Point => ({
  x,
  y,
  z,
});
