import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The named gap of an eye-region measurement whose reader does not exist yet.
 *
 * Eye-region measurements read the producer's periocular registration (brow,
 * lash rows, lid margins, canthi) or its optical support (globe, cornea,
 * pupil). While the basis lacks the registration a measurement needs, the gap
 * names that registration ("missing registration: ..."); once the basis
 * carries it, the gap names the reader still to be written ("missing rule:
 * ..."). No nearby vertex, asset name or proportion stands in for either.
 *
 * @evidence contracts/common.md#principled-implementation The gap depends only on whether the basis carries the named registration, so a published registration moves every dependent measurement from a registration gap to a rule gap without code changes.
 * @evidence contracts/common.md#clear-and-simple-design One presence check and two messages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never measures a stand-in; it only names what is missing.
 * @evidence contracts/common.md#meaningful-documentation States both gap forms and when each applies.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Reads no position.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The registration names the parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it returns.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The parameter types cite the measurement protocols.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Not an input.
 *
 * @author Samchon
 */
export function readHumanFaceEyeRegionGap(
  context: IHumanFaceMeasurementContext,
  registration: "periocular" | "opticalSupport",
  rule: string,
): IHumanFaceMeasurementGap {
  return context.basis[registration] === undefined
    ? {
        reason: `missing registration: the basis's ${registration} registration`,
      }
    : { reason: `missing rule: ${rule}` };
}
