import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";

/**
 * Preserve the contour stage's original millimetre and metre area predicates.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The original subtract/cross/hypot order is evaluated independently before and after the original 0.001 coordinate scaling.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar measurement owner leaves correspondence, identity and admission decisions with the contour kernel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No changed normal, threshold, precision or area fallback changes either measured value.
 * @evidence contracts/development/common.md#meaningful-documentation Results are doubled areas in square millimetres and square metres; neither is a topology certificate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed three-component arithmetic costs constant work and storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both values are computed once for the original stage admission.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed local vectors exist; no input is mutated or retained.
 */
export function measureAutoMovieContourFace64(
  p: M.V,
  q: M.V,
  r: M.V,
): { millimetresSquared: number; metresSquared: number } {
  const cross: (a: M.V, b: M.V) => M.V = (a: M.V, b: M.V): M.V => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const normal: M.V = cross(M.sub(q, p), M.sub(r, p));
  const length: number = Math.hypot(...normal);
  const output: M.V[] = [p, q, r].map(
    (point: M.V): M.V => M.scale(point, 0.001),
  );
  return {
    millimetresSquared: length,
    metresSquared: Math.hypot(
      ...cross(M.sub(output[1], output[0]), M.sub(output[2], output[0])),
    ),
  };
}
