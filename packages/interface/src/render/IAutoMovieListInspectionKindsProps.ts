import type { IAutoMovieMark } from "../index";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest";

/**
 * Subject marks and conditional request features used to enumerate inspection
 * kinds. listInspectionKinds adds sliver/trail kinds only when
 * requested and resolves supplied mark kind identities; empty marks still
 * permit built-in kinds.
 */
export interface IAutoMovieListInspectionKindsProps {
  /**
   * The request's sliver limit and trail patterns, which decide the conditional
   * kinds.
   */
  request: Pick<IAutoMovieInspectionRequest, "sliver" | "trail">;

  /** The marks the subject supplies. */
  marks: readonly IAutoMovieMark[];
}
