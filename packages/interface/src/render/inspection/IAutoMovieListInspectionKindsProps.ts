import type { IAutoMovieMark } from "../../index.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * Subject marks and conditional request features used to enumerate inspection kinds. listAutoMovieInspectionKinds adds sliver/trail kinds only when requested and resolves supplied mark kind identities; empty marks still permit built-in kinds.
 *
 * @evidence contracts/development/design.md#principled-representation Subject marks and conditional request features used to enumerate inspection kinds. listAutoMovieInspectionKinds adds sliver/trail kinds only when requested and resolves supplied mark kind identities; empty marks still permit built-in kinds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface listAutoMovieInspectionKinds exchanges request, marks; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Subject marks and conditional request features used to enumerate inspection kinds. listAutoMovieInspectionKinds adds sliver/trail kinds only when requested and resolves supplied mark kind identities; empty marks still permit built-in kinds.
 * @evidence contracts/development/common.md#meaningful-documentation Subject marks and conditional request features used to enumerate inspection kinds. listAutoMovieInspectionKinds adds sliver/trail kinds only when requested and resolves supplied mark kind identities; empty marks still permit built-in kinds. The prose and members document how listAutoMovieInspectionKinds interprets and admits these values.
 */
export interface IAutoMovieListInspectionKindsProps {
  /** The request's sliver limit and trail patterns, which decide the conditional kinds. */
  request: Pick<IAutoMovieInspectionRequest, "sliver" | "trail">;

  /** The marks the subject supplies. */
  marks: readonly IAutoMovieMark[];
}
