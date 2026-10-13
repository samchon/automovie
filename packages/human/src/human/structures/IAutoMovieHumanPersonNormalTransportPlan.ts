import type { IAutoMovieHumanPersonNormalBinding } from "./IAutoMovieHumanPersonNormalBinding";
import type { IAutoMovieHumanPersonNormalCell } from "./IAutoMovieHumanPersonNormalCell";

/**
 * Admitted fixed source normal transport: every fixed normal cell in parent order, and per skin half (face, then body) one binding per vertex, undefined for an unused vertex. Returned arrays are owned and must remain unchanged during compiled transport; this mutable representation does not freeze them at runtime.
 *
 * @evidence contracts/common.md#principled-implementation Admitted fixed cells retain parent order while per-half dense binding slots preserve vertex correspondence, including undefined entries for unused vertices.
 * @evidence contracts/common.md#clear-and-simple-design One plan groups admitted lineage cells with face-then-body binding arrays consumed by differential transport; its consumer relies on their unchanged captured contents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused entries remain explicit and do not fabricate a normal binding for a vertex absent from emitted triangles.
 * @evidence contracts/common.md#meaningful-documentation Documentation states owned arrays, parent order, face/body ordering and unused-binding meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The admitted normal cells and per-vertex transport bindings specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the admitted normal cells and per-vertex transport bindings; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The admitted normal cells and per-vertex transport bindings acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportPlan {
  /** Every fixed normal cell, in parent order. */
  cells: IAutoMovieHumanPersonNormalCell[];

  /** Per half, face then body, each vertex's binding or undefined when unused. */
  bindings: (undefined | IAutoMovieHumanPersonNormalBinding)[][];
}
