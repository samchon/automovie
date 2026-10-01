import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Admit one nasal socket and return an owned copy.
 *
 * The socket is attachment geometry the host measured, in millimetres of the
 * head frame (+X anatomical left, +Y up, +Z anterior). `portraitNoseDepth`
 * divides by the tip and alar influence radii, so a zero, negative or
 * nonfinite radius would turn every exterior target of the nose into `NaN` or
 * `Infinity` without any refusal; admission therefore requires finite
 * midline, tip and alar centres, strictly positive radii and an alar offset
 * that is a nonnegative distance from the midline. The vertex and triangle
 * ordinals are copied without being checked here, because only the host that
 * numbers them can say which are resident.
 *
 * Nothing is mutated, and the copy aliases none of the caller's arrays or the
 * radius pair, so a later edit of the caller's socket cannot move a nose that
 * was already built. These checks say the socket is constructible, not that it
 * lies on a living nose.
 *
 * @evidence contracts/common.md#principled-implementation Admission is a set of closed-form predicates over the numbers that `portraitNoseDepth` divides by or squares, and structural copying so the built nose keeps its own socket.
 * @evidence contracts/common.md#clear-and-simple-design The socket rules live in one function beside the shape rules; the component reads the admitted copy and keeps only fitting and attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; every refusal is a statement about the socket alone.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame and unit, why each refusal exists, which fields are deliberately not checked and who owns the copy.
 * @evidence contracts/modeling.md#spatial-conventions Every value stays in head-frame millimetres exactly as `IPortraitNoseSocket` defines them; the function converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it admits the attachment of the nose component.
 * @evidenceExclude contracts/modeling.md#parameter-channels The socket is subject-owned attachment geometry, not a channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the component observes the assembled nose.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the socket values come from the host's measured attachment.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function refuses a socket that cannot be evaluated, not a state outside what a living body can take; the bounds of a living nose are not encoded here.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function admits the fields defined on IPortraitNoseSocket and adds no input.
 */
export function resolvePortraitNoseSocket(
  input: IPortraitNoseSocket,
): IPortraitNoseSocket {
  const finite = [input.midline, input.tipY, input.alarY].every(
    Number.isFinite,
  );
  const radii = [...input.tipRadius, input.alarRadius];
  if (
    !finite ||
    !Number.isFinite(input.alarOffset) ||
    input.alarOffset < 0 ||
    radii.length !== 3 ||
    radii.some((radius) => !Number.isFinite(radius) || radius <= 0)
  )
    throw new Error(
      "Nasal socket centres must be finite, the alar offset nonnegative and every influence radius positive.",
    );
  return {
    ...input,
    tipRadius: [input.tipRadius[0], input.tipRadius[1]],
    surface: [...input.surface],
    nostrils: input.nostrils.map((faces) => [...faces]),
    supportPlane:
      input.supportPlane === undefined ? undefined : [...input.supportPlane],
  };
}
