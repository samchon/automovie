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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Forms a connected vestibular meridian from the shared aperture rim to a recessed floor.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses two Hermite intervals with a common middle derivative and a radial floor derivative about the fixed inward group axis.
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
