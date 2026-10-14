import type { PortraitSkinColourSite } from "./PortraitSkinColourSite";

/**
 * One numerical pigmentation of a named skin site, independent of illumination
 * and current expression. It multiplies base colour in linear RGB and does not
 * infer a biological chromophore concentration. The region's extent is not an
 * input: it is a fixed fraction of the host's bizygomatic breadth, so a caller
 * names where and how strongly, never which vertices or how far.
 *
 * @evidence contracts/common.md#principled-implementation Seven declared landmark sites locate ellipsoidal linear reflectance fields on the fixed 478-landmark basis; createPortraitSkinColour uses an authored breadth-relative support rather than estimating biological pigmentation.
 * @evidence contracts/common.md#clear-and-simple-design Site, gain and strength describe one regional optical input; landmark positions and conventional extent remain with the producer instead of duplicating vertex selection in callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Gains and strength are admitted in [0,1] and site identities must be unique; the fixed extent is an authored convention, not a measured anatomical boundary.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies linear RGB multiplication, expression-independent reference placement, fixed extent and white/zero identities.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record implements no landmark lookup or field evaluation; createPortraitSkinColour and createPortraitColourField own those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record schedules no computation; the producer creates reusable field samplers from the admitted regional population.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no handle or cache; its consuming sampler retains the derived field data.
 *
 * @author Samchon
 */
export interface IPortraitSkinColourRegion {
  /** The named site; unique within a population, and its landmark is fixed by the basis. */
  site: PortraitSkinColourSite;

  /** Linear RGB multipliers in [0,1]; white leaves the base colour unchanged. */
  gain: [number, number, number];

  /** Region strength in [0,1]; zero is the identity multiplier. */
  strength: number;
}
