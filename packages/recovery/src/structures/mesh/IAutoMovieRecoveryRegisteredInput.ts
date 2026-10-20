import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "@automovie/interface/recovery";

/**
 * Evaluated triangles in an already applied millimetre registration.
 *
 * @evidence contracts/common.md#principled-implementation Explicit registration binds the supplied millimetre positions and oriented triangle indices to the caller's evaluated pose.
 * @evidence contracts/common.md#clear-and-simple-design The record groups evaluated geometry, its registration and the policy forwarded to observation; loading and transformation remain caller responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared matrix is recorded as already applied, rather than becoming an instruction to transform the vertices again.
 * @evidence contracts/common.md#meaningful-documentation States the physical frame, borrowed arrays, triangle addressing and the caller's responsibility for evaluated geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryRegisteredInput {
  /** Caller-supplied frame, evaluated pose and transform already applied to the positions. */
  registration: IAutoMovieRecoveryRegistration;

  /** Caller-owned evaluated positions; admission borrows these millimetre triples without transforming them. */
  verticesMm: IAutoMovieRecoveryInput["verticesMm"];

  /** Caller-owned oriented triples of indices into verticesMm. */
  triangles: IAutoMovieRecoveryInput["triangles"];

  /** Explicit section extraction and fitting limits. */
  policy: Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles">;
}
