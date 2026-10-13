import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Admit one nasal socket and return an owned copy.
 *
 * The socket is attachment geometry the host measured, in millimetres of the head frame (+X anatomical left, +Y up, +Z anterior). `portraitNoseDepth` divides by the tip and alar influence radii, so a zero, negative or nonfinite radius would turn every exterior target of the nose into `NaN` or `Infinity` without any refusal; admission therefore requires finite midline, tip and alar centres, strictly positive radii and an alar offset that is a nonnegative distance from the midline. The vertex and triangle ordinals are copied without being checked here, because only the host that numbers them can say which are resident.
 *
 * Nothing is mutated, and the copy aliases none of the caller's arrays or the radius pair, so a later edit of the caller's socket cannot move a nose that was already built. These checks say the socket is constructible, not that it lies on a living nose.
 *
 * @evidence contracts/common.md#principled-implementation Finite chart centres, positive influence radii and nonnegative alar offset admit a copied nasal registration.
 * @evidence contracts/common.md#clear-and-simple-design Host-dependent resident vertex/triangle checks remain with the component's actual host stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numeric admission does not prove living anatomy or a valid registered cut population; ordinals are copied without residency validation here.
 * @evidence contracts/common.md#meaningful-documentation All source distances use head millimetres and retained arrays/radius pair are independent copies.
 * @evidence contracts/performance.md#efficient-algorithms Scalar admission is fixed work and copying scales with surface, opening and support-id populations.
 * @evidence contracts/performance.md#reuse-equivalent-work One socket owner supplies the depth and aperture consumers with the same copied chart.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned index arrays/radius pair are owned so later caller edits cannot alter the compiled component.
 */
export function resolvePortraitNoseSocket(
  input: IPortraitNoseSocket,
): IPortraitNoseSocket {
  const finite: boolean = [input.midline, input.tipY, input.alarY].every(
    Number.isFinite,
  );
  const radii: number[] = [...input.tipRadius, input.alarRadius];
  if (
    !finite ||
    !Number.isFinite(input.alarOffset) ||
    input.alarOffset < 0 ||
    radii.length !== 3 ||
    radii.some((radius: number): boolean => !Number.isFinite(radius) || radius <= 0)
  )
    throw new Error(
      "Nasal socket centres must be finite, the alar offset nonnegative and every influence radius positive.",
    );
  return {
    ...input,
    tipRadius: [input.tipRadius[0], input.tipRadius[1]],
    surface: [...input.surface],
    nostrils: input.nostrils.map((faces: number[]): number[] => [...faces]),
    supportPlane:
      input.supportPlane === undefined ? undefined : [...input.supportPlane],
  };
}
