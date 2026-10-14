import type { IPortraitComponent } from "../../../surface/structures/IPortraitComponent";
import type { IPortraitComponentHost } from "../../../surface/structures/IPortraitComponentHost";
import type { IPortraitHeadPerformance } from "./IPortraitHeadPerformance";

/**
 * Independently assembled colour-reference host and its numerical sampler.
 * Preparation admits component identity and control topology correspondence
 * before sampling refined reference points; this assembly is a material basis.
 *
 * @evidence contracts/common.md#principled-implementation The reference host, ordered components and optional continuation performance supply corresponding reference coordinates to the linear RGB sampler.
 * @evidence contracts/common.md#clear-and-simple-design This named shape owns the existing appearance input while formation controls and preparePortraitHead retain geometry and correspondence admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reference assembly does not replace tissue rest geometry or certify anatomical appearance; concrete sampling and topology guards remain with consumers.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the independently assembled millimetre host, component ordering, optional performance and linear RGB sampling domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input shape performs no assembly, correspondence or colour evaluation; its concrete producers and consumers own those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no cache or equivalence policy; the sampler owner compiles the current reference field.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema starts no task or handle; referenced host, components and sampler follow the actual formation owner's lifetime.
 *
 *
 * @author Samchon
 */
export interface IPortraitHeadAppearance {
  /** Reference host in head millimetres, independently assembled with corresponding topology. */
  host: IPortraitComponentHost;

  /** Reference components in the same identity order as the current assembly. */
  components: IPortraitComponent[];

  /** Optional continuation restoration/pose for this reference assembly. */
  performance?: IPortraitHeadPerformance;

  /**
   * Sample one refined reference-coordinate point in head millimetres.
   * Return three finite linear RGB components in [0,1].
   *
   * @evidence contracts/common.md#principled-implementation Appearance is evaluated at corresponding refined reference positions rather than interpolating already sampled posed vertex colours.
   * @evidence contracts/common.md#clear-and-simple-design The sampler owns its colour field while preparePortraitHead owns reference correspondence and finite three-component result admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference appearance does not replace physical rest geometry or certify tissue; invalid RGB refuses instead of clipping or painting expected geometry results.
   * @evidence contracts/common.md#meaningful-documentation The member states head-millimetre reference input, exact RGB component population and linear [0,1] output domain.
   * @evidence contracts/performance.md#efficient-algorithms Preparation invokes the sampler once per refined reference vertex and checks three channels; the caller determines the colour field's evaluation cost.
   * @evidence contracts/performance.md#reuse-equivalent-work One sampler serves the corresponding reference points of an assembly; the caller owns any compiled field and must invalidate it when its reference inputs change.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The appearance record retains the sampler for its lifetime and preparation copies returned RGB triples; the callback signature bounds neither captured state nor caller-owned resources.
   */
  sample: (reference: readonly number[]) => number[];
}
