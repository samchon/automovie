import { IAutoMovieBeatEndState, IAutoMovieDiagnostic, IAutoMovieShotSourceOutput } from "@automovie/interface";
import type { IProductionExternalMotionConversionDraft } from "./IProductionExternalMotionConversionDraft";

/**
 * One assembly result with optional shot output/closing state, motion conversion drafts and branch-selected diagnostics. A returned value still needs outer materialization and realization admission before publication; the existing compiler-failure branch omits prior source/runtime advice.
 *
 * @evidence contracts/common.md#principled-implementation Nullable output and closing expose refusal or unavailable continuity explicitly; separate conversion and diagnostic arrays preserve the actual work and advice for the build coordinator.
 * @evidence contracts/common.md#clear-and-simple-design The internal result shape belongs to one assembly boundary, with the attempt owning artifact materialization, conversion sealing and final publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-null value is not renderer proof or published admission, and source warnings remain visible rather than being discarded from successful assembly.
 * @evidence contracts/common.md#meaningful-documentation States null outcomes, subsequent admission, transferred output/draft ownership and diagnostic retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result shape performs no synthesis or artifact cloning; assembleShotSource owns that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type creates no assembly-result cache; the outer attempt decides when current source and prior state admit another build.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires no resource; the caller owns output, closing, conversion drafts and diagnostics transferred by the producer.
 * @author Samchon
 */
export interface IProductionShotAssemblyResult {
  /** Compiled source before materialization, or null when assembly refuses. */
  value: IAutoMovieShotSourceOutput | null;

  /** Closing state available to the next full hard-cut shot, on success. */
  closing: IAutoMovieBeatEndState | null;

  /** Unsealed conversion drafts transferred to the outer build attempt. */
  conversions: IProductionExternalMotionConversionDraft[];

  /** Branch-selected source/compiler findings; failed compilation omits prior source/runtime advice. */
  diagnostics: IAutoMovieDiagnostic[];
}
