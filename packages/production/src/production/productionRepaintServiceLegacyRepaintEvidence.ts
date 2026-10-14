import { IAutoMovieRepaintRequestEvidence } from "@automovie/interface";

/**
 * Constructs the existing legacy prompt/settings/design/brief/shot evidence addresses for the requested shot, retaining nullable continuity fields.
 *
 * @evidence contracts/common.md#principled-implementation Constructs the existing legacy prompt/settings/design/brief/shot evidence addresses for the requested shot, retaining nullable continuity fields.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The record is request-local metadata with no pixels or host task.
 * @evidence contracts/performance.md#efficient-algorithms Constant record construction plus shot text interpolation preserves compatibility defaults rather than claiming a real review.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record is request-local metadata with no pixels or host task.
 */
export const productionRepaintServiceLegacyRepaintEvidence: (shot: string) => IAutoMovieRepaintRequestEvidence = (
  shot: string,
): IAutoMovieRepaintRequestEvidence => ({
  prompt: `legacy:repaint:${shot}:prompt`,
  continuity: null,
  settings: "legacy:repaint:settings",
  design: `legacy:repaint:${shot}:design`,
  screenplayOrBrief: `legacy:repaint:${shot}:screenplay-or-brief`,
  shot: `legacy:repaint:${shot}:shot`,
});
