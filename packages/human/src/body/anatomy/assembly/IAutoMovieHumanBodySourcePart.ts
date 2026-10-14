import type { IAutoMovieHumanBodyGeneratedPart } from "../generated/IAutoMovieHumanBodyGeneratedPart";
import type { IAutoMovieHumanBodySourcePartPayload } from "./IAutoMovieHumanBodySourcePartPayload";

type SourcePart<Part extends IAutoMovieHumanBodyGeneratedPart> =
  Part extends unknown
    ? Pick<Part, "id" | "tissue"> & IAutoMovieHumanBodySourcePartPayload
    : never;

/**
 * A coarse source part retaining the actual generated catalogue's id/tissue pair.
 *
 * The source union derives from the maintained generated-part identity rather than a second catalogue. Actual boundary surfaces are not asserted to be independently validated volumetric solids or clinically resolved tissue.
 *
 * @evidence contracts/common.md#principled-implementation A distributive conditional projects each generated-part union member's id/tissue pair and adds the shared source payload, preserving valid pair correlations.
 * @evidence contracts/common.md#clear-and-simple-design The source part derives identity from the maintained generated catalogue instead of duplicating its anatomical cases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Boundary surfaces remain acquired/authored coarse geometry and are not promoted to clinically validated volumetric solids by their catalogue membership.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies catalogue-derived pair integrity and the limits of boundary geometry independent of clinical resolution.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The distributive type projection operates at compile time without scanning anatomical surfaces.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A catalogue-derived union cannot retain completed source-part geometry or invalidate evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Payload typing establishes no runtime resident mesh owner or release obligation.
 * @author Samchon
 */
export type IAutoMovieHumanBodySourcePart =
  SourcePart<IAutoMovieHumanBodyGeneratedPart>;
