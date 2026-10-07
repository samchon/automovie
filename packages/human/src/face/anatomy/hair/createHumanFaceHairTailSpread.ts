import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanFaceHairFrame } from "./humanFaceHairFrame";

import type { ICreateHumanFaceHairTailSpreadProps } from "./ICreateHumanFaceHairTailSpreadProps";

/**
 * Derive one lock's radial velocity after a scalp tie. The tie entry fixes its
 * transverse side around the authored tail axis; the root supplies that side
 * if entry lies on the axis, and a stable frame resolves the final collinear
 * case. The target is a deterministic sample inside the authored tube: phase
 * chooses angle and sqrt of a second uniform sequence value chooses radius,
 * because disk area grows with radius squared. Cubic smoothstep moves from
 * entry offset to target offset over a positive metric reach. Its derivative
 * adds radial motion to the axial tail field without moving a station after
 * contact or changing its metric length.
 *
 * A numerical radius describes rendered bundle volume, not physical fibre
 * thickness. The integrator still limits turning and checks skin contact;
 * this derivative alone promises neither a collision-free tube nor a complete
 * ponytail. Inputs stay caller-owned, and the returned field has no state.
 *
 * @evidence contracts/common.md#principled-implementation The target is
 *   uniform in a disc of the authored radius: the angle is the lock's phase and
 *   the radius is the disc radius times the square root of a second uniform
 *   value, because disc area grows with the radius squared. The offset from the
 *   tie entry to the target moves over the reach by the cubic smoothstep 3u^2 -
 *   2u^3, and the returned velocity is its derivative times the change, 6u(1 -
 *   u) / reach, which integrates to the change exactly and is zero at both ends.
 *   The transverse side comes from the entry, the root, or a stable frame in the
 *   collinear case, so the field is defined for every input.
 * @evidence contracts/common.md#clear-and-simple-design A stateless closure
 *   over one lock's constants; the integrator adds it to the axial tail field,
 *   and contact stays with the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject: the radial target is a function of the lock's sequence
 *   values and the authored radius and reach only.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the target, the profile, that the radius is rendered volume and not fibre
 *   thickness and that no collision-free tube is promised.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Axis and directions are
 *   unit vectors in the head frame, anchor, entry and root are metres in it,
 *   radius and reach are metres, and phase is radians; the velocity is per metre
 *   of arc length and no conversion is made.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The radius describes
 *   a rendered bundle volume, as the comment states, and carries no anatomical
 *   value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidence contracts/anatomy.md#parametric-authority The inputs are a named
 *   tail axis, a cross-section radius and a reach in metres; the per-lock offset
 *   is derived from the lock's sequence values, so no input places a strand.
 */
export function createHumanFaceHairTailSpread(
  props: ICreateHumanFaceHairTailSpreadProps,
): (distance: number) => IAutoMovieVector3 {
  const axis = humanFaceHairFrame.direction(props.axis);
  const transverse = (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const offset = Vector3.subtract(point, props.anchor);
    return Vector3.subtract(
      offset,
      Vector3.scale(axis, Vector3.dot(offset, axis)),
    );
  };
  const entry = transverse(props.entry);
  const entryRadius = Vector3.length(entry);
  let radial = entryRadius > 0 ? entry : transverse(props.root);
  if (Vector3.length(radial) === 0) {
    radial = humanFaceHairFrame.perpendicular(axis, Vector3.create(0, 1, 0));
  }
  const unit = humanFaceHairFrame.direction(radial);
  const across = Vector3.cross(axis, unit);
  const target = Vector3.scale(
    Vector3.add(
      Vector3.scale(unit, Math.cos(props.phase)),
      Vector3.scale(across, Math.sin(props.phase)),
    ),
    props.radius * props.radialFraction,
  );
  const change = Vector3.subtract(target, entry);
  return (distance) => {
    const u = Math.max(0, Math.min(1, distance / props.reach));
    return Vector3.scale(change, (6 * u * (1 - u)) / props.reach);
  };
}
