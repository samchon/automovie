import type { V3 } from "../geometry/V3.ts";

/**
 * Private geometric evaluation input in native-root millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Positions and triangle addresses express a physical surface without inferred registration.
 * @evidence contracts/common.md#clear-and-simple-design This evaluator-only boundary is separate from generation inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source coordinates or specimen-specific constants are embedded.
 * @evidence contracts/common.md#meaningful-documentation Members specify units and the private triangle-address boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased type opens no resource.
 *
 * @author Samchon
 */
export interface EvaluationMesh {
  /** Physical positions in native-root millimetres. */
  vertices: V3[];
  /** Private triangle addresses, never fed into reconstruction. */
  triangles: [number, number, number][];
}
