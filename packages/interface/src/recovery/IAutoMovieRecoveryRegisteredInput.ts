import type {
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryRegistration,
} from "..";

/** Evaluated triangles in an already applied millimetre registration. */
export interface IAutoMovieRecoveryRegisteredInput {
  /**
   * Caller-supplied frame, evaluated pose and transform already applied to the
   * positions.
   */
  registration: IAutoMovieRecoveryRegistration;

  /**
   * Caller-owned evaluated positions; admission borrows these millimetre
   * triples without transforming them.
   */
  verticesMm: IAutoMovieRecoveryInput["verticesMm"];

  /** Caller-owned oriented triples of indices into verticesMm. */
  triangles: IAutoMovieRecoveryInput["triangles"];

  /** Explicit section extraction and fitting limits. */
  policy: Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles">;
}
