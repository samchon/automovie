import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "@automovie/interface";

/**
 * Evaluated triangles in an already applied millimetre registration.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit registration binds the supplied millimetre positions and oriented triangle indices to the caller's evaluated pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record groups evaluated geometry, its registration and the policy forwarded to observation; loading and transformation remain caller responsibilities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A declared matrix is recorded as already applied, rather than becoming an instruction to transform the vertices again.
 * @evidence contracts/development/common.md#meaningful-documentation States the physical frame, borrowed arrays, triangle addressing and the caller's responsibility for evaluated geometry.
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
