import { IPortraitUpperLidSection } from "./IPortraitUpperLidSection";

/**
 * Independently authored medial-to-lateral upper-lid tissue sections. The eye blends them toward its basic canthi; aperture motion, optics and the live skin attachment remain eye-owned. A supplied section population replaces the previous detailed population, and omission retains basic upper-lid formulas.
 *
 * Witness compilation validates and copies the supplied sections. Closed sections add an unfolding target at matching witnesses and unchanged attachment distances. The folded branch validates each sampled transverse curve; the ordinary strictly ordered branch does not independently recheck strict offset separation after binary64 interpolation. Neither branch proves whole-eye collision clearance or appearance.
 *
 * @evidence contracts/common.md#principled-implementation Observed and closed populations share witnesses and attachment distances while optional unfolding admits a simple returning hood; ordinary smoothstep interpolation retains mathematical order but not an independent binary64 strict-separation check.
 * @evidence contracts/common.md#clear-and-simple-design The indexed sections type is reused for closedSections so both populations have the same record shape without another interpolation layer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closed sections are an explicit authoring mode; omitted sections keep basic formulas, and extrapolated opening still requires validity at the consumer.
 * @evidence contracts/common.md#meaningful-documentation The prose gives witness bounds, copied ownership, replacement/omission, closed-witness matching, fixed attachments and the limits of interpolation and transverse validity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This paired-population input does not choose an interpolation algorithm; createPortraitUpperLidProfile owns validation and per-query blending.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observed and closed lists are distinct states rather than interchangeable cached results; the interface makes no cross-pose reuse promise.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly witness arrays remain caller-owned inputs; a profile sampler owns any copied values for its closure lifetime.
 *
 * @author Samchon
 */
export interface IPortraitUpperLidProfile {
  /** Two through 32 complete sections, strictly ordered and including both ends. */
  sections: readonly {
    /** Anatomical medial-to-lateral progress in [0,1], independent of head-X side. */
    at: number;

    /** Complete transverse tissue section at this witness. */
    section: IPortraitUpperLidSection;
  }[];

  /**
   * Optional fully closed, unfolded sections at exactly the same witnesses and with unchanged attachment distances. Selecting them admits an inward hood return in the observed sections. Current closure interpolates from those observed sections; opening farther extrapolates and must remain valid. Omission retains strictly ordered observed sections and prior performance.
   */
  closedSections?: IPortraitUpperLidProfile["sections"];
}
