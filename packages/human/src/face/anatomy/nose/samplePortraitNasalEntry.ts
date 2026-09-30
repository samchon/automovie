import { Vector3 } from "@automovie/engine";

import { samplePortraitNasalSection } from "./samplePortraitNasalSection";
import { IPortraitNasalApertureFrame } from "./structures/IPortraitNasalApertureFrame";
import { IPortraitNasalRimJet } from "./structures/IPortraitNasalRimJet";

/**
 * Shape a complete vestibular meridian from its shared exterior jet to a floor.
 * The middle section contracts the rim about the group datum and travels inward;
 * its one derivative belongs to both Hermite intervals. The final derivative is
 * radial in the floor plane, so all meridians approach a common smooth pole.
 * This is a geometric lining hypothesis, not a measured airway reconstruction.
 *
 * Depth and both intervals use millimetres. Progress spans [0,1] from rim to
 * floor. The returned initial derivative points inward, opposite the exterior
 * co-normal. Neither the body height nor a newly fitted plane moves the datum.
 *
 * @evidence contracts/common.md#principled-implementation The meridian is two cubic Hermite intervals through the rim jet, a middle section (rim contracted about the aperture origin and translated inward by the depth) and a floor point, with one shared middle derivative and a radial end derivative in the floor plane so all meridians approach one smooth pole; the split follows the two spans so parameter speed is uniform. Non-positive depth, a contraction outside (0,1) or coincident sections refuse.
 * @evidence contracts/common.md#clear-and-simple-design One meridian sampler that consumes the same jet as the exterior band and the shared Hermite sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject special-casing; the lining follows the jet, the frame, the depth and the contraction only.
 * @evidence contracts/common.md#meaningful-documentation The comment states the sections, the derivatives, the units, and that this is a geometric lining hypothesis and not a measured airway.
 * @evidence contracts/modeling.md#spatial-conventions Points and depth are head millimetres; progress is dimensionless in [0,1] from rim to floor; the inward axis is the aperture frame's normalised inward direction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal vestibule owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function samplePortraitNasalEntry(
  rim: IPortraitNasalRimJet,
  frame: IPortraitNasalApertureFrame,
  depth: number,
  contraction: number,
  progress: number,
): { point: number[]; derivative: number[] } {
  if (
    !Number.isFinite(depth) ||
    depth <= 0 ||
    !Number.isFinite(contraction) ||
    contraction <= 0 ||
    contraction >= 1 ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1 ||
    [frame.origin, frame.inward, rim.point, rim.tangent, rim.transverse].some(
      (v) => v.length !== 3 || !v.every(Number.isFinite),
    )
  )
    throw new Error(
      "A nasal entry needs finite jets, positive depth and a contracted middle section.",
    );
  const inward = Vector3.normalize(
    Vector3.create(...(frame.inward as [number, number, number])),
  );
  if (Vector3.length(inward) === 0)
    throw new Error("A nasal entry needs a nonzero inward group axis.");
  const axis = [inward.x, inward.y, inward.z];
  const floor = frame.origin.map((v, i) => v + depth * axis[i]);
  const middle = frame.origin.map(
    (v, i) => v + contraction * (rim.point[i] - v) + depth * axis[i],
  );
  const radial = middle.map((v, i) => floor[i] - v);
  const firstSpan = Math.hypot(...middle.map((v, i) => v - rim.point[i]));
  const lastSpan = Math.hypot(...radial);
  const total = firstSpan + lastSpan;
  const axial = radial.reduce((sum, v, i) => sum + v * axis[i], 0);
  const floorRadial = radial.map((v, i) => v - axial * axis[i]);
  const floorRadius = Math.hypot(...floorRadial);
  if (
    ![...floor, ...middle, firstSpan, lastSpan, total, floorRadius].every(
      Number.isFinite,
    ) ||
    firstSpan === 0 ||
    lastSpan === 0 ||
    floorRadius === 0
  )
    throw new Error(
      "A nasal entry needs finite nonzero body and floor sections.",
    );
  const middleDerivative = floor.map((v, i) => (v - rim.point[i]) / total);
  const endDerivative = floorRadial.map((v) => v / floorRadius);
  const split = firstSpan / total;
  return progress <= split
    ? samplePortraitNasalSection(
        { point: rim.point, derivative: rim.transverse.map((v) => -v) },
        { point: middle, derivative: middleDerivative },
        firstSpan,
        progress / split,
      )
    : samplePortraitNasalSection(
        { point: middle, derivative: middleDerivative },
        { point: floor, derivative: endDerivative },
        lastSpan,
        (progress - split) / (1 - split),
      );
}
