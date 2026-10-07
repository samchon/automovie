import type { IHumanFaceHairFreeDistanceBoundProps } from "./IHumanFaceHairFreeDistanceBoundProps";

/**
 * Certify that an unqueried point remains outside a closed contact surface.
 *
 * The signed distance to that surface is 1-Lipschitz, so a sample d at p
 * bounds a candidate q below by d - |q-p|. The caller supplies the same
 * surface's required free distance and any numerical allowance already used
 * by its contact rule; no curve or mesh is altered. A strict comparison and a
 * scale-relative floating-point margin leave boundary cases to the original
 * exact query. This bound is meaningful only for a closed, consistently
 * oriented surface and finite points in its metre frame.
 *
 * The integrator uses it for a free step, the projector for successive strand
 * stations, and the mesher for full ribbon width. They share this proof so a
 * change to the numerical guard cannot make their contact rules disagree.
 *
 * @evidence contracts/common.md#principled-implementation The distance to a
 *   closed set is 1-Lipschitz, so a sample d at p bounds a candidate q below by
 *   d - |q - p|; the function returns true only when that bound, less the
 *   caller's allowance, exceeds the requirement by a roundoff margin scaled to
 *   the operands' magnitude. The comparison is strict and the margin
 *   conservative, so a boundary case falls back to the exact query and
 *   floating-point rounding cannot certify a point that is not free. It is
 *   meaningful only for a closed, consistently oriented surface, which the
 *   callers' contract supplies.
 * @evidence contracts/common.md#clear-and-simple-design One shared proof used
 *   by the integrator, the projector and the mesher, so their contact rules
 *   cannot drift apart.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or fixture: the result depends only on the sample, the
 *   candidate and the requirement.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the argument, its premises, the strictness and who uses it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Points and distances are
 *   metres in one frame supplied by the caller, and nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairFreeDistanceBound(props: IHumanFaceHairFreeDistanceBoundProps): boolean {
  const separation = Math.hypot(
    props.candidate.x - props.sampled.x,
    props.candidate.y - props.sampled.y,
    props.candidate.z - props.sampled.z,
  );
  const roundoff =
    64 *
    Number.EPSILON *
    Math.max(
      Math.abs(props.sampled.x),
      Math.abs(props.sampled.y),
      Math.abs(props.sampled.z),
      Math.abs(props.candidate.x),
      Math.abs(props.candidate.y),
      Math.abs(props.candidate.z),
      Math.abs(props.distance),
      separation,
      props.required,
      props.allowance,
    );
  return (
    props.distance - separation - props.allowance > props.required + roundoff
  );
}
